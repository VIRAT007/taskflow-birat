import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('password123', 12);

  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: passwordHash,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      description: 'Seeded project for local development',
      owner_id: user.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Backlog item',
        description: 'Not started yet',
        status: TaskStatus.todo,
        priority: TaskPriority.low,
        project_id: project.id,
        assignee_id: user.id,
        created_by: user.id,
      },
      {
        title: 'In progress work',
        description: 'Currently being worked on',
        status: TaskStatus.in_progress,
        priority: TaskPriority.medium,
        project_id: project.id,
        assignee_id: user.id,
        created_by: user.id,
      },
      {
        title: 'Completed task',
        description: 'Done and verified',
        status: TaskStatus.done,
        priority: TaskPriority.high,
        project_id: project.id,
        assignee_id: null,
        created_by: user.id,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err: unknown) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
