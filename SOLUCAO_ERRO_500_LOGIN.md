# 🔧 Guia Completo: Resolver Erro 500 no Login

Este guia contém **TODAS as soluções possíveis** para resolver o erro 500 ao fazer login.

## ⚠️ PROBLEMA COMUM: SQLite vs PostgreSQL

**Se você receber o erro:**
```
error: Error validating datasource `db`: the URL must start with the protocol `file:`.
error: Error validating datasource `db`: the URL must start with the protocol `file:`.
  -->  schema.prisma:10
   | 
 9 |   provider = "sqlite"
```

**Causa:** O schema.prisma está configurado para SQLite, mas o Render está usando PostgreSQL.

**Solução COMPLETA:**

1. **Verificar se o schema.prisma está correto:**
   - Deve ter `provider = "postgresql"` (não `sqlite`)
   - O arquivo local já foi corrigido ✅

2. **Atualizar migration_lock.toml:**
   - O arquivo `backend/prisma/migrations/migration_lock.toml` também precisa ter `provider = "postgresql"`
   - Já foi corrigido ✅

3. **Fazer commit e push:**
   ```bash
   git add backend/prisma/schema.prisma backend/prisma/migrations/migration_lock.toml render.yaml
   git commit -m "Fix: Change to PostgreSQL provider and use db push"
   git push
   ```

4. **Verificar DATABASE_URL no Render:**
   - Deve ser uma URL PostgreSQL: `postgresql://user:password@host:port/database`
   - **NÃO use** `file:./prisma/dev.db` (isso é SQLite)
   - O Render fornece a URL automaticamente quando você cria um banco PostgreSQL

5. **Fazer novo deploy:**
   - No Render: Manual Deploy → Deploy latest commit
   - Aguarde o build completar (pode levar 5-10 minutos)
   - O `prisma db push` criará todas as tabelas automaticamente
   - Verifique os logs do build - deve aparecer: `Your database is now in sync with your schema`

6. **Criar as tabelas (se necessário):**
   - Se as tabelas não foram criadas durante o build, acesse: `https://seu-backend.onrender.com/api/setup-db`
   - Isso criará todas as tabelas necessárias
   - Você verá uma resposta confirmando que as tabelas foram criadas

7. **Chamar /api/init:**
   - Após criar as tabelas, acesse: `https://seu-backend.onrender.com/api/init`
   - Isso criará os usuários iniciais

**⚠️ IMPORTANTE:** 
- O `prisma db push` cria as tabelas diretamente do schema, sem precisar de migrations
- Isso é mais simples para o primeiro deploy com PostgreSQL
- Se aparecer erro sobre tabelas já existentes, o `--skip-generate` evita regenerar o client desnecessariamente

## 📋 Checklist de Diagnóstico

Siga estes passos na ordem:

### ✅ Passo 1: Verificar se as tabelas existem

**Se você receber erro sobre tabelas não existirem, crie-as primeiro:**

**Acesse no navegador:**
```
https://uati-nexus-backend.onrender.com/api/setup-db
```

**Respostas esperadas:**

✅ **Tabelas criadas:**
```json
{
  "message": "Database tables created successfully",
  "tables": ["users", "projects", "notes", ...],
  "nextStep": "Call /api/init to create initial users"
}
```

✅ **Tabelas já existem:**
```json
{
  "message": "Database tables already exist",
  "hint": "Tables are already created"
}
```

---

### ✅ Passo 2: Verificar se o banco foi inicializado

**Acesse no navegador:**
```
https://uati-nexus-backend.onrender.com/api/init
```

**Respostas esperadas:**

✅ **Sucesso:**
```json
{
  "message": "Database initialized successfully",
  "users": [
    { "email": "alexandre@uati.com", "password": "password123" }
  ]
}
```

✅ **Já inicializado:**
```json
{
  "message": "Database already initialized",
  "usersCount": 2
}
```

❌ **Erro:** Se aparecer erro, veja a seção "Problemas com /api/init" abaixo.

---

### ✅ Passo 3: Verificar os logs do Render

1. Acesse o dashboard do Render
2. Vá em **Logs** do seu serviço backend
3. Procure por:
   - `Login attempt for email:`
   - `❌ Login error:`
   - `Error message:`
   - `Error code:`

**O que procurar nos logs:**

- Se aparecer `"no such table"` ou `"does not exist"` → As migrations não foram executadas
- Se aparecer `"Database not initialized"` → Chame `/api/init` primeiro
- Se aparecer outro erro → Anote a mensagem completa

---

### ✅ Passo 3: Verificar variáveis de ambiente no Render

No Render, vá em **Environment** e verifique:

**Variáveis obrigatórias:**
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET` - deve ter um valor (gere um novo se necessário)
- ✅ `DATABASE_URL=file:./prisma/dev.db` (sem espaços, sem barras extras)
- ✅ `FRONTEND_URL=https://seu-app.vercel.app` (URL de produção do Vercel)

**Gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### ✅ Passo 4: Verificar se as migrations foram executadas

**No Render, verifique os logs do BUILD:**

1. Vá em **Events** ou **Logs** do deploy
2. Procure por:
   - `Running migrations...`
   - `Applied migration:`
   - `Prisma Migrate`

**Se não aparecer, o buildCommand precisa incluir as migrations:**

No arquivo `render.yaml`, verifique:
```yaml
buildCommand: npm install && npx prisma migrate deploy && npm run build
```

**Se não estiver assim, atualize e faça um novo deploy.**

---

## 🔧 Soluções por Tipo de Erro

