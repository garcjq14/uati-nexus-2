# 🔄 Como Fazer Redeploy no Render

## ✅ Passo a Passo Rápido

### 1. Fazer Commit e Push (Se ainda não fez)

```bash
# Verificar o que foi alterado
git status

# Adicionar as mudanças
git add backend/src/routes/setup-db.ts
git add backend/src/routes/curriculum.ts
git add INICIALIZAR_BANCO_VAZIO.md
git add REDEPLOY_RENDER.md

# Fazer commit
git commit -m "Fix: Adiciona customFields automaticamente no setup-db e curriculum"

# Fazer push
git push origin main
```

### 2. Redeploy no Render

**Opção A: Deploy Automático (Recomendado)**

1. Após fazer `git push`, o Render detecta automaticamente as mudanças
2. Vá para [Render Dashboard](https://dashboard.render.com)
3. Selecione seu serviço **uati-nexus-backend**
4. Você verá um novo deploy iniciando automaticamente
5. Aguarde o build completar (2-5 minutos)

**Opção B: Deploy Manual**

Se o deploy automático não iniciar:

1. Vá para [Render Dashboard](https://dashboard.render.com)
2. Selecione seu serviço **uati-nexus-backend**
3. Clique em **Manual Deploy** → **Deploy latest commit**
4. Aguarde o build completar (2-5 minutos)

### 3. Verificar se o Deploy Funcionou

1. No Render, vá em **Logs** do serviço
2. Procure por mensagens de sucesso:
   ```
   ✅ Build completed successfully
   ✅ Service is live
   ```

3. Teste se o backend está respondendo:
   - Acesse: `https://uati-nexus-backend.onrender.com`
   - Deve retornar: `{"message":"UATI Nexus API",...}`

### 4. Inicializar o Banco de Dados (Após Deploy)

**Após o deploy completar, inicialize o banco:**

1. **Criar tabelas:**
   - Acesse: `https://uati-nexus-backend.onrender.com/api/setup-db`
   - Aguarde a resposta de sucesso

2. **Popular dados:**
   - Acesse: `https://uati-nexus-backend.onrender.com/api/init`
   - Aguarde a resposta de sucesso

## ⚠️ Importante

- **Não precisa fazer redeploy no Vercel** (a menos que tenha mudado algo no frontend)
- O redeploy no Render é suficiente para aplicar as mudanças no backend
- Após o deploy, sempre inicialize o banco chamando `/api/setup-db` e `/api/init`

## 🔍 Troubleshooting

### Deploy falhou

1. Verifique os **Logs** no Render
2. Procure por erros de build
3. Verifique se todas as variáveis de ambiente estão configuradas

### Backend não está respondendo após deploy

1. Verifique se o serviço está **Live** (não pausado)
2. Verifique os logs para ver se há erros de inicialização
3. Verifique se `DATABASE_URL` está configurada corretamente

### Banco ainda está vazio após chamar /api/setup-db

1. Verifique os logs do Render para ver se há erros
2. Tente chamar `/api/setup-db` novamente
3. Se persistir, verifique a conexão com o banco de dados


