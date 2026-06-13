'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminView } from '@/components/AdminView';
import { 
  Shield, 
  LogOut, 
  Users, 
  Settings, 
  HelpCircle, 
  Sun, 
  Moon,
  AlertCircle,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminDashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/');
      } else if (user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white dark:border-t-transparent" />
          <span className="text-xs font-black tracking-wider text-neutral-500 dark:text-zinc-400 uppercase animate-pulse">
            Loading Admin Workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 text-black dark:bg-zinc-950 dark:text-white transition-colors duration-200">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-66 flex-col border-r-2 border-black bg-white p-6 dark:border-white dark:bg-zinc-950 shadow-[2px_0px_0px_0px_#000000] dark:shadow-[2px_0px_0px_0px_#ffffff]">
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="flex size-9 items-center justify-center rounded-none border border-black bg-black text-white dark:border-white dark:bg-white dark:text-black">
            <Shield className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-black dark:text-white uppercase tracking-wider leading-none">
              TaskFlow Admin
            </span>
            <span className="mt-1 text-[10px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wider leading-none">
              Management Portal
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <nav className="space-y-1">
            <div className="text-[10px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wider px-3 mb-2">
              Management
            </div>
            <button className="flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-xs transition-colors font-black bg-neutral-100 text-black dark:bg-zinc-900 dark:text-white border border-black dark:border-white">
              <Users className="size-4" />
              Users Directory
            </button>
          </nav>

          <div className="mt-auto space-y-4">
            <nav className="space-y-0.5 border-t border-dashed border-black pt-3 dark:border-white">
              <button className="flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-xs font-black text-neutral-500 hover:bg-neutral-50 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white transition-colors uppercase tracking-wider">
                <Settings className="size-4" />
                Settings
              </button>
              <button className="flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-xs font-black text-neutral-500 hover:bg-neutral-50 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white transition-colors uppercase tracking-wider">
                <HelpCircle className="size-4" />
                Documentation
              </button>
            </nav>

            {/* User Profile Summary */}
            <div className="flex items-center gap-3 rounded-none bg-white p-3.5 dark:bg-zinc-950 border border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff]">
              <div className="flex size-9 items-center justify-center rounded-none border border-black bg-neutral-50 text-black dark:border-white dark:bg-zinc-900 dark:text-white text-sm font-black uppercase">
                {user.name ? user.name[0] : user.email[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-black text-black dark:text-white leading-tight uppercase tracking-wider">
                  {user.name || 'Admin User'}
                </p>
                <p className="truncate text-[10px] text-neutral-500 dark:text-zinc-400 mt-0.5 font-bold leading-none">
                  {user.email}
                </p>
              </div>
              <button 
                onClick={logout}
                title="Log out"
                className="rounded-none border border-black bg-white p-1.5 text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-66">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b-2 border-black bg-white px-8 dark:border-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">
              Users Directory
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Badge */}
            <button className="relative rounded-none border border-black p-2 bg-white text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:bg-zinc-950 dark:hover:bg-white dark:hover:text-black transition-colors">
              <Bell className="size-4" />
              <span className="absolute top-1 right-1 flex size-2 bg-red-600 border border-black dark:border-white rounded-none" />
            </button>

            {/* Dark/Light mode Toggler */}
            <button
              onClick={toggleTheme}
              className="rounded-none border border-black p-2 bg-white text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:bg-zinc-950 dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6 max-w-[1440px] w-full mx-auto">
          <AdminView onShowToast={showToast} />
        </main>
      </div>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 rounded-none border-2 border-black px-4 py-3 text-xs font-black shadow-[4px_4px_0px_0px_#000000] bg-white text-black dark:bg-zinc-950 dark:border-white dark:shadow-[4px_4px_0px_0px_#ffffff] dark:text-white animate-in slide-in-from-bottom-5 duration-300`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="size-4 text-green-500" />
            ) : (
              <AlertCircle className="size-4 text-red-500" />
            )}
            <span className="uppercase tracking-wider">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
