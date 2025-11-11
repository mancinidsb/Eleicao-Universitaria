from flask import Flask, request, jsonify, abort, redirect, url_for, session
from flask_cors import CORS
import json
import os
import hashlib
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_
from typing import Tuple, List, Dict
from web3 import Web3
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from unidecode import unidecode
from datetime import datetime
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
# Permite que o frontend (porta 8000 ou 5500) envie cookies
# CORS(app, supports_credentials=True, origins=["http://127.0.0.1:8000", "http://localhost:8000", "http://127.0.0.1:5500", "http://localhost:5500"])

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

CORS(app,
    supports_credentials=True,
    resources={r"/*": {"origins": [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ]}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)



app.secret_key = 'chave-secreta-muito-segura-trocar-depois' 

app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True
)

# --- CONFIGURAÇÃO WEB3 E DO RELAYER (MESTRE) ---
RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/8FaeERMnNWGASM_ePLx7I"
_RELAYER_ADDRESS_RAW = "0x21dcfc33545acecf7bffa27b33261deeb6667622" 
RELAYER_PRIVATE_KEY = "4910711ef868cdbeee8ff20ef7787b4402f609ba1c03f9b05db4c97cb396b53d"

CONTRACT_JSON_PATH = 'contract.json'
if not os.path.exists(CONTRACT_JSON_PATH):
    print("ERRO: contract.json não encontrado.")
    exit()
with open(CONTRACT_JSON_PATH, 'r') as f:
    contract_data = json.load(f)
    CONTRACT_ABI = contract_data.get('abi')
    CONTRACT_BYTECODE = contract_data.get('bytecode')
    if not CONTRACT_ABI or not CONTRACT_BYTECODE:
        print("ERRO: ABI ou Bytecode não encontrado em contract.json")
        exit()

web3 = Web3(Web3.HTTPProvider(RPC_URL))
RELAYER_ADDRESS = web3.to_checksum_address(_RELAYER_ADDRESS_RAW)
if not web3.is_connected():
    print(f"ERRO: Falha ao conectar ao nó Ethereum em {RPC_URL}")
    exit()
else:
    print(f"Conectado ao nó Ethereum (Chain ID: {web3.eth.chain_id})")

# --- Configuração do Google OAuth ---
CLIENT_SECRETS_FILE = "client_secret.json"
if not os.path.exists(CLIENT_SECRETS_FILE):
    print(f"ERRO: {CLIENT_SECRETS_FILE} não encontrado.")
    exit()
with open(CLIENT_SECRETS_FILE, 'r') as f:
    GOOGLE_CLIENT_ID = json.load(f)['web']['client_id']
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
SCOPES = ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

# --- Configuração do Banco de Dados SQLite ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'votacoes.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Modelos do Banco de Dados (ATUALIZADOS) ---
class Votacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    campus = db.Column(db.String(100), nullable=False)
    curso = db.Column(db.String(100), nullable=False)
    sigaa_link = db.Column(db.String(255), nullable=False)
    # A carteira do Proponente que pagou o deploy
    admin_wallet_proponente = db.Column(db.String(42), nullable=True) 
    contract_address = db.Column(db.String(42), nullable=False, unique=True)
    
    # ATENÇÃO: O `Voting.sol` que você enviou não tem 'data_inicio_chapa' (começa em Inscricao)
    # Vou remover 'data_inicio_chapa' para bater com o contrato
    data_inicio_chapa = db.Column(db.DateTime, nullable=False)
    data_fim_chapa = db.Column(db.DateTime, nullable=False)
    data_inicio_votacao = db.Column(db.DateTime, nullable=False)
    data_fim_votacao = db.Column(db.DateTime, nullable=False)
    
    chapas = db.relationship('Chapa', backref='votacao', lazy=True, cascade="all, delete-orphan")

class Chapa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome_chapa = db.Column(db.String(100), nullable=False)
    proposta = db.Column(db.Text, nullable=False)
    numero_chapa = db.Column(db.Integer, nullable=False) 
    votacao_id = db.Column(db.Integer, db.ForeignKey('votacao.id'), nullable=False)

