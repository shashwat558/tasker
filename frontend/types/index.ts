export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Attachment {
  id: string;
  filename: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  taskId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  attachments?: Attachment[];
}

export interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: PaginationInfo;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  _count: {
    tasks: number;
  };
}

export interface UserDetailsResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    taskTitle: string;
    timestamp: string;
  }>;
  tasks: Task[];
}
