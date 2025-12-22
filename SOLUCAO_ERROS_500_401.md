# 🔧 Solução: Erros 500, 401 e 404

## 📋 Resumo dos Erros

### ❌ Erros 401 (Unauthorized)
- `/api/domains`
- `/api/user/dashboard-layout`
- `/api/auth/me`
- `manifest.json`

**Causa:** Usuário não está autenticado ou token inválido.

**Solução:** 
1. Faça login no frontend
2. Verifique se o token está sendo salvo no `localStorage`
3. Verifique se `JWT_SECRET` está configurado no Render

### ❌ Erro 500 em `/api/curriculum`
**Causa:** Campo `customFields` não existe no banco de dados.

**Solução:** Veja [APLICAR_MIGRATION_CUSTOMFIELDS.md](./APLICAR_MIGRATION_CUSTOMFIELDS.md)

### ❌ Erro 500 em `/api/achievements`
**Causa:** Possível problema com queries do Prisma ou banco de dados.

**Solução:** Verifique os logs do Render para ver o erro específico.

### ❌ Erro 404 em `/api/courses/cmip7zfyd0001ak5sjpdipnzx`
**Causa:** Curso com esse ID não existe no banco de dados.

**Solução:** 
- O frontend está tentando buscar um curso que não existe
- Isso pode ser um ID antigo no localStorage
- Limpe o localStorage ou crie um novo curso

## ✅ Passos para Resolver

### 1. Aplicar Migration do customFields

**No Render Shell:**
```bash
cd backend
npx prisma migrate deploy
```

Ou via SQL no CockroachDB:
```sql
ALTER TABLE "curriculum" ADD COLUMN IF NOT EXISTS "customFields" TEXT NOT NULL DEFAULT '{}';
```

### 2. Verificar Variáveis de Ambiente no Render

Certifique-se de que estas variáveis estão configuradas:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://... (URL do CockroachDB)
JWT_SECRET=seu-jwt-secret-aqui
FRONTEND_URL=https://uati-nexus-2-ljgj7fp2p-garcjq14-gmailcoms-projects.vercel.app
```

### 3. Verificar Variáveis de Ambiente no Vercel

Certifique-se de que esta variável está configurada:

```
VITE_API_URL=https://uati-nexus-backend.onrender.com/api
```

**⚠️ IMPORTANTE:** Marque TODOS os ambientes (Production, Preview, Development) e faça um **REDEPLOY** após adicionar.

### 4. Limpar Cache e Testar

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Limpe o localStorage** (F12 → Console → `localStorage.clear()`)
3. **Faça login novamente**
4. **Verifique o console** para ver se os erros desapareceram

### 5. Verificar Logs

**No Render:**
- Vá em **Logs** do serviço backend
- Procure por erros relacionados a `customFields` ou `curriculum`
- Procure por erros de autenticação

**No Vercel:**
- Vá em **Deployments** → Selecione o deploy → **Build Logs**
- Verifique se `VITE_API_URL` está sendo incluída no build

## 🔍 Debug Detalhado

### Verificar se Migration foi Aplicada

**No CockroachDB SQL Editor:**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'curriculum' 
AND column_name = 'customFields';
```

Se retornar uma linha, a migration foi aplicada. Se não retornar nada, aplique a migration.

### Verificar Token de Autenticação

**No Console do Navegador (F12):**
```javascript
localStorage.getItem('token')
```

Se retornar `null`, você precisa fazer login. Se retornar um token, verifique se ele é válido.

### Verificar URL da API

**No Console do Navegador (F12):**
Você deve ver:
```
🔧 API URL configurada: https://uati-nexus-backend.onrender.com/api
```

Se aparecer `localhost:3001`, a variável `VITE_API_URL` não está configurada corretamente no Vercel.

## 📝 Checklist Final

- [ ] Migration `customFields` aplicada no Render
- [ ] Variáveis de ambiente configuradas no Render
- [ ] Variável `VITE_API_URL` configurada no Vercel (todos os ambientes)
- [ ] Redeploy feito no Vercel após adicionar `VITE_API_URL`
- [ ] Backend reiniciado no Render após aplicar migration
- [ ] Cache do navegador limpo
- [ ] localStorage limpo
- [ ] Login feito novamente
- [ ] Console do navegador verificado (sem erros 500/401)

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs do Render** para ver o erro exato
2. **Verifique o console do navegador** para ver requisições que estão falhando
3. **Teste a API diretamente** usando curl ou Postman:
   ```bash
   curl https://uati-nexus-backend.onrender.com/api/health
   ```

4. **Verifique se o banco de dados está acessível** do Render

