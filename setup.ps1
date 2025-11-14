# -----------------------------------------------------------------
# --- PASSO 1, 2, 3: PYTHON (venv, pip, compile) ---
# -----------------------------------------------------------------
Write-Host "--- 1. Verificando/Criando ambiente virtual (venv) ---" -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    Write-Host "Criando venv..."
    python -m venv venv
} else {
    Write-Host "venv ja existe."
}

Write-Host ""
Write-Host "--- 2. Instalando dependencias Python (pip) ---" -ForegroundColor Yellow
.\venv\Scripts\pip.exe install -r requirements.txt

Write-Host ""
Write-Host "--- 3. Rodando compile.py ---" -ForegroundColor Yellow
.\venv\Scripts\python.exe compile.py

# -----------------------------------------------------------------
# --- PASSO 4: VERIFICACAO DO NODE.JS (NPM) ---
# -----------------------------------------------------------------
Write-Host ""
Write-Host "--- 4. Verificando se o Node.js (npm) esta instalado ---" -ForegroundColor Cyan

# Tenta encontrar o comando 'npm'. -ErrorAction SilentlyContinue impede um erro vermelho
$npmEncontrado = Get-Command npm -ErrorAction SilentlyContinue

if ($npmEncontrado) {
    Write-Host "Node.js (npm) ja esta instalado. Continuando..." -ForegroundColor Green
} else {
    Write-Host "Node.js (npm) NAO foi encontrado." -ForegroundColor Red
    $resposta = Read-Host "Deseja tentar instalar o Node.js LTS agora usando 'winget'? (S/N)"

    if ($resposta -match '^[Ss]$') { # Aceita 'S' ou 's'
        
        # Verifica se o 'winget' (gerenciador de pacotes do Windows) existe
        $wingetEncontrado = Get-Command winget -ErrorAction SilentlyContinue
        
        if ($wingetEncontrado) {
            Write-Host "Iniciando instalacao do Node.js LTS via winget..."
            Write-Host "Isso pode demorar alguns minutos e pode abrir janelas de permissao (UAC)."
            
            try {
                # O comando para instalar o Node.js (versao LTS)
                winget install --id OpenJS.NodeJS.LTS --source winget
                
                Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
                Write-Host "INSTALACAO CONCLUIDA!" -ForegroundColor Green
                Write-Host "POR FAVOR, FECHE ESTE TERMINAL AGORA."
                Write-Host "Abra um NOVO terminal PowerShell e rode o script novamente:"
                Write-Host "  . .\iniciar.ps1"
                Write-Host "--------------------------------------------------------"
                
                # PARA o script aqui. É OBRIGATÓRIO.
                return
                
            } catch {
                Write-Host "Falha na instalacao via winget. $_" -ForegroundColor Red
                Write-Host "Tente instalar manualmente em: https://nodejs.org/"
                Write-Host "O script sera encerrado."
                return
            }
        } else {
            Write-Host "Comando 'winget' nao encontrado." -ForegroundColor Red
            Write-Host "Nao e possivel instalar automaticamente o Node.js."
            Write-Host "Por favor, baixe e instale o Node.js LTS manualmente em:"
            Write-Host "  https://nodejs.org/"
            Write-Host "Depois da instalacao, feche e reabra o terminal e rode este script novamente."
            return
        }
    } else {
        Write-Host "Instalacao do Node.js pulada." -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------------
# --- PASSO 5: INSTALAR PACOTES NPM (AGORA QUE O NPM EXISTE) ---
# -----------------------------------------------------------------
# Esta secao so sera executada se o 'npm' foi encontrado (seja de antes
# ou porque o usuario re-executou o script apos a instalacao).

if ($npmEncontrado) {
    Write-Host ""
    Write-Host "--- 5. Instalando dependencias Node.js (npm) ---" -ForegroundColor Cyan
    Write-Host "Executando: npm install paillier-bigint vite"
    npm install paillier-bigint vite
} else {
    Write-Host ""
    Write-Host "--- 5. Pulando instalacao de dependencias Node.js (npm nao encontrado) ---" -ForegroundColor Yellow
}

# -----------------------------------------------------------------
# --- PASSO 6: ATIVAR O AMBIENTE PYTHON ---
# -----------------------------------------------------------------
Write-Host ""
Write-Host "--- SUCESSO! Setup completo. ---" -ForegroundColor Green
Write-Host "Ativando o ambiente virtual (venv)..."
.\venv\Scripts\Activate.ps1

Write-Host "Ambiente (venv) ativado! Voce esta pronto." -ForegroundColor Green

Write-Host "Rodando o FRON-END." -ForegroundColor Green

npx vite