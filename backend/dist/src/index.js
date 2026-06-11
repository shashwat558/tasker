import { serve } from '@hono/node-server';
import { app } from './app.js';
const port = parseInt(process.env.PORT || '5000', 10);
serve({
    fetch: app.fetch,
    port: port,
}, (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
});
