import { Task, TasksResponse, TaskStatus, TaskPriority, AdminUser, UserDetailsResponse, Attachment } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export async function fetchTasks(params: {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<TasksResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') {
    query.append('status', params.status);
  }
  if (params.search) {
    query.append('search', params.search);
  }
  if (params.sortBy) {
    query.append('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.append('sortOrder', params.sortOrder);
  }
  if (params.page) {
    query.append('page', String(params.page));
  }
  if (params.limit) {
    query.append('limit', String(params.limit));
  }

  const response = await fetch(`${API_URL}/tasks?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch tasks');
  }

  return response.json();
}

export async function createTask(taskData: {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
}): Promise<Task> {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create task');
  }

  return response.json();
}

export async function updateTask(
  taskId: string,
  updates: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
  }>
): Promise<Task> {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update task');
  }

  return response.json();
}

export async function deleteTask(taskId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete task');
  }

  return response.json();
}

export async function fetchUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch users');
  }

  return response.json();
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN'): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update user role');
  }

  return response.json();
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete user');
  }

  return response.json();
}

export async function fetchUserDetails(userId: string): Promise<UserDetailsResponse> {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch user details');
  }

  return response.json();
}

function getMultipartHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export async function uploadAttachment(taskId: string, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers: getMultipartHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to upload attachment');
  }

  return response.json();
}

export async function deleteAttachment(taskId: string, attachmentId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/tasks/${taskId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete attachment');
  }

  return response.json();
}

