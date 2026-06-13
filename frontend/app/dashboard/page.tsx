'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TaskBoard } from '@/components/TaskBoard';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role === 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white dark:border-t-transparent" />
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
            Loading your workspace...
          </span>
        </div>
      </div>
    );
  }

  return <TaskBoard />;
}
