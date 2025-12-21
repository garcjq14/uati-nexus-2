# 🔗 Guia de Integração: Render (Backend) + Vercel (Frontend)

Este guia explica como configurar as variáveis de ambiente para que o frontend no Vercel se comunique corretamente com o backend no Render.

## ⚡ Checklist Rápido

Se você está vendo erros de **CORS** ou **"Não foi possível conectar ao servidor"**, siga estes passos:

- [ ] **No Vercel**: Adicione a variável `VITE_API_URL` com a URL do seu backend Render (ex: `https://seu-backend.onrender.com/api`)
- [ ] **No Vercel**: Marque TODOS os ambientes (Production, Preview, Development) ao adicionar a variável
- [ ] **No Vercel**: Faça um **REDEPLOY** após adicionar a variável (obrigatório!)
- [ ] **No Render**: Adicione a variável `FRONTEND_URL` com a URL de **PRODUÇÃO** do Vercel (ex: `https://uati-nexus-frontend.vercel.app`)
  - ⚠️ Use a URL de produção, não a de preview!
  - ⚠️ Sem barra `/` no final!
- [ ] **No Render**: Reinicie o serviço após adicionar a variável
- [ ] Abra o console do navegador (F12) e verifique se aparece `🔧 API URL configurada:` com a URL do Render
- [ ] Verifique os logs do Render - deve aparecer `✅ CORS allowed for origin:` quando funcionar

## 📋 Pré-requisitos

- Backend já deployado no Render
- Frontend já deployado no Vercel
- URLs de ambos os serviços

## 🔧 Configuração no Render (Backend)

### 1. Acesse o Dashboard do Render

