import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração para sistema de domínios...');

  try {
    // 1. Criar domínio "TI" padrão se não existir
    console.log('📦 Criando domínio TI padrão...');
    let itDomain = await prisma.domain.findUnique({
      where: { code: 'it' },
    });

    if (!itDomain) {
      // Carregar template IT
      const templatePath = path.join(__dirname, 'src/templates/it');
      const domainData = JSON.parse(
        fs.readFileSync(path.join(templatePath, 'domain.json'), 'utf-8')
      );

      itDomain = await prisma.domain.create({
        data: {
          code: domainData.code,
          name: domainData.name,
          description: domainData.description || null,
          icon: domainData.icon || null,
          color: domainData.color || null,
          config: JSON.stringify(domainData.config || {}),
        },
      });
      console.log('✅ Domínio TI criado:', itDomain.id);
    } else {
      console.log('ℹ️  Domínio TI já existe:', itDomain.id);
    }

    // 2. Criar DomainFields para TI baseado no template
    console.log('📋 Criando campos customizados para TI...');
    const fieldsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'src/templates/it/fields.json'), 'utf-8')
    );

    for (const fieldData of fieldsData) {
      const existingField = await prisma.domainField.findFirst({
        where: {
          domainId: itDomain.id,
          entity: fieldData.entity,
          fieldName: fieldData.fieldName,
        },
      });

      if (!existingField) {
        await prisma.domainField.create({
          data: {
            domainId: itDomain.id,
            entity: fieldData.entity,
            fieldName: fieldData.fieldName,
            fieldType: fieldData.fieldType,
            label: fieldData.label,
            required: fieldData.required || false,
            options: fieldData.options || null,
            defaultValue: fieldData.defaultValue || null,
            order: fieldData.order || 0,
          },
        });
        console.log(`  ✅ Campo criado: ${fieldData.entity}.${fieldData.fieldName}`);
      }
    }

    // 3. Migrar campos existentes de Project para customFields
    console.log('🔄 Migrando projetos existentes...');
    const projects = await prisma.project.findMany({
      where: {
        customFields: '{}', // Apenas projetos sem customFields
      },
    });

    let migratedCount = 0;
    for (const project of projects) {
      const customFields: Record<string, any> = {};

      // Migrar technologies
      if (project.technologies && project.technologies !== '[]') {
        try {
          const techs = JSON.parse(project.technologies);
          if (Array.isArray(techs) && techs.length > 0) {
            customFields.technologies = techs;
          }
        } catch {
          // Se não for JSON válido, tentar como string
          if (project.technologies.trim()) {
            customFields.technologies = [project.technologies];
          }
        }
      }

      // Migrar repository
      if (project.repository) {
        customFields.repository = project.repository;
      }

      // Migrar type
      if (project.type && project.type !== 'Dev') {
        customFields.type = project.type;
      }

      // Atualizar projeto apenas se houver campos para migrar
      if (Object.keys(customFields).length > 0) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            customFields: JSON.stringify(customFields),
          },
        });
        migratedCount++;
      }
    }

    console.log(`✅ ${migratedCount} projetos migrados`);

    // 4. Atribuir domínio TI a cursos existentes sem domínio
    console.log('🎓 Atribuindo domínio TI a cursos existentes...');
    const coursesWithoutDomain = await prisma.course.findMany({
      where: {
        domainId: null,
      },
    });

    let assignedCount = 0;
    for (const course of coursesWithoutDomain) {
      await prisma.course.update({
        where: { id: course.id },
        data: { domainId: itDomain.id },
      });
      assignedCount++;
    }

    console.log(`✅ ${assignedCount} cursos atribuídos ao domínio TI`);

    // 5. Criar plugin de paradigmas para TI
    console.log('🔌 Criando plugin de paradigmas...');
    const pluginsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'src/templates/it/plugins.json'), 'utf-8')
    );

    for (const pluginData of pluginsData) {
      const existingPlugin = await prisma.domainPlugin.findFirst({
        where: {
          domainId: itDomain.id,
          pluginKey: pluginData.pluginKey,
        },
      });

      if (!existingPlugin) {
        await prisma.domainPlugin.create({
          data: {
            domainId: itDomain.id,
            pluginKey: pluginData.pluginKey,
            name: pluginData.name,
            description: pluginData.description || null,
            config: JSON.stringify(pluginData.config || {}),
          },
        });
        console.log(`  ✅ Plugin criado: ${pluginData.pluginKey}`);
      }
    }

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