# --- Constante de Segredo ---
SEGREDO_ELEICAO = "ufpi-eleicao-2025.2"

# --- LÓGICA DA MERKLE TREE (Corrigida com web3.keccak) ---
def _get_nullifier(matricula: str) -> str:
    return web3.keccak(text=f"{matricula}-{SEGREDO_ELEICAO}").hex()
def _get_all_leaves(lista_de_matriculas: List[str]) -> List[str]:
    leaves = [_get_nullifier(m) for m in lista_de_matriculas]
    leaves.sort()
    return leaves
def _hash_pair(left: str, right: str) -> str:
    if left > right: left, right = right, left
    left_bytes = bytes.fromhex(left.replace("0x", ""))
    right_bytes = bytes.fromhex(right.replace("0x", ""))
    return web3.keccak(left_bytes + right_bytes).hex()
def _build_tree_levels(leaves: List[str]) -> List[List[str]]:
    if not leaves: return [[ web3.keccak(b"").hex() ]] if not leaves else [[]]
    levels = [leaves]
    current_level = leaves
    while len(current_level) > 1:
        new_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i+1] if (i+1) < len(current_level) else left
            parent_hash = _hash_pair(left, right)
            new_level.append(parent_hash)
        levels.append(new_level)
        current_level = new_level
    return levels
def _get_merkle_proof(leaf_hash: str, levels: List[List[str]]) -> List[str]:
    proof = []
    current_hash = leaf_hash
    for i in range(len(levels) - 1):
        current_level = levels[i]
        try: idx = current_level.index(current_hash)
        except ValueError: raise Exception("Erro de lógica: Folha não encontrada na árvore.")
        if idx % 2 == 0:
            sibling_idx = idx + 1
            sibling = current_level[sibling_idx] if sibling_idx < len(current_level) else current_hash
        else:
            sibling_idx = idx - 1
            sibling = current_level[sibling_idx]
        proof.append(f"0x{sibling.replace('0x','')}")
        left, right = (current_hash, sibling) if idx % 2 == 0 else (sibling, current_hash)
        current_hash = _hash_pair(left, right)
    root = levels[-1][0] if levels[-1] else web3.keccak(b"").hex()
    if current_hash != root: raise Exception("Falha ao construir a prova, a raiz não bate.")
    return proof
def get_contract_instance(contract_address: str):
    try:
        address = web3.to_checksum_address(contract_address)
        return web3.eth.contract(address=address, abi=CONTRACT_ABI)
    except Exception as e:
        print(f"Erro ao carregar contrato {contract_address}: {e}")
        return None

# --- Simulação de Scraping ---
def _simular_scraping_sigaa(sigaa_link: str) -> Dict[str, str]:
    print(f"Simulando scraping do link: {sigaa_link}")
    return {
        "20169004867": "ADAILTON SILVA PALHANO",
        "20229038498": "ALAN NUNES VELOSO NOGUEIRA",
        "20189016391": "ALAN VITOR BRITO AMORIM",
        "2019011094": "ALEXANDRE JOSE CANTUARIA MONTEIRO ROSA FILHO",
        "20229020690": "GUILHERME MANCINI DE SOUSA BARROSO",
    }
def normalize_name(name: str) -> str:
    if not name: return ""
    name = unidecode(name) # Remove acentos
    name = name.lower()   # Converte para minúsculas
    name = ' '.join(name.split()) # Remove espaços extras
    return name