1. Vá para [render.com](https://render.com) e faça login
2. Selecione seu serviço do backend (UATI Nexus Backend)

### 2. Configure as Variáveis de Ambiente

Vá em **Environment** e adicione/verifique as seguintes variáveis:

#### Variáveis Obrigatórias:

```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://seu-app.vercel.app
```

**⚠️ MUITO IMPORTANTE sobre `FRONTEND_URL`:**
- Substitua `https://seu-app.vercel.app` pela URL de **produção** do seu frontend no Vercel
- **Use a URL de produção**, não a URL de preview
- O código agora aceita automaticamente URLs de preview do mesmo projeto
- Se você tiver múltiplos domínios (ex: vercel.app e domínio customizado), separe por vírgula:
  ```
  FRONTEND_URL=https://seu-app.vercel.app,https://seudominio.com
  ```
- **NÃO inclua a barra `/` no final da URL**
- **Exemplo correto**: `https://uati-nexus-frontend.vercel.app`
- **Exemplo errado**: `https://uati-nexus-frontend.vercel.app/` (com barra no final)

#### Outras Variáveis Necessárias:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
```

**⚠️ IMPORTANTE sobre DATABASE_URL:**
- No Render, você deve usar a URL do banco PostgreSQL fornecida pelo Render
- A URL será algo como: `postgresql://user:password@host:port/database?sslmode=require`
- **NÃO use** `file:./prisma/dev.db` (isso é apenas para SQLite local)
- O Render fornece a URL do PostgreSQL automaticamente quando você cria um banco de dados

**Gerar JWT_SECRET:**
```bash
# No terminal, execute:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Reinicie o Serviço

Após adicionar/modificar as variáveis:
1. Vá em **Manual Deploy** → **Deploy latest commit**
2. Ou aguarde o deploy automático (se configurado)

## 🔧 Configuração no Vercel (Frontend)

### 1. Acesse o Dashboard do Vercel

1. Vá para [vercel.com](https://vercel.com) e faça login
2. Selecione seu projeto (UATI Nexus Frontend)

### 2. Configure as Variáveis de Ambiente

Vá em **Settings** → **Environment Variables** e adicione:

```
VITE_API_URL=https://seu-backend.onrender.com/api
```

**⚠️ ATENÇÃO - MUITO IMPORTANTE:**
- Substitua `https://seu-backend.onrender.com` pela URL real do seu backend no Render
- A URL deve terminar com `/api` (sem barra no final)
- Exemplo: `https://uati-nexus-backend.onrender.com/api`
- **Marque TODOS os ambientes**: Production, Preview e Development
- Se você não marcar todos, o build pode não incluir a variável!

**Como configurar:**
1. Clique em **Add New**
2. Digite `VITE_API_URL` como Key
3. Digite a URL do seu backend (ex: `https://seu-backend.onrender.com/api`)
4. **Marque as 3 opções**: ☑ Production ☑ Preview ☑ Development
5. Clique em **Save**

### 3. Redeploy do Frontend

**⚠️ OBRIGATÓRIO após adicionar a variável:**
1. Vá em **Deployments**
2. Clique nos três pontos (⋯) do último deploy
3. Selecione **Redeploy**
4. Aguarde o build completar (pode levar 2-5 minutos)

**OU** faça um novo commit e push (se tiver auto-deploy configurado)

**⚠️ IMPORTANTE:** Variáveis de ambiente do Vite são incluídas no build. Se você não fizer redeploy, a variável não será incluída no código!

## ✅ Verificação

### 1. Teste a Conexão

1. Abra o console do navegador (F12)
2. Tente fazer login no seu app
3. Verifique se não há erros de CORS ou conexão

### 2. Verifique os Logs

**No Render:**
- Vá em **Logs** do seu serviço backend
- Verifique se as requisições estão chegando

**No Vercel:**
- Vá em **Deployments** → Selecione o deploy → **Functions** → Ver logs

### 3. Erros Comuns

#### Erro: "CORS policy: No 'Access-Control-Allow-Origin' header" ou "Response to preflight request doesn't pass access control check"
**Solução:** 
1. Verifique se `FRONTEND_URL` no Render está configurada com a URL de **produção** do Vercel (ex: `https://uati-nexus-frontend.vercel.app`)
2. **NÃO use a URL de preview** - use a URL de produção, o código aceita previews automaticamente
3. Verifique se não há barra `/` no final da URL
4. Verifique os logs do Render - você deve ver `✅ CORS allowed for origin:` quando funcionar
5. Se ainda não funcionar, verifique se o backend foi reiniciado após adicionar a variável

#### Erro: "Network Error" ou "Failed to fetch" ou "Não foi possível conectar ao servidor na porta 3001"
**Solução:** 
- **Este erro significa que `VITE_API_URL` não está configurada ou não foi incluída no build**
- Verifique se `VITE_API_URL` no Vercel está configurada corretamente
- **Verifique se marcou TODOS os ambientes** (Production, Preview, Development) ao adicionar a variável
- **FAÇA UM REDEPLOY** após adicionar a variável (variáveis do Vite precisam estar no build)
- Verifique se o backend no Render está online
- Verifique se a URL termina com `/api`
- Abra o console do navegador (F12) e veja qual URL está sendo usada (deve aparecer um log "🔧 API URL configurada:")

#### Erro: "401 Unauthorized"
**Solução:** 
- Verifique se `JWT_SECRET` está configurado no Render
- Verifique se o token está sendo enviado corretamente (veja Network tab no navegador)

## 🔍 Debugging

### Verificar Variáveis de Ambiente no Frontend

1. Abra o console do navegador (F12 → Console)
2. Você deve ver um log: `🔧 API URL configurada: https://seu-backend.onrender.com/api`
3. Se aparecer `http://localhost:3001/api`, significa que a variável não foi configurada ou não foi incluída no build

**O que fazer:**
- Se aparecer `localhost:3001`: A variável `VITE_API_URL` não está configurada no Vercel OU não foi incluída no build
- Verifique se marcou todos os ambientes (Production, Preview, Development) ao adicionar a variável
- **FAÇA UM REDEPLOY** após adicionar/modificar a variável

### Verificar CORS no Backend

No backend (Render), os logs devem mostrar:
```
GET /api/auth/me
```

Se não aparecer, o frontend não está conseguindo fazer requisições (provavelmente erro de CORS ou URL incorreta).

### Verificar Requisições no Navegador

1. Abra o console do navegador (F12)
2. Vá na aba **Network**
3. Tente fazer login
4. Procure por requisições para `/api/auth/login`
5. Clique na requisição e veja:
   - **Request URL**: Deve ser a URL do Render, não localhost
   - **Status**: Se for CORS error, verifique `FRONTEND_URL` no Render

## 📝 Resumo das URLs

| Serviço | Variável | Exemplo |
|---------|----------|---------|
| **Render (Backend)** | `FRONTEND_URL` | `https://uati-nexus.vercel.app` |
| **Vercel (Frontend)** | `VITE_API_URL` | `https://uati-nexus-backend.onrender.com/api` |

## 🚀 Após Configurar

1. Aguarde alguns minutos para os serviços reiniciarem
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Tente fazer login novamente
4. Se ainda não funcionar, verifique os logs de ambos os serviços

## 🔧 Configuração do Vercel para SPA (Single Page Application)

Se você está recebendo erro **404** ao acessar rotas diretamente ou ao recarregar a página:

### Solução: Arquivo `vercel.json`

Crie um arquivo `vercel.json` na raiz do projeto frontend (ou na raiz do repositório se o projeto do Vercel aponta para a raiz):

**Se o projeto do Vercel aponta para a pasta `frontend`:**
- Crie `frontend/vercel.json`

**Se o projeto do Vercel aponta para a raiz:**
- Crie `vercel.json` na raiz

O arquivo deve conter:
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**OU** se o projeto do Vercel está configurado na raiz com `frontend` como pasta:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

Isso faz com que todas as rotas sejam redirecionadas para o `index.html`, permitindo que o React Router gerencie as rotas no cliente.

### Verificar Configuração do Projeto no Vercel

1. Acesse o dashboard do Vercel
2. Vá em **Settings** → **General**
3. Verifique os seguintes campos:

**Root Directory:**
   - Se estiver vazio ou apontar para `.`, use `vercel.json` na raiz
   - Se apontar para `frontend`, use `frontend/vercel.json`

**Build Command:**
   - Deve ser: `cd frontend && npm install && npm run build` (se root directory for raiz)
   - OU: `npm install && npm run build` (se root directory for `frontend`)

**Output Directory:**
   - Deve ser: `frontend/dist` (se root directory for raiz)
   - OU: `dist` (se root directory for `frontend`)

**Framework Preset:**
   - Deve ser: **Other** ou **Vite**

### Após Criar o Arquivo

1. **Faça commit e push** do arquivo `vercel.json`:
   ```bash
   git add vercel.json frontend/vercel.json
   git commit -m "Add Vercel configuration for SPA routing"
   git push
   ```

2. **No dashboard do Vercel:**
   - Vá em **Deployments**
   - Clique nos três pontos (⋯) do último deploy
   - Selecione **Redeploy** (para garantir que a nova configuração seja aplicada)

3. **Aguarde alguns minutos** para o deploy completar

4. **Teste acessando uma rota diretamente:**
   - Ex: `https://seu-app.vercel.app/login`
   - Deve carregar sem erro 404

### Se Ainda Não Funcionar

1. Verifique se o arquivo `vercel.json` está no lugar correto (raiz ou `frontend/`)
2. Verifique se o deploy foi concluído com sucesso
3. Verifique as configurações em **Settings** → **General** no Vercel
4. Tente limpar o cache do navegador (Ctrl+Shift+Delete)
5. Verifique os logs do deploy no Vercel para ver se há erros

## 🔧 Troubleshooting: Erro 500 no Login

Se você está recebendo erro **500** ao tentar fazer login:

### Possíveis Causas:

1. **Banco de dados não inicializado**
   - As migrations não foram executadas
   - O banco de dados não foi criado

2. **Banco de dados não seedado**
   - Não há usuários no banco de dados
   - O seed não foi executado

3. **JWT_SECRET não configurado**
   - A variável `JWT_SECRET` não está configurada no Render

### Soluções:

#### 1. Verificar se as migrations foram executadas

No Render, verifique os logs do build. Você deve ver:
```
Running migrations...
Applied migration: 20250101000000_add_block_and_milestones
```

Se não aparecer, adicione ao `buildCommand` no `render.yaml`:
```yaml
buildCommand: npm install && npx prisma migrate deploy && npm run build
```

#### 2. Executar o seed do banco de dados (OBRIGATÓRIO)

**⚠️ MUITO IMPORTANTE: Você DEVE chamar este endpoint antes de tentar fazer login!**

**Como o Shell do Render é pago, use o endpoint HTTP de inicialização:**

1. **Após o deploy do backend, acesse no navegador:**
   ```
   https://seu-backend.onrender.com/api/setup-db
   ```

   Isso criará todas as tabelas do banco de dados. Depois, chame:

   ```
   https://seu-backend.onrender.com/api/init
   ```
   (Substitua `seu-backend` pela URL real do seu backend no Render)

2. **Ou use curl:**
   ```bash
   curl https://seu-backend.onrender.com/api/init
   ```

3. **Você deve receber uma resposta de sucesso:**
   ```json
   {
     "message": "Database initialized successfully",
     "users": [
       { "email": "alexandre@uati.com", "password": "password123" },
       { "email": "anegarcia@uati.com", "password": "AnaGarcia@UATI2024!Secure" }
     ]
   }
   ```

4. **Se o banco já estiver inicializado, você verá:**
   ```json
   {
     "message": "Database already initialized",
     "usersCount": 2
   }
   ```

5. **Se aparecer erro, verifique:**
   - Se as migrations foram executadas (veja logs do build)
   - Se `DATABASE_URL` está configurado corretamente
   - Os logs do Render para mais detalhes

**⚠️ IMPORTANTE:** 
- Chame este endpoint apenas UMA VEZ após o primeiro deploy
- Ele cria os usuários iniciais necessários para fazer login
- **SEM chamar este endpoint, você NÃO conseguirá fazer login!**

#### 3. Verificar variáveis de ambiente

No Render, verifique se estas variáveis estão configuradas:
- `JWT_SECRET` - deve ter um valor seguro
- `DATABASE_URL` - deve ser a URL do PostgreSQL fornecida pelo Render (formato: `postgresql://...`)
  - ⚠️ **NÃO use** `file:./prisma/dev.db` (isso é apenas para desenvolvimento local com SQLite)
  - O Render fornece a URL automaticamente quando você cria um banco PostgreSQL
- `NODE_ENV=production`

#### 4. Verificar os logs do Render

Após tentar fazer login, verifique os logs do Render. Você deve ver:
```
Login attempt for email: seu@email.com
User found, comparing password...
Password valid, generating token...
```

Se aparecer algum erro, ele será logado com detalhes.

#### 5. Criar usuário manualmente (se necessário)

Se o seed não funcionar, você pode criar um usuário manualmente via Shell do Render:

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createUser() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'seu@email.com',
      name: 'Seu Nome',
      password: hashedPassword,
    },
  });
  console.log('User created:', user);
  await prisma.\$disconnect();
}

createUser();
"
```

### Verificar se está funcionando:

1. Tente fazer login com:
   - Email: `alexandre@uati.com`
   - Senha: `password123`

2. Se não funcionar, verifique os logs do Render para ver o erro específico

---

**Dica:** Mantenha este arquivo atualizado com as URLs reais do seu projeto para referência futura.

