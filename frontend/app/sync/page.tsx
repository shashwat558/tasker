'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SyncPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMessage('No sync token provided in the URL.');
      return;
    }

    const performSync = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const res = await fetch(`${API_URL}/auth/sync-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to sync session');
        }

        // Successfully logged in via sync token!
        // We use the same local storage structure as regular login
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setStatus('success');
        
        // Let the user see the success message briefly before redirecting
        setTimeout(() => {
          // Force a hard reload to ensure AuthContext picks up the new token
          window.location.href = '/dashboard';
        }, 1500);

      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An error occurred during sync.');
      }
    };

    performSync();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm border-2 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-900 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="size-12 animate-spin text-black dark:text-white mb-4" />
            <h1 className="text-xl font-bold uppercase tracking-widest text-black dark:text-white">
              Syncing Session...
            </h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Please wait while we log you in securely.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="size-12 text-green-500 mb-4" />
            <h1 className="text-xl font-bold uppercase tracking-widest text-black dark:text-white">
              Sync Complete!
            </h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="size-12 text-red-500 mb-4" />
            <h1 className="text-xl font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
              Sync Failed
            </h1>
            <p className="mt-2 mb-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full border-2 border-black bg-black px-4 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors dark:border-white dark:bg-white dark:text-black dark:hover:bg-zinc-900 dark:hover:text-white rounded-none"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
