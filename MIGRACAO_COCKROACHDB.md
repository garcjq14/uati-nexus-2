# Guia de Migração para CockroachDB

Este documento contém todas as instruções necessárias para migrar o banco de dados do projeto UATI Nexus de PostgreSQL para CockroachDB.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do CockroachDB](#configuração-do-cockroachdb)
3. [Atualização do Schema Prisma](#atualização-do-schema-prisma)
4. [Migração dos Dados](#migração-dos-dados)
5. [Ajustes no Código](#ajustes-no-código)
6. [Testes e Validação](#testes-e-validação)
7. [Rollback (se necessário)](#rollback-se-necessário)

---

## 1. Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Conta no CockroachDB (Cloud ou Self-hosted)
- ✅ Acesso ao banco de dados PostgreSQL atual
- ✅ Backup completo do banco de dados atual
- ✅ Node.js e npm instalados
- ✅ Prisma CLI instalado globalmente (`npm install -g prisma`)

---

## 2. Configuração do CockroachDB

### 2.1. Criar Cluster no CockroachDB Cloud

1. Acesse [CockroachDB Cloud](https://cockroachlabs.cloud/)
2. Crie uma conta ou faça login
3. Crie um novo cluster:
   - Escolha a região mais próxima dos seus usuários
   - Selecione o plano apropriado (Free tier disponível para testes)
   - Configure o nome do cluster

### 2.2. Obter String de Conexão

1. No dashboard do CockroachDB, vá em **Connect**
2. Selecione **Connection string**
3. Copie a string de conexão que será algo como:
   ```
   postgresql://usuario:senha@host:port/defaultdb?sslmode=require
   ```
4. **IMPORTANTE**: Adicione `?sslmode=require` se não estiver presente

### 2.3. Configurar Variáveis de Ambiente

Atualize o arquivo `.env` (ou variáveis de ambiente no seu provedor de hosting):

```env
# Antes (PostgreSQL)
# DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# Depois (CockroachDB)
DATABASE_URL="postgresql://usuario:senha@host:port/defaultdb?sslmode=require&schema=public"
```

**Nota**: CockroachDB usa o protocolo PostgreSQL, então a string de conexão é similar, mas sempre requer SSL.

---

## 3. Atualização do Schema Prisma

### 3.1. Schema já Atualizado

O arquivo `backend/prisma/schema.prisma` já foi atualizado para usar `cockroachdb` como provider:

```prisma
datasource db {
  provider = "cockroachdb"
  url      = env("DATABASE_URL")
}
```

### 3.2. Gerar Prisma Client

Execute os seguintes comandos:

```bash
cd backend
npm install
npx prisma generate
```

Isso irá gerar o Prisma Client compatível com CockroachDB.

---

## 4. Migração dos Dados

### 4.1. Fazer Backup do Banco Atual

**CRÍTICO**: Antes de qualquer migração, faça um backup completo!

```bash
# Backup do PostgreSQL atual
pg_dump -h localhost -U usuario -d database > backup.sql
```

Ou use a ferramenta de backup do seu provedor (Render, Heroku, etc.).

### 4.2. Criar Estrutura no CockroachDB

#### Opção A: Usando Prisma Migrate (Recomendado)

```bash
cd backend

# Resetar o banco (CUIDADO: isso apaga todos os dados!)
# Use apenas se for um banco novo/vazio
npx prisma migrate reset

# Ou criar uma nova migration
npx prisma migrate dev --name init_cockroachdb
```

#### Opção B: Usando o Endpoint /api/setup-db

1. Configure a `DATABASE_URL` apontando para o CockroachDB
2. Acesse: `https://seu-backend.com/api/setup-db`
3. Isso criará todas as tabelas necessárias

### 4.3. Migrar Dados (se necessário)

Se você já tem dados no PostgreSQL e precisa migrá-los:

#### Método 1: Usando pg_dump e psql

```bash
# Exportar dados do PostgreSQL (sem estrutura)
pg_dump -h localhost -U usuario -d database --data-only --column-inserts > data.sql

# Importar no CockroachDB
psql "postgresql://usuario:senha@host:port/defaultdb?sslmode=require" < data.sql
```

#### Método 2: Usando Script de Migração Personalizado

Crie um script Node.js para migrar dados específicos:

```javascript
// migrate-data.js
const { PrismaClient: PrismaPostgres } = require('@prisma/client');
const { PrismaClient: PrismaCockroach } = require('@prisma/client');

const postgres = new PrismaPostgres({
  datasources: { db: { url: process.env.POSTGRES_URL } }
});

const cockroach = new PrismaCockroach({
  datasources: { db: { url: process.env.COCKROACH_URL } }
});

async function migrate() {
  // Migrar usuários
  const users = await postgres.user.findMany();
  for (const user of users) {
    await cockroach.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }
  
  // Repetir para outras tabelas...
  
  await postgres.$disconnect();
  await cockroach.$disconnect();
}

migrate();
```

---

## 5. Ajustes no Código

### 5.1. Queries SQL Específicas do PostgreSQL

O código contém alguns blocos `DO $$` que são específicos do PostgreSQL. CockroachDB suporta a maioria, mas pode haver diferenças sutis.

#### Arquivos que podem precisar de ajustes:

- `backend/src/routes/setup-db.ts` - Contém blocos `DO $$`
- `backend/src/routes/migrate.ts` - Usa `information_schema`
- `backend/src/routes/init.ts` - Usa `information_schema`

**Status**: As queries atuais devem funcionar, mas teste cuidadosamente.

#### Sobre Blocos DO $$ no CockroachDB

CockroachDB suporta blocos `DO $$`, mas com algumas diferenças:

1. **Sintaxe**: A sintaxe básica é a mesma: `DO $$ BEGIN ... END $$;`
2. **Linguagem**: CockroachDB usa PL/pgSQL por padrão (similar ao PostgreSQL)
3. **Fallback**: O código já possui fallback para quando `DO $$` falha, usando comandos SQL diretos

**Se encontrar erros com blocos DO $$**, você pode substituir por queries diretas:

```sql
-- Em vez de:
DO $$
BEGIN
  IF NOT EXISTS (...) THEN
    ALTER TABLE ...;
  END IF;
END $$;

-- Use:
-- Verificar primeiro em JavaScript/TypeScript
const exists = await prisma.$queryRaw`SELECT ...`;
if (!exists) {
  await prisma.$executeRawUnsafe(`ALTER TABLE ...`);
}
```

**Nota**: O código atual já tem tratamento de erros e fallbacks, então deve funcionar sem modificações na maioria dos casos.

### 5.2. Diferenças Importantes

| PostgreSQL | CockroachDB | Status |
|------------|-------------|--------|
| `DO $$ ... END $$;` | Suportado | ✅ Funciona |
| `information_schema` | Suportado | ✅ Funciona |
| `TIMESTAMP(3)` | Suportado | ✅ Funciona |
| `TEXT` | Suportado | ✅ Funciona |
| `CURRENT_TIMESTAMP` | Suportado | ✅ Funciona |

### 5.3. Verificar Conexões

Após a migração, verifique se todas as rotas estão funcionando:

```bash
# Testar conexão
curl https://seu-backend.com/api/health

# Testar setup
curl https://seu-backend.com/api/setup-db

# Testar init
curl https://seu-backend.com/api/init
```

---

## 6. Testes e Validação

### 6.1. Checklist de Testes

Execute os seguintes testes após a migração:

- [ ] Conexão com banco de dados estabelecida
- [ ] Todas as tabelas criadas corretamente
- [ ] CRUD de usuários funcionando
- [ ] CRUD de cursos funcionando
- [ ] CRUD de projetos funcionando
- [ ] CRUD de notas funcionando
- [ ] CRUD de flashcards funcionando
- [ ] Relacionamentos entre tabelas funcionando
- [ ] Queries complexas funcionando
- [ ] Transações funcionando
- [ ] Índices criados corretamente

### 6.2. Testar Endpoints Principais

```bash
# Autenticação
curl -X POST https://seu-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alexandre@uati.com","password":"password123"}'

# Listar cursos
curl https://seu-backend.com/api/courses \
  -H "Authorization: Bearer SEU_TOKEN"

# Criar projeto
curl -X POST https://seu-backend.com/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"title":"Teste","description":"Projeto de teste"}'
```

### 6.3. Monitorar Performance

- Verifique os logs do CockroachDB Cloud
- Monitore latência de queries
- Verifique uso de recursos (CPU, memória, storage)

---

## 7. Rollback (se necessário)

Se algo der errado, você pode voltar ao PostgreSQL:

### 7.1. Reverter Schema Prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 7.2. Restaurar Backup

```bash
# Restaurar backup do PostgreSQL
psql -h localhost -U usuario -d database < backup.sql
```

### 7.3. Atualizar Variáveis de Ambiente

Reverter a `DATABASE_URL` para o PostgreSQL original.

---

## 8. Diferenças e Considerações

### 8.1. Limitações do CockroachDB

- **Transações**: CockroachDB usa transações distribuídas, pode haver latência adicional
- **Joins Complexos**: Alguns joins muito complexos podem ser mais lentos
- **Funções Personalizadas**: Algumas funções PostgreSQL podem não estar disponíveis

### 8.2. Vantagens do CockroachDB

- ✅ Escalabilidade horizontal automática
- ✅ Alta disponibilidade (99.99% SLA)
- ✅ Backups automáticos
- ✅ Multi-região (redução de latência)
- ✅ Compatibilidade com PostgreSQL

### 8.3. Custos

- **Free Tier**: 50GB de storage, 1 vCPU, 2GB RAM
- **Paid Plans**: A partir de $25/mês
- Verifique os preços atualizados em: https://www.cockroachlabs.com/pricing/

---

## 9. Próximos Passos

Após a migração bem-sucedida:

1. ✅ Monitorar logs e performance por alguns dias
2. ✅ Configurar alertas no CockroachDB Cloud
3. ✅ Documentar qualquer ajuste necessário
4. ✅ Atualizar documentação do projeto
5. ✅ Considerar configuração multi-região se necessário

---

## 10. Suporte e Recursos

- **Documentação CockroachDB**: https://www.cockroachlabs.com/docs/
- **Prisma + CockroachDB**: https://www.prisma.io/docs/concepts/database-connectors/cockroachdb
- **CockroachDB Community**: https://www.cockroachlabs.com/community/

---

## 11. Checklist Final

Antes de considerar a migração completa:

- [ ] Backup do PostgreSQL criado e testado
- [ ] Cluster CockroachDB criado e configurado
- [ ] `DATABASE_URL` atualizada
- [ ] Schema Prisma atualizado (`cockroachdb` provider)
- [ ] `npx prisma generate` executado
- [ ] Estrutura de tabelas criada no CockroachDB
- [ ] Dados migrados (se aplicável)
- [ ] Todos os testes passando
- [ ] Performance aceitável
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

---

## ⚠️ IMPORTANTE

1. **SEMPRE faça backup antes de migrar**
2. **Teste em ambiente de desenvolvimento primeiro**
3. **Mantenha o PostgreSQL original até confirmar que tudo funciona**
4. **Monitore logs e performance após a migração**
5. **Tenha um plano de rollback pronto**

---

**Data da Migração**: _______________

**Responsável**: _______________

**Status**: ⬜ Pendente | ⬜ Em Progresso | ⬜ Concluído | ⬜ Rollback

