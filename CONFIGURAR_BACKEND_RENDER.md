# 🚀 Como Configurar o Backend no Render

Este guia explica como conectar o frontend (Vercel) ao backend hospedado no Render.

## 📋 Pré-requisitos

1. Backend já deployado no Render
2. Frontend já deployado no Vercel
3. URL do backend no Render (exemplo: `https://uati-nexus-backend.onrender.com`)

## 🔧 Configuração no Vercel (Frontend)

### 1. Acesse as Configurações do Projeto no Vercel

1. Vá para [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**

### 2. Adicione a Variável de Ambiente

Adicione a seguinte variável:

- **Key**: `VITE_API_URL`
- **Value**: `https://SEU-BACKEND-URL.onrender.com/api`
  - ⚠️ **IMPORTANTE**: Substitua `SEU-BACKEND-URL` pela URL real do seu backend no Render
  - ⚠️ **IMPORTANTE**: Adicione `/api` no final da URL

**Exemplo:**
```
VITE_API_URL = https://uati-nexus-backend.onrender.com/api
```

### 3. Configure para Todos os Ambientes

Marque as opções:
- ✅ Production
- ✅ Preview
- ✅ Development (opcional)

### 4. Faça um Novo Deploy

Após adicionar a variável:
1. Vá em **Deployments**
2. Clique nos três pontos (⋯) do último deploy
3. Selecione **Redeploy**
4. Ou faça um novo commit para trigger automático

---

## 🔧 Configuração no Render (Backend)

### 1. Acesse as Configurações do Serviço no Render

1. Vá para [Render Dashboard](https://dashboard.render.com)
2. Selecione seu serviço backend
3. Vá em **Environment**

### 2. Adicione/Verifique as Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

#### Variáveis Obrigatórias:

1. **NODE_ENV**
   - Value: `production`

2. **PORT**
   - Value: `10000` (ou a porta que o Render atribuiu)

3. **DATABASE_URL**
   - Value: Sua string de conexão do CockroachDB
   - ⚠️ **IMPORTANTE**: Esta variável deve estar configurada

4. **JWT_SECRET**
   - Value: Uma string secreta aleatória (ex: `seu-jwt-secret-super-seguro-aqui`)
   - ⚠️ **IMPORTANTE**: Use uma string forte e aleatória

5. **FRONTEND_URL**
   - Value: URL do seu frontend no Vercel
   - Exemplo: `https://seu-projeto.vercel.app`
   - ⚠️ **IMPORTANTE**: Sem a barra `/` no final
   - ⚠️ **DICA**: Se tiver múltiplas URLs (production + preview), separe por vírgula:
     ```
     https://seu-projeto.vercel.app,https://seu-projeto-git-main.vercel.app
     ```

### 3. Exemplo Completo de Variáveis no Render

```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://usuario:senha@host:porta/database?sslmode=require
JWT_SECRET=sua-chave-secreta-jwt-aqui
FRONTEND_URL=https://seu-projeto.vercel.app
```

### 4. Reinicie o Serviço

Após adicionar/modificar variáveis:
1. Vá em **Manual Deploy** → **Clear build cache & deploy**
2. Ou aguarde o deploy automático

---

## ✅ Verificação

### 1. Verificar se o Backend está Respondendo

Abra no navegador:
```
https://SEU-BACKEND-URL.onrender.com/api/health
```

Ou teste com curl:
```bash
curl https://SEU-BACKEND-URL.onrender.com/api/health
```

### 2. Verificar CORS

O backend deve aceitar requisições do frontend. Se houver erro de CORS:

1. Verifique se `FRONTEND_URL` no Render está configurada corretamente
2. Verifique se a URL do frontend no Vercel corresponde exatamente
3. Verifique os logs do backend no Render para ver mensagens de CORS

### 3. Testar Login

1. Acesse o frontend no Vercel
2. Tente fazer login
3. Abra o Console do navegador (F12) e verifique:
   - Se há erros de conexão
   - Se as requisições estão sendo feitas para a URL correta do backend

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to server"

**Causa**: `VITE_API_URL` não está configurada ou está incorreta no Vercel

**Solução**:
1. Verifique se a variável `VITE_API_URL` está configurada no Vercel
2. Verifique se a URL termina com `/api`
3. Faça um novo deploy após adicionar a variável

### Erro: "CORS blocked"

**Causa**: `FRONTEND_URL` não está configurada ou está incorreta no Render

**Solução**:
1. Verifique se `FRONTEND_URL` está configurada no Render
2. Verifique se a URL corresponde exatamente à URL do frontend no Vercel
3. Reinicie o serviço no Render

### Erro: "401 Unauthorized"

**Causa**: Problema com autenticação

**Solução**:
1. Verifique se `JWT_SECRET` está configurado no Render
2. Verifique se o token está sendo enviado corretamente
3. Verifique os logs do backend no Render

### Backend não inicia

**Causa**: Variáveis de ambiente faltando ou incorretas

**Solução**:
1. Verifique se todas as variáveis obrigatórias estão configuradas
2. Verifique os logs do build no Render
3. Verifique se `DATABASE_URL` está correta

---

## 📝 Checklist Final

Antes de considerar tudo configurado, verifique:

- [ ] `VITE_API_URL` configurada no Vercel com a URL do backend + `/api`
- [ ] `FRONTEND_URL` configurada no Render com a URL do frontend
- [ ] `DATABASE_URL` configurada no Render
- [ ] `JWT_SECRET` configurado no Render
- [ ] `NODE_ENV=production` no Render
- [ ] Backend respondendo em `/api/health`
- [ ] Frontend fazendo requisições para a URL correta
- [ ] Login funcionando corretamente

---

## 🔗 Links Úteis

- [Documentação do Render](https://render.com/docs)
- [Documentação do Vercel](https://vercel.com/docs)
- [Documentação do CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)


