import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface TaskKanbanViewProps {
  tasks: Task[];
  statusFilter: 'ALL' | TaskStatus;
  openAddTask: (status: TaskStatus) => void;
  setEditingTask: (task: Task) => void;
  setIsTaskModalOpen: (isOpen: boolean) => void;
  setDeleteTaskId: (id: string) => void;
  handleToggleComplete: (id: string, currentStatus: TaskStatus) => void;
}

export function TaskKanbanView({
  tasks,
  statusFilter,
  openAddTask,
  setEditingTask,
  setIsTaskModalOpen,
  setDeleteTaskId,
  handleToggleComplete
}: TaskKanbanViewProps) {
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="flex-1 md:min-h-0 grid grid-cols-1 gap-6 md:grid-cols-3 items-start h-auto md:h-full">
      {(statusFilter === 'ALL' || statusFilter === 'TODO') && (
        <div className="space-y-4 flex flex-col h-auto md:h-full md:min-h-0">
          <div className="shrink-0 flex items-center justify-between border-b border-dashed border-black pb-3.5 dark:border-white">
            <div className="flex items-center gap-2">
              <span className="size-2.5 bg-[#f97316] border border-black dark:border-white rounded-none" />
              <h3 className="font-bold text-slate-850 dark:text-zinc-200 text-sm uppercase tracking-wider">To do</h3>
              <span className="rounded-none border border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                {todoTasks.length} Tasks
              </span>
            </div>
            <button
              onClick={() => openAddTask('TODO')}
              className="border border-black bg-white p-1 text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-none"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="space-y-4 md:overflow-y-auto md:flex-1 pr-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <AnimatePresence mode="popLayout">
              {todoTasks.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="w-full"
                >
                  <TaskCard
                    task={t}
                    onEdit={(task) => { setEditingTask(task); setIsTaskModalOpen(true); }}
                    onDelete={(id) => setDeleteTaskId(id)}
                    onToggleComplete={handleToggleComplete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {todoTasks.length === 0 && (
              <motion.div 
                layout 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="rounded-none border border-dashed border-black p-6 text-center text-xs font-bold uppercase tracking-wider text-neutral-500 dark:border-white dark:text-zinc-400"
              >
                No tasks in To do
              </motion.div>
            )}
          </div>
        </div>
      )}

      {(statusFilter === 'ALL' || statusFilter === 'IN_PROGRESS') && (
        <div className="space-y-4 flex flex-col h-auto md:h-full md:min-h-0">
          <div className="shrink-0 flex items-center justify-between border-b border-dashed border-black pb-3.5 dark:border-white">
            <div className="flex items-center gap-2">
              <span className="size-2.5 bg-[#3b82f6] border border-black dark:border-white rounded-none" />
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm uppercase tracking-wider">Doing</h3>
              <span className="rounded-none border border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                {inProgressTasks.length} Tasks
              </span>
            </div>
            <button
              onClick={() => openAddTask('IN_PROGRESS')}
              className="border border-black bg-white p-1 text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-none"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="space-y-4 md:overflow-y-auto md:flex-1 pr-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <AnimatePresence mode="popLayout">
              {inProgressTasks.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="w-full"
                >
                  <TaskCard
                    task={t}
                    onEdit={(task) => { setEditingTask(task); setIsTaskModalOpen(true); }}
                    onDelete={(id) => setDeleteTaskId(id)}
                    onToggleComplete={handleToggleComplete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {inProgressTasks.length === 0 && (
              <motion.div 
                layout 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="rounded-none border border-dashed border-black p-6 text-center text-xs font-bold uppercase tracking-wider text-neutral-500 dark:border-white dark:text-zinc-400"
              >
                No tasks in Doing
              </motion.div>
            )}
          </div>
        </div>
      )}

      {(statusFilter === 'ALL' || statusFilter === 'COMPLETED') && (
        <div className="space-y-4 flex flex-col h-auto md:h-full md:min-h-0">
          <div className="shrink-0 flex items-center justify-between border-b border-dashed border-black pb-3.5 dark:border-white">
            <div className="flex items-center gap-2">
              <span className="size-2.5 bg-[#a855f7] border border-black dark:border-white rounded-none" />
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm uppercase tracking-wider">Done</h3>
              <span className="rounded-none border border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                {completedTasks.length} Tasks
              </span>
            </div>
            <button
              onClick={() => openAddTask('COMPLETED')}
              className="border border-black bg-white p-1 text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-none"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="space-y-4 md:overflow-y-auto md:flex-1 pr-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <AnimatePresence mode="popLayout">
              {completedTasks.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="w-full"
                >
                  <TaskCard
                    task={t}
                    onEdit={(task) => { setEditingTask(task); setIsTaskModalOpen(true); }}
                    onDelete={(id) => setDeleteTaskId(id)}
                    onToggleComplete={handleToggleComplete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {completedTasks.length === 0 && (
              <motion.div 
                layout 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="rounded-none border border-dashed border-black p-6 text-center text-xs font-bold uppercase tracking-wider text-neutral-500 dark:border-white dark:text-zinc-400"
              >
                No tasks in Done
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
