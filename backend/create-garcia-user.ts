// Script para criar usuário garcia@uati.com
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createGarciaUser() {
  console.log('Criando usuário garcia@uati.com...\n');

  const userEmail = 'garcia@uati.com';
  const userName = 'Garcia';
  const userPassword = 'Garcia2024!';

  try {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUser) {
      console.log('⚠️  Usuário já existe! Atualizando senha...');
      
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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', userEmail);
      console.log('👤 Nome:', userName);
      console.log('🔑 Senha:', userPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('Criando novo usuário...');
      
      const hashedPassword = await bcrypt.hash(userPassword, 10);
      const user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          password: hashedPassword,
          role: 'STUDENT',
          avatar: 'https://ui-avatars.com/api/?name=Garcia&background=C11E3D&color=fff',
          onboardingCompleted: false,
        },
      });

      console.log('✅ Usuário criado com sucesso!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🆔 ID:', user.id);
      console.log('📧 Email:', userEmail);
      console.log('👤 Nome:', userName);
      console.log('🔑 Senha:', userPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // Testar a senha
    console.log('\n🧪 Testando senha...');
    const testUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { password: true },
    });

    if (testUser) {
      const isValid = await bcrypt.compare(userPassword, testUser.password);
      if (isValid) {
        console.log('✅ Senha testada e funcionando!');
      } else {
        console.error('❌ Erro: Senha não funciona após criação!');
      }
    }

  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    throw error;
  }
}

createGarciaUser()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