# --- Rota 1 (Prepare Deploy) (Correta) ---
@app.route('/api/prepare-deploy', methods=['POST', 'OPTIONS'])
def prepare_deploy_info():
    if request.method == "OPTIONS": return '', 200
    data = request.json
    sigaa_link = data.get('sigaa_link')
    if not sigaa_link: abort(400, description="Link do SIGAA é obrigatório.")
    try:
        mapa_alunos = _simular_scraping_sigaa(sigaa_link)
        lista_de_matriculas = list(mapa_alunos.keys())
        leaves = _get_all_leaves(lista_de_matriculas)
        levels = _build_tree_levels(leaves)
        merkle_root = levels[-1][0] if levels[-1] else web3.keccak(b"").hex()
        merkle_root_hex = f"0x{merkle_root.replace('0x','')}"
        print(f"Merkle Root (Keccak256/Web3) gerada: {merkle_root_hex}")
        
        return jsonify(
            abi=CONTRACT_ABI, 
            bytecode=CONTRACT_BYTECODE,
            merkleRoot=merkle_root_hex,
            relayerAddress=RELAYER_ADDRESS # O endereço do Mestre
        )
    except Exception as e: 
        print(f"Erro ao preparar deploy: {e}")
        abort(500, description=f"Erro ao gerar Merkle Root: {e}")

# --- Rota 2 (Criar Votacao) (Correta) ---
@app.route('/api/criar-votacao', methods=['POST'])
def criar_votacao():
    data = request.json
    
    required_fields = [
        'sigaa_link', 'campus', 'curso','data_inicio_chapa',
        'data_fim_chapa', 'data_inicio_votacao', 'data_fim_votacao',
        'admin_wallet', 'contract_address'
    ]
    if not all(k in data for k in required_fields):
        abort(400, description="Dados incompletos recebidos.")
    
    try:
        data_inicio_chapa = datetime.fromisoformat(data['data_inicio_chapa'])
        data_fim_chapa = datetime.fromisoformat(data['data_fim_chapa'])
        data_inicio_votacao = datetime.fromisoformat(data['data_inicio_votacao'])
        data_fim_votacao = datetime.fromisoformat(data['data_fim_votacao'])

        # Validação de lógica de datas
        if not (data_fim_chapa < data_inicio_votacao < data_fim_votacao):
            abort(400, description="Lógica de datas inválida. (Fim-Chapa < Inicio-Voto < Fim-Voto)")

        nova_votacao = Votacao(
            campus=data['campus'], curso=data['curso'], sigaa_link=data['sigaa_link'],
            admin_wallet_proponente=data['admin_wallet'], # O Proponente
            contract_address=data['contract_address'],   # O Contrato
            data_inicio_chapa=data_inicio_chapa,
            data_fim_chapa=data_fim_chapa,
            data_inicio_votacao=data_inicio_votacao,
            data_fim_votacao=data_fim_votacao
        )
        db.session.add(nova_votacao)
        db.session.commit()
    
    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO SALVAR VOTAÇÃO: {e}")
        abort(500, description=f"Erro ao salvar a votação no banco: {e}")
    
    return jsonify(
        message="Votação salva com sucesso!",
        contract_address=data['contract_address']
    ), 201

