'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Task, TaskPriority, TaskStatus } from '../types';
import { fetchTasks, createTask, updateTask, deleteTask } from '../lib/api';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { MobileSyncModal } from './MobileSyncModal';
import { VoiceCommand } from './VoiceCommand';
import { MagicTaskModal } from './MagicTaskModal';
import { TaskKanbanView } from './TaskKanbanView';
import { TaskBoardSidebar } from './TaskBoardSidebar';
import { ConfirmDialog } from './ConfirmDialog';
import { TaskSkeleton } from './TaskSkeleton';
import { Button } from './ui/button';
import {
  FolderKanban,
  List,
  Table,
  Plus,
  Search,
  Bell,
  Settings,
  HelpCircle,
  TrendingUp,
  Building2,
  Users,
  ChevronDown,
  ArrowUpDown,
  Filter as FunnelIcon,
  LogOut,
  SlidersHorizontal,
  LayoutGrid,
  Menu,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Inbox,
  BarChart3,
  Sun,
  Moon,
  Smartphone
} from 'lucide-react';

import { AnalyticsView } from './AnalyticsView';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function TaskBoard() {
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';

    const updateDOM = () => {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setTheme('dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setTheme('light');
      }
    };

    if ('startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(updateDOM);
    } else {
      updateDOM();
    }
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'board' | 'analytics'>('board');
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [preselectedStatus, setPreselectedStatus] = useState<TaskStatus>('TODO');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        page,
        limit: 12, // slightly larger limit for multi-column dashboard
      });
      setTasks(data.tasks);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, debouncedSearch, sortBy, sortOrder, page]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateOrUpdateTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
  }) => {
    const originalTasks = [...tasks];
    setIsTaskModalOpen(false);

    if (editingTask) {
      const optimisticTask: Task = {
        ...editingTask,
        ...taskData,
        dueDate: taskData.dueDate || undefined,
        updatedAt: new Date().toISOString()
      };

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? optimisticTask : t)));
      setEditingTask(null);

      try {
        const updated = await updateTask(editingTask.id, taskData);
        setTasks((prev) => prev.map((t) => (t.id === optimisticTask.id ? updated : t)));
        showToast('Task updated successfully');
        loadTasks(true);
      } catch (err: any) {
        setTasks(originalTasks);
        showToast(err.message || 'Failed to save task', 'error');
      }
    } else {
      const tempId = `temp-${Math.random().toString(36).substring(2, 9)}`;
      const optimisticTask: Task = {
        id: tempId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate || undefined,
        userId: user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: user ? { id: user.id, email: user.email, name: user.name } : undefined
      };

      if (statusFilter === 'ALL' || statusFilter === taskData.status) {
        setTasks((prev) => [optimisticTask, ...prev]);
      }

      try {
        const created = await createTask(taskData);
        setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
        showToast('Task created successfully');
        loadTasks(true);
      } catch (err: any) {
        setTasks(originalTasks);
        showToast(err.message || 'Failed to create task', 'error');
      }
    }
  };

  const handleVoiceCommand = (command: string, transcript: string) => {
    switch (command) {
      case 'ADD_TASK':
        setEditingTask(null);
        setPreselectedStatus('TODO');
        if (transcript) {
          handleCreateOrUpdateTask({
            title: transcript,
            description: 'Created via voice command',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: new Date().toISOString()
          });
        } else {
          setIsTaskModalOpen(true);
        }
        break;
      case 'COMPLETE_TASK': {
        const targetWords = transcript.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/).filter(w => w.length > 2);
        const taskToComplete = tasks.find(t => {
          const taskTitle = t.title.toLowerCase();
          return targetWords.length > 0 && targetWords.every(word => taskTitle.includes(word));
        }) || tasks.find(t => t.title.toLowerCase().includes(transcript.toLowerCase().trim()));
        
        if (taskToComplete) {
          handleToggleComplete(taskToComplete.id, taskToComplete.status);
          showToast(`Completed task: ${taskToComplete.title}`);
        } else {
          showToast(`Could not find a task matching: "${transcript}"`, 'error');
        }
        break;
      }
      case 'DELETE_TASK': {
        const targetWords = transcript.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/).filter(w => w.length > 2);
        const taskToDelete = tasks.find(t => {
          const taskTitle = t.title.toLowerCase();
          return targetWords.length > 0 && targetWords.every(word => taskTitle.includes(word));
        }) || tasks.find(t => t.title.toLowerCase().includes(transcript.toLowerCase().trim()));
        
        if (taskToDelete) {
          setDeleteTaskId(taskToDelete.id);
          showToast(`Please confirm deletion of: ${taskToDelete.title}`);
        } else {
          showToast(`Could not find a task matching: "${transcript}"`, 'error');
        }
        break;
      }
      case 'SEARCH':
        setSearch(transcript);
        showToast(`Searching for: "${transcript}"`);
        break;
      case 'CLEAR_SEARCH':
        setSearch('');
        showToast('Search cleared');
        break;
      case 'DARK_MODE':
        if (theme === 'light') toggleTheme();
        break;
      case 'LIGHT_MODE':
        if (theme === 'dark') toggleTheme();
        break;
      case 'SHOW_ANALYTICS':
        setCurrentView('analytics');
        showToast('Switched to Analytics View');
        break;
      case 'SHOW_BOARD':
        setCurrentView('board');
        showToast('Switched to Board View');
        break;
      case 'LOGOUT':
        logout();
        break;
      case 'UNKNOWN':
        showToast(`Heard: "${transcript}" but didn't recognize command`, 'info');
        break;
    }
  };

  const handleToggleComplete = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const originalTasks = [...tasks];

    setTasks((prev) => {
      if (statusFilter !== 'ALL' && statusFilter !== nextStatus) {
        return prev.filter((t) => t.id !== taskId);
      }
      return prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
    });

    try {
      await updateTask(taskId, { status: nextStatus });
      showToast(nextStatus === 'COMPLETED' ? 'Task marked complete' : 'Task marked incomplete');
      loadTasks(true);
    } catch (err: any) {
      setTasks(originalTasks);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTaskId) return;
    const originalTasks = [...tasks];
    const taskIdToDelete = deleteTaskId;

    setTasks((prev) => prev.filter((t) => t.id !== taskIdToDelete));
    setDeleteTaskId(null);

    try {
      await deleteTask(taskIdToDelete);
      showToast('Task deleted successfully');
      loadTasks(true);
    } catch (err: any) {
      setTasks(originalTasks);
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleSortChange = (
    newSortBy: 'dueDate' | 'priority' | 'createdAt',
    newSortOrder: 'asc' | 'desc'
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const openAddTask = (status: TaskStatus = 'TODO') => {
    setEditingTask(null);
    setPreselectedStatus(status);
    setIsTaskModalOpen(true);
  };

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  const profilePhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&auto=format&q=80";

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-800 dark:bg-zinc-950 dark:text-zinc-50 font-sans">

      <TaskBoardSidebar
        isSidebarOpen={isSidebarOpen}
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        logout={logout}
      />

      <div className="flex flex-1 flex-col md:pl-66 overflow-hidden">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b-2 border-black bg-white px-4 md:px-8 dark:border-white dark:bg-zinc-950">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="border border-black bg-white p-1.5 text-black hover:bg-black hover:text-white md:hidden dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 dark:text-zinc-50 tracking-tight uppercase truncate">
              {currentView === 'analytics' ? 'Analytics' : 'Workspace Tasks'}
            </h1>

            {currentView === 'board' && (
              <div className="hidden sm:flex items-center gap-1.5 ml-6 border-l-2 border-black dark:border-zinc-800 pl-6">
                <button
                  onClick={() => setActiveTab('kanban')}
                  className={`flex items-center gap-1.8 px-3.5 py-2 text-xs font-bold rounded-none uppercase tracking-wider transition-all border ${activeTab === 'kanban' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-white border-transparent text-slate-400 hover:text-black hover:border-black dark:bg-zinc-950 dark:hover:text-white dark:hover:border-white'}`}
                >
                  <FolderKanban className="size-3.5" />
                  Kanban
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`flex items-center gap-1.8 px-3.5 py-2 text-xs font-bold rounded-none uppercase tracking-wider transition-all border ${activeTab === 'list' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-white border-transparent text-slate-400 hover:text-black hover:border-black dark:bg-zinc-950 dark:hover:text-white dark:hover:border-white'}`}
                >
                  <List className="size-3.5" />
                  List
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`flex items-center gap-1.8 px-3.5 py-2 text-xs font-bold rounded-none uppercase tracking-wider transition-all border ${activeTab === 'table' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-white border-transparent text-slate-400 hover:text-black hover:border-black dark:bg-zinc-950 dark:hover:text-white dark:hover:border-white'}`}
                >
                  <Table className="size-3.5" />
                  Table
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="flex size-9 items-center justify-center border border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] transition-colors cursor-pointer rounded-none"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {currentView === 'board' && (
              <div className="flex items-center gap-1.5 md:gap-2">
                <Button
                  onClick={() => setIsMagicModalOpen(true)}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent text-xs font-bold uppercase tracking-wider h-9 px-2.5 md:px-4 rounded-none shrink-0"
                >
                  <Sparkles className="size-4" />
                  <span className="hidden md:inline md:ml-1.5">Magic</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSyncModalOpen(true)}
                  className="text-xs font-bold uppercase tracking-wider h-9 px-2.5 md:px-4 border-black dark:border-white shrink-0"
                >
                  <Smartphone className="size-4" />
                  <span className="hidden md:inline md:ml-1.5">Sync Mobile</span>
                </Button>
                <Button
                  onClick={() => openAddTask('TODO')}
                  className="text-xs font-bold uppercase tracking-wider h-9 px-2.5 md:px-4 shrink-0"
                >
                  <Plus className="size-4" />
                  <span className="hidden md:inline md:ml-1.5">Add Task</span>
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className={`flex-1 p-4 md:p-8 flex flex-col max-w-[1440px] w-full mx-auto overflow-y-auto ${currentView === 'board' ? 'md:overflow-hidden' : ''}`}>
          {currentView === 'analytics' ? (
            <AnalyticsView tasks={tasks} totalCount={totalCount} />
          ) : (
            <>

              <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4.5 border border-black dark:bg-zinc-950 dark:border-white shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#ffffff] rounded-none mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search task..."
                    className="h-9 w-full border border-black bg-white pl-9 pr-4 text-xs font-semibold text-black placeholder-neutral-500 focus:outline-none dark:border-white dark:bg-zinc-950 dark:text-white rounded-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setStatusFilter('ALL'); setPage(1); }}
                    className={`h-9 flex items-center justify-center rounded-none px-4 text-[10px] font-bold uppercase tracking-wider transition-all border ${statusFilter === 'ALL' ? 'bg-black border-black text-white dark:bg-white dark:border-white dark:text-black' : 'bg-white border-black text-black hover:bg-neutral-50 dark:bg-zinc-950 dark:border-white dark:text-white dark:hover:bg-zinc-900'}`}
                  >
                    All Tasks
                  </button>
                  <button
                    onClick={() => { setStatusFilter('TODO'); setPage(1); }}
                    className={`h-9 flex items-center justify-center rounded-none px-4 text-[10px] font-bold uppercase tracking-wider transition-all border ${statusFilter === 'TODO' ? 'bg-black border-black text-white dark:bg-white dark:border-white dark:text-black' : 'bg-white border-black text-black hover:bg-neutral-50 dark:bg-zinc-950 dark:border-white dark:text-white dark:hover:bg-zinc-900'}`}
                  >
                    To do
                  </button>
                  <button
                    onClick={() => { setStatusFilter('IN_PROGRESS'); setPage(1); }}
                    className={`h-9 flex items-center justify-center rounded-none px-4 text-[10px] font-bold uppercase tracking-wider transition-all border ${statusFilter === 'IN_PROGRESS' ? 'bg-black border-black text-white dark:bg-white dark:border-white dark:text-black' : 'bg-white border-black text-black hover:bg-neutral-50 dark:bg-zinc-950 dark:border-white dark:text-white dark:hover:bg-zinc-900'}`}
                  >
                    Doing
                  </button>
                  <button
                    onClick={() => { setStatusFilter('COMPLETED'); setPage(1); }}
                    className={`h-9 flex items-center justify-center rounded-none px-4 text-[10px] font-bold uppercase tracking-wider transition-all border ${statusFilter === 'COMPLETED' ? 'bg-black border-black text-white dark:bg-white dark:border-white dark:text-black' : 'bg-white border-black text-black hover:bg-neutral-50 dark:bg-zinc-950 dark:border-white dark:text-white dark:hover:bg-zinc-900'}`}
                  >
                    Done
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative h-9 flex items-center gap-1.5 rounded-none border border-black bg-white px-3.5 dark:border-white dark:bg-zinc-950">
                    <ArrowUpDown className="size-3.5 text-slate-400" />
                    <select
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-');
                        handleSortChange(field as 'dueDate' | 'priority' | 'createdAt', order as 'asc' | 'desc');
                      }}
                      value={`${sortBy}-${sortOrder}`}
                      className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-black dark:text-white outline-none cursor-pointer pr-1"
                    >
                      <option value="createdAt-desc">Sort by: Newest</option>
                      <option value="createdAt-asc">Sort by: Oldest</option>
                      <option value="dueDate-asc">Sort by: Due Soon</option>
                      <option value="dueDate-desc">Sort by: Due Late</option>
                      <option value="priority-desc">Sort by: Priority</option>
                    </select>
                  </div>

                  <button className="h-9 flex items-center gap-1.8 rounded-none border border-black bg-white px-3.5 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-neutral-50 dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 transition-colors">
                    <FunnelIcon className="size-3.5 text-slate-400" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="shrink-0 h-1 w-full overflow-hidden bg-transparent mb-4 rounded-none">
                {loading && tasks.length > 0 && (
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '300%' }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    className="h-full w-1/3 bg-black dark:bg-white rounded-none"
                  />
                )}
              </div>

              {loading && tasks.length === 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-4">
                    <div className="h-5 w-24 bg-slate-250 dark:bg-zinc-850 rounded-none animate-pulse" />
                    <TaskSkeleton />
                    <TaskSkeleton />
                  </div>
                  <div className="space-y-4">
                    <div className="h-5 w-24 bg-slate-250 dark:bg-zinc-850 rounded-none animate-pulse" />
                    <TaskSkeleton />
                    <TaskSkeleton />
                  </div>
                  <div className="space-y-4">
                    <div className="h-5 w-24 bg-slate-250 dark:bg-zinc-850 rounded-none animate-pulse" />
                    <TaskSkeleton />
                    <TaskSkeleton />
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-black dark:bg-zinc-950 dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] rounded-none">
                  <AlertCircle className="size-10 text-red-500 mb-3" />
                  <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-base">Failed to load tasks</h3>
                  <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1 mb-4">{error}</p>
                  <Button onClick={() => loadTasks()} className="px-5">
                    Retry
                  </Button>
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-black dark:bg-zinc-950 dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] rounded-none">
                  <div className="flex size-14 items-center justify-center border border-black bg-white dark:bg-zinc-950 dark:border-white mb-4 rounded-none">
                    <FolderKanban className="size-7 text-black dark:text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-base uppercase tracking-wider">No tasks found</h3>
                  <p className="text-xs text-slate-450 dark:text-zinc-500 mt-1 max-w-xs leading-relaxed">
                    Add a new task or change your filters to populate your workspace dashboard.
                  </p>
                  <Button onClick={() => openAddTask('TODO')} className="mt-4">
                    <Plus className="size-3.5 mr-1" />
                    Create Task
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-visible md:overflow-hidden flex flex-col">
                  {activeTab === 'kanban' && (
                    <TaskKanbanView
                      tasks={tasks}
                      statusFilter={statusFilter}
                      openAddTask={openAddTask}
                      setEditingTask={setEditingTask}
                      setIsTaskModalOpen={setIsTaskModalOpen}
                      setDeleteTaskId={setDeleteTaskId}
                      handleToggleComplete={handleToggleComplete}
                    />
                  )}

                  {activeTab === 'list' && (
                    <motion.div
                      layout
                      className="space-y-3 bg-white p-6 border border-black dark:bg-zinc-950 dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] rounded-none flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                      <AnimatePresence mode="popLayout">
                        {tasks.map((task) => (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                            className="flex items-center justify-between p-3.5 border border-black bg-white hover:bg-neutral-50 dark:border-white dark:bg-zinc-950 dark:hover:bg-zinc-900 cursor-pointer transition-all rounded-none shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:shadow-[3px_3px_0px_0px_#000000] dark:hover:shadow-[3px_3px_0px_0px_#ffffff]"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(task.id, task.status);
                                }}
                                className={`size-5 border border-black dark:border-white rounded-none flex items-center justify-center p-0.5 transition-colors ${task.status === 'COMPLETED' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white hover:bg-neutral-100 dark:bg-zinc-950 dark:hover:bg-zinc-900'}`}
                              >
                                {task.status === 'COMPLETED' && <CheckCircle2 className="size-3.5" />}
                              </button>
                              <div className="flex flex-col">
                                <span className={`text-sm font-semibold text-slate-800 dark:text-zinc-200 ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}`}>
                                  {task.title}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold">
                              <span className={`px-2 py-0.5 border border-black bg-white text-black dark:border-white dark:bg-zinc-950 dark:text-white rounded-none text-[10px] font-bold uppercase tracking-wider`}>
                                {task.priority}
                              </span>
                              <span className="text-slate-450 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {activeTab === 'table' && (
                    <div className="flex-1 overflow-y-auto min-h-0 bg-white border-2 border-black dark:bg-zinc-950 dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] rounded-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-black bg-neutral-50 dark:border-white dark:bg-zinc-900 text-black dark:text-white font-bold uppercase tracking-wider">
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
                              onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                              className="hover:bg-neutral-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                            >
                              <td className="p-4 font-semibold text-slate-800 dark:text-zinc-200">{task.title}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 border border-black bg-white text-black dark:border-white dark:bg-zinc-950 dark:text-white rounded-none font-bold text-[10px] uppercase tracking-wider`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-4 font-medium">
                                <span className={`px-2 py-0.5 border border-black bg-white text-black dark:border-white dark:bg-zinc-950 dark:text-white rounded-none font-bold text-[10px] uppercase tracking-wider`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td className="p-4 font-medium text-slate-500 dark:text-zinc-450 text-[10px] uppercase tracking-wider">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="shrink-0 flex items-center justify-between border-t border-dashed border-black pt-6 dark:border-white mt-6">
                      <p className="text-xs font-semibold text-slate-450 dark:text-zinc-500">
                        Showing {tasks.length} of {totalCount} tasks
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="text-xs font-bold rounded-none"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`flex size-8 items-center justify-center rounded-none border text-xs font-bold transition-all ${p === page ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-white text-black border-black hover:bg-neutral-50 dark:bg-zinc-950 dark:text-white dark:border-white dark:hover:bg-zinc-900'}`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="text-xs font-bold rounded-none"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-35 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="fixed top-4 left-68 z-40 border border-black bg-white p-2 text-black md:hidden dark:bg-zinc-950 dark:text-white shadow-md rounded-none"
        >
          <X className="size-4" />
        </button>
      )}

      <VoiceCommand onCommand={handleVoiceCommand} />

      <MobileSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <MagicTaskModal
        isOpen={isMagicModalOpen}
        onClose={() => setIsMagicModalOpen(false)}
        onTasksGenerated={(tasks) => {
          loadTasks(true);
          showToast(`Successfully generated ${tasks.length} tasks!`, 'success');
        }}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        onSubmit={handleCreateOrUpdateTask}
        task={editingTask}
        defaultStatus={preselectedStatus}
        isSaving={isSaving}
        onTaskUpdated={(updatedTask) => {
          setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
          setEditingTask(updatedTask);
        }}
      />

      <ConfirmDialog
        isOpen={deleteTaskId !== null}
        title="Delete Task"
        message="Are you absolutely sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTaskId(null)}
      />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 rounded-none px-4 py-3 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] border border-black dark:border-white text-xs font-bold transition-all duration-300 animate-slide-in-right ${toast.type === 'success' ? 'bg-white text-green-700 dark:bg-zinc-950 dark:text-green-400' : toast.type === 'error' ? 'bg-white text-red-700 dark:bg-zinc-950 dark:text-red-400' : 'bg-white text-black dark:bg-zinc-950 dark:text-white'}`}
          >
            {toast.type === 'success' && <CheckCircle2 className="size-4 text-green-500" />}
            {toast.type === 'error' && <AlertCircle className="size-4 text-red-500" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
