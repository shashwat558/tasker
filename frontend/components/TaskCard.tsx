'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { 
  MoreHorizontal, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  ListTodo, 
  Pencil, 
  Trash2, 
  CheckSquare, 
  Square 
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string, currentStatus: TaskStatus) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const parseChecklist = (description?: string) => {
    if (!description) return null;
    const lines = description.split('\n');
    let total = 0;
    let completed = 0;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
        total++;
        if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
          completed++;
        }
      }
    });
    if (total === 0) return null;
    return { completed, total };
  };

  const getTags = (task: Task) => {
    const tags: string[] = [];
    const hashtagRegex = /#(\w+)/g;
    let match;
    if (task.description) {
      const tempDesc = task.description;
      while ((match = hashtagRegex.exec(tempDesc)) !== null) {
        if (!tags.includes(match[1])) {
          tags.push(match[1]);
        }
      }
    }

    if (tags.length === 0) {
      if (task.priority === 'HIGH') {
        tags.push('Urgent');
      } else if (task.priority === 'MEDIUM') {
        tags.push('Internal');
      } else if (task.priority === 'LOW') {
        tags.push('Lead');
      }

      const titleLower = task.title.toLowerCase();
      if (titleLower.includes('report') || titleLower.includes('eval')) {
        tags.push('Report');
      } else if (titleLower.includes('market') || titleLower.includes('digital')) {
        tags.push('Marketing');
      } else if (titleLower.includes('visit') || titleLower.includes('factory')) {
        tags.push('Client');
      }
    }

    return tags;
  };

  const getTagStyles = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower === 'urgent' || lower === 'high') {
      return 'border border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400';
    }
    if (lower === 'lead' || lower === 'low') {
      return 'border border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400';
    }
    if (lower === 'internal' || lower === 'medium') {
      return 'border border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450';
    }
    return 'border border-black text-black bg-white dark:border-white dark:text-white dark:bg-zinc-900';
  };

  const getCollaborators = (taskId: string) => {
    const users = [
      { name: 'Bessie Cooper', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&auto=format&q=80', initials: 'BC', color: 'bg-indigo-500' },
      { name: 'Albert Flores', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&auto=format&q=80', initials: 'AF', color: 'bg-emerald-500' },
      { name: 'Jenny Wilson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&auto=format&q=80', initials: 'JW', color: 'bg-amber-500' },
      { name: 'Courtney Henry', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&auto=format&q=80', initials: 'CH', color: 'bg-rose-500' },
    ];

    const charCodeSum = taskId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const count = (charCodeSum % 3) + 1;
    const assigned: typeof users = [];

    for (let i = 0; i < count; i++) {
      const userIndex = (charCodeSum + i) % users.length;
      if (!assigned.some(u => u.name === users[userIndex].name)) {
        assigned.push(users[userIndex]);
      }
    }

    return assigned;
  };

  const charCodeSum = task.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const commentCount = charCodeSum % 5;
  const attachmentCount = task.attachments ? task.attachments.length : 0;

  const checklist = parseChecklist(task.description);
  const tags = getTags(task);
  const collaborators = getCollaborators(task.id);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.stop-click-propagation')) {
      return;
    }
    onEdit(task);
  };

  const isCompleted = task.status === 'COMPLETED';

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col rounded-none border border-black bg-white p-5 shadow-[2px_2px_0px_0px_#000000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[2px_2px_0px_0px_#ffffff] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className={`text-base font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight leading-snug line-clamp-1 uppercase ${isCompleted ? 'line-through text-slate-400 dark:text-zinc-555 font-bold' : ''}`}>
          {task.title}
        </h4>

        <div className="relative stop-click-propagation" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="border border-black bg-white p-1 text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none"
          >
            <MoreHorizontal className="size-4.5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-32 origin-top-right border border-black bg-white p-1 shadow-[3px_3px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[3px_3px_0px_0px_#ffffff] z-10 rounded-none">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(task);
                }}
                className="flex w-full items-center gap-2 px-2.5 py-1.8 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete(task.id);
                }}
                className="flex w-full items-center gap-2 px-2.5 py-1.8 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-600 hover:text-white dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-black transition-colors rounded-none"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className={`mt-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed ${isCompleted ? 'opacity-50' : ''}`}>
        {task.description ? task.description.replace(/#\w+/g, '').trim() || 'No description provided.' : 'No description provided.'}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getTagStyles(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="my-4 border-t border-dashed border-black dark:border-zinc-800" />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3.5 text-[10px] font-bold uppercase tracking-wider">
        {task.dueDate && (
          <div className="inline-flex items-center gap-1.5 text-slate-450 dark:text-zinc-450">
            <Calendar className="size-3.5 text-slate-400 dark:text-zinc-500" />
            <span>Due {formatDate(task.dueDate)}</span>
          </div>
        )}

        {checklist && (
          <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 ml-auto font-bold">
            <ListTodo className="size-3.5 text-slate-450 dark:text-zinc-500" />
            <span>{checklist.completed}/{checklist.total}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex -space-x-1 overflow-hidden">
          {collaborators.map((user, idx) => (
            <img
              key={idx}
              className="inline-block size-6 border border-black dark:border-white ring-1 ring-white dark:ring-zinc-900 object-cover rounded-none"
              src={user.avatar}
              alt={user.name}
              title={user.name}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 text-black dark:text-white">
          {commentCount > 0 && (
            <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <MessageSquare className="size-3.5" />
              <span className="text-[10px] font-bold">{commentCount}</span>
            </div>
          )}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <Paperclip className="size-3.5" />
              <span className="text-[10px] font-bold">{attachmentCount}</span>
            </div>
          )}

          <div className="stop-click-propagation flex items-center ml-2 border-l border-black dark:border-zinc-850 pl-3">
            <button
              onClick={() => onToggleComplete(task.id, task.status)}
              className="text-black hover:text-red-500 dark:text-white dark:hover:text-red-400 transition-colors"
              title={isCompleted ? "Mark incomplete" : "Mark complete"}
            >
              {isCompleted ? (
                <CheckSquare className="size-4.5 text-black dark:text-white" />
              ) : (
                <Square className="size-4.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