# --- Rota 3 (Listar Votações) (Correta) ---
@app.route('/api/votacoes', methods=['GET'])
def get_votacoes():
    try:
        search_term = request.args.get('search', '') 
        query = Votacao.query
        if search_term:
            search_filter = f"%{search_term}%"
            query = query.filter(or_(Votacao.campus.ilike(search_filter), Votacao.curso.ilike(search_filter), Votacao.admin_wallet_proponente.ilike(search_filter)))
        
        votacoes_db = query.order_by(Votacao.id.desc()).all()
        resultado_final = []
        
        for votacao in votacoes_db:
            estado_contrato_int = -1
            estado_contrato_str = "Erro ao ler contrato"
            agora = datetime.now()
            
            try:
                contrato_instance = get_contract_instance(votacao.contract_address)
                if contrato_instance:
                    estado_contrato_int = contrato_instance.functions.estadoAtual().call() 
                    
                    # LÓGICA DE VERIFICAÇÃO DE DATA (OFF-CHAIN)
                    if estado_contrato_int == 0: # 0 = Inscricao
                        if agora < votacao.data_inicio_chapa:
                            estado_contrato_str = "Aguardando Inscrição"


                            # estado_contrato_str = "Votação Aberta"
                        else:
                            estado_contrato_str = "Inscrição Aberta"

                            # estado_contrato_int=1
                            # contrato_instance.functions.iniciarInscricao().call()

                            # tx_hash = contrato_instance.functions.iniciarInscricao().transact({
                            #     'from': RELAYER_ADDRESS,
                            #     # 'gas': 100000, # Opcional, web3.py pode estimar
                            #     # 'gasPrice': web3.to_wei('50', 'gwei') # Opcional
                            # })


                            nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
                            tx = contrato_instance.functions.iniciarInscricao(
                                
                            ).build_transaction({'from': RELAYER_ADDRESS, 'nonce': nonce, 'gas': 300000})
                            
                            signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
                            tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
                            print(f"[RELAYER]: Transação enviada! Hash: {tx_hash.hex()}. Aguardando recibo...")
                            tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

                            if tx_receipt.status != 0:
                                print("TUDO OKAY")

                    elif estado_contrato_int == 1: # 1 = Votacao
                        if agora < votacao.data_fim_chapa:
                            estado_contrato_str = "Inscrição Aberta"
                        elif agora >= votacao.data_fim_chapa and agora < votacao.data_inicio_votacao:
                            estado_contrato_str = "Inscrição Encerrada"
                        else:
                            estado_contrato_str = "Votação Aberta"
                            estado_contrato_int=2

                            nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
                            tx = contrato_instance.functions.iniciarVotacao(
                                
                            ).build_transaction({'from': RELAYER_ADDRESS, 'nonce': nonce, 'gas': 300000})
                            
                            signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
                            tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
                            print(f"[RELAYER]: Transação enviada! Hash: {tx_hash.hex()}. Aguardando recibo...")
                            tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

                            if tx_receipt.status != 0:
                                print("TUDO OKAY")


                    elif estado_contrato_int == 2: # 2 = Encerrada
                        if agora < votacao.data_fim_votacao:
                            estado_contrato_str = "Votação Aberta"
                        else:
                            estado_contrato_str = "Votação Encerrada"

                            nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
                            tx = contrato_instance.functions.encerrarVotacao(
                                
                            ).build_transaction({'from': RELAYER_ADDRESS, 'nonce': nonce, 'gas': 300000})
                            
                            signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
                            tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
                            print(f"[RELAYER]: Transação enviada! Hash: {tx_hash.hex()}. Aguardando recibo...")
                            tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

                            if tx_receipt.status != 0:
                                print("TUDO OKAY")
                    else:
                        estado_contrato_str = "Votação Encerrada"
                        
            except Exception as e:
                print(f"Erro ao ler estado do contrato {votacao.contract_address}: {e}")

            resultado_final.append({
                "id": votacao.id,
                "campus": votacao.campus,
                "curso": votacao.curso,
                "admin_wallet_proponente": votacao.admin_wallet_proponente,
                "contract_address": votacao.contract_address,
                "estado_contrato_int": estado_contrato_int, # (0, 1, 2)
                "estado_contrato_str": estado_contrato_str, # O texto descritivo
            })
            
        return jsonify(resultado_final), 200
        
    except Exception as e: 
        print(f"Erro ao buscar votações: {e}")
        abort(500, description=f"Erro ao buscar dados no servidor: {e}")

