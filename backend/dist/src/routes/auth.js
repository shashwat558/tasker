import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { prisma } from '../db.js';
import { signupSchema, loginSchema } from '../schemas/auth.js';
import { authMiddleware } from '../middleware/auth.js';
const auth = new Hono();
const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7;
const validationHook = (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Validation Error',
            details: result.error.issues.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            })),
        }, 400);
    }
};
auth.post('/signup', zValidator('json', signupSchema, validationHook), async (c) => {
    const { email, password, name } = c.req.valid('json');
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return c.json({ error: 'User with this email already exists' }, 409);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
            },
        });
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return c.json({ error: 'JWT configuration error' }, 500);
        }
        const token = await sign({
            userId: user.id,
            exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS,
        }, secret, 'HS256');
        return c.json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        }, 201);
    }
    catch (error) {
        console.error('Signup error:', error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});
auth.post('/login', zValidator('json', loginSchema, validationHook), async (c) => {
    const { email, password } = c.req.valid('json');
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return c.json({ error: 'Invalid email or password' }, 401);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return c.json({ error: 'Invalid email or password' }, 401);
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return c.json({ error: 'JWT configuration error' }, 500);
        }
        const token = await sign({
            userId: user.id,
            exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS,
        }, secret, 'HS256');
        return c.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        }, 200);
    }
    catch (error) {
        console.error('Login error:', error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});
auth.get('/me', authMiddleware, async (c) => {
    const userId = c.get('userId');
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }
        return c.json({ user }, 200);
    }
    catch (error) {
        console.error('Fetch me error:', error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});
export default auth;
