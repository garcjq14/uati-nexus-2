// Script to reset user anegarcia@uati.com to a completely new state
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetUser() {
  console.log('Resetting user anegarcia@uati.com...');

  const userEmail = 'anegarcia@uati.com';

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log(`Found user: ${user.name} (${user.id})`);

  // Delete all user-related data (cascade will handle most, but let's be explicit)
  console.log('Deleting user data...');

  // Delete in correct order to avoid foreign key issues
  await prisma.weeklySchedule.deleteMany({
    where: { userId: user.id },
  });

  await prisma.studySession.deleteMany({
    where: { userId: user.id },
  });

  await prisma.activity.deleteMany({
    where: { userId: user.id },
  });

  await prisma.notification.deleteMany({
    where: { userId: user.id },
  });

  // Delete curriculum (will cascade to topics)
  await prisma.curriculum.deleteMany({
    where: { userId: user.id },
  });

  // Delete projects (will cascade to tasks, milestones, diary entries)
  await prisma.project.deleteMany({
    where: { userId: user.id },
  });

  // Delete flashcards
  await prisma.flashcard.deleteMany({
    where: { userId: user.id },
  });

  // Delete resources (will cascade to annotations)
  await prisma.resource.deleteMany({
    where: { userId: user.id },
  });

  // Delete notes
  await prisma.note.deleteMany({
    where: { userId: user.id },
  });

  // Delete knowledge nodes (will cascade to connections)
  await prisma.knowledgeNode.deleteMany({
    where: { userId: user.id },
  });

  console.log('All user data deleted.');

  // Reset user to initial state
  const anaPassword = await bcrypt.hash('AnaGarcia@UATI2024!Secure', 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: anaPassword,
      onboardingCompleted: false,
      avatar: null,
      portfolio: null,
      role: 'STUDENT',
      updatedAt: new Date(),
    },
  });

  console.log('User reset successfully!');
  console.log('User is now in a completely new state.');
  console.log('Email:', userEmail);
  console.log('Password: AnaGarcia@UATI2024!Secure');
  console.log('Onboarding: Not completed');
}

resetUser()
  .catch((e) => {
    console.error('Error resetting user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




