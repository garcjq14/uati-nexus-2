# 🔧 Troubleshooting: Erro de Credenciais Inválidas

## Problema
Ao tentar fazer login, aparece o erro "Invalid credentials" mesmo com email e senha corretos.

## ✅ Soluções

### 1. Verificar Email e Senha

**Credenciais corretas:**
- **Email:** `anegarcia@uati.com` (minúsculas, sem espaços)
- **Senha:** `AneGarcia2024!` (exatamente como está escrito, com maiúsculas/minúsculas)

**⚠️ ATENÇÃO:**
- O email é **case-insensitive** (não importa maiúsculas/minúsculas)
- A senha é **case-sensitive** (importa maiúsculas/minúsculas)
- Não inclua espaços antes ou depois do email/senha

### 2. Verificar se a Senha Está Correta no Banco

Execute o script de verificação:

```bash
cd backend
npm run verify-password
```

Isso vai:
- Verificar se o usuário existe
- Testar se a senha `AneGarcia2024!` funciona
- Atualizar a senha se necessário

### 3. Atualizar a Senha Novamente

Se a senha não estiver funcionando, execute:

```bash
cd backend
npm run update-password
```

Isso vai atualizar a senha para `AneGarcia2024!` no banco de dados.

### 4. Verificar Logs do Backend

No Render (ou onde o backend está hospedado), verifique os logs:

1. Acesse o dashboard do Render
2. Vá em **Logs**
3. Tente fazer login
4. Procure por mensagens como:
   - `Login attempt for email:`
   - `User found:`
   - `Invalid password for email:`
   - `Password is valid!`

### 5. Problemas Comuns

#### Problema: Email com Espaços
**Sintoma:** Email parece correto mas não funciona
**Solução:** O código agora faz trim automaticamente, mas verifique se não há espaços extras

#### Problema: Senha com Caracteres Especiais
**Sintoma:** Senha não funciona mesmo estando correta
**Solução:** 
- Verifique se está digitando exatamente: `AneGarcia2024!`
- O caractere `!` no final é importante
- Não copie/cole com espaços extras

#### Problema: CORS ou Cookies
**Sintoma:** Login funciona mas depois dá erro
**Solução:**
- Verifique se `FRONTEND_URL` está configurada no backend
- Verifique se os cookies estão sendo enviados (aba Network no navegador)

### 6. Testar Diretamente a API

Você pode testar o login diretamente via curl ou Postman:

```bash
curl -X POST https://seu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anegarcia@uati.com","password":"AneGarcia2024!"}'
```

Ou usando o navegador (console):

```javascript
fetch('https://seu-backend.onrender.com/api/auth/login', {
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

### 7. Resetar Completamente o Usuário

Se nada funcionar, você pode resetar o usuário completamente:

```bash
cd backend
npm run reset-user
```

Isso vai:
- Deletar todos os dados do usuário
- Resetar a senha para `AnaGarcia@UATI2024!Secure`
- Deixar o usuário em estado inicial

**⚠️ ATENÇÃO:** Isso apaga TODOS os dados do usuário (projetos, notas, flashcards, etc.)

### 8. Verificar Variáveis de Ambiente

Certifique-se de que no backend (Render) estão configuradas:

- `DATABASE_URL` - URL do CockroachDB
- `JWT_SECRET` - Chave secreta para JWT
- `FRONTEND_URL` - URL do frontend no Vercel
- `NODE_ENV=production`

### 9. Checklist Final

- [ ] Email digitado corretamente: `anegarcia@uati.com`
- [ ] Senha digitada corretamente: `AneGarcia2024!` (com maiúscula A, maiúscula G, e ! no final)
- [ ] Sem espaços antes/depois do email ou senha
- [ ] Backend está online e acessível
- [ ] Variáveis de ambiente configuradas no Render
- [ ] Logs do backend mostram tentativas de login
- [ ] `VITE_API_URL` configurada no Vercel
- [ ] Frontend foi redeployado após configurar `VITE_API_URL`

## 🆘 Se Nada Funcionar

1. **Verifique os logs do backend** - Eles mostram exatamente o que está acontecendo
2. **Teste a API diretamente** - Use curl ou Postman para isolar o problema
3. **Verifique o console do navegador** - Veja se há erros de CORS ou rede
4. **Execute o script verify-password** - Confirme que a senha está correta no banco

## 📝 Informações Úteis

- **Email do usuário:** `anegarcia@uati.com`
- **Senha atual:** `AneGarcia2024!`
- **ID do usuário:** `cmjcu94e60000e4ba3wtr437n` (pode variar)





