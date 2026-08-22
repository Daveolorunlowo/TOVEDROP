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
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10 w-full">
      {/* Subtle vignette background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#111115] via-[#050508] to-black -z-10" />

      <div className="w-full max-w-sm">
        {/* Minimalist Logo Header */}
        <div className="text-left mb-12">
          <Link href="/" className="text-4xl font-extrabold tracking-tighter" style={{ letterSpacing: '-0.04em' }}>
            <span className="text-white">TOVE</span>
            <span className="text-orange-brand">.</span>
          </Link>
          <h1 className="text-3xl font-light text-white mt-4 tracking-tight">
            {tab === 'login' ? 'Welcome back' : 'Start riding'}
          </h1>
          <p className="text-white/40 text-[15px] mt-2 font-medium">
            {tab === 'login' ? 'Enter your details to continue.' : 'Create an account in seconds.'}
          </p>
        </div>

        {/* Text-based Tabs */}
        <div className="flex gap-6 mb-10 border-b border-white/10 pb-4">
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setErrors({}); }}
              className={`text-[17px] font-medium transition-all relative ${
                tab === t 
                  ? 'text-white' 
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {t === 'login' ? 'Log In' : 'Sign Up'}
              {tab === t && (
                <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-orange-brand shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {tab === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name" className="sr-only">Full Name</Label>
              <Input id="name" name="name" type="text" placeholder="Full Name"
                className={`h-14 px-0 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-orange-brand text-lg placeholder:text-white/20 ${errors.name ? 'border-red-500 text-red-100 placeholder:text-red-500/50' : ''}`}
                autoComplete="name" />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="sr-only">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="Email Address"
              className={`h-14 px-0 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-orange-brand text-lg placeholder:text-white/20 ${errors.email ? 'border-red-500 text-red-100 placeholder:text-red-500/50' : ''}`}
              autoComplete="email" />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="password" className="sr-only">Password</Label>
            {/* Custom password input to match borderless style */}
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                className={`h-14 px-0 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-orange-brand text-lg placeholder:text-white/20 ${errors.password ? 'border-red-500 text-red-100 placeholder:text-red-500/50' : ''}`}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            {tab === 'login' && (
              <div className="absolute right-0 top-3 text-right">
                <Link href="#" className="text-[13px] text-white/40 hover:text-white transition-colors">Forgot?</Link>
              </div>
            )}
          </div>

          <LoadingButton
            type="submit"
            className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-[16px] font-bold tracking-wide mt-8 flex items-center justify-center gap-2"
            isLoading={isLoading}
            effect="pulse"
            loadingText="Authenticating..."
          >
            <span>{tab === 'login' ? 'Log In →' : 'Create Account →'}</span>
          </LoadingButton>
        </form>

        <div className="mt-12">
           <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-14 rounded-full bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/40 text-[16px] font-medium flex items-center justify-center gap-3 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>
        </div>

        {tab === 'signup' && (
          <p className="text-[12px] text-white/30 text-center mt-8 leading-relaxed">
            By signing up, you agree to our <br/>
            <Link href="#" className="text-white hover:underline">Terms of Service</Link> and <Link href="#" className="text-white hover:underline">Privacy Policy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>
      </div>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
