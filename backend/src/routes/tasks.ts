import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../db.js'
import { createTaskSchema, updateTaskSchema } from '../schemas/tasks.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Env } from '../types.js'
import { TaskStatus, TaskPriority, Prisma } from '@prisma/client'
import { promises as fs } from 'fs'
import { join } from 'path'
import crypto from 'crypto'
import Groq from 'groq-sdk'

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
      include: {
        attachments: true,
      },
    })

    return c.json(task, 201)
  } catch (error) {
    console.error('Create task error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

tasks.post('/magic', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => ({}))
  const text = body.text

  if (!text) {
    return c.json({ error: 'Text is required' }, 400)
  }

  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey) {
    return c.json({ error: 'GROQ_API_KEY is not configured in the server' }, 500)
  }

  try {
    const groq = new Groq({ apiKey: groqApiKey })

    const prompt = `
      You are an AI task assistant. Analyze the following text and break it down into a list of actionable tasks.
      Return the result strictly as a JSON array of objects. Do not include markdown formatting or backticks around the JSON.
      Each object must have:
      - title: string (short, actionable)
      - description: string (more details)
      - priority: "LOW", "MEDIUM", or "HIGH"
      - status: "TODO", "IN_PROGRESS", or "COMPLETED"
      - dueDate: ISO string date (only if explicitly mentioned, otherwise null)

      Text to analyze:
      """
      ${text}
      """
    `

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an AI that strictly outputs raw JSON arrays of tasks without markdown block wrappers or conversational text.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    })

    const rawContent = completion.choices[0]?.message?.content || '[]'

    // Strip markdown formatting if the model still outputs it
    const cleanedContent = rawContent.replace(/```json/i, '').replace(/```/g, '').trim()
    const parsedTasks = JSON.parse(cleanedContent)

    if (!Array.isArray(parsedTasks)) {
      throw new Error('AI did not return an array')
    }

    const createdTasks = []
    for (const task of parsedTasks) {
      const created = await prisma.task.create({
        data: {
          title: task.title || 'Untitled Task',
          description: task.description || '',
          priority: ['LOW', 'MEDIUM', 'HIGH'].includes(task.priority) ? task.priority : 'MEDIUM',
          status: ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(task.status) ? task.status : 'TODO',
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          userId,
        },
        include: { attachments: true, user: { select: { id: true, email: true, name: true } } }
      })
      createdTasks.push(created)
    }

    return c.json({ tasks: createdTasks }, 201)
  } catch (error) {
    console.error('Magic task error:', error)
    return c.json({ error: 'Failed to process magic tasks' }, 500)
  }
})

tasks.get('/', async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')

  const statusParam = c.req.query('status')
  const searchParam = c.req.query('search')
  const sortByParam = c.req.query('sortBy')
  const sortOrderParam = c.req.query('sortOrder')
  const pageParam = c.req.query('page')
  const limitParam = c.req.query('limit')

  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const limit = Math.max(1, Math.min(100, parseInt(limitParam || '10', 10)))
  const skip = (page - 1) * limit

  const where: Prisma.TaskWhereInput = {}
  if (userRole !== 'ADMIN') {
    where.userId = userId
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
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
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
  const userRole = c.get('userRole')
  const taskId = c.req.param('id')

  try {
    const task = await prisma.task.findFirst({
      where: userRole === 'ADMIN' ? { id: taskId } : { id: taskId, userId },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
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
  const userRole = c.get('userRole')
  const taskId = c.req.param('id')
  const updates = c.req.valid('json')

  try {
    const task = await prisma.task.findFirst({
      where: userRole === 'ADMIN' ? { id: taskId } : { id: taskId, userId },
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
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    })

    return c.json(updatedTask, 200)
  } catch (error) {
    console.error('Update task error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

tasks.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')
  const taskId = c.req.param('id')

  try {
    const task = await prisma.task.findFirst({
      where: userRole === 'ADMIN' ? { id: taskId } : { id: taskId, userId },
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

tasks.post('/:id/attachments', async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')
  const taskId = c.req.param('id')

  try {
    const task = await prisma.task.findFirst({
      where: userRole === 'ADMIN' ? { id: taskId } : { id: taskId, userId },
    })

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404)
    }

    const body = await c.req.parseBody()
    const file = body['file']

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Validation Error', message: 'File is required' }, 400)
    }

    const UPLOADS_DIR = join(process.cwd(), 'uploads')
    await fs.mkdir(UPLOADS_DIR, { recursive: true })

    const uniqueId = crypto.randomUUID()
    const originalName = file.name
    const sanitizedOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const savedFilename = `${uniqueId}_${sanitizedOriginalName}`
    const filePath = join(UPLOADS_DIR, savedFilename)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(filePath, buffer)

    const attachment = await prisma.attachment.create({
      data: {
        filename: originalName,
        filePath: `/uploads/${savedFilename}`,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        taskId: taskId,
      },
    })

    return c.json(attachment, 201)
  } catch (error) {
    console.error('Upload attachment error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

tasks.delete('/:id/attachments/:attachmentId', async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')
  const taskId = c.req.param('id')
  const attachmentId = c.req.param('attachmentId')

  try {
    const task = await prisma.task.findFirst({
      where: userRole === 'ADMIN' ? { id: taskId } : { id: taskId, userId },
    })

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404)
    }

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, taskId },
    })

    if (!attachment) {
      return c.json({ error: 'Attachment not found' }, 404)
    }

    const filename = attachment.filePath.replace('/uploads/', '')
    const absolutePath = join(process.cwd(), 'uploads', filename)
    try {
      await fs.unlink(absolutePath)
    } catch (err) {
      console.warn(`Failed to delete file from disk at ${absolutePath}:`, err)
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    })

    return c.json({ message: 'Attachment deleted successfully' }, 200)
  } catch (error) {
    console.error('Delete attachment error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default tasks
