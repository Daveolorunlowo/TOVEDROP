import os

content = '''"use client";

import { useState, Suspense, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Mail, User, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { Button } from '@/components/ui/button';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function DropCoin({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="url(#authdc)" />
      <path d="M10 5 C10 5 7 9 7 11.5 A3 3 0 0 0 13 11.5 C13 9 10 5 10 5Z" fill="white" opacity="0.85" />
      <defs>
        <linearGradient id="authdc" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--orange-brand)" />
          <stop offset="100%" stopColor="var(--orange-brand)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function CheckmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 13l4 4L19 7"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 24,
          strokeDashoffset: 0,
          animation: 'checkmark-draw 250ms ease-out forwards',
        }}
      />
    </svg>
  );
}

type AuthState = 'idle' | 'anticipating' | 'dropping' | 'squashed' | 'splashing' | 'error';

function AuthForm() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [btnState, setBtnState] = useState<AuthState>('idle');
  const [errorText, setErrorText] = useState('');
  const router = useRouter();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup' || tabParam === 'login') setTab(tabParam);
  }, [searchParams]);

  const intent = searchParams.get('intent');
  const isProcessing = btnState !== 'idle' && btnState !== 'error';

  const resetForm = () => {
    setBtnState('idle');
    setErrorText('');
  };

  const handleAuthResult = async (success: boolean, message?: string, redirectUrl?: string) => {
    if (success) {
      setBtnState('splashing');
      await sleep(700);
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 200ms ease-out';
      await sleep(200);
      router.push(redirectUrl || '/dashboard');
    } else {
      setBtnState('error');
      setErrorText(message || 'Authentication failed');
      await sleep(2000);
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const form = e.target as HTMLFormElement;
    const newErrors: Record<string, string> = {};

    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;

    if (tab === 'signup') {
      const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
      if (!name || name.trim().length < 2) newErrors.name = 'Please enter your full name.';
      const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value;
      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!email?.includes('@') || !email.includes('.')) newErrors.email = 'Please use a valid email address.';
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters.';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Start physical drop animation sequence
    setBtnState('anticipating');
    
    // Kick off the API call concurrently
    const apiPromise = (async () => {
      if (tab === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: (form.elements.namedItem('name') as HTMLInputElement)?.value, email, password }),
        });
        if (res.ok) {
          const signInRes = await signIn('credentials', { email, password, redirect: false });
          return signInRes?.error ? { ok: false, msg: 'Sign in failed' } : { ok: true, url: intent === 'book' ? '/book' : '/welcome' };
        }
        const data = await res.json();
        return { ok: false, msg: data.message || 'Registration failed' };
      } else {
        const res = await signIn('credentials', { email, password, redirect: false });
        if (res?.error) return { ok: false, msg: 'Invalid email or password' };
        
        if (intent === 'book') return { ok: true, url: '/book' };
        const session = await getSession();
        if (session?.user) {
          return { ok: true, url: getRoleRedirectPath(session.user.role as string, (session.user as any).driverStatus as string | null) };
        }
        return { ok: true, url: '/dashboard' };
      }
    })();

    await sleep(300); // Anticipation pump ends
    
    setBtnState('dropping');
    await sleep(460); // Drop fall animation finishes

    setBtnState('squashed');
    
    // Wait for actual auth to finish if it hasn't already
    const result = await apiPromise;
    await handleAuthResult(result.ok, result.msg, result.url);
  };

  const getButtonAnimation = () => {
    switch (btnState) {
      case 'idle': return 'btn-breathe 2.6s infinite ease-in-out';
      case 'anticipating': return 'btn-anticipation 300ms ease-in-out';
      case 'splashing': return 'btn-recoil 240ms ease-out';
      case 'error': return 'btn-shake 200ms ease-in-out';
      default: return 'none';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold inline-block" style={{ letterSpacing: '-0.02em' }}>
            <span className="text-foreground">TOVE</span><span className="text-orange-brand">DROP</span>
          </Link>
          <p className="mt-2 text-muted-foreground text-sm">
            {tab === 'login' ? 'Welcome back to your campus ride platform' : 'Join the trusted student ride network'}
          </p>
        </div>

        <div className="bg-surface-card rounded-xl border border-border-default p-8 pb-16">
          <div className="flex rounded-xl bg-surface-elevated p-1 mb-7">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); resetForm(); }}
                disabled={isProcessing}
                className={lex-1 py-2 text-sm font-semibold rounded-lg transition-all  }
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" name="name" type="text" placeholder="Ada Okafor"
                    className={pl-10 }
                    autoComplete="name" disabled={isProcessing} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="you@example.com"
                  className={pl-10 }
                  autoComplete="email" disabled={isProcessing} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Password</Label>
              <PasswordInput
                id="password" name="password" placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
                className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                disabled={isProcessing}
              />
            </div>

            {tab === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword" name="confirmPassword" placeholder="Min. 8 characters"
                  className={errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  autoComplete="new-password" disabled={isProcessing}
                />
              </div>
            )}

            {/* Morphing Drop Button System */}
            <div className="relative flex flex-col items-center mt-6" style={{ height: '70px' }}>
              
              <button
                type="submit"
                disabled={isProcessing}
                aria-busy={isProcessing}
                aria-live="polite"
                className="flex items-center justify-center font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-brand relative z-10"
                style={{
                  width: (btnState !== 'idle' && btnState !== 'error') ? '52px' : '100%',
                  height: '52px',
                  borderRadius: '26px',
                  background: btnState === 'error' ? 'var(--status-danger)' : 'var(--orange-brand)',
                  transition: 'width 300ms ease-in-out, background 200ms ease-out',
                  animation: getButtonAnimation(),
                }}
              >
                <span style={{
                  opacity: btnState === 'idle' ? 1 : 0,
                  transition: 'opacity 100ms ease-out',
                  position: btnState === 'idle' ? 'relative' : 'absolute'
                }}>
                  {tab === 'login' ? 'Log In' : 'Create Account'}
                </span>
                
                {btnState === 'error' && (
                  <span className="absolute">Try again</span>
                )}
              </button>

              {/* The Physical Drop */}
              {(btnState === 'dropping' || btnState === 'squashed') && (
                <div 
                  className="absolute z-0 pointer-events-none"
                  style={{
                    top: '26px', // Center of button
                    animation: btnState === 'dropping' ? 'drop-fall-wrap 460ms cubic-bezier(0.5, 0.05, 0.7, 0.3) forwards' : 'none',
                    transform: btnState === 'squashed' ? 'translateY(55px) scale(1.6, 0.4)' : undefined,
                  }}
                >
                  <div className="w-[14px] h-[14px] bg-orange-brand" style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }} />
                </div>
              )}

              {/* Splash & Checkmark Payoff */}
              {btnState === 'splashing' && (
                <div className="absolute z-20 pointer-events-none" style={{ top: '81px' }}>
                  {/* Expanding Rings */}
                  <div className="absolute border-[1.5px] border-orange-brand rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44px] h-[44px]" style={{ animation: 'ring-expand 650ms ease-out forwards' }} />
                  <div className="absolute border-[1.5px] border-orange-brand rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44px] h-[44px]" style={{ animation: 'ring-expand 650ms ease-out 130ms forwards', opacity: 0 }} />
                  
                  {/* Particle Burst */}
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="absolute w-[5px] h-[5px] bg-orange-brand rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: particle-burst- 600ms ease-out forwards }} />
                  ))}
                  
                  {/* Success Checkmark Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22px] h-[22px] bg-orange-brand rounded-full flex items-center justify-center" style={{ animation: 'checkmark-bounce 520ms ease-out forwards' }}>
                    <CheckmarkIcon />
                  </div>
                </div>
              )}

              {/* Status Text Region */}
              <div className="absolute top-[88px] w-full text-center text-sm font-medium h-[24px]">
                <div style={{ opacity: (btnState === 'dropping' || btnState === 'squashed') ? 1 : 0, transition: 'opacity 200ms' }} className="text-muted-foreground absolute inset-0">
                  Dropping you in...
                </div>
                <div style={{ opacity: btnState === 'splashing' ? 1 : 0, transform: btnState === 'splashing' ? 'translateY(0)' : 'translateY(8px)', transition: 'all 300ms ease-out' }} className="text-orange-brand absolute inset-0">
                  You're in — welcome back.
                </div>
                <div style={{ opacity: btnState === 'error' ? 1 : 0, transition: 'opacity 200ms' }} className="text-red-500 absolute inset-0">
                  {errorText}
                </div>
              </div>
            </div>
          </form>
          
          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-default"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-card px-2 text-muted-foreground font-medium tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" size="lg" className="w-full bg-surface-elevated hover:bg-muted/50 border-border font-medium text-foreground h-12" onClick={() => signIn('google', { callbackUrl: intent === 'book' ? '/book' : '/dashboard' })} disabled={isProcessing}>
            <GoogleIcon className="w-5 h-5 mr-2" />
            Google
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
      
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-orange-brand border-t-transparent animate-spin" /></div>}>
        <AuthForm />
      </Suspense>

      <style jsx global>{
        @keyframes btn-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        @keyframes btn-anticipation {
          0% { transform: scaleY(1); }
          33% { transform: scaleY(0.9); }
          66% { transform: scaleY(1.03); }
          85% { transform: scaleY(0.88); }
          100% { transform: scaleY(1); }
        }
        @keyframes btn-recoil {
          0% { transform: translateY(0) scaleY(1); }
          40% { transform: translateY(-3px) scaleY(0.97); }
          100% { transform: translateY(0) scaleY(1); }
        }
        @keyframes btn-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        @keyframes drop-fall-wrap {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          10% { opacity: 1; transform: translateY(5px) scale(0.85, 1.3); }
          60% { transform: translateY(35px) scale(0.78, 1.5); }
          95% { transform: translateY(53px) scale(0.9, 1.2); }
          100% { transform: translateY(55px) scale(1.6, 0.4); opacity: 1; }
        }
        @keyframes ring-expand {
          0% { transform: scale(0.27); opacity: 0.7; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes checkmark-bounce {
          0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          30% { transform: scale(1.3) rotate(4deg); opacity: 1; }
          60% { transform: scale(0.9) rotate(-2deg); }
          85% { transform: scale(1.06) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes checkmark-draw {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        
        /* Particle bursts with slight downward arc (gravity) */
        @keyframes particle-burst-0 {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% - 16px), calc(-50% - 22px)) scale(0); opacity: 0; }
        }
        @keyframes particle-burst-1 {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + 18px), calc(-50% - 15px)) scale(0); opacity: 0; }
        }
        @keyframes particle-burst-2 {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% - 24px), calc(-50% + 4px)) scale(0); opacity: 0; }
        }
        @keyframes particle-burst-3 {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + 22px), calc(-50% + 8px)) scale(0); opacity: 0; }
        }
        @keyframes particle-burst-4 {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% - 12px), calc(-50% + 26px)) scale(0); opacity: 0; }
        }
        @keyframes particle-burst-5 {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + 14px), calc(-50% + 24px)) scale(0); opacity: 0; }
        }
        @keyframes particle-burst-6 {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + 2px), calc(-50% - 28px)) scale(0); opacity: 0; }
        }
      }</style>
    </div>
  );
}
'''

with open('app/auth/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Drop animation built.")
