# Script PowerShell para criar tabelas no CockroachDB
# Uso: .\criar-tabelas.ps1

Write-Host "Criando tabelas no CockroachDB..." -ForegroundColor Cyan

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "Arquivo .env nao encontrado!" -ForegroundColor Red
    Write-Host "Por favor, crie um arquivo .env com a seguinte configuracao:" -ForegroundColor Yellow
    Write-Host ""
    $dbUrl = 'DATABASE_URL="postgresql://usuario:senha@host:port/defaultdb?sslmode=require&schema=public"'
    Write-Host $dbUrl -ForegroundColor Gray
    Write-Host 'JWT_SECRET="sua-chave-secreta-jwt"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Consulte o arquivo CRIAR_TABELAS_COCKROACHDB.md para mais detalhes." -ForegroundColor Yellow
    exit 1
}

# Verificar se DATABASE_URL está configurada e no formato correto
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "DATABASE_URL") {
    Write-Host "DATABASE_URL nao encontrada no arquivo .env!" -ForegroundColor Red
    exit 1
}

# Verificar se DATABASE_URL não está vazia ou comentada
$dbUrlLine = Get-Content ".env" | Where-Object { $_ -match '^DATABASE_URL\s*=' -and $_ -notmatch '^\s*#' }
if (-not $dbUrlLine) {
    Write-Host "DATABASE_URL encontrada mas parece estar vazia ou comentada!" -ForegroundColor Red
    Write-Host "Certifique-se de que a linha DATABASE_URL nao comeca com #" -ForegroundColor Yellow
    exit 1
}

Write-Host "Arquivo .env encontrado" -ForegroundColor Green

# Carregar variáveis de ambiente do arquivo .env
Write-Host ""
Write-Host "Carregando variaveis de ambiente..." -ForegroundColor Cyan
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Remover aspas se existirem
        if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") {
            $value = $matches[1]
        }
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Verificar se DATABASE_URL foi carregada
if (-not $env:DATABASE_URL) {
    Write-Host "ERRO: DATABASE_URL nao foi carregada do arquivo .env!" -ForegroundColor Red
    Write-Host "Verifique se o arquivo .env contem DATABASE_URL no formato correto." -ForegroundColor Yellow
    exit 1
}

Write-Host "Variaveis de ambiente carregadas" -ForegroundColor Green

# Extrair DATABASE_URL do arquivo .env para passar diretamente
$databaseUrl = $null
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*DATABASE_URL\s*=\s*(.+)$' -and $_ -notmatch '^\s*#') {
        $databaseUrl = $matches[1].Trim()
        # Remover aspas se existirem
        if ($databaseUrl -match '^"(.*)"$' -or $databaseUrl -match "^'(.*)'$") {
            $databaseUrl = $matches[1]
        }
    }
}

if (-not $databaseUrl) {
    Write-Host "ERRO: Nao foi possivel extrair DATABASE_URL do arquivo .env!" -ForegroundColor Red
    exit 1
}

# Mostrar parte da URL para debug (mascarando senha)
$urlForDisplay = $databaseUrl -replace '://([^:]+):([^@]+)@', '://$1:***@'
Write-Host "DATABASE_URL encontrada: $urlForDisplay" -ForegroundColor Green

# Gerar Prisma Client
Write-Host ""
Write-Host "Gerando Prisma Client..." -ForegroundColor Cyan
# Definir variável de ambiente explicitamente
$env:DATABASE_URL = $databaseUrl
$result = & npx prisma generate 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao gerar Prisma Client" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

Write-Host "Prisma Client gerado com sucesso" -ForegroundColor Green

# Aplicar migrações
Write-Host ""
Write-Host "Aplicando migracoes..." -ForegroundColor Cyan
# Garantir que DATABASE_URL está definida antes de executar
$env:DATABASE_URL = $databaseUrl
$result = & npx prisma migrate deploy 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao aplicar migracoes com migrate deploy" -ForegroundColor Yellow
    Write-Host "Tentando alternativa: prisma db push..." -ForegroundColor Yellow
    $env:DATABASE_URL = $databaseUrl
    $result = & npx prisma db push --accept-data-loss 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao aplicar migracoes:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "Verifique:" -ForegroundColor Yellow
        Write-Host "  1. Se a DATABASE_URL esta correta no arquivo .env" -ForegroundColor Gray
        Write-Host "  2. Se o banco de dados esta acessivel" -ForegroundColor Gray
        Write-Host "  3. Se as credenciais estao corretas" -ForegroundColor Gray
        exit 1
    } else {
        Write-Host "Tabelas criadas usando db push" -ForegroundColor Green
    }
} else {
    Write-Host "Migracoes aplicadas com sucesso" -ForegroundColor Green
}

Write-Host ""
Write-Host "Tabelas criadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verificar tabelas: npx prisma studio" -ForegroundColor Gray
Write-Host "   2. Popular dados iniciais: npm run prisma:seed" -ForegroundColor Gray
Write-Host "   3. Iniciar servidor: npm run dev" -ForegroundColor Gray

