'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { fetchUserDetails } from '@/lib/api';
import { UserDetailsResponse } from '@/types';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Shield, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sun, 
  Moon,
  ListTodo,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserDetailPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [details, setDetails] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/');
      } else if (currentUser.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [currentUser, authLoading, router]);

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

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN' && userId) {
      const loadDetails = async () => {
        try {
          setLoading(true);
          const data = await fetchUserDetails(userId);
          setDetails(data);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch user details');
        } finally {
          setLoading(false);
        }
      };
      loadDetails();
    }
  }, [currentUser, userId]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white dark:border-t-transparent" />
          <span className="text-xs font-black tracking-wider text-neutral-500 dark:text-zinc-400 uppercase animate-pulse">
            Loading user profile...
          </span>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-950 p-6">
        <div className="w-full max-w-md text-center bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-none p-8 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <AlertCircle className="size-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-wider mb-2">Error Occurred</h2>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mb-6 uppercase tracking-wider">{error || 'User details could not be loaded.'}</p>
          <button
            onClick={() => router.push('/admin')}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 border-2 border-black bg-white text-black rounded-none text-xs font-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-955 dark:text-white dark:hover:bg-white dark:hover:text-black transition uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#ffffff]"
          >
            <ArrowLeft className="size-4" />
            Back to Users Directory
          </button>
        </div>
      </div>
    );
  }

  const { user, stats, recentActivity, tasks } = details;

  return (
    <div className="min-h-screen bg-neutral-50 text-black dark:bg-zinc-950 dark:text-white transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b-2 border-black bg-white px-8 dark:border-white dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex size-9 items-center justify-center rounded-none border border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:bg-zinc-950 dark:hover:bg-white dark:hover:text-black transition shadow-[1px_1px_0px_0px_#000000] dark:shadow-[1px_1px_0px_0px_#ffffff]"
          >
            <ArrowLeft className="size-4.5" />
          </button>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">
            User Profile Analysis
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-none border border-black p-2 bg-white text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:bg-zinc-955 dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto p-8 space-y-8">
        
        {/* User Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-zinc-955 border-2 border-black dark:border-white rounded-none p-6.5 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4.5">
            <div className="flex size-15 items-center justify-center rounded-none border-2 border-black bg-black text-white dark:border-white dark:bg-white dark:text-black font-black text-2xl">
              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
                  {user.name || 'N/A'}
                </h2>
                <span className="inline-flex items-center gap-1.2 rounded-none border border-black bg-white px-2 py-0.5 text-[9px] font-black tracking-wider uppercase text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                  <Shield className="size-3" />
                  {user.role}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 text-xs font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-black dark:text-white" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-black dark:text-white" />
                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white dark:bg-zinc-955 border-2 border-black dark:border-white rounded-none p-5 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Total Todos</span>
              <p className="text-3xl font-black text-black dark:text-white">{stats.totalTasks}</p>
            </div>
            <div className="size-11 rounded-none border border-black bg-neutral-50 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white">
              <ListTodo className="size-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white dark:bg-zinc-955 border-2 border-black dark:border-white rounded-none p-5 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Completed</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.completedTasks}</p>
            </div>
            <div className="size-11 rounded-none border border-black bg-neutral-50 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white">
              <CheckCircle2 className="size-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white dark:bg-zinc-955 border-2 border-black dark:border-white rounded-none p-5 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Pending</span>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-500">{stats.pendingTasks}</p>
            </div>
            <div className="size-11 rounded-none border border-black bg-neutral-50 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white">
              <Clock className="size-5" />
            </div>
          </motion.div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tasks List (Table/Grid) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-black dark:text-white uppercase tracking-wider">
                User Tasks ({tasks.length})
              </h3>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white dark:bg-zinc-955 border-2 border-black dark:border-white rounded-none p-12 text-center text-neutral-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
                No tasks created by this user yet.
              </div>
            ) : (
              <div className="overflow-hidden bg-white dark:bg-zinc-955 border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-black bg-neutral-50 dark:border-white dark:bg-zinc-900 text-black dark:text-white font-bold uppercase tracking-wider">
                        <th className="p-4 font-bold text-[10px] tracking-wider">Task Title</th>
                        <th className="p-4 font-bold text-[10px] tracking-wider">Status</th>
                        <th className="p-4 font-bold text-[10px] tracking-wider">Priority</th>
                        <th className="p-4 font-bold text-[10px] tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black dark:divide-white">
                      {tasks.map((task) => (
                        <tr
                          key={task.id}
                          className="hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                          <td className="p-4 font-semibold text-slate-800 dark:text-zinc-200">{task.title}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center rounded-none border border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 font-medium">
                            <span className="inline-flex items-center rounded-none border border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                              {task.priority}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>

          {/* Activity Timeline Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-base font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="size-4" />
              Recent Activity
            </h3>

            <div className="bg-white dark:bg-zinc-955 border-2 border-black dark:border-white rounded-none p-5 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff]">
              {recentActivity.length === 0 ? (
                <div className="text-center text-neutral-500 py-6 text-xs font-black uppercase tracking-wider">
                  No activity found.
                </div>
              ) : (
                <div className="relative border-l border-black dark:border-white pl-4 space-y-6">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-6.5 top-1.5 flex size-4 items-center justify-center border border-black bg-black dark:border-white dark:bg-white rounded-none" />
                      
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-neutral-500 dark:text-zinc-400 font-black uppercase tracking-wider">
                          {new Date(activity.timestamp).toLocaleDateString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <p className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                          {activity.action}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                          {activity.taskTitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
