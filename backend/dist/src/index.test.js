import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from './app.js';
import { prisma } from './db.js';
describe('Task Management API Integration Tests', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    let authToken = '';
    let createdTaskId = '';
    afterAll(async () => {
        try {
            await prisma.user.deleteMany({
                where: {
                    email: {
                        contains: 'test-',
                    },
                },
            });
            await prisma.$disconnect();
        }
        catch (error) {
            console.error('Test cleanup failed:', error);
        }
    });
    it('GET /health - should return status OK', async () => {
        const res = await app.request('/health');
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual(expect.objectContaining({
            status: 'ok',
        }));
    });
    it('POST /auth/signup - should reject invalid email/password shapes', async () => {
        const res = await app.request('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'invalid-email',
                password: '123',
            }),
        });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Validation Error');
        expect(data.details).toHaveLength(2);
    });
    it('POST /auth/signup - should register a new user successfully', async () => {
        const res = await app.request('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                name: 'Test User',
            }),
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.message).toBe('User registered successfully');
        expect(data.token).toBeDefined();
        expect(data.user.email).toBe(testEmail);
        authToken = data.token;
    });
    it('GET /tasks - should deny access without authentication token', async () => {
        const res = await app.request('/tasks');
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toContain('Unauthorized');
    });
    it('POST /tasks - should create a new task when authenticated', async () => {
        const res = await app.request('/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                title: 'Learn Vitest',
                description: 'Write meaningful API tests for the task manager',
                priority: 'HIGH',
                status: 'TODO',
            }),
        });
        expect(res.status).toBe(201);
        const task = await res.json();
        expect(task.title).toBe('Learn Vitest');
        expect(task.priority).toBe('HIGH');
        expect(task.status).toBe('TODO');
        expect(task.userId).toBeDefined();
        createdTaskId = task.id;
    });
    it('GET /tasks - should fetch user tasks with filters', async () => {
        const res = await app.request(`/tasks?status=TODO&sortBy=priority&sortOrder=desc`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.tasks).toBeInstanceOf(Array);
        expect(data.tasks.length).toBeGreaterThan(0);
        expect(data.tasks[0].id).toBe(createdTaskId);
        expect(data.pagination.totalCount).toBe(1);
    });
    it('PATCH /tasks/:id - should update the task', async () => {
        const res = await app.request(`/tasks/${createdTaskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                status: 'IN_PROGRESS',
                description: 'Updated test description',
            }),
        });
        expect(res.status).toBe(200);
        const updatedTask = await res.json();
        expect(updatedTask.status).toBe('IN_PROGRESS');
        expect(updatedTask.description).toBe('Updated test description');
    });
    it('DELETE /tasks/:id - should delete the task', async () => {
        const deleteRes = await app.request(`/tasks/${createdTaskId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        expect(deleteRes.status).toBe(200);
        const checkRes = await app.request(`/tasks/${createdTaskId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        expect(checkRes.status).toBe(404);
    });
});
