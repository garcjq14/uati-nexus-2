# Aplicar Migrations: customFields em Resources e Projects

## Problema
As colunas `customFields` estão definidas no schema do Prisma mas não existem no banco de dados, causando erros:
```
Invalid `prisma.resource.create()` invocation: The column `customFields` does not exist in the current database.
Invalid `prisma.project.create()` invocation: The column `customFields` does not exist in the current database.
```

## Solução

### 1. Migrations Criadas
Foram criadas as seguintes migrations:
- `20250128000000_add_resource_custom_fields` - adiciona `customFields` na tabela `resources`
- `20250128000001_add_project_custom_fields` - adiciona `customFields` na tabela `projects`

### 2. Aplicar a Migration

#### Opção A: Via Prisma CLI (Recomendado)
```bash
cd backend
npx prisma migrate deploy
```

#### Opção B: SQL Manual
Execute os seguintes SQLs no banco de dados:
```sql
-- Para resources
ALTER TABLE "resources" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '{}';

-- Para projects
ALTER TABLE "projects" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '{}';
```

### 3. Ambiente de Produção (Render/Vercel)

Se estiver usando Render ou Vercel, você pode:

1. **Render**: Adicione um script de build que aplica migrations:
   ```json
   "scripts": {
     "postinstall": "prisma generate",
     "migrate": "prisma migrate deploy"
   }
   ```

2. **Vercel**: Execute a migration manualmente via CLI ou adicione ao processo de deploy.

### 4. Verificação

Após aplicar as migrations, verifique se as colunas foram criadas:
```sql
-- Verificar resources
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'resources' AND column_name = 'customFields';

-- Verificar projects
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'customFields';
```

## Nota
O código já foi atualizado para tratar `customFields` como campo opcional em ambos os casos (resources e projects), então não causará erros mesmo se as colunas ainda não existirem. No entanto, é recomendado aplicar as migrations o quanto antes.

