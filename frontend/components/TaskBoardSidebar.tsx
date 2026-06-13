import React from 'react';
import { FolderKanban, BarChart3, Settings, LogOut, ChevronDown } from 'lucide-react';

interface TaskBoardSidebarProps {
  isSidebarOpen: boolean;
  user: any;
  currentView: 'board' | 'analytics';
  setCurrentView: (view: 'board' | 'analytics') => void;
  logout: () => void;
}

export function TaskBoardSidebar({
  isSidebarOpen,
  user,
  currentView,
  setCurrentView,
  logout
}: TaskBoardSidebarProps) {
  const profilePhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&auto=format&q=80";

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-66 flex flex-col border-r-2 border-black bg-white p-5 transition-transform duration-300 dark:border-white dark:bg-zinc-950 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between pb-4 border-b border-black dark:border-white">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={profilePhoto}
            alt="Profile"
            className="size-9 border border-black dark:border-white object-cover rounded-none"
          />
          <div className="min-w-0 leading-tight">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 truncate">
              {user?.name || 'Bessie Cooper'}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 truncate">
              {user?.role === 'ADMIN' ? 'Admin Account' : 'Personal Account'}
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1">
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Workspace
          </span>
          <nav className="space-y-1 pt-1">
            <button
              onClick={() => setCurrentView('board')}
              className={`flex w-full items-center gap-3 rounded-none border px-3 py-2.5 text-xs transition-colors uppercase font-bold tracking-wider ${currentView === 'board' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff]' : 'border-transparent text-slate-500 hover:border-black dark:text-zinc-400 dark:hover:border-white'}`}
            >
              <FolderKanban className="size-4" />
              Tasks
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex w-full items-center gap-3 rounded-none border px-3 py-2.5 text-xs transition-colors uppercase font-bold tracking-wider ${currentView === 'analytics' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff]' : 'border-transparent text-slate-500 hover:border-black dark:text-zinc-400 dark:hover:border-white'}`}
            >
              <BarChart3 className="size-4" />
              Analytics
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <nav className="space-y-1 border-t border-black pt-3 dark:border-white">
          <button className="flex w-full items-center gap-3 rounded-none border border-transparent hover:border-black px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:border-white dark:hover:text-zinc-200 transition-colors">
            <Settings className="size-4" />
            Settings
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-none border border-transparent hover:border-red-500 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 transition-colors"
          >
            <LogOut className="size-4" />
            Log Out
          </button>
        </nav>
      </div>
    </aside>
  );
}