# --- Rota 4 (Inscrever Chapa) (Correta) ---
@app.route('/api/inscrever-chapa', methods=['POST'])
def inscrever_chapa():
    data = request.json
    if not all(k in data for k in ['contract_address', 'chapa_name', 'chapa_proposal']):
        abort(400, description="Dados incompletos para inscrever chapa.")
    try:
        votacao = Votacao.query.filter_by(contract_address=data['contract_address']).first()
        if not votacao: abort(404, description="Votação não encontrada.")
        
        # Verificação de Data (Off-chain)
        agora = datetime.now()
        if agora > votacao.data_fim_chapa:
            abort(403, description="O período de inscrição de chapas já encerrou.")
        
        # Verificação de Estado (On-chain)
        contrato_instance = get_contract_instance(votacao.contract_address)
        if not contrato_instance: abort(500, "Erro ao conectar ao contrato.")
        
        estado_atual = contrato_instance.functions.estadoAtual().call()
        if estado_atual != 1: # 0 = Inscricao
             abort(403, description="As inscrições não estão abertas no contrato.")

        # Salva a chapa no DB
        numero_atual = Chapa.query.filter_by(votacao_id=votacao.id).count()
        novo_numero_chapa = numero_atual + 1
        nova_chapa = Chapa(
            nome_chapa=data['chapa_name'], proposta=data['chapa_proposal'],
            numero_chapa=novo_numero_chapa, votacao_id=votacao.id
        )
        db.session.add(nova_chapa)
        db.session.commit()
        return jsonify(message="Chapa inscrita com sucesso!", numero_chapa=novo_numero_chapa), 201
    except Exception as e:
        db.session.rollback()
        abort(500, description=f"Erro interno ao salvar a chapa: {e}")

# --- Rota 5 (Login Google) e Rota 6 (Callback) (Corretas) ---
@app.route('/api/auth/google')
def auth_google():
    contract_address = request.args.get('contract_address')
    matricula = request.args.get('matricula')
    if not contract_address or not matricula:
        abort(400, description="Matrícula e endereço do contrato são necessários.")
    
    votacao = Votacao.query.filter_by(contract_address=contract_address).first()
    if not votacao: abort(404, description="Votação não encontrada.")
    
    mapa_alunos = _simular_scraping_sigaa(votacao.sigaa_link)
    if matricula not in mapa_alunos:
        abort(403, description="Matrícula não encontrada na lista pública.")
    
    # Verificação de Data (Off-chain)
    agora = datetime.now()
    if agora < votacao.data_inicio_votacao:
        return "<h1>Erro: O período de votação ainda não começou.</h1>", 403
    if agora > votacao.data_fim_votacao:
        return "<h1>Erro: O período de votação já encerrou.</h1>", 403
        
    session['contract_address'] = contract_address
    session['matricula'] = matricula
    session['nome_sigaa_normalizado'] = normalize_name(mapa_alunos[matricula])
    flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=url_for('autenticar_callback', _external=True))
    authorization_url, state = flow.authorization_url()
    session['state'] = state
    return redirect(authorization_url)

