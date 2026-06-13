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
    describe('Task Attachments', () => {
        let attachmentTaskId = '';
        it('should create a task to attach files to', async () => {
            const res = await app.request('/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    title: 'Attachment Test Task',
                    description: 'Testing file attachments',
                    status: 'TODO',
                    priority: 'LOW',
                }),
            });
            expect(res.status).toBe(201);
            const data = await res.json();
            attachmentTaskId = data.id;
        });
        it('should upload a file attachment successfully', async () => {
            const formData = new FormData();
            const file = new File(['dummy content'], 'dummy.txt', { type: 'text/plain' });
            formData.append('file', file);
            const res = await app.request(`/tasks/${attachmentTaskId}/attachments`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: formData,
            });
            expect(res.status).toBe(201);
            const data = await res.json();
            expect(data.filename).toBe('dummy.txt');
            expect(data.mimeType).toBe('text/plain');
            expect(data.taskId).toBe(attachmentTaskId);
            expect(data.filePath).toContain('/uploads/');
        });
        it('should include attachments when fetching the task', async () => {
            const res = await app.request(`/tasks`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            const task = data.tasks.find((t) => t.id === attachmentTaskId);
            expect(task).toBeDefined();
            expect(task.attachments).toBeInstanceOf(Array);
            expect(task.attachments.length).toBe(1);
            expect(task.attachments[0].filename).toBe('dummy.txt');
        });
        it('should delete the attachment successfully', async () => {
            const getRes = await app.request(`/tasks`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const getData = await getRes.json();
            const task = getData.tasks.find((t) => t.id === attachmentTaskId);
            const attachmentId = task.attachments[0].id;
            const delRes = await app.request(`/tasks/${attachmentTaskId}/attachments/${attachmentId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            expect(delRes.status).toBe(200);
            const verifyRes = await app.request(`/tasks`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const verifyData = await verifyRes.json();
            const verifiedTask = verifyData.tasks.find((t) => t.id === attachmentTaskId);
            expect(verifiedTask.attachments.length).toBe(0);
        });
    });
    describe('Admin Role Access Control', () => {
        const userEmail = `user-${Date.now()}@example.com`;
        const adminEmail = `admin-${Date.now()}@example.com`;
        const password = 'testpassword123';
        let userToken = '';
        let adminToken = '';
        let userTaskId = '';
        it('should register a normal user and an admin user', async () => {
            // Register normal user
            const userRes = await app.request('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    password,
                    name: 'Regular User',
                    role: 'USER',
                }),
            });
            expect(userRes.status).toBe(201);
            const userData = await userRes.json();
            userToken = userData.token;
            expect(userData.user.role).toBe('USER');
            // Register admin user
            const adminRes = await app.request('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: adminEmail,
                    password,
                    name: 'Admin User',
                    role: 'ADMIN',
                    adminSecret: process.env.ADMIN_SECRET_KEY || 'admin_secret',
                }),
            });
            expect(adminRes.status).toBe(201);
            const adminData = await adminRes.json();
            adminToken = adminData.token;
            expect(adminData.user.role).toBe('ADMIN');
        });
        it('should reject registering an admin with a missing or incorrect secret key', async () => {
            const res1 = await app.request('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: `badadmin1-${Date.now()}@example.com`,
                    password,
                    name: 'Bad Admin',
                    role: 'ADMIN',
                }),
            });
            expect(res1.status).toBe(403);
            const res2 = await app.request('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: `badadmin2-${Date.now()}@example.com`,
                    password,
                    name: 'Bad Admin',
                    role: 'ADMIN',
                    adminSecret: 'wrong_secret',
                }),
            });
            expect(res2.status).toBe(403);
        });
        it('should create a task for the normal user', async () => {
            const res = await app.request('/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                    title: 'User Private Task',
                    description: 'Visible to admin, not other users',
                    priority: 'MEDIUM',
                    status: 'TODO',
                }),
            });
            expect(res.status).toBe(201);
            const task = await res.json();
            userTaskId = task.id;
        });
        it('should allow the admin to view all tasks (including the normal user task)', async () => {
            const res = await app.request('/tasks', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.tasks).toBeInstanceOf(Array);
            const userTask = data.tasks.find((t) => t.id === userTaskId);
            expect(userTask).toBeDefined();
            expect(userTask.user).toBeDefined();
            expect(userTask.user.email).toBe(userEmail);
        });
        it('should allow the admin to update the normal user task', async () => {
            const res = await app.request(`/tasks/${userTaskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify({
                    status: 'IN_PROGRESS',
                }),
            });
            expect(res.status).toBe(200);
            const updated = await res.json();
            expect(updated.status).toBe('IN_PROGRESS');
        });
        it('should allow the admin to delete the normal user task', async () => {
            const res = await app.request(`/tasks/${userTaskId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });
            expect(res.status).toBe(200);
        });
        describe('Admin User Management Routes', () => {
            it('should deny non-admin users access to admin routes', async () => {
                const res = await app.request('/admin/users', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                    },
                });
                expect(res.status).toBe(403);
            });
            it('should allow admin users to fetch all users with task counts', async () => {
                const res = await app.request('/admin/users', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                });
                expect(res.status).toBe(200);
                const users = await res.json();
                expect(users).toBeInstanceOf(Array);
                const regularUserObj = users.find((u) => u.email === userEmail);
                expect(regularUserObj).toBeDefined();
                expect(regularUserObj._count.tasks).toBeDefined();
            });
            it('should allow admin to change user role', async () => {
                const listRes = await app.request('/admin/users', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                });
                const users = await listRes.json();
                const regularUserObj = users.find((u) => u.email === userEmail);
                const patchRes = await app.request(`/admin/users/${regularUserObj.id}/role`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({ role: 'ADMIN' }),
                });
                expect(patchRes.status).toBe(200);
                const updated = await patchRes.json();
                expect(updated.role).toBe('ADMIN');
                // Revert back so other tests/teardown works normally
                await app.request(`/admin/users/${regularUserObj.id}/role`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({ role: 'USER' }),
                });
            });
            it('should block admin from changing their own role', async () => {
                const listRes = await app.request('/admin/users', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                });
                const users = await listRes.json();
                const adminUserObj = users.find((u) => u.email === adminEmail);
                const patchRes = await app.request(`/admin/users/${adminUserObj.id}/role`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({ role: 'USER' }),
                });
                expect(patchRes.status).toBe(400);
            });
            it('should allow admin to fetch user details and statistics', async () => {
                const listRes = await app.request('/admin/users', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                });
                const users = await listRes.json();
                const regularUserObj = users.find((u) => u.email === userEmail);
                const detailRes = await app.request(`/admin/users/${regularUserObj.id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                });
                expect(detailRes.status).toBe(200);
                const details = await detailRes.json();
                expect(details.user.email).toBe(userEmail);
                expect(details.stats.totalTasks).toBeDefined();
                expect(details.tasks).toBeInstanceOf(Array);
            });
            it('should block admin from deleting themselves', async () => {
                const listRes = await app.request('/admin/users', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                });
                const users = await listRes.json();
                const adminUserObj = users.find((u) => u.email === adminEmail);
                const deleteRes = await app.request(`/admin/users/${adminUserObj.id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                });
                expect(deleteRes.status).toBe(400);
            });
        });
    });
});
