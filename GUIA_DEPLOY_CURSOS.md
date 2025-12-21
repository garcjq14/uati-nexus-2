# Guia de Deploy - Sistema de Múltiplos Cursos

Este guia explica como fazer o deploy das mudanças do sistema de múltiplos cursos no ambiente de produção.

## 📋 Pré-requisitos

1. Ter acesso ao Render (backend)
2. Ter acesso ao Vercel (frontend)
3. Ter acesso ao banco de dados PostgreSQL

## 🔄 Passo a Passo

### 1. Preparar o Código Local

Certifique-se de que todas as mudanças estão commitadas:

```bash
# Verificar status
git status

# Adicionar todas as mudanças
git add .

# Commit (se ainda não fez)
git commit -m "feat: adicionar suporte a múltiplos cursos"

# Push para o repositório
git push origin main
```

### 2. Deploy do Backend (Render)

O Render detecta automaticamente mudanças no repositório, mas você pode forçar um novo deploy:

#### Opção A: Deploy Automático (Recomendado)
1. Acesse o [Render Dashboard](https://dashboard.render.com)
2. Vá para o serviço do backend (`uati-nexus-backend`)
3. O Render deve detectar automaticamente o novo commit e iniciar um deploy
4. Se não iniciar automaticamente, clique em **"Manual Deploy"** → **"Deploy latest commit"**

#### Opção B: Deploy Manual via CLI
```bash
# Instalar Render CLI (se ainda não tiver)
npm install -g render-cli

# Fazer login
render login

# Fazer deploy
render deploy
```

#### ⚠️ IMPORTANTE: Aplicar Migration no Banco de Dados

A migration será aplicada **automaticamente** durante o build do Render através do comando `npx prisma migrate deploy` no `render.yaml`.

**Se a migration automática falhar**, você pode usar o endpoint de setup como fallback:

**Opção 1: Via Endpoint de Setup (Recomendado se migration falhar)**
1. Acesse: `https://seu-backend.onrender.com/api/setup-db`
2. Isso criará/atualizará todas as tabelas necessárias, incluindo a tabela `courses` e as colunas `courseId`
3. O endpoint é idempotente (pode ser chamado múltiplas vezes sem problemas)

**Opção 2: Verificar se funcionou**
Após o deploy, teste se a rota de cursos funciona:
```bash
GET https://seu-backend.onrender.com/api/courses
```
Deve retornar uma lista (mesmo que vazia `[]`).

### 3. Deploy do Frontend (Vercel)

O Vercel também detecta mudanças automaticamente:

#### Opção A: Deploy Automático (Recomendado)
1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá para o projeto do frontend
3. O Vercel deve detectar automaticamente o novo commit
4. Se não iniciar, clique em **"Redeploy"** → **"Redeploy"**

#### Opção B: Deploy Manual via CLI
```bash
# Instalar Vercel CLI (se ainda não tiver)
npm install -g vercel

# Fazer login
vercel login

# Fazer deploy
cd frontend
vercel --prod
```

### 4. Verificar o Deploy

Após ambos os deploys:

1. **Backend:**
   - Verifique os logs no Render para garantir que não há erros
   - Teste a rota: `GET https://seu-backend.onrender.com/api/courses`
   - Deve retornar uma lista vazia `[]` ou os cursos existentes

2. **Frontend:**
   - Acesse a aplicação no Vercel
   - Faça login
   - Verifique se o seletor de cursos aparece no Dashboard
   - Tente criar um novo curso

### 5. Migração de Dados Existentes (Opcional)

Se você já tem dados no banco de produção e quer associá-los a um curso:

1. **Criar um curso padrão via API:**
```bash
POST https://seu-backend.onrender.com/api/courses
{
  "title": "Meu Curso Principal",
  "description": "Curso padrão"
}
```

2. **Associar dados existentes ao curso:**
   - Você pode fazer isso via SQL direto no banco ou criar um script de migração
   - Exemplo SQL:
```sql
-- Obter o ID do curso criado
SELECT id FROM courses WHERE title = 'Meu Curso Principal';

-- Atualizar curriculum
UPDATE curriculum SET "courseId" = 'ID_DO_CURSO' WHERE "courseId" IS NULL;

-- Atualizar projects
UPDATE projects SET "courseId" = 'ID_DO_CURSO' WHERE "courseId" IS NULL;

-- Atualizar flashcards
UPDATE flashcards SET "courseId" = 'ID_DO_CURSO' WHERE "courseId" IS NULL;

-- Atualizar resources
UPDATE resources SET "courseId" = 'ID_DO_CURSO' WHERE "courseId" IS NULL;

-- Atualizar knowledge_nodes
UPDATE knowledge_nodes SET "courseId" = 'ID_DO_CURSO' WHERE "courseId" IS NULL;

-- Atualizar usuário para ter o curso como atual
UPDATE users SET "currentCourseId" = 'ID_DO_CURSO' WHERE "currentCourseId" IS NULL;
```

## 🔍 Troubleshooting

### Erro: "Table 'courses' does not exist"
- **Solução:** Execute `npx prisma migrate deploy` no Render Shell

### Erro: "Foreign key constraint failed"
- **Solução:** Verifique se a migration foi aplicada corretamente. Use `npx prisma db push` como alternativa.

### Frontend não carrega cursos
- **Solução:** 
  1. Verifique se a variável de ambiente `VITE_API_URL` está configurada no Vercel
  2. Verifique os logs do console do navegador
  3. Verifique se o backend está respondendo em `/api/courses`

### Cursos não aparecem no seletor
- **Solução:**
  1. Verifique se você está logado
  2. Crie um curso primeiro via o modal no Dashboard
  3. Verifique os logs do backend para erros

## 📝 Checklist de Deploy

- [ ] Código commitado e enviado para o repositório
- [ ] Backend deployado no Render
- [ ] Migration aplicada no banco de dados (`npx prisma migrate deploy`)
- [ ] Frontend deployado no Vercel
- [ ] Testado criação de curso
- [ ] Testado troca de curso
- [ ] Verificado que dados são filtrados por curso
- [ ] Dados existentes migrados (se aplicável)

## 🚀 Comandos Rápidos

```bash
# 1. Commit e push
git add .
git commit -m "feat: múltiplos cursos"
git push origin main

# 2. No Render Shell (após deploy)
cd backend
npx prisma migrate deploy

# 3. Verificar logs
# Render: Dashboard → Service → Logs
# Vercel: Dashboard → Project → Deployments → View Function Logs
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Render e Vercel
2. Verifique o console do navegador
3. Teste as rotas da API diretamente
4. Verifique se todas as variáveis de ambiente estão configuradas