@app.route('/api/autenticar-callback')
def autenticar_callback():
    try:
        if request.args.get('state') != session.get('state'): abort(403, "Erro de estado (CSRF).")
        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=url_for('autenticar_callback', _external=True))
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials
        id_info = id_token.verify_oauth2_token(credentials.id_token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        email_google = id_info.get('email')
        dominio_google = id_info.get('hd')
        nome_google = id_info.get('name')
        
        if dominio_google != "ufpi.edu.br":
             return "<h1>Erro: Apenas e-mails @ufpi.edu.br são permitidos.</h1><script>window.close();</script>", 403

        matricula = session.get('matricula')
        contract_address = session.get('contract_address')
        nome_sigaa_normalizado = session.get('nome_sigaa_normalizado')
        nome_google_normalizado = normalize_name(nome_google)
        
        if nome_sigaa_normalizado not in nome_google_normalizado and nome_google_normalizado not in nome_sigaa_normalizado:
            return f"<h1>Erro: O nome da sua conta Google ({nome_google}) não corresponde ao nome da matrícula ({nome_sigaa_normalizado}).</h1><script>window.close();</script>", 403

        nullifier_hash = _get_nullifier(matricula)
        nullifier_hash_bytes = bytes.fromhex(nullifier_hash.replace("0x", ""))
        contrato = get_contract_instance(contract_address)
        if not contrato: abort(500, "Falha ao carregar o contrato.")
        
        ja_votou = contrato.functions.nullifiersUsados(nullifier_hash_bytes).call()
        if ja_votou:
            return "<h1>Erro: Esta matrícula já foi usada para votar.</h1><script>window.close();</script>", 403
        
        # Checagem final do estado do contrato (On-chain)
        estado_contrato = contrato.functions.estadoAtual().call()
        # if estado_contrato != 1: # 1 = Votacao
            # return "<h1>Erro: A votação não está aberta no contrato.</h1><script>window.close();</script>", 403

        votacao = Votacao.query.filter_by(contract_address=contract_address).first()
        mapa_alunos = _simular_scraping_sigaa(votacao.sigaa_link)
        lista_completa_matriculas = list(mapa_alunos.keys())
        all_leaves = _get_all_leaves(lista_completa_matriculas)
        tree_levels = _build_tree_levels(all_leaves)
        merkle_proof = _get_merkle_proof(nullifier_hash, tree_levels)
        chapas_db = Chapa.query.filter_by(votacao_id=votacao.id).order_by(Chapa.numero_chapa.asc()).all()
        chapas_json = [{"numero": c.numero_chapa, "nome": c.nome_chapa, "proposta": c.proposta} for c in chapas_db]

        session['vote_data'] = {
            "autenticado": True, "merkleProof": merkle_proof, "nullifierHash": f"0x{nullifier_hash}",
            "chapas": chapas_json, "contract_address": contract_address,
            "aluno_info": {"email": email_google, "nome": nome_google}
        }
        return "<script>window.opener.postMessage('auth_success', '*'); window.close();</script>"
    except Exception as e:
        print(f"Erro no callback do Google: {e}")
        return f"<h1>Erro interno do servidor: {e}</h1><script>window.close();</script>", 500

# --- Rota 7 (Get Vote Data) (Correta) ---
@app.route('/api/get-vote-data')
def get_vote_data():
    vote_data = session.pop('vote_data', None)
    if not vote_data:
        return jsonify({"autenticado": False, "mensagem": "Falha na autenticação ou sessão expirada."}), 404
    return jsonify(vote_data), 200

# --- Rota 8 (Relayer Votar) (Correta) ---
@app.route('/api/votar', methods=['POST'])
def relayer_votar():
    data = request.json
    if not all(k in data for k in ['contract_address', 'votoCriptografado', 'reciboDoAluno', 'nullifierHash', 'merkleProof']):
        abort(400, description="Dados da transação de voto incompletos.")
    try:
        print(f"\n[RELAYER]: Recebido pedido de voto para o contrato {data['contract_address']}")
        contrato = get_contract_instance(data['contract_address'])
        if not contrato: abort(500, "Falha ao carregar o contrato.")
        
        voto_bytes = data['votoCriptografado'].encode('utf-8')
        recibo_bytes = bytes.fromhex(data['reciboDoAluno'].replace('0x', ''))
        nullifier_bytes = bytes.fromhex(data['nullifierHash'].replace('0x', ''))
        proof_bytes_list = [bytes.fromhex(p.replace('0x', '')) for p in data['merkleProof']]
        
        nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
        tx = contrato.functions.votar(
            voto_bytes, recibo_bytes, nullifier_bytes, proof_bytes_list
        ).build_transaction({'from': RELAYER_ADDRESS, 'nonce': nonce, 'gas': 300000})
        
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"[RELAYER]: Transação enviada! Hash: {tx_hash.hex()}. Aguardando recibo...")
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        if tx_receipt.status == 0:
            raise Exception("A transação foi revertida pelo contrato.")

        print(f"[RELAYER]: Voto computado com sucesso! Bloco: {tx_receipt.blockNumber}")
        return jsonify(sucesso=True, mensagem="Voto computado com sucesso!", tx_hash=tx_hash.hex()), 200
    except Exception as e:
        print(f"ERRO NO RELAYER: {e}")
        return jsonify(sucesso=False, mensagem=f"Erro do Relayer: {e}"), 500

if __name__ == '__main__':
    # with app.app_context():
        # ATENÇÃO: Isso cria as novas colunas. Delete seu 'votacoes.db'
        # uma última vez para que isso funcione.
        # db.drop_all()
        # db.create_all()
    
    app.run(debug=True, port=5000)