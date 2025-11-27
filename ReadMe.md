## 🔐 Configuração de Autenticação (Google Auth)

Para rodar este projeto localmente e utilizar o login com Google, é necessário criar um projeto no **Google Cloud Platform (GCP)** e obter as credenciais de OAuth.

### Passo a Passo

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto (ou selecione um existente).
3. No menu lateral, vá em **APIs e Serviços** > **Tela de consentimento OAuth**.
    * Escolha **Externo** (ou Interno se tiver uma organização).
    * Preencha as informações obrigatórias (Nome do App, e-mail de suporte).
4. No menu lateral, vá em **Credenciais**.
5. Clique em **+ CRIAR CREDENCIAIS** e selecione **ID do cliente OAuth**.
6. Em "Tipo de aplicativo", selecione **Aplicativo da Web**. 
7. **Importante:** Na seção **URIs de redirecionamento autorizados**, adicione a URL de callback do seu ambiente local.
    * *Exemplo:* `http://localhost:5000`
8. Clique em **Criar**.
9. Coloque a key do google (.json) dentro do projeto.

### Configurando as Variáveis de Ambiente

Ao finalizar a criação, você receberá um **ID do Cliente** e uma **Chave Secreta do Cliente**. Adicione essas chaves no seu arquivo `.env`:

```env
# Google Auth
CLIENT_SECRETS_FILE=./caminho/para/seu_client_secrets.json

# Contratos e Blockchain
CONTRACT_JSON_PATH=contract.json
RPC_URL=https://... (Sua URL RPC, ex: Alchemy ou Infura)

# Relayer (Carteira/Transações)
RELAYER_PRIVATE_KEY=sua_chave_privada_aqui
_RELAYER_ADDRESS_RAW=endereco_da_carteira_relayer
```

### ⚙️ Configuração Automática (Setup)

Para finalizar a configuração do ambiente, é **obrigatório** executar o script `setup.ps1` localizado na raiz do projeto.

Abra o terminal na pasta do projeto e execute:

```powershell
./setup.ps1
```

Após isto, abra um novo terminal dentro do VSCode e digite:
```python
python app.py
```

> 🎓 **Restrição de Acesso:**
> Como este sistema utiliza a autenticação do Google, **apenas alunos ativos do curso** têm permissão para interagir com as votações. Usuários sem o e-mail institucional ou não matriculados não conseguirão computar votos.

### ✅ Tudo pronto!
Se as variáveis estiverem corretas e o script rodar sem erros, o servidor estará disponível. Acesse o projeto em: http://localhost:5174