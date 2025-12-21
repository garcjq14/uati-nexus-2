// Script para atualizar senha do usuário anegarcia@uati.com
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword() {
  console.log('Atualizando senha do usuário anegarcia@uati.com...');

  const userEmail = 'anegarcia@uati.com';
  const newPassword = 'AneGarcia2024!';

  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.error('❌ Usuário não encontrado!');
      console.log('Email:', userEmail);
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.id})`);
    console.log('Atualizando senha...');

    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Senha atualizada com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', userEmail);
    console.log('🔑 Nova Senha:', newPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error: any) {
    console.error('❌ Erro ao atualizar senha:', error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    throw error;
  }
}

updatePassword()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





