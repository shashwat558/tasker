'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthView } from '@/components/AuthView';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 animate-spin rounded-none border-2 border-black border-t-transparent dark:border-white" />
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
            Loading your workspace...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-2">
        <div className="size-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
          Redirecting to your dashboard...
        </span>
      </div>
    </div>
  );
}
