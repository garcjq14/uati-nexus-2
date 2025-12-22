# 🚀 Configurar Frontend no Vercel - Guia Rápido

## ✅ Passo a Passo

### 1. Configurar Variável de Ambiente no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Selecione seu projeto **uati-nexus**
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Configure:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://uati-nexus-backend.onrender.com/api`
   - **Environments**: Marque TODOS os três:
     - ☑ Production
     - ☑ Preview  
     - ☑ Development
6. Clique em **Save**

**⚠️ IMPORTANTE:**
- A URL deve terminar com `/api` (sem barra no final)
- Exemplo correto: `https://uati-nexus-backend.onrender.com/api`
- Exemplo errado: `https://uati-nexus-backend.onrender.com/api/` (com barra no final)

### 2. Fazer Redeploy (OBRIGATÓRIO)

**⚠️ CRÍTICO:** Após adicionar a variável, você DEVE fazer um redeploy:

1. Vá em **Deployments**
2. Clique nos três pontos (⋯) do último deploy
3. Selecione **Redeploy**
4. Aguarde o build completar (2-5 minutos)

**Por quê?** Variáveis de ambiente do Vite (`VITE_*`) são incluídas no build. Se você não fizer redeploy, a variável não será incluída no código compilado!

### 3. Verificar se Funcionou

1. Após o redeploy, acesse seu app no Vercel
2. Abra o console do navegador (F12 → Console)
3. Você deve ver:
   ```
   🔧 API URL configurada: https://uati-nexus-backend.onrender.com/api
   ```
4. Se ainda aparecer `localhost:3001`, a variável não foi configurada corretamente ou o redeploy não foi feito

### 4. Verificar Backend no Render

Certifique-se de que o backend está configurado:

1. No Render, verifique se `FRONTEND_URL` está configurada:
   ```
   FRONTEND_URL=https://uati-nexus-2-k070csb9e-garcjq14-gmailcoms-projects.vercel.app
   ```
   (substitua pela URL real do seu frontend no Vercel)

2. **NÃO inclua barra `/` no final da URL**

3. Reinicie o serviço no Render após adicionar/modificar variáveis

## 📋 Checklist

- [ ] Variável `VITE_API_URL` configurada no Vercel com valor `https://uati-nexus-backend.onrender.com/api`
- [ ] Todos os ambientes marcados (Production, Preview, Development)
- [ ] Redeploy feito após adicionar a variável
- [ ] Console mostra a URL correta do backend (não localhost)
- [ ] Backend no Render está online
- [ ] `FRONTEND_URL` configurada no Render com a URL do Vercel
- [ ] Backend reiniciado no Render

## 🔍 Debug

### Verificar Variável no Build

1. No Vercel, vá em **Deployments** → Selecione o deploy → **Build Logs**
2. Procure por `VITE_API_URL` nos logs
3. Se não aparecer, a variável não foi incluída no build

### Testar Localmente

```bash
cd frontend
export VITE_API_URL=https://uati-nexus-backend.onrender.com/api
npm run build
npm run preview
```

## 🆘 Problemas Comuns

### Erro: Ainda mostra `localhost:3001`
**Solução:** 
- Verifique se marcou TODOS os ambientes ao adicionar a variável
- **FAÇA UM REDEPLOY** após adicionar a variável

### Erro: CORS no navegador
**Solução:**
- Verifique se `FRONTEND_URL` no Render está com a URL correta do Vercel
- Reinicie o backend no Render

### Erro: 401 Unauthorized
**Solução:**
- Verifique se `JWT_SECRET` está configurado no Render
- Verifique se o token está sendo enviado (veja Network tab no navegador)

