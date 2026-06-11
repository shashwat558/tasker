import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';
export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
    description: z.string().max(1000, 'Description is too long').default(''),
    status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
    priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
    dueDate: z
        .string()
        .datetime({ message: 'Invalid ISO date string' })
        .nullable()
        .optional(),
});
export const updateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title is too long').optional(),
    description: z.string().max(1000, 'Description is too long').optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z
        .string()
        .datetime({ message: 'Invalid ISO date string' })
        .nullable()
        .optional(),
});
