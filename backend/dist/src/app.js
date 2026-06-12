import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import adminRouter from './routes/admin.js';
const app = new Hono();
// Serve static uploaded files
app.use('/uploads/*', serveStatic({ root: './' }));
app.use('*', cors({
    origin: (origin) => {
        return origin || '*';
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));
app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    console.log(`[${c.req.method}] ${c.req.url} - ${c.res.status} (${duration}ms)`);
});
app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.route('/auth', authRouter);
app.route('/tasks', tasksRouter);
app.route('/admin', adminRouter);
app.notFound((c) => {
    return c.json({ error: 'Not Found', message: `Route ${c.req.method} ${c.req.url} not found` }, 404);
});
app.onError((err, c) => {
    console.error('Server Error:', err);
    return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});
export { app };
