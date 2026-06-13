'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { FolderKanban, Mail, Lock, User, AlertCircle, ArrowRight, Shield } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']),
  adminSecret: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: signupErrors },
    reset: resetSignup,
    watch: watchSignup,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      role: 'USER',
      adminSecret: '',
    },
  });

  const selectedRole = watchSignup('role');

  const handleLoginSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    try {
      await signup(data.email, data.password, data.name, data.role, data.adminSecret);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setIsLogin(!isLogin);
    resetLogin();
    resetSignup();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-7 border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[6px_6px_0px_0px_#ffffff]">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex size-11 items-center justify-center border border-black bg-black text-white dark:border-white dark:bg-white dark:text-black mb-4">
            <FolderKanban className="size-5" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-zinc-50 uppercase">
            {isLogin ? 'Sign in to TaskFlow' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500">
            {isLogin ? "Welcome back! Enter your details to continue." : 'Start managing your tasks effectively today.'}
          </p>
        </div>

        {error && (
          <div className="border border-red-500 bg-red-50/80 p-3.5 text-xs font-bold text-red-700 dark:bg-red-950/20 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleSubmitLogin(handleLoginSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                <Mail className="size-3.5" />
                Email Address
              </label>
              <input
                type="email"
                {...registerLogin('email')}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 border border-black dark:border-white"
              />
              {loginErrors.email && (
                <p className="text-[10px] font-bold text-red-500">{loginErrors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                <Lock className="size-3.5" />
                Password
              </label>
              <input
                type="password"
                {...registerLogin('password')}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-black dark:border-white"
              />
              {loginErrors.password && (
                <p className="text-[10px] font-bold text-red-500">{loginErrors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-xs mt-2 border border-black bg-black text-white hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitSignup(handleSignupSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                <User className="size-3.5" />
                Full Name
              </label>
              <input
                type="text"
                {...registerSignup('name')}
                placeholder="John Doe"
                className="w-full px-3.5 py-2.5 border border-black dark:border-white"
              />
              {signupErrors.name && (
                <p className="text-[10px] font-bold text-red-500">{signupErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                <Mail className="size-3.5" />
                Email Address
              </label>
              <input
                type="email"
                {...registerSignup('email')}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 border border-black dark:border-white"
              />
              {signupErrors.email && (
                <p className="text-[10px] font-bold text-red-500">{signupErrors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                <Lock className="size-3.5" />
                Password
              </label>
              <input
                type="password"
                {...registerSignup('password')}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-black dark:border-white"
              />
              {signupErrors.password && (
                <p className="text-[10px] font-bold text-red-500">{signupErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                <Shield className="size-3.5" />
                Account Role
              </label>
              <select
                {...registerSignup('role')}
                className="w-full px-3.5 py-2.5 border border-black dark:border-white"
              >
                <option value="USER">User (Personal Tasks Only)</option>
                <option value="ADMIN">Admin (View/Edit All Users' Tasks)</option>
              </select>
              {signupErrors.role && (
                <p className="text-[10px] font-bold text-red-500">{signupErrors.role.message}</p>
              )}
            </div>

            {selectedRole === 'ADMIN' && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                  <Lock className="size-3.5" />
                  Admin Secret Key
                </label>
                <input
                  type="password"
                  {...registerSignup('adminSecret')}
                  placeholder="Enter admin secret code"
                  className="w-full px-3.5 py-2.5 border border-black dark:border-white"
                />
                {signupErrors.adminSecret && (
                  <p className="text-[10px] font-bold text-red-500">{signupErrors.adminSecret.message}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-xs mt-2 border border-black bg-black text-white hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        )}

        <div className="text-center pt-1 border-t border-black dark:border-white">
          <button
            onClick={toggleMode}
            className="text-xs font-bold text-black hover:underline dark:text-white flex items-center justify-center gap-1 w-full mt-4 uppercase tracking-wider"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
