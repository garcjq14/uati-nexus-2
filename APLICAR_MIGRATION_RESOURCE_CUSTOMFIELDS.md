# Aplicar Migration: customFields em Resources

## Problema
A coluna `customFields` está definida no schema do Prisma mas não existe no banco de dados, causando o erro:
```
Invalid `prisma.resource.create()` invocation: The column `customFields` does not exist in the current database.
```

## Solução

### 1. Migration Criada
Foi criada a migration `20250128000000_add_resource_custom_fields` que adiciona a coluna `customFields` na tabela `resources`.

### 2. Aplicar a Migration

#### Opção A: Via Prisma CLI (Recomendado)
```bash
cd backend
npx prisma migrate deploy
```

#### Opção B: SQL Manual
Execute o seguinte SQL no banco de dados:
```sql
ALTER TABLE "resources" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '{}';
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

Após aplicar a migration, verifique se a coluna foi criada:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'resources' AND column_name = 'customFields';
```

## Nota
O código já foi atualizado para tratar `customFields` como campo opcional, então não causará erros mesmo se a coluna ainda não existir. No entanto, é recomendado aplicar a migration o quanto antes.

