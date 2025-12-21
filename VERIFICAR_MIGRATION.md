# Verificar se a Migration foi Aplicada

## Problema Identificado

Os logs mostram que não há requisições para `/api/courses/current`, o que pode indicar que:

1. A migration não foi aplicada no banco de produção
2. O frontend está falhando silenciosamente
3. O usuário não tem curso e precisa criar um

## Como Verificar

### 1. Verificar se a tabela `courses` existe

Execute no seu banco de dados:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'courses'
);
```

Se retornar `false`, a migration não foi aplicada.

### 2. Verificar se a coluna `currentCourseId` existe em `users`

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'currentCourseId';
```

### 3. Verificar se a coluna `courseId` existe nas tabelas

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'courseId'
AND table_schema = 'public'
ORDER BY table_name;
```

Deve retornar `courseId` em:
- curriculum
- projects
- flashcards
- resources
- notes
- knowledge_nodes
- study_sessions
- activities
- weekly_schedules
- manual_competencies

## Solução

### Se a migration NÃO foi aplicada:

1. **Aplicar a migration manualmente:**

   Opção A - Via Prisma (se DATABASE_URL estiver configurado):
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

   Opção B - Executar SQL manualmente:
   - Abra o arquivo: `backend/prisma/migrations/20250127000000_add_courses_support/migration.sql`
   - Execute todo o SQL no seu banco de dados

2. **Migrar dados existentes:**
   ```bash
   cd backend
   npm run migrate:courses
   ```

### Se a migration JÁ foi aplicada:

O problema pode ser que o usuário não tem curso. Verifique:

1. **Verificar se o usuário tem cursos:**
   ```sql
   SELECT * FROM courses WHERE "userId" = 'SEU_USER_ID';
   ```

2. **Se não houver cursos, criar um via API:**
   - Faça login no frontend
   - Clique no botão "Criar Curso" no TopBar
   - Ou acesse `/courses` e crie um curso

## Logs Adicionados

Adicionei logs detalhados que aparecerão nos logs do backend:

- `📚 GET /courses/current - User: {userId}` - Quando a rota é chamada
- `⚠️  User {userId} has no courses available` - Quando usuário não tem curso
- `✅ Fetched current course data for user {userId}, course: {courseTitle}` - Quando dados são retornados com sucesso
- `❌ User {userId} not found` - Quando usuário não existe

## Próximos Passos

1. Verifique os logs do backend após o deploy
2. Procure por mensagens que começam com `📚`, `⚠️`, `✅`, ou `❌`
3. Se ver `⚠️  User has no courses available`, o usuário precisa criar um curso
4. Se não ver nenhuma requisição para `/api/courses/current`, verifique se a migration foi aplicada

