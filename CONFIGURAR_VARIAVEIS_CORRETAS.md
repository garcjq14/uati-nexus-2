# 🔧 Configurar Variáveis de Ambiente Corretamente

## ⚠️ IMPORTANTE: Duas Variáveis Diferentes

Você tem **DUAS variáveis diferentes** que vão em **lugares diferentes**:

### 1. `DATABASE_URL` → Render (Backend)

**Onde configurar:** Render Dashboard → Seu serviço backend → Environment

**Valor:**
```
postgresql://garcjq:3tx3Z6VnLYx6suiXES1V0J2yRESutqvU@dpg-d4mpq73uibrs738q0r4g-a/uati_nexus
```

**Esta é a string de conexão do seu banco PostgreSQL no CockroachDB.**

### 2. `VITE_API_URL` → Vercel (Frontend)

**Onde configurar:** Vercel Dashboard → Seu projeto → Settings → Environment Variables

**Valor:** A URL do seu **backend HTTP** no Render (não do banco!)

**Como descobrir a URL correta:**

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Selecione seu serviço backend (provavelmente `uati-nexus-backend`)
3. Veja a URL no topo da página (algo como: `https://uati-nexus-backend.onrender.com`)
4. Adicione `/api` no final

**Exemplo:**
```
https://uati-nexus-backend.onrender.com/api
```

**⚠️ IMPORTANTE:**
- Não use a URL do banco de dados (`postgresql://...`)
- Use a URL HTTP do backend (`https://...`)
- Deve terminar com `/api` (sem barra no final)

## 📋 Checklist de Configuração

### No Render (Backend)

- [ ] `DATABASE_URL` = `postgresql://garcjq:3tx3Z6VnLYx6suiXES1V0J2yRESutqvU@dpg-d4mpq73uibrs738q0r4g-a/uati_nexus`
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `JWT_SECRET` = (uma string secreta aleatória)
- [ ] `FRONTEND_URL` = (URL do seu frontend no Vercel, sem barra no final)

### No Vercel (Frontend)

- [ ] `VITE_API_URL` = `https://SEU-BACKEND.onrender.com/api`
  - ⚠️ Substitua `SEU-BACKEND` pela URL real do seu backend no Render
  - ⚠️ Deve terminar com `/api` (sem barra no final)
  - ⚠️ Marque TODOS os ambientes (Production, Preview, Development)
  - ⚠️ **FAÇA REDEPLOY** após adicionar

## 🔍 Como Descobrir a URL do Backend

1. **No Render:**
   - Vá para [dashboard.render.com](https://dashboard.render.com)
   - Selecione seu serviço backend
   - A URL aparece no topo da página
   - Exemplo: `https://uati-nexus-backend.onrender.com`

2. **Teste se está funcionando:**
   - Acesse: `https://SEU-BACKEND.onrender.com`
   - Deve retornar: `{"message":"UATI Nexus API",...}`

3. **Use essa URL + `/api` no Vercel:**
   - Se a URL do backend é: `https://uati-nexus-backend.onrender.com`
   - No Vercel, use: `https://uati-nexus-backend.onrender.com/api`

## ✅ Resumo

| Variável | Onde | Valor |
|----------|------|-------|
| `DATABASE_URL` | **Render** | `postgresql://garcjq:3tx3Z6VnLYx6suiXES1V0J2yRESutqvU@dpg-d4mpq73uibrs738q0r4g-a/uati_nexus` |
| `VITE_API_URL` | **Vercel** | `https://SEU-BACKEND.onrender.com/api` |

**⚠️ NÃO confunda:**
- `DATABASE_URL` = conexão com o banco (PostgreSQL)
- `VITE_API_URL` = URL HTTP do backend (API REST)

## 🆘 Se Não Souber a URL do Backend

1. Acesse o Render Dashboard
2. Veja a lista de serviços
3. Procure pelo serviço backend (geralmente tem "backend" no nome)
4. Clique nele
5. A URL aparece no topo da página

Ou teste estas URLs comuns:
- `https://uati-nexus-backend.onrender.com`
- `https://uati-nexus.onrender.com`
- `https://backend-uati-nexus.onrender.com`

Acesse no navegador e veja qual retorna a mensagem da API.

