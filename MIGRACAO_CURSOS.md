# Guia de Migração - Múltiplos Cursos

Este guia explica como aplicar a migration para suportar múltiplos cursos no sistema.

## Pré-requisitos

1. Certifique-se de que o `DATABASE_URL` está configurado no arquivo `backend/.env`
2. O banco de dados deve estar acessível
3. Node.js e npm instalados

## ⚠️ IMPORTANTE: Verificar se a Migration foi Aplicada

Antes de continuar, verifique se a migration foi aplicada no banco de produção:

```sql
-- Verificar se tabela courses existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'courses'
);

-- Verificar se coluna currentCourseId existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'currentCourseId';
```

Se retornar `false` ou não retornar resultados, a migration precisa ser aplicada.

## Passo 1: Aplicar a Migration

### Opção A: Usando Prisma CLI (Recomendado)

```bash
cd backend
npx prisma migrate deploy
```

### Opção B: Usando Prisma DB Push (Desenvolvimento)

Para desenvolvimento, você pode usar:

```bash
cd backend
npm run prisma:push
```

Isso aplicará as mudanças do schema diretamente sem criar uma migration.

### Opção C: Usando o Script Manual

Se o Prisma CLI não funcionar, use o script alternativo:

```bash
cd backend
node apply-migration.js
```

### Opção C: Aplicar SQL Manualmente

Se ambas as opções falharem, você pode executar o SQL manualmente no seu banco de dados:

1. Abra o arquivo: `backend/prisma/migrations/20250127000000_add_courses_support/migration.sql`
2. Copie todo o conteúdo SQL
3. Execute no seu cliente de banco de dados (pgAdmin, DBeaver, etc.)

## Passo 2: Migrar Dados Existentes

Após aplicar a migration, execute o script de migração de dados:

```bash
cd backend
npm run migrate:courses
```

Ou diretamente:

```bash
cd backend
npx tsx migrate-existing-data.ts
```

Este script irá:
- Criar um curso padrão "Meu Curso" para cada usuário existente
- Atribuir todos os dados existentes (curriculum, projects, flashcards, etc.) a esse curso
- Definir esse curso como o curso atual do usuário

## Passo 3: Verificar a Migração

Após executar os scripts, verifique se tudo está funcionando:

1. **Verificar tabela courses:**
   ```sql
   SELECT * FROM courses;
   ```

2. **Verificar se os dados foram atribuídos:**
   ```sql
   SELECT COUNT(*) FROM curriculum WHERE "courseId" IS NOT NULL;
   SELECT COUNT(*) FROM projects WHERE "courseId" IS NOT NULL;
   ```

3. **Verificar usuários com curso atual:**
   ```sql
   SELECT id, email, "currentCourseId" FROM users WHERE "currentCourseId" IS NOT NULL;
   ```

## Passo 4: Testar no Frontend

1. Inicie o backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Inicie o frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Faça login e verifique:
   - O seletor de curso aparece no TopBar
   - Você pode criar novos cursos
   - Você pode trocar entre cursos
   - Os dados são isolados por curso

## Solução de Problemas

### Erro: "DATABASE_URL not configured"
- Verifique se o arquivo `backend/.env` existe
- Certifique-se de que contém: `DATABASE_URL=postgresql://user:password@host:port/database`

### Erro: "Relation already exists"
- Isso significa que a migration já foi aplicada parcialmente
- Use o script `apply-migration.js` que ignora erros de "já existe"

### Erro: "Cannot delete the only remaining course"
- Isso é esperado - o sistema protege contra deletar o último curso
- Crie outro curso antes de deletar

### Dados não aparecem após trocar de curso
- Verifique se o script de migração foi executado
- Verifique se os dados têm `courseId` atribuído no banco

## Estrutura de Dados

Após a migration, a estrutura será:

```
User
  ├── currentCourseId (referência ao curso atual)
  └── courses[] (todos os cursos do usuário)

Course
  ├── id
  ├── userId
  ├── title
  └── description

Todos os dados (Curriculum, Project, Flashcard, etc.) agora têm:
  └── courseId (referência ao curso ao qual pertencem)
```

## Notas Importantes

- **Backup**: Sempre faça backup do banco antes de aplicar migrations em produção
- **Teste**: Teste primeiro em ambiente de desenvolvimento
- **Rollback**: Se precisar reverter, você precisará criar uma migration reversa manualmente

## Suporte

Se encontrar problemas, verifique:
1. Logs do backend no console
2. Logs do frontend no console do navegador
3. Verifique se todas as rotas estão retornando dados filtrados por `courseId`

