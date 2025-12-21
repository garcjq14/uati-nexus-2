// Script para verificar e testar a senha do usuário
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyPassword() {
  console.log('Verificando senha do usuário anegarcia@uati.com...\n');

  const userEmail = 'anegarcia@uati.com';
  const testPassword = 'AneGarcia2024!';

  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      console.error('❌ Usuário não encontrado!');
      console.log('Email:', userEmail);
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.id})`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔐 Hash da senha no banco: ${user.password.substring(0, 20)}...`);
    console.log('');

    // Testar a senha
    console.log('🧪 Testando senha: AneGarcia2024!');
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ Senha está CORRETA!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', userEmail);
      console.log('🔑 Senha:', testPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ Senha está INCORRETA!');
      console.log('');
      console.log('🔄 Atualizando senha...');
      
      // Gerar novo hash
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      // Atualizar no banco
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      console.log('✅ Senha atualizada com sucesso!');
      console.log('');
      
      // Testar novamente
      const newHash = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      });
      
      const isValidAfter = await bcrypt.compare(testPassword, newHash!.password);
      if (isValidAfter) {
        console.log('✅ Verificação: Senha atualizada e funcionando!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', userEmail);
        console.log('🔑 Senha:', testPassword);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else {
        console.error('❌ Erro: Senha atualizada mas ainda não funciona!');
      }
    }

    // Testar outras senhas possíveis
    console.log('');
    console.log('🧪 Testando outras senhas possíveis...');
    const possiblePasswords = [
      'AnaGarcia@UATI2024!Secure',
      'AneGarcia2024!',
      'anegarcia2024!',
      'AneGarcia@2024!',
    ];

    for (const pwd of possiblePasswords) {
      if (pwd === testPassword) continue; // Já testamos essa
      const test = await bcrypt.compare(pwd, user.password);
      if (test) {
        console.log(`⚠️  ATENÇÃO: A senha "${pwd}" também funciona!`);
      }
    }

  } catch (error: any) {
    console.error('❌ Erro ao verificar senha:', error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    throw error;
  }
}

verifyPassword()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





