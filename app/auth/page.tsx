'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Mail, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { LoadingButton, LoadingEffect } from '@/components/shared/LoadingButton';

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

function AuthForm() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [effect, setEffect] = useState<LoadingEffect>('fill');
  const router = useRouter();

  useEffect(() => {
    const effects: LoadingEffect[] = ['fill', 'rain', 'morph', 'pulse'];
    setEffect(effects[Math.floor(Math.random() * effects.length)]);
  }, []);

  // Read initial tab and intent
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup' || tabParam === 'login') {
      setTab(tabParam);
    }
  }, [searchParams]);

  const intent = searchParams.get('intent');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newErrors: Record<string, string> = {};
    
    if (tab === 'signup') {
      const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
      if (!name || name.trim().length < 2) newErrors.name = 'Please enter your full name.';
      
      const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
      const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value;
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }
    
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    if (!email?.includes('@') || !email.includes('.')) {
      newErrors.email = 'Please use a valid email address.';
    }
    
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      if (tab === 'signup') {
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: (form.elements.namedItem('name') as HTMLInputElement)?.value, email, password })
        }).then((res) => {
          if (res.ok) {
            signIn('credentials', { email, password, redirect: false }).then(() => {
              if (intent === 'book') {
                router.push('/book');
              } else {
                router.push('/welcome');
              }
            });
          } else {
            res.json().then((data) => {
              setErrors({ email: data.message || 'Registration failed' });
              setIsLoading(false);
            });
          }
        }).catch(() => setIsLoading(false));
      } else {
        signIn('credentials', { email, password, redirect: false }).then(async (res) => {
          if (res?.error) {
            setErrors({ email: 'Invalid email or password' });
          } else {
            if (intent === 'book') {
              router.push('/book');
              return;
            }
            
            const session = await getSession();
            if (session?.user) {
              router.push(getRoleRedirectPath(session.user.role as string, (session.user as any).driverStatus as string | null));
            } else {
              router.push('/dashboard');
            }
          }
        }).catch(() => setIsLoading(false));
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-brand/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-brand/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-black inline-block transition-transform hover:scale-105" style={{ letterSpacing: '-0.03em' }}>
            <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">TOVE</span>
            <span className="text-orange-brand drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">DROP</span>
          </Link>
          <p className="mt-3 text-white/70 text-sm font-medium">
            {tab === 'login' ? 'Welcome back to your campus ride platform' : 'Join the trusted student ride network'}
          </p>
          {tab === 'signup' && (
            <div className="mt-4 inline-flex items-center gap-1.5 bg-orange-brand/15 border border-orange-brand/30 rounded-full px-4 py-1.5 text-[13px] font-bold text-orange-brand shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <DropCoin size={14} />
              Get 3 free Drops on sign up
            </div>
          )}
        </div>

        <div className="glass-card rounded-[24px] p-8 relative overflow-hidden">
          {/* Subtle top glow line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-brand/50 to-transparent" />
          
          <div className="flex rounded-xl bg-black/40 p-1 mb-8 border border-white/5 backdrop-blur-md">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                  tab === t 
                    ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/10' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/70">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-brand transition-colors" />
                  <Input id="name" name="name" type="text" placeholder="Ada Okafor"
                    className={`pl-10 h-12 bg-black/30 border-white/10 focus-visible:border-orange-brand/50 focus-visible:ring-orange-brand/20 ${errors.name ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
                    autoComplete="name" />
                </div>
                {errors.name && <p className="text-xs text-red-400 font-medium">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/70">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-brand transition-colors" />
                <Input id="email" name="email" type="email" placeholder="you@example.com"
                  className={`pl-10 h-12 bg-black/30 border-white/10 focus-visible:border-orange-brand/50 focus-visible:ring-orange-brand/20 ${errors.email ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
                  autoComplete="email" />
              </div>
              {tab === 'signup' && !errors.email && (
                <p className="text-[11px] text-white/40">We'll use this to send you ride updates.</p>
              )}
              {errors.email && <p className="text-xs text-red-400 font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/70">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
                className={`h-12 bg-black/30 border-white/10 focus-visible:border-orange-brand/50 focus-visible:ring-orange-brand/20 ${errors.password ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <p className="text-xs text-red-400 font-medium">{errors.password}</p>}
            </div>

            {tab === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/70">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Min. 8 characters"
                  className={`h-12 bg-black/30 border-white/10 focus-visible:border-orange-brand/50 focus-visible:ring-orange-brand/20 ${errors.confirmPassword ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-xs text-red-400 font-medium">{errors.confirmPassword}</p>}
              </div>
            )}

            {tab === 'login' && (
              <div className="text-right pb-1">
                <Link href="#" className="text-[12px] text-orange-brand hover:text-orange-brand/80 hover:underline font-bold transition-colors">Forgot password?</Link>
              </div>
            )}

            <LoadingButton
              type="submit"
              className="w-full h-12 rounded-xl text-[15px] font-bold tracking-wide mt-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all"
              isLoading={isLoading}
              effect={effect}
              loadingText="Connecting..."
            >
              <span className="text-white drop-shadow-md">
                {tab === 'login' ? 'Log In' : 'Create Account'}
              </span>
            </LoadingButton>
          </form>

          {tab === 'signup' && (
            <p className="text-[11px] text-white/40 text-center mt-6">
              By signing up you agree to our{' '}
              <Link href="#" className="text-orange-brand hover:underline font-medium">Terms of Service</Link>{' '}
              and{' '}
              <Link href="#" className="text-orange-brand hover:underline font-medium">Privacy Policy</Link>.
            </p>
          )}
        </div>

        <p className="text-center text-[13px] text-white/50 mt-8 font-medium">
          {tab === 'login' ? (
            <>Don't have an account?{' '}<button onClick={() => { setTab('signup'); setErrors({}); }} className="text-white hover:text-orange-brand transition-colors font-bold hover:underline">Sign up free</button></>
          ) : (
            <>Already have an account?{' '}<button onClick={() => { setTab('login'); setErrors({}); }} className="text-white hover:text-orange-brand transition-colors font-bold hover:underline">Log in</button></>
          )}
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-bg-deep admin-mesh-bg flex flex-col relative">
      <div className="px-8 py-6 relative z-20">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-orange-brand/30 border-t-orange-brand animate-spin shadow-[0_0_15px_rgba(249,115,22,0.3)]" /></div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
