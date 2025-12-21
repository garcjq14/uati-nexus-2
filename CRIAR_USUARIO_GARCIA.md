# 👤 Criar Usuário Garcia

## Credenciais

- **Email:** `garcia@uati.com`
- **Nome:** `Garcia`
- **Senha:** `Garcia2024!`

## Métodos para Criar o Usuário

### Método 1: Via Script (Recomendado)

Execute o script no servidor onde o backend está rodando:

```bash
cd backend
npm run create-garcia
```

Ou diretamente:
```bash
npx tsx create-garcia-user.ts
```

### Método 2: Via API de Registro

Você pode criar o usuário diretamente via endpoint de registro:

**Via curl:**
```bash
curl -X POST https://uati-nexus-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "garcia@uati.com",
    "name": "Garcia",
    "password": "Garcia2024!",
    "password": "Garcia2024!"
  }'
```

**Via navegador (Console F12):**
```javascript
fetch('https://uati-nexus-backend.onrender.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'garcia@uati.com',
    name: 'Garcia',
    password: 'Garcia2024!'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Via Postman ou Insomnia:**
- Method: `POST`
- URL: `https://uati-nexus-backend.onrender.com/api/auth/register`
- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "garcia@uati.com",
    "name": "Garcia",
    "password": "Garcia2024!"
  }
  ```

### Método 3: Via Frontend

1. Acesse a página de login
2. Clique em "Criar conta"
3. Preencha:
   - Nome: `Garcia`
   - Email: `garcia@uati.com`
   - Senha: `Garcia2024!`
4. Clique em "Criar conta"

## Verificar se o Usuário Foi Criado

Após criar, você pode verificar fazendo login:

1. Acesse a página de login
2. Use as credenciais:
   - Email: `garcia@uati.com`
   - Senha: `Garcia2024!`

## Notas

- A senha é case-sensitive (importa maiúsculas/minúsculas)
- O email será normalizado para minúsculas automaticamente
- O usuário será criado com role `STUDENT` por padrão
- O onboarding não estará completo inicialmente





