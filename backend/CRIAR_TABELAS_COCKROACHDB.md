# Guia para Criar Tabelas no CockroachDB

Este guia explica como criar todas as tabelas no banco de dados CockroachDB.

## 📋 Pré-requisitos

1. ✅ Cluster CockroachDB criado (Cloud ou Self-hosted)
2. ✅ String de conexão do CockroachDB
3. ✅ Node.js e npm instalados

## 🔧 Passo 1: Configurar a String de Conexão

### 1.1. Obter a String de Conexão do CockroachDB

1. Acesse o [CockroachDB Cloud](https://cockroachlabs.cloud/)
2. Vá em **Connect** no seu cluster
3. Selecione **Connection string**
4. Copie a string de conexão

A string deve ter o formato:
```
postgresql://usuario:senha@host:port/defaultdb?sslmode=require
```

### 1.2. Criar arquivo `.env` no diretório `backend`

Crie um arquivo `.env` na pasta `backend` com o seguinte conteúdo:

```env
DATABASE_URL="postgresql://usuario:senha@host:port/defaultdb?sslmode=require&schema=public"
JWT_SECRET="sua-chave-secreta-jwt-aqui"
PORT=3001
NODE_ENV=development
```

**⚠️ IMPORTANTE**: 
- Substitua `usuario`, `senha`, `host` e `port` pelos valores reais do seu CockroachDB
- Adicione `&schema=public` no final da URL
- Mantenha `?sslmode=require` (obrigatório para CockroachDB)

## 🚀 Passo 2: Criar as Tabelas

Existem duas formas de criar as tabelas:

### Opção A: Usando Prisma Migrate (Recomendado)

```bash
cd backend
npx prisma migrate deploy
```

Este comando aplicará todas as migrações existentes e criará todas as tabelas.

### Opção B: Usando Prisma DB Push (Desenvolvimento)

```bash
cd backend
npx prisma db push
```

Este comando sincroniza o schema diretamente com o banco (útil para desenvolvimento).

### Opção C: Usando o Endpoint HTTP (Alternativa)

Se o servidor estiver rodando, você pode chamar:

```bash
curl https://seu-backend.com/api/setup-db
```

Ou acesse no navegador: `https://seu-backend.com/api/setup-db`

## ✅ Passo 3: Verificar se as Tabelas Foram Criadas

### 3.1. Usando Prisma Studio

```bash
cd backend
npx prisma studio
```

Isso abrirá uma interface web onde você pode visualizar todas as tabelas.

### 3.2. Usando SQL direto

Conecte-se ao CockroachDB e execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver as seguintes tabelas:
- users
- courses
- curriculum
- topics
- notes
- projects
- milestones
- tasks
- flashcards
- resources
- resource_annotations
- diary_entries
- knowledge_nodes
- node_connections
- study_sessions
- activities
- notifications
- weekly_schedules
- manual_competencies

## 🔍 Troubleshooting

### Erro: "Environment variable not found: DATABASE_URL"

**Solução**: Certifique-se de que o arquivo `.env` existe na pasta `backend` e contém a variável `DATABASE_URL`.

### Erro: "Connection refused" ou "SSL required"

**Solução**: 
- Verifique se a string de conexão contém `?sslmode=require`
- Verifique se o host e porta estão corretos
- Verifique se o cluster CockroachDB está ativo

### Erro: "relation already exists"

**Solução**: As tabelas já existem. Isso é normal se você já executou o comando antes. Se quiser recriar, use:

```bash
npx prisma migrate reset
```

⚠️ **ATENÇÃO**: `migrate reset` apaga todos os dados!

## 📝 Próximos Passos

Após criar as tabelas:

1. **Popular dados iniciais** (opcional):
   ```bash
   npm run prisma:seed
   ```

2. **Iniciar o servidor**:
   ```bash
   npm run dev
   ```

3. **Criar usuário inicial** (se necessário):
   Acesse `/api/init` ou use o endpoint de registro.

## 📚 Recursos Adicionais

- [Documentação CockroachDB](https://www.cockroachlabs.com/docs/)
- [Prisma + CockroachDB](https://www.prisma.io/docs/concepts/database-connectors/cockroachdb)
- [Guia de Migração Completo](./MIGRACAO_COCKROACHDB.md)





