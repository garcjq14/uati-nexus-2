// Script para criar usuário ane garcia
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  console.log('Criando usuário ane garcia...');

  const userEmail = 'anegarcia@uati.com';
  const userName = 'Ane Garcia';
  const userPassword = 'AneGarcia2024!'; // Nova senha mais simples

  // Verificar se o usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (existingUser) {
    console.log('Usuário já existe! Atualizando senha...');
    
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: userName,
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Usuário atualizado com sucesso!');
    console.log('Email:', userEmail);
    console.log('Nome:', userName);
    console.log('Senha:', userPassword);
  } else {
    console.log('Criando novo usuário...');
    
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        name: userName,
        password: hashedPassword,
        role: 'STUDENT',
        avatar: 'https://ui-avatars.com/api/?name=Ane+Garcia&background=C11E3D&color=fff',
        onboardingCompleted: false,
      },
    });

    console.log('✅ Usuário criado com sucesso!');
    console.log('ID:', user.id);
    console.log('Email:', userEmail);
    console.log('Nome:', userName);
    console.log('Senha:', userPassword);
  }
}

createUser()
  .catch((e) => {
    console.error('❌ Erro ao criar usuário:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

