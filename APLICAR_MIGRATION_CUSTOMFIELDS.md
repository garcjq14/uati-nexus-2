# 🔧 Aplicar Migration: customFields no Curriculum

## Problema

O erro `The column 'customFields' does not exist in the current database` ocorre porque a migration que adiciona o campo `customFields` na tabela `curriculum` ainda não foi aplicada no banco de dados do Render.

## ✅ Solução: Aplicar Migration no Render

### Opção 1: Via Shell do Render (Recomendado)

1. **Acesse o Shell do Render:**
   - Vá para [render.com](https://render.com)
   - Selecione seu serviço **uati-nexus-backend**
   - Clique em **Shell** (no menu lateral)

2. **Execute os comandos:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. **Verifique se funcionou:**
   - Você deve ver mensagens como:
     ```
     Applied migration: 20251222000000_add_curriculum_custom_fields
     ```

### Opção 2: Via Endpoint HTTP (Se Shell não estiver disponível)

Se o Shell do Render não estiver disponível (plano free), você pode aplicar a migration manualmente via SQL:

1. **Acesse o CockroachDB Console:**
   - Vá para o dashboard do CockroachDB
   - Acesse o SQL Editor

2. **Execute o SQL da migration:**
   ```sql
   ALTER TABLE "curriculum" ADD COLUMN IF NOT EXISTS "customFields" TEXT NOT NULL DEFAULT '{}';
   ```

3. **Verifique se funcionou:**
   - Execute: `SELECT column_name FROM information_schema.columns WHERE table_name = 'curriculum' AND column_name = 'customFields';`
   - Deve retornar uma linha com `customFields`

### Opção 3: Atualizar o buildCommand no Render

Se você quiser que as migrations sejam aplicadas automaticamente em cada deploy:

1. **No Render, vá em Settings → Build & Deploy**

2. **Atualize o Build Command para:**
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```

   ⚠️ **ATENÇÃO:** Isso aplicará TODAS as migrations pendentes em cada deploy. Use com cuidado se você tiver migrations que não quer aplicar automaticamente.

## ✅ Verificação

Após aplicar a migration:

1. **Teste criar um módulo no frontend**
2. **Verifique os logs do Render** - não deve mais aparecer o erro `customFields does not exist`
3. **Verifique o console do navegador** - o erro 500 em `/api/curriculum` deve desaparecer

## 🔍 Troubleshooting

### Erro: "Migration already applied"
- Isso significa que a migration já foi aplicada
- O problema pode ser que o Prisma Client precisa ser regenerado
- Execute: `npx prisma generate` no Shell do Render

### Erro: "Can't reach database server"
- Verifique se `DATABASE_URL` está configurada corretamente no Render
- Verifique se o banco de dados está online

### Erro persiste após aplicar migration
- Limpe o cache do Prisma: `rm -rf node_modules/.prisma`
- Regere o Prisma Client: `npx prisma generate`
- Reinicie o serviço no Render

## 📝 Nota

A migration `20251222000000_add_curriculum_custom_fields` adiciona o campo `customFields` na tabela `curriculum` com valor padrão `'{}'`. Este campo é usado para armazenar campos personalizados específicos do domínio do curso.

