# 🗄️ Inicializar Banco de Dados Vazio no CockroachDB

## 📋 Situação

Seu banco de dados PostgreSQL no CockroachDB está completamente vazio (sem tabelas, sem dados). Este guia vai te ajudar a criar todas as tabelas e popular com dados iniciais.

## ✅ Passo a Passo

### 1. Verificar se o Backend está Online

1. Acesse: `https://uati-nexus-backend.onrender.com`
2. Você deve ver: `{"message":"UATI Nexus API","version":"1.0.0",...}`
3. Se não aparecer, o backend não está rodando - verifique os logs no Render

### 2. Criar Todas as Tabelas

**Opção A: Via Endpoint HTTP (Recomendado - Mais Fácil)**

1. Abra seu navegador
2. Acesse: `https://uati-nexus-backend.onrender.com/api/setup-db`
3. Aguarde alguns segundos (pode levar 30-60 segundos)
4. Você deve ver uma resposta JSON com `"message": "Database tables created successfully"`

**Opção B: Via Shell do Render**

1. No Render, vá em **Shell** do seu serviço backend
2. Execute:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

**Opção C: Via SQL Direto no CockroachDB (Se as outras falharem)**

1. Acesse o CockroachDB Console
2. Vá em **SQL Editor**
3. Execute todas as migrations manualmente (veja pasta `backend/prisma/migrations/`)

### 3. Popular com Dados Iniciais

**Após criar as tabelas (passo 2), faça:**

1. Abra seu navegador
2. Acesse: `https://uati-nexus-backend.onrender.com/api/init`
3. Aguarde alguns segundos
4. Você deve ver uma resposta JSON com:
   ```json
   {
     "message": "Database initialized successfully",
     "users": [
       { "email": "alexandre@uati.com", "password": "password123" },
       { "email": "anegarcia@uati.com", "password": "AnaGarcia@UATI2024!Secure" }
     ]
   }
   ```

### 4. Verificar customFields (Opcional)

**NOTA:** O endpoint `/api/setup-db` agora cria automaticamente o campo `customFields` na tabela `curriculum`. Se você já tinha uma tabela criada antes, o campo será adicionado automaticamente.

**Se quiser verificar manualmente:**

1. Acesse o CockroachDB Console → **SQL Editor**
2. Execute:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'curriculum' 
   AND column_name = 'customFields';
   ```
3. Se retornar uma linha, está tudo certo!

### 5. Verificar se Funcionou

**Teste no navegador:**

1. Acesse: `https://uati-nexus-backend.onrender.com/api/health`
   - Deve retornar status 200

2. Tente fazer login no frontend com:
   - Email: `alexandre@uati.com`
   - Senha: `password123`

## 🔍 Verificação Detalhada

### Verificar se as Tabelas Foram Criadas

**No CockroachDB SQL Editor, execute:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver tabelas como:
- `users`
- `courses`
- `curriculum`
- `topics`
- `projects`
- `notes`
- `flashcards`
- `resources`
- etc.

### Verificar se os Usuários Foram Criados

```sql
SELECT email, name FROM users;
```

Deve retornar:
- `alexandre@uati.com`
- `anegarcia@uati.com`

### Verificar se customFields Existe

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'curriculum' 
AND column_name = 'customFields';
```

Deve retornar uma linha com `customFields`.

## ⚠️ Problemas Comuns

### Erro: "Database connection failed"

**Causa:** `DATABASE_URL` não está configurada ou está incorreta no Render.

**Solução:**
1. No Render, vá em **Environment**
2. Verifique se `DATABASE_URL` está configurada
3. A URL deve ser algo como: `postgresql://usuario:senha@host:porta/database?sslmode=require`
4. Reinicie o serviço após adicionar/modificar

### Erro: "Tabelas não existem" ao chamar /api/init

**Causa:** Você tentou chamar `/api/init` antes de chamar `/api/setup-db`.

**Solução:**
1. Chame primeiro: `https://seu-backend.onrender.com/api/setup-db`
2. Aguarde a resposta de sucesso
3. Depois chame: `https://seu-backend.onrender.com/api/init`

### Erro: "customFields does not exist"

**Causa:** A migration do `customFields` não foi aplicada.

**Solução:**
1. Execute o SQL no CockroachDB:
   ```sql
   ALTER TABLE "curriculum" ADD COLUMN IF NOT EXISTS "customFields" TEXT NOT NULL DEFAULT '{}';
   ```
2. Ou via Shell do Render: `npx prisma migrate deploy`

### Endpoint /api/setup-db demora muito

**Normal:** Criar todas as tabelas pode levar 30-60 segundos. Aguarde a resposta.

**Se demorar mais de 2 minutos:**
- Verifique os logs do Render
- Verifique se `DATABASE_URL` está correta
- Verifique se o banco está acessível

## 📝 Checklist Final

- [ ] Backend está online e respondendo
- [ ] Chamou `/api/setup-db` e recebeu sucesso
- [ ] Chamou `/api/init` e recebeu sucesso
- [ ] Aplicou migration do `customFields`
- [ ] Verificou que as tabelas foram criadas (SQL)
- [ ] Verificou que os usuários foram criados (SQL)
- [ ] Consegue fazer login no frontend

## 🚀 Após Inicializar

1. **Faça login no frontend** com:
   - Email: `alexandre@uati.com`
   - Senha: `password123`

2. **Os erros 500 e 401 devem desaparecer** após fazer login

3. **Se ainda houver erros:**
   - Verifique os logs do Render
   - Verifique o console do navegador (F12)
   - Veja [SOLUCAO_ERROS_500_401.md](./SOLUCAO_ERROS_500_401.md)

## 💡 Dica

Se você precisar resetar o banco completamente:

1. No CockroachDB Console, execute:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

2. Depois siga os passos acima novamente

**⚠️ ATENÇÃO:** Isso apaga TODOS os dados! Use apenas em desenvolvimento.

