// ═══════════════════════════════════════════════════════════
// QA Forge — Prisma Database Seed
// Seed initial data for development
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const password_hash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@qaforge.local' },
    update: {},
    create: {
      email: 'admin@qaforge.local',
      password_hash,
      name: 'QA Admin',
      role: 'admin',
    },
  });
  console.log(`  ✅ Admin user: ${admin.email}`);

  // Create demo QA Engineer
  const qaHash = await bcrypt.hash('qa123', 12);
  const qaUser = await prisma.user.upsert({
    where: { email: 'qa@qaforge.local' },
    update: {},
    create: {
      email: 'qa@qaforge.local',
      password_hash: qaHash,
      name: 'QA Engineer',
      role: 'qa_engineer',
    },
  });
  console.log(`  ✅ QA user: ${qaUser.email}`);

  // Create demo project
  const project = await prisma.project.create({
    data: {
      user_id: qaUser.id,
      name: 'Demo E-Commerce App',
      app_types: ['web', 'api'],
      frameworks: ['playwright', 'postman', 'k6'],
      enabled_outputs: ['test_documentation', 'automation_scripts', 'analytics'],
      settings: {
        base_url: 'https://staging.example.com',
        auth_method: 'bearer',
        target_domain: 'staging.example.com',
      },
    },
  });
  console.log(`  ✅ Demo project: ${project.name}`);

  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('  Login credentials:');
  console.log('  Admin:  admin@qaforge.local / admin123');
  console.log('  QA:     qa@qaforge.local / qa123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
