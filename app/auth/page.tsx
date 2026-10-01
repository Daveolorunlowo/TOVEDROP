'use client';

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



function AuthForm() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const router = useRouter();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup' || tabParam === 'login') setTab(tabParam);
  }, [searchParams]);

  const intent = searchParams.get('intent');

  const resetForm = () => {
    setErrorText('');
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

    setIsProcessing(true);
    setErrorText('');
    
    try {
      let result;
      if (tab === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: (form.elements.namedItem('name') as HTMLInputElement)?.value, email, password }),
        });
        if (res.ok) {
          const signInRes = await signIn('credentials', { email, password, redirect: false });
          result = signInRes?.error ? { ok: false, msg: 'Sign in failed' } : { ok: true, url: intent === 'book' ? '/book' : '/welcome' };
        } else {
          const data = await res.json();
          result = { ok: false, msg: data.message || 'Registration failed' };
        }
      } else {
        const res = await signIn('credentials', { email, password, redirect: false });
        if (res?.error) {
          result = { ok: false, msg: 'Invalid email or password' };
        } else {
          if (intent === 'book') {
            result = { ok: true, url: '/book' };
          } else {
            await new Promise(r => setTimeout(r, 100));
            const session = await getSession();
            if (session?.user) {
              result = { ok: true, url: getRoleRedirectPath(session.user.role as string, (session.user as any).driverStatus as string | null) };
            } else {
              result = { ok: true, url: '/dashboard' };
            }
          }
        }
      }

      if (result.ok && result.url) {
        window.location.href = result.url;
      } else {
        setErrorText(result.msg || 'Authentication failed');
        setIsProcessing(false);
      }
    } catch (e) {
      setErrorText('An unexpected error occurred');
      setIsProcessing(false);
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
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t ? 'bg-surface-card text-primary ' : 'text-muted-foreground hover:text-primary'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    className={`pl-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    autoComplete="name" disabled={isProcessing} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="you@example.com"
                  className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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
            <div className="relative z-50 flex flex-col items-center mt-6" style={{ height: '110px' }}>
              
              <Button
                  type="submit"
                  disabled={isProcessing}
                  size="lg"
                  className="w-full h-12 rounded-full font-bold transition-all relative"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : tab === 'login' ? 'Log In' : 'Create Account'}
                </Button>

                {/* Status Text Region */}
                <div className="absolute top-[88px] w-full text-center text-sm font-medium h-[24px]">
                  {errorText && (
                    <div className="text-red-500 absolute inset-0">
                      {errorText}
                    </div>
                  )}
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

      
    </div>
  );
}
