'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task, TaskStatus, TaskPriority, Attachment } from '../types';
import { Button } from './ui/button';
import { 
  X, 
  Calendar, 
  Type, 
  AlignLeft, 
  Info, 
  HelpCircle, 
  Paperclip, 
  Trash2, 
  Upload, 
  FileText, 
  Loader2 
} from 'lucide-react';
import { uploadAttachment, deleteAttachment } from '../lib/api';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().max(1000, 'Description must be under 1000 characters'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED'] as const),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'] as const),
  dueDate: z.string().nullable().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
  }) => Promise<void>;
  task?: Task | null;
  defaultStatus?: TaskStatus;
  isSaving: boolean;
  onTaskUpdated?: (updatedTask: Task) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  task = null,
  defaultStatus = 'TODO',
  isSaving,
  onTaskUpdated,
}: TaskModalProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'MEDIUM',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (task) {
      setAttachments(task.attachments || []);
      let formattedDate = '';
      if (task.dueDate) {
        formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
      }
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: formattedDate,
      });
    } else {
      setAttachments([]);
      reset({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'MEDIUM',
        dueDate: '',
      });
    }
  }, [task, defaultStatus, reset, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    setIsUploading(true);
    try {
      const newAttachment = await uploadAttachment(task.id, file);
      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          attachments: updatedAttachments,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;

    const previousAttachments = [...attachments];
    const updatedAttachments = attachments.filter((a) => a.id !== attachmentId);
    setAttachments(updatedAttachments);
    if (onTaskUpdated) {
      onTaskUpdated({
        ...task,
        attachments: updatedAttachments,
      });
    }

    try {
      await deleteAttachment(task.id, attachmentId);
    } catch (err: any) {
      setAttachments(previousAttachments);
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          attachments: previousAttachments,
        });
      }
      alert(err.message || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFormSubmit = async (values: TaskFormValues) => {
    let apiDueDate: string | null = null;
    if (values.dueDate) {
      apiDueDate = new Date(values.dueDate).toISOString();
    }
    await onSubmit({
      title: values.title,
      description: values.description || '',
      status: values.status as TaskStatus,
      priority: values.priority as TaskPriority,
      dueDate: apiDueDate,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative z-10 w-full max-w-lg overflow-hidden border-2 border-black bg-white shadow-[6px_6px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[6px_6px_0px_0px_#ffffff] flex flex-col max-h-[90vh] rounded-none"
          >
            <div className="flex items-center justify-between border-b border-black p-5 dark:border-white flex-shrink-0">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-zinc-50 tracking-tight uppercase">
                {task ? 'Edit Task' : 'Create Task'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="border border-black bg-white p-1 text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    <Type className="size-3.5" />
                    Title
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    placeholder="e.g. Preparation of Q2 report"
                    className="w-full px-3.5 py-2.5 border border-black dark:border-white"
                  />
                  {errors.title && (
                    <p className="text-[10px] font-bold text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    <AlignLeft className="size-3.5" />
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Add details, subtasks like:&#10;- [ ] Checklist item 1&#10;- [ ] Checklist item 2&#10;Or hashtags like #Internal #Urgent"
                    className="w-full px-3.5 py-2.5 resize-none leading-relaxed border border-black dark:border-white"
                  />
                  {errors.description && (
                    <p className="text-[10px] font-bold text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      <Info className="size-3.5" />
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3.5 py-2.5 border border-black dark:border-white cursor-pointer"
                    >
                      <option value="TODO">To do</option>
                      <option value="IN_PROGRESS">Doing</option>
                      <option value="COMPLETED">Done</option>
                    </select>
                    {errors.status && (
                      <p className="text-[10px] font-bold text-red-500">{errors.status.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      <HelpCircle className="size-3.5" />
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full px-3.5 py-2.5 border border-black dark:border-white cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                    {errors.priority && (
                      <p className="text-[10px] font-bold text-red-500">{errors.priority.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    <Calendar className="size-3.5" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className="w-full px-3.5 py-2.5 border border-black dark:border-white"
                  />
                  {errors.dueDate && (
                    <p className="text-[10px] font-bold text-red-500">{errors.dueDate.message}</p>
                  )}
                </div>

                {/* Attachments Section */}
                {task ? (
                  <div className="space-y-2.5 pt-4 border-t border-dashed border-black dark:border-zinc-800">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      <Paperclip className="size-3.5" />
                      Attachments ({attachments.length})
                    </label>

                    {/* Attachment List */}
                    {attachments.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {attachments.map((att) => {
                          const isImage = att.mimeType.startsWith('image/');
                          const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${att.filePath}`;

                          return (
                            <div 
                              key={att.id} 
                              className="flex items-center justify-between p-2.5 border border-black bg-white dark:border-white dark:bg-zinc-950 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors group rounded-none"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {isImage ? (
                                  <div className="relative size-10 overflow-hidden border border-black dark:border-white flex-shrink-0 rounded-none">
                                    <img 
                                      src={fileUrl} 
                                      alt={att.filename} 
                                      className="size-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="size-10 border border-black dark:border-white bg-white dark:bg-zinc-950 flex items-center justify-center text-black dark:text-white flex-shrink-0 rounded-none">
                                    <FileText className="size-5" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs font-bold text-black dark:text-white hover:underline transition-colors line-clamp-1 break-all"
                                  >
                                    {att.filename}
                                  </a>
                                  <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-semibold mt-0.5">
                                    {formatFileSize(att.fileSize)} • {new Date(att.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(att.id)}
                                className="border border-red-500 p-1.5 text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-650 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-none"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* File Upload Area */}
                    <div className="relative">
                      <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-black dark:border-white cursor-pointer hover:bg-neutral-50 dark:hover:bg-zinc-900 transition duration-155 rounded-none">
                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                          {isUploading ? (
                            <>
                              <Loader2 className="size-5.5 text-black dark:text-white animate-spin mb-1.5" />
                              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Uploading file...
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="size-5.5 text-black dark:text-white mb-1.5" />
                              <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">
                                Click to attach image or document
                              </p>
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          disabled={isUploading} 
                          onChange={handleFileUpload} 
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-dashed border-black dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider">
                      Attachments can be added after saving the task.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-5 border-t border-black dark:border-white bg-white dark:bg-zinc-950 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-xs h-8 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="text-xs h-8 px-4"
                >
                  {isSaving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
