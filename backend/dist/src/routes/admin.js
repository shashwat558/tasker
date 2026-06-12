import { Hono } from 'hono';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
const admin = new Hono();
// Protect all admin endpoints with authMiddleware
admin.use(authMiddleware);
// Verify the user is an ADMIN
admin.use(async (c, next) => {
    const role = c.get('userRole');
    if (role !== 'ADMIN') {
        return c.json({ error: 'Forbidden', message: 'Admin role is required to access these routes' }, 403);
    }
    await next();
});
// GET /users - Get all users with their task counts
admin.get('/users', async (c) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { tasks: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return c.json(users);
    }
    catch (error) {
        console.error('Fetch users error:', error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});
// PATCH /users/:id/role - Update a user's role
admin.patch('/users/:id/role', async (c) => {
    const id = c.req.param('id');
    const loggedInUserId = c.get('userId');
    if (id === loggedInUserId) {
        return c.json({ error: 'Bad Request', message: 'You cannot change your own role' }, 400);
    }
    try {
        const { role } = await c.req.json();
        if (!role || (role !== 'USER' && role !== 'ADMIN')) {
            return c.json({ error: 'Bad Request', message: 'Invalid role payload' }, 400);
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { tasks: true }
                }
            }
        });
        return c.json(updatedUser);
    }
    catch (error) {
        console.error('Update user role error:', error);
        return c.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : undefined }, 500);
    }
});
// DELETE /users/:id - Delete a user (cascades to their tasks)
admin.delete('/users/:id', async (c) => {
    const id = c.req.param('id');
    const loggedInUserId = c.get('userId');
    if (id === loggedInUserId) {
        return c.json({ error: 'Bad Request', message: 'You cannot delete your own account' }, 400);
    }
    try {
        await prisma.user.delete({
            where: { id }
        });
        return c.json({ message: 'User and all associated tasks successfully deleted' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        return c.json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : undefined }, 500);
    }
});
// GET /users/:id - Get specific user details, stats, and tasks list
admin.get('/users/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            }
        });
        if (!user) {
            return c.json({ error: 'Not Found', message: 'User not found' }, 404);
        }
        // Fetch task statistics and all tasks
        const [totalTasks, completedTasks, pendingTasks, tasks] = await Promise.all([
            prisma.task.count({ where: { userId: id } }),
            prisma.task.count({ where: { userId: id, status: 'COMPLETED' } }),
            prisma.task.count({ where: { userId: id, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
            prisma.task.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' }
            })
        ]);
        // Generate recent activity list based on tasks
        const recentActivity = tasks.slice(0, 5).map(task => ({
            id: task.id,
            action: task.createdAt.getTime() === task.updatedAt.getTime() ? 'Created task' : 'Updated task',
            taskTitle: task.title,
            timestamp: task.updatedAt || task.createdAt
        }));
        return c.json({
            user,
            stats: {
                totalTasks,
                completedTasks,
                pendingTasks,
            },
            recentActivity,
            tasks
        });
    }
    catch (error) {
        console.error('Fetch user detail error:', error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});
export default admin;
