import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../db.js'
import { createTaskSchema, updateTaskSchema } from '../schemas/tasks.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Env } from '../types.js'
import { TaskStatus, TaskPriority, Prisma } from '@prisma/client'

const tasks = new Hono<Env>()

tasks.use(authMiddleware)

const validationHook = (result: any, c: any) => {
  if (!result.success) {
    return c.json({
      error: 'Validation Error',
      details: result.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    }, 400)
  }
}

tasks.post('/', zValidator('json', createTaskSchema, validationHook), async (c) => {
  const userId = c.get('userId')
  const { title, description, status, priority, dueDate } = c.req.valid('json')

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
      },
    })

    return c.json(task, 201)
  } catch (error) {
    console.error('Create task error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

tasks.get('/', async (c) => {
  const userId = c.get('userId')

  const statusParam = c.req.query('status')
  const searchParam = c.req.query('search')
  const sortByParam = c.req.query('sortBy')
  const sortOrderParam = c.req.query('sortOrder')
  const pageParam = c.req.query('page')
  const limitParam = c.req.query('limit')

  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const limit = Math.max(1, Math.min(100, parseInt(limitParam || '10', 10)))
  const skip = (page - 1) * limit

  const where: Prisma.TaskWhereInput = {
    userId,
  }

  if (statusParam && Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
    where.status = statusParam as TaskStatus
  }

  if (searchParam) {
    where.title = {
      contains: searchParam,
      mode: 'insensitive',
    }
  }

  let orderBy: Prisma.TaskOrderByWithRelationInput = { createdAt: 'desc' }
  const sortOrder: 'asc' | 'desc' = sortOrderParam === 'asc' ? 'asc' : 'desc'

  if (sortByParam === 'dueDate') {
    orderBy = { dueDate: sortOrder }
  } else if (sortByParam === 'priority') {
    orderBy = { priority: sortOrder }
  } else if (sortByParam === 'createdAt') {
    orderBy = { createdAt: sortOrder }
  } else if (sortByParam === 'title') {
    orderBy = { title: sortOrder }
  }

  try {
    const totalCount = await prisma.task.count({ where })
    const totalPages = Math.ceil(totalCount / limit)

    const tasksList = await prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    })

    return c.json({
      tasks: tasksList,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    }, 200)
  } catch (error) {
    console.error('List tasks error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

tasks.get('/:id', async (c) => {
  const userId = c.get('userId')
  const taskId = c.req.param('id')

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    })

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json(task, 200)
  } catch (error) {
    console.error('Fetch task error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

tasks.patch('/:id', zValidator('json', updateTaskSchema, validationHook), async (c) => {
  const userId = c.get('userId')
  const taskId = c.req.param('id')
  const updates = c.req.valid('json')

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    })

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404)
    }

    const updateData: Prisma.TaskUpdateInput = { ...updates }
    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    })

    return c.json(updatedTask, 200)
  } catch (error) {
    console.error('Update task error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

tasks.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const taskId = c.req.param('id')

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    })

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404)
    }

    await prisma.task.delete({
      where: { id: taskId },
    })

    return c.json({ message: 'Task deleted successfully' }, 200)
  } catch (error) {
    console.error('Delete task error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default tasks