### ❌ Erro: "Cannot GET /api/init"

**Causa:** A rota não foi deployada ou o código não foi atualizado.

**Solução:**
1. Verifique se fez commit e push do arquivo `backend/src/routes/init.ts`
2. Verifique se o deploy foi concluído no Render
3. Aguarde alguns minutos após o deploy
4. Tente novamente

---

### ❌ Erro: "Database not initialized" ou "no such table"

**Causa:** As migrations não foram executadas ou o banco não existe.

**Soluções:**

#### Solução A: Verificar buildCommand

No `render.yaml`, certifique-se de que está:
```yaml
buildCommand: npm install && npx prisma migrate deploy && npm run build
```

Faça commit, push e um novo deploy.

#### Solução B: Verificar DATABASE_URL

No Render, verifique se `DATABASE_URL` está configurado como:
```
file:./prisma/dev.db
```

**⚠️ IMPORTANTE:**
- Sem espaços
- Sem barras extras
- Caminho relativo (não absoluto)

#### Solução C: Forçar migrations manualmente (se possível)

Se tiver acesso ao Shell (pago), execute:
```bash
cd backend
npx prisma migrate deploy
```

---

### ❌ Erro: "Login failed" (genérico)

**Causa:** Erro não identificado, precisa ver logs.

**Soluções:**

#### Solução A: Verificar logs detalhados

Os logs agora mostram mais detalhes. Procure por:
- `Login attempt for email:`
- `User found, comparing password...`
- `❌ Login error:`
- `Error code:`

#### Solução B: Verificar se o usuário existe

Chame `/api/init` e verifique se retorna sucesso. Se retornar "already initialized", o usuário existe.

#### Solução C: Verificar Prisma Client

O Prisma Client pode não ter sido gerado. Verifique os logs do build:
- Deve aparecer: `Generated Prisma Client`

Se não aparecer, o `postinstall` no `package.json` deve executar `prisma generate`.

---

### ❌ Erro: "Invalid credentials" (401)

**Causa:** Email ou senha incorretos, OU usuário não existe.

**Soluções:**

#### Solução A: Verificar credenciais

Use exatamente:
- Email: `alexandre@uati.com`
- Senha: `password123`

#### Solução B: Recriar usuário

Chame `/api/init` novamente. Ele usa `upsert`, então atualizará o usuário se já existir.

---

### ❌ Erro: Problemas com Prisma Client

**Causa:** Prisma Client não foi gerado ou está desatualizado.

**Soluções:**

#### Solução A: Verificar package.json

Certifique-se de que tem:
```json
"postinstall": "prisma generate"
```

#### Solução B: Verificar logs do build

Nos logs do build, deve aparecer:
```
> prisma generate
```

Se não aparecer, o `postinstall` não está sendo executado.

---

## 🚀 Solução Rápida (Tentar Primeiro)

Se você quer uma solução rápida, tente esta sequência:

### 1. Verificar se /api/init funciona

Acesse: `https://seu-backend.onrender.com/api/init`

Se não funcionar:
- Verifique se o código foi deployado
- Aguarde alguns minutos após o deploy
- Verifique os logs do Render

### 2. Se /api/init funcionar mas login não

Verifique os logs do Render ao tentar fazer login. Os logs agora mostram:
- Qual email está tentando
- Se o usuário foi encontrado
- Onde exatamente está falhando

### 3. Verificar variáveis de ambiente

Certifique-se de que todas estão configuradas:
- `NODE_ENV=production`
- `JWT_SECRET` (com valor)
- `DATABASE_URL=file:./prisma/dev.db`
- `FRONTEND_URL` (URL do Vercel)

### 4. Fazer novo deploy completo

1. Faça commit de todas as mudanças
2. Faça push
3. No Render, vá em **Manual Deploy** → **Deploy latest commit**
4. Aguarde o build completar
5. Aguarde o serviço iniciar
6. Chame `/api/init`
7. Tente fazer login

---

## 📝 Informações para Debug

Quando reportar o problema, inclua:

1. **Resposta do /api/init:**
   - Copie a resposta completa (JSON)

2. **Logs do Render ao tentar login:**
   - Copie as linhas que aparecem quando você tenta fazer login
   - Procure por: `Login attempt`, `Login error`, `Error message`

3. **Variáveis de ambiente:**
   - Quais estão configuradas (sem mostrar valores sensíveis)
   - Especialmente `DATABASE_URL` e `JWT_SECRET` (se está configurado)

4. **Logs do build:**
   - Aparece `prisma migrate deploy`?
   - Aparece `Generated Prisma Client`?

5. **Erro exato no frontend:**
   - Qual é a mensagem de erro?
   - Qual é o status code (500, 401, etc.)?

---

## 🔍 Verificações Finais

Antes de desistir, verifique:

- [ ] `/api/init` retorna sucesso
- [ ] Logs do Render mostram que o servidor está rodando
- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] O build foi concluído com sucesso
- [ ] As migrations foram executadas (veja logs do build)
- [ ] Prisma Client foi gerado (veja logs do build)
- [ ] Está usando as credenciais corretas: `alexandre@uati.com` / `password123`
- [ ] Aguardou alguns minutos após o deploy para o serviço estabilizar

---

## 💡 Solução Alternativa: Criar Usuário via Endpoint

Se nada funcionar, podemos criar um endpoint temporário para criar usuário manualmente. Mas primeiro, tente todas as soluções acima.

---

**Última atualização:** Agora os logs mostram muito mais detalhes. Sempre verifique os logs do Render primeiro!

