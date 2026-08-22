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

function AuthForm() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

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
            res.json().then((data) => setErrors({ email: data.message || 'Registration failed' }));
          }
        });
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
        });
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold inline-block" style={{ letterSpacing: '-0.02em' }}>
            <span className="text-[#1A1A2E]">TOVE</span><span className="text-orange-brand">DROP</span>
          </Link>
          <p className="mt-2 text-muted-foreground text-sm">
            {tab === 'login' ? 'Welcome back to your campus ride platform' : 'Join the trusted student ride network'}
          </p>
          {tab === 'signup' && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-orange-brand/10 border border-orange-brand/25 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-orange-brand">
              <DropCoin size={13} />
              Get 3 free Drops on sign up
            </div>
          )}
        </div>

        <div className="bg-surface-card rounded-2xl border border-border-default p-8">
          <div className="flex rounded-xl bg-surface-elevated p-1 mb-7">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t ? 'bg-surface-card text-primary shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" name="name" type="text" placeholder="Ada Okafor"
                    className={`pl-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    autoComplete="name" />
                </div>
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="you@example.com"
                  className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="email" />
              </div>
              {tab === 'signup' && !errors.email && (
                <p className="text-xs text-muted-foreground">We'll use this to send you ride updates.</p>
              )}
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
                className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            {tab === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Min. 8 characters"
                  className={errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
              </div>
            )}

            {tab === 'login' && (
              <div className="text-right">
                <Link href="#" className="text-xs text-orange-brand hover:underline font-medium">Forgot password?</Link>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full text-foreground font-semibold mt-1"
              style={{ background: 'linear-gradient(135deg, var(--purple-brand), var(--purple-light))' }}>
              {tab === 'login' ? 'Log In' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-default"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-card px-2 text-muted-foreground font-medium tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="lg" 
            className="w-full bg-surface-elevated hover:bg-muted/50 border-border font-medium text-foreground h-12"
            onClick={() => signIn('google', { callbackUrl: intent === 'book' ? '/book' : '/dashboard' })}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Google
          </Button>

          {tab === 'signup' && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              By signing up you agree to our{' '}
              <Link href="#" className="text-orange-brand hover:underline">Terms of Service</Link>{' '}
              and{' '}
              <Link href="#" className="text-orange-brand hover:underline">Privacy Policy</Link>.
            </p>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {tab === 'login' ? (
            <>Don&apos;t have an account?{' '}<button onClick={() => { setTab('signup'); setErrors({}); }} className="text-orange-brand font-semibold hover:underline">Sign up free</button></>
          ) : (
            <>Already have an account?{' '}<button onClick={() => { setTab('login'); setErrors({}); }} className="text-orange-brand font-semibold hover:underline">Log in</button></>
          )}
        </p>
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
