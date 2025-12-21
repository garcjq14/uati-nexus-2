# 🔧 Solução: Erro 401 (Unauthorized) no Login

## Problema
Ao tentar fazer login, recebe erro 401 (Unauthorized) mesmo com credenciais corretas.

## ✅ Soluções

### 1. Verificar se o Código Atualizado Foi Deployado

O código que melhoramos ainda precisa ser deployado no Render:

1. **Faça push das mudanças:**
   ```bash
   git push origin main
   ```

2. **No Render:**
   - O deploy automático deve iniciar
   - Ou vá em **Manual Deploy** → **Deploy latest commit**
   - Aguarde o deploy completar

3. **Verifique os logs do Render:**
   - Vá em **Logs** do seu serviço backend
   - Procure por mensagens como:
     - `Login attempt for email:`
     - `User found:`
     - `Password is valid!` ou `Invalid password`

### 2. Verificar Credenciais

**Credenciais corretas:**
- **Email:** `anegarcia@uati.com` (minúsculas)
- **Senha:** `AneGarcia2024!` (exatamente como está escrito)

**⚠️ IMPORTANTE:**
- A senha é **case-sensitive** (importa maiúsculas/minúsculas)
- Não inclua espaços antes ou depois
- O caractere `!` no final é obrigatório

### 3. Testar a API Diretamente

Teste se a API está funcionando corretamente:

**Via curl:**
```bash
curl -X POST https://uati-nexus-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anegarcia@uati.com","password":"AneGarcia2024!"}'
```

**Via navegador (Console F12):**
```javascript
fetch('https://uati-nexus-backend.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'anegarcia@uati.com',
    password: 'AneGarcia2024!'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 4. Verificar Logs do Backend

Os logs agora mostram informações detalhadas:

1. Acesse o dashboard do Render
2. Vá em **Logs**
3. Tente fazer login
4. Você deve ver:
   ```
   Login attempt for email: anegarcia@uati.com
   Password length: 15
   ✅ User found: Ane Garcia (ID: ...)
   🔐 Comparing password...
   ✅ Password is valid!
   ```

Se aparecer `❌ Invalid password`, a senha está incorreta.

### 5. Atualizar Senha no Banco

Se a senha não estiver funcionando, execute localmente:

```bash
cd backend
npm run update-password
```

Isso vai atualizar a senha para `AneGarcia2024!` no banco de dados.

**⚠️ IMPORTANTE:** Você precisa ter acesso ao banco de dados localmente ou via script remoto.

### 6. Verificar Variáveis de Ambiente no Render

Certifique-se de que no Render estão configuradas:

- ✅ `DATABASE_URL` - URL do CockroachDB
- ✅ `JWT_SECRET` - Chave secreta para JWT
- ✅ `FRONTEND_URL` - URL do frontend no Vercel
- ✅ `NODE_ENV=production`

### 7. Verificar CORS

Se o erro for de CORS:

1. Verifique se `FRONTEND_URL` está configurada no Render
2. A URL deve ser: `https://uati-nexus-frontend.vercel.app` (sem barra no final)
3. Reinicie o serviço no Render após configurar

### 8. Erro de Sintaxe no Frontend

O erro `Unexpected identifier 'as'` no login pode ser do build antigo:

1. **No Vercel:**
   - Vá em **Deployments**
   - Clique nos três pontos (⋯) do último deploy
   - Selecione **Redeploy**
   - Aguarde o build completar

2. **Ou faça um novo commit:**
   ```bash
   git commit --allow-empty -m "trigger rebuild"
   git push
   ```

## 🔍 Debugging

### Verificar o que o Backend Está Recebendo

Os logs do Render agora mostram:
- Email recebido (normalizado)
- Tamanho da senha
- Se o usuário foi encontrado
- Se a senha está correta

### Verificar o que o Frontend Está Enviando

No console do navegador (F12), você pode ver:
- Requisições na aba **Network**
- Payload da requisição
- Resposta do servidor

## 📝 Checklist

- [ ] Código atualizado foi commitado e feito push
- [ ] Backend foi deployado no Render
- [ ] Logs do Render mostram tentativas de login
- [ ] Email digitado corretamente: `anegarcia@uati.com`
- [ ] Senha digitada corretamente: `AneGarcia2024!`
- [ ] Variáveis de ambiente configuradas no Render
- [ ] Frontend foi redeployado no Vercel (para corrigir erro de sintaxe)
- [ ] Teste a API diretamente (curl ou console)

## 🆘 Se Nada Funcionar

1. **Verifique os logs do Render** - Eles mostram exatamente o que está acontecendo
2. **Teste a API diretamente** - Use curl ou Postman para isolar o problema
3. **Verifique se o usuário existe** - Execute `npm run verify-password` localmente
4. **Verifique a conexão com o banco** - Os logs devem mostrar se há erros de conexão



