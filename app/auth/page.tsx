'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { LoadingButton, LoadingEffect } from '@/components/shared/LoadingButton';
import Image from 'next/image';

function AuthForm() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [effect, setEffect] = useState<LoadingEffect>('fill');
  const router = useRouter();

  useEffect(() => {
    const effects: LoadingEffect[] = ['fill', 'rain', 'morph', 'pulse'];
    setEffect(effects[Math.floor(Math.random() * effects.length)]);
  }, []);

  // Read initial tab
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

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn('google', { callbackUrl: intent === 'book' ? '/book' : '/dashboard' });
  };

  return (
    <div className="flex-1 flex flex-col px-6 pb-12 pt-6 font-sans w-full max-w-md mx-auto">
      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="inline-flex items-center text-white mb-8 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-6 h-6 mr-3" />
          <span className="font-semibold text-[17px]">Back</span>
        </Link>
        <h1 className="text-[32px] font-bold text-white leading-tight">
          {tab === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-[17px] text-white/60 mt-1">
          {tab === 'login' ? 'Log in to continue' : 'Join the community'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {tab === 'signup' && (
          <div>
            <Input 
              id="name" 
              name="name" 
              type="text" 
              placeholder="Full Name"
              className={`h-14 px-4 text-base bg-surface-card border-border-default text-white rounded-2xl ${errors.name ? 'border-red-500' : ''}`}
              autoComplete="name" 
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
          </div>
        )}

        <div>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="Email Address"
            className={`h-14 px-4 text-base bg-surface-card border-border-default text-white rounded-2xl ${errors.email ? 'border-red-500' : ''}`}
            autoComplete="email" 
          />
          {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
        </div>

        <div>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Password"
            className={`h-14 px-4 text-base bg-surface-card border-border-default text-white rounded-2xl ${errors.password ? 'border-red-500' : ''}`}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />
          {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
        </div>

        {tab === 'login' && (
          <div className="mt-1 mb-2">
            <Link href="#" className="text-[15px] font-medium text-text-secondary hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>
        )}

        <LoadingButton
          type="submit"
          className="w-full h-14 rounded-2xl text-[17px] font-bold mt-2"
          isLoading={isLoading}
          effect={effect}
          loadingText="Connecting..."
        >
          <span className="text-white">
            {tab === 'login' ? 'LOG IN' : 'SIGN UP'}
          </span>
        </LoadingButton>
      </form>

      <div className="my-8 flex items-center justify-center">
        <div className="h-[1px] flex-1 bg-white/10" />
        <span className="px-4 text-[15px] text-white/40 font-medium">Or continue with</span>
        <div className="h-[1px] flex-1 bg-white/10" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 border-0 text-[17px] font-bold flex items-center justify-center gap-3"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        {isGoogleLoading ? 'Connecting...' : 'Google'}
      </Button>

      {/* Spacer to push toggle to bottom */}
      <div className="flex-1" />

      <div className="mt-8 text-center pb-6">
        {tab === 'login' ? (
          <p className="text-[15px] text-white/60">
            Don't have an account?{' '}
            <button 
              onClick={() => { setTab('signup'); setErrors({}); }} 
              className="text-primary font-semibold hover:underline"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="text-[15px] text-white/60">
            Already have an account?{' '}
            <button 
              onClick={() => { setTab('login'); setErrors({}); }} 
              className="text-primary font-semibold hover:underline"
            >
              Log in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-[100dvh] bg-bg-deep flex flex-col">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-orange-brand border-t-transparent animate-spin" /></div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
