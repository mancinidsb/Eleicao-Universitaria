# app.py (Atualizado com Criptografia Paillier)

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

from dotenv import load_dotenv

from raspagem import *

load_dotenv()

# FIXED_REDIRECT_URI = "https://ballastic-latricia-delectably.ngrok-free.dev/api/autenticar-callback"
FIXED_REDIRECT_URI = "http://127.0.0.1:5000/api/autenticar-callback"

# --- NOVA IMPORTAÇÃO ---
from phe import paillier

app = Flask(__name__)
# ... (Toda a sua configuração de CORS, ProxyFix e Secret Key) ...
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
CORS(app,
    supports_credentials=True,
    resources={r"/*": {"origins": [
        "http://127.0.0.1:5500", "http://localhost:5500",
        "http://127.0.0.1:8000", "http://localhost:8000",
        "http://127.0.0.1:5173", "http://localhost:5173" # Adiciona porta do Vite
    ]}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
)
app.secret_key = 'chave-secreta-muito-segura-trocar-depois' 
app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True
)

# ... (Toda a sua configuração de WEB3 e Google OAuth) ...
# RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/8FaeERMnNWGASM_ePLx7I"
# _RELAYER_ADDRESS_RAW = "0x21dcfc33545acecf7bffa27b33261deeb6667622" 
# RELAYER_PRIVATE_KEY = "4910711ef868cdbeee8ff20ef7787b4402f609ba1c03f9b05db4c97cb396b53d"
# CONTRACT_JSON_PATH = 'contract.json'

RPC_URL = os.getenv("RPC_URL")
_RELAYER_ADDRESS_RAW = os.getenv("_RELAYER_ADDRESS_RAW")
RELAYER_PRIVATE_KEY = os.getenv("RELAYER_PRIVATE_KEY")
CONTRACT_JSON_PATH = os.getenv("CONTRACT_JSON_PATH")


# ... (carregamento do ABI/Bytecode) ...
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

# CLIENT_SECRETS_FILE = "client_secret.json"
CLIENT_SECRETS_FILE = os.getenv("CLIENT_SECRETS_FILE")

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
    admin_wallet_proponente = db.Column(db.String(42), nullable=True) 
    contract_address = db.Column(db.String(42), nullable=False, unique=True)

    data_assembleia_geral = db.Column(db.DateTime, nullable=True)
    data_inicio_chapa = db.Column(db.DateTime, nullable=True)
    data_fim_chapa = db.Column(db.DateTime, nullable=True)
    data_inicio_votacao = db.Column(db.DateTime, nullable=True)
    data_fim_votacao = db.Column(db.DateTime, nullable=True)
    
    chapas = db.relationship('Chapa', backref='votacao', lazy=True, cascade="all, delete-orphan")
    comissao_membros = db.relationship('Comissao', backref='votacao', lazy=True, cascade="all, delete-orphan")
    alunos_validos = db.relationship('AlunoValido', backref='votacao', lazy=True, cascade="all, delete-orphan")
    
    estado_contrato = db.Column(db.Integer, nullable=False)
    
    # --- NOVAS COLUNAS PAILLIER ---
    # Armazenamos os componentes para recriar as chaves
    paillier_n = db.Column(db.Text, nullable=True) # Componente da Chave Pública
    paillier_g = db.Column(db.Text, nullable=True) # Componente da Chave Pública
    paillier_p = db.Column(db.Text, nullable=True) # Componente da Chave Privada
    paillier_q = db.Column(db.Text, nullable=True) # Componente da Chave Privada
    # Relação com os votos armazenados
    votos_armazenados = db.relationship('VotoArmazenado', backref='votacao', lazy=True, cascade="all, delete-orphan")


class Chapa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome_chapa = db.Column(db.String(100), nullable=False)
    proposta = db.Column(db.Text, nullable=False)
    numero_chapa = db.Column(db.Integer, nullable=False) 
    votacao_id = db.Column(db.Integer, db.ForeignKey('votacao.id'), nullable=False)
    situacao = db.Column(db.Boolean, default=False, nullable=False)

# --- NOVA TABELA (Quadro de Avisos / Bulletin Board) ---
class VotoArmazenado(db.Model):
    """
    Simula o "Quadro de Avisos" (Bulletin Board).
    Armazena o voto criptografado que foi para a blockchain.
    Isso facilita a apuração off-chain.
    """
    id = db.Column(db.Integer, primary_key=True)
    votacao_id = db.Column(db.Integer, db.ForeignKey('votacao.id'), nullable=False)
    # Armazena o JSON string do array de votos criptografados
    # Ex: '["...enc(0)...", "...enc(1)...", "...enc(0)..."]'
    voto_criptografado_json = db.Column(db.Text, nullable=False)

class AlunoValido(db.Model):
    """
    Armazena a lista de TODOS os alunos aptos a votar
    em uma determinada votação.
    Isso substitui o "scraping" repetido.
    """
    __tablename__ = 'aluno_valido'
    id = db.Column(db.Integer, primary_key=True)
    votacao_id = db.Column(db.Integer, db.ForeignKey('votacao.id'), nullable=False)
    matricula = db.Column(db.String(100), nullable=False)
    nome = db.Column(db.String(200), nullable=False)

    # Isso cria um índice rápido para a consulta: 
    # "Esta matrícula existe nesta votação?"
    __table_args__ = (db.UniqueConstraint('votacao_id', 'matricula', name='_votacao_matricula_uc'),)

    def __repr__(self):
        return f'<AlunoValido {self.matricula} ({self.votacao_id})>'

class Comissao(db.Model):
    __tablename__ = 'comissao'
    id = db.Column(db.Integer, primary_key=True)
    
    # Colunas do membro da comissão
    nome = db.Column(db.String(200), nullable=False)
    matricula = db.Column(db.String(100), nullable=False) 
    email = db.Column(db.String(120), nullable=False)
    
    # Chave estrangeira que liga este membro à votação principal
    votacao_id = db.Column(db.Integer, db.ForeignKey('votacao.id'), nullable=False)

    # Garante que o mesmo aluno (matrícula) não possa ser
    # adicionado duas vezes na comissão da *mesma* votação.
    __table_args__ = (db.UniqueConstraint('matricula', 'votacao_id', name='_matricula_votacao_uc'),)
    __table_args__ = (db.UniqueConstraint('email', 'votacao_id', name='_email_votacao_uc'),)

    def __repr__(self):
        return f'<Comissao {self.nome} ({self.matricula})>'

# --- (Funções de Merkle Tree e Scraping - Sem Mudanças) ---
SEGREDO_ELEICAO = "ufpi-eleicao-2025.2"
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
def _simular_scraping_sigaa(nome_curso: str) -> Dict[str, str]:
    # print(f"Simulando scraping do link: {sigaa_link}")
    # ... (mesmo dicionário de alunos) ...
    raspagem = Raspagem(nome_curso)
    return raspagem.dicionario
def normalize_name(name: str) -> str:
    if not name: return ""
    name = unidecode(name) # Remove acentos
    name = name.lower()   # Converte para minúsculas
    name = ' '.join(name.split()) # Remove espaços extras
    return name

# --- Rota 1 (Prepare Deploy) (Sem Mudanças) ---
@app.route('/api/prepare-deploy', methods=['POST', 'OPTIONS'])
def prepare_deploy_info():
    # ... (código idêntico ao seu) ...
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
        
        return jsonify(
            abi=CONTRACT_ABI, 
            bytecode=CONTRACT_BYTECODE,
            merkleRoot=merkle_root_hex,
            relayerAddress=RELAYER_ADDRESS
        )
    except Exception as e: 
        abort(500, description=f"Erro ao gerar Merkle Root: {e}")

# --- Rota 2 (Criar Votacao) (ATUALIZADA) ---
@app.route('/api/criar-votacao', methods=['POST'])
def criar_votacao():
    data = request.json
    
    required_fields = [
        'sigaa_link', 'campus', 'curso','data_assembleia_geral',
        'admin_wallet', 'contract_address'
    ]
    if not all(k in data for k in required_fields):
        abort(400, description="Dados incompletos recebidos.")
    
    try:
        # data_inicio_chapa = datetime.fromisoformat(data['data_inicio_chapa'])
        # data_fim_chapa = datetime.fromisoformat(data['data_fim_chapa'])
        # data_inicio_votacao = datetime.fromisoformat(data['data_inicio_votacao'])
        data_assembleia_geral = datetime.fromisoformat(data['data_assembleia_geral'])

        # if not (data_fim_chapa < data_inicio_votacao < data_fim_votacao):
        #     abort(400, description="Lógica de datas inválida. (Fim-Chapa < Inicio-Voto < Fim-Voto)")

        # --- GERAÇÃO DAS CHAVES PAILLIER ---
        print("Gerando chaves Paillier (1024-bit) para esta votação...")
        # n_length=1024 é mais rápido para testes. Use 2048 para produção.
        public_key, private_key = paillier.generate_paillier_keypair(n_length=1024)
        print("Chaves Paillier geradas.")

        nova_votacao = Votacao(
            campus=data['campus'], curso=data['curso'], sigaa_link=data['sigaa_link'],
            admin_wallet_proponente=data['admin_wallet'],
            contract_address=data['contract_address'],
            data_assembleia_geral=data_assembleia_geral,
            estado_contrato=0,
            # data_inicio_chapa=data_inicio_chapa,
            # data_fim_chapa=data_fim_chapa,
            # data_inicio_votacao=data_inicio_votacao,
            # data_fim_votacao=data_fim_votacao,
            
            # --- SALVANDO AS CHAVES NO BD ---
            paillier_n = str(public_key.n),
            paillier_g = str(public_key.g),
            paillier_p = str(private_key.p),
            paillier_q = str(private_key.q)
        )
        db.session.add(nova_votacao)

        mapa_alunos = _simular_scraping_sigaa(data['sigaa_link'])
        lista_alunos_para_db = []
        for matricula, nome in mapa_alunos.items():
            aluno = AlunoValido(
                votacao=nova_votacao, # Vincula o aluno à votação
                matricula=matricula,
                nome=nome
            )
            lista_alunos_para_db.append(aluno)

        # 3. Salve todos os alunos no banco
        if not lista_alunos_para_db:
             abort(400, description="A lista de alunos (SIGAA) não pode estar vazia.")
             
        db.session.add_all(lista_alunos_para_db)
        db.session.commit()
    
    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO SALVAR VOTAÇÃO: {e}")
        abort(500, description=f"Erro ao salvar a votação no banco: {e}")
    
    return jsonify(
        message="Votação salva com sucesso!",
        contract_address=data['contract_address']
    ), 201

# --- Rota 3 (Listar Votações) (Sem Mudanças) ---
# ... (seu código idêntico para get_votacoes) ...
@app.route('/api/votacoes', methods=['GET'])
def get_votacoes():
    try:
        search_term = request.args.get('search', '') 
        query = Votacao.query
        if search_term:
            search_filter = f"%{search_term}%"
            query = query.filter(or_(Votacao.campus.ilike(search_filter), Votacao.curso.ilike(search_filter), Votacao.admin_wallet_proponente.ilike(search_filter), Votacao.contract_address.ilike(search_filter)))
        
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
                    
                    if estado_contrato_int == 0: # 0 = Inscricao
                            estado_contrato_str = "Aguardando Inscrição"
                        
                            if agora < votacao.data_inicio_chapa: 
                                pass
                            else:
                                votacao.estado_contrato=1
                                db.session.commit()

                                estado_contrato_str = "Inscrição Aberta"
                                # (A lógica de transação do relayer está OK)
                                nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
                                tx = contrato_instance.functions.iniciarInscricao().build_transaction({'from': RELAYER_ADDRESS, 'nonce': nonce, 'gas': 300000})
                                signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
                                tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
                                tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                                if tx_receipt.status != 0: print("Inscrição iniciada no contrato.")

                    elif estado_contrato_int == 1: # 1 = Votacao
                        if agora < votacao.data_fim_chapa:
                            estado_contrato_str = "Inscrição Aberta"
                        elif agora >= votacao.data_fim_chapa and agora < votacao.data_inicio_votacao:
                            estado_contrato_str = "Inscrição Encerrada"
                        else:
                            estado_contrato_str = "Votação Aberta"
                            estado_contrato_int=2
                            nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
                            tx = contrato_instance.functions.iniciarVotacao().build_transaction({'from': RELAYER_ADDRESS, 'nonce': nonce, 'gas': 3000000})
                            signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
                            tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
                            tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                            if tx_receipt.status != 0: print("Votação iniciada no contrato.")

                    elif estado_contrato_int == 2: # 2 = Encerrada
                        if agora < votacao.data_fim_votacao:
                            estado_contrato_str = "Votação Aberta"
                        else:
                            estado_contrato_str = "Votação Encerrada"
                            nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
                            tx = contrato_instance.functions.encerrarVotacao().build_transaction({'from': RELAYER_ADDRESS, 'nonce': nonce, 'gas': 3000000})
                            signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
                            tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
                            tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                            if tx_receipt.status != 0: print("Votação encerrada no contrato.")
                    else:
                        estado_contrato_str = "Votação Encerrada"
                        
            except Exception as e:
                print(f"Erro ao ler/atualizar estado do contrato {votacao.contract_address}: {e}")
            # estado_contrato_str = "Aguardando Inscrição"
            # estado_contrato_int=0
            resultado_final.append({
                "id": votacao.id, "campus": votacao.campus, "curso": votacao.curso,
                "data_assembleia_geral": votacao.data_assembleia_geral,
                "admin_wallet_proponente": votacao.admin_wallet_proponente,
                "contract_address": votacao.contract_address,
                "estado_contrato_int": estado_contrato_int,
                "estado_contrato_str": estado_contrato_str,
                "data_inicio_chapa": votacao.data_inicio_chapa,
                "data_fim_chapa": votacao.data_fim_chapa,
                "data_inicio_votacao": votacao.data_inicio_votacao,
                "data_fim_votacao": votacao.data_fim_votacao
            })
            
        return jsonify(resultado_final), 200
        
    except Exception as e: 
        print(f"Erro ao buscar votações: {e}")
        abort(500, description=f"Erro ao buscar dados no servidor: {e}")

# --- Rota 4 (Inscrever Chapa) (Sem Mudanças) ---
# ... (seu código idêntico para inscrever_chapa) ...
@app.route('/api/inscrever-chapa', methods=['POST'])
def inscrever_chapa():
    data = request.json
    if not all(k in data for k in ['contract_address', 'chapa_name', 'chapa_proposal']):
        abort(400, description="Dados incompletos para inscrever chapa.")
    try:
        votacao = Votacao.query.filter_by(contract_address=data['contract_address']).first()
        if not votacao: abort(404, description="Votação não encontrada.")
        
        agora = datetime.now()
        if agora > votacao.data_fim_chapa:
            abort(403, description="O período de inscrição de chapas já encerrou.")
        
        contrato_instance = get_contract_instance(votacao.contract_address)
        if not contrato_instance: abort(500, "Erro ao conectar ao contrato.")
        
        estado_atual = contrato_instance.functions.estadoAtual().call()
        if estado_atual != 1:
             abort(403, description="As inscrições não estão abertas no contrato.")

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

# --- Rota 5 (Login Google) e Rota 6 (Callback) (Sem Mudanças) ---
# ... (seu código idêntico para auth_google e autenticar_callback) ...
# ATENÇÃO: A Rota 6 (autenticar_callback) será atualizada

@app.route('/api/auth/google')
def auth_google():
    contract_address = request.args.get('contract_address')
    matricula = request.args.get('matricula') # Pode ser None se for modo comissao
    mode = request.args.get('mode', 'votar') # 'votar' ou 'comissao'

    if not contract_address:
        abort(400, description="Endereço do contrato é obrigatório.")

    votacao = Votacao.query.filter_by(contract_address=contract_address).first()
    if not votacao: abort(404, description="Votação não encontrada.")

    # Lógica específica para cada modo
    if mode == 'votar':
        if not matricula: abort(400, description="Matrícula necessária para votar.")
        # ... (validações de data e aluno existente - MANTENHA O QUE JÁ EXISTE) ...
        # ... (lógica rápida de AlunoValido que implementamos antes) ...
        aluno_valido = AlunoValido.query.filter_by(votacao_id=votacao.id, matricula=matricula).first()
        if not aluno_valido: abort(403, description="Matrícula não encontrada.")
        
        session['nome_sigaa_normalizado'] = normalize_name(aluno_valido.nome)
        session['matricula'] = matricula

    elif mode == 'comissao':
        # No modo comissão, não precisamos da matrícula agora, validaremos o email no callback
        pass

    session['contract_address'] = contract_address
    session['auth_mode'] = mode # Salva o modo na sessão

    # redirect_uri_https = url_for('autenticar_callback', _external=True).replace("http://", "https://")
    redirect_uri_https = url_for('autenticar_callback', _external=True).replace("http://", "https://")

    # flow = Flow.from_client_secrets_file(
    #     CLIENT_SECRETS_FILE, 
    #     scopes=SCOPES, 
    #     redirect_uri=redirect_uri_https # <--- Usa a URL com HTTPS forçado
    # )

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, 
        scopes=SCOPES, 
        redirect_uri=FIXED_REDIRECT_URI 
    )
    
    # flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=url_for('autenticar_callback', _external=True))
    authorization_url, state = flow.authorization_url()
    session['state'] = state
    return redirect(authorization_url)



# --- Rota 6 (Callback) (ATUALIZADA) ---

@app.route('/api/autenticar-callback')
def autenticar_callback():
    try:
        if request.args.get('state') != session.get('state'): abort(403, "Erro de estado (CSRF).")
        
        # flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=url_for('autenticar_callback', _external=True))
        
        redirect_uri_https = url_for('autenticar_callback', _external=True).replace("http://", "https://")

        code = request.args.get('code')
        if not code:
            abort(400, "Código de autenticação não encontrado.")


        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE, 
            scopes=SCOPES, 
            redirect_uri=FIXED_REDIRECT_URI # <--- Usa a URL com HTTPS forçado
        )
        # flow.fetch_token(authorization_response=request.url)
        flow.fetch_token(code=code)

        # authorization_response = request.url.replace("http://", "https://")
        # flow.fetch_token(authorization_response=authorization_response)
        
        credentials = flow.credentials
        id_info = id_token.verify_oauth2_token(credentials.id_token, google_requests.Request(), GOOGLE_CLIENT_ID, clock_skew_in_seconds=5)
        
        email_google = id_info.get('email')
        # ... (outros dados do google) ...
        
        contract_address = session.get('contract_address')
        auth_mode = session.get('auth_mode', 'votar') # Recupera o modo

        votacao = Votacao.query.filter_by(contract_address=contract_address).first()
        if not votacao: abort(404, "Votação não encontrada.")

        if auth_mode == 'comissao':
            membro = Comissao.query.filter_by(votacao_id=votacao.id, email=email_google).first()
            
            if not membro:
                return f"<h1>Erro: O email {email_google} não faz parte da comissão eleitoral desta votação.</h1><script>window.close();</script>", 403

            # Sucesso! Retorna os dados para o frontend abrir a tela de avaliação
            session['comissao_data'] = {
                "autenticado": True,
                "is_comissao": True,
                "contract_address": contract_address,
                "membro_nome": membro.nome
            }
            return "<script>window.opener.postMessage('auth_comissao_success', '*'); window.close();</script>"
        
        else:

            if request.args.get('state') != session.get('state'): abort(403, "Erro de estado (CSRF).")
            # flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=url_for('autenticar_callback', _external=True))
            # flow.fetch_token(authorization_response=request.url)
            credentials = flow.credentials
            id_info = id_token.verify_oauth2_token(credentials.id_token, google_requests.Request(), GOOGLE_CLIENT_ID)
            str_script=""
            email_google = id_info.get('email')
            dominio_google = id_info.get('hd')
            nome_google = id_info.get('name')
            
            if dominio_google != "ufpi.edu.br":
                return f"<h1>Erro: Apenas e-mails @ufpi.edu.br são permitidos. Tente novamente.</h>{str_script}", 403

            matricula = session.get('matricula')
            contract_address = session.get('contract_address')
            nome_sigaa_normalizado = session.get('nome_sigaa_normalizado')
            nome_google_normalizado = normalize_name(nome_google)
            
            if nome_sigaa_normalizado not in nome_google_normalizado and nome_google_normalizado not in nome_sigaa_normalizado:
                return f"<h1>Erro: O nome da sua conta Google ({nome_google}) não corresponde ao nome da matrícula ({nome_sigaa_normalizado}).</h1>{str_script}", 403

            nullifier_hash = _get_nullifier(matricula)
            nullifier_hash_bytes = bytes.fromhex(nullifier_hash.replace("0x", ""))
            contrato = get_contract_instance(contract_address)
            if not contrato: abort(500, "Falha ao carregar o contrato.")
            
            ja_votou = contrato.functions.nullifiersUsados(nullifier_hash_bytes).call()
            if ja_votou:
                return f"<h1>Erro: Esta matrícula já foi usada para votar.</h1>{str_script}", 403
            
            estado_contrato = contrato.functions.estadoAtual().call()
            if estado_contrato != 2: # 2 = Votacao
                return f"<h1>Erro: A votação não está aberta no contrato.</h1>{str_script}", 403

            votacao = Votacao.query.filter_by(contract_address=contract_address).first()
            mapa_alunos = _simular_scraping_sigaa(votacao.sigaa_link)
            lista_completa_matriculas = list(mapa_alunos.keys())
            all_leaves = _get_all_leaves(lista_completa_matriculas)
            tree_levels = _build_tree_levels(all_leaves)
            merkle_proof = _get_merkle_proof(nullifier_hash, tree_levels)
            chapas_db = Chapa.query.filter_by(votacao_id=votacao.id).order_by(Chapa.numero_chapa.asc()).all()
            chapas_json = [{"numero": c.numero_chapa, "nome": c.nome_chapa, "proposta": c.proposta} for c in chapas_db]

            # --- PREPARA OS DADOS PARA O FRONTEND ---
            session['vote_data'] = {
                "autenticado": True, 
                "merkleProof": merkle_proof, 
                "nullifierHash": f"0x{nullifier_hash}",
                "chapas": chapas_json, 
                "contract_address": contract_address,
                "aluno_info": {"email": email_google, "nome": nome_google},
                
                # --- ENVIA A CHAVE PÚBLICA PARA O FRONTEND ---
                "paillier_n": votacao.paillier_n,
                "paillier_g": votacao.paillier_g,
                "num_chapas": len(chapas_json) # Informa ao frontend o tamanho do array
            }
            return "<script>window.opener.postMessage('auth_success', '*'); window.close();</script>"
    except Exception as e:
        print(f"Erro no callback do Google: {e}")
        return f"<h1>Erro interno do servidor: {e}</h1><script>window.close();</script>", 500



# --- Rota 7 (Get Vote Data) (ATUALIZADA) ---
@app.route('/api/get-vote-data')
def get_vote_data():
    # Esta rota agora envia os dados da chave Paillier
    vote_data = session.pop('vote_data', None)
    if not vote_data:
        return jsonify({"autenticado": False, "mensagem": "Falha na autenticação ou sessão expirada."}), 404
    return jsonify(vote_data), 200

# --- Rota 8 (Relayer Votar) (ATUALIZADA) ---
@app.route('/api/votar', methods=['POST'])
def relayer_votar():
    data = request.json
    if not all(k in data for k in ['contract_address', 'votoCriptografado', 'reciboDoAluno', 'nullifierHash', 'merkleProof']):
        abort(400, description="Dados da transação de voto incompletos.")
    try:
        print(f"\n[RELAYER]: Recebido pedido de voto para o contrato {data['contract_address']}")
        contrato = get_contract_instance(data['contract_address'])
        if not contrato: abort(500, "Falha ao carregar o contrato.")
        
        # O 'votoCriptografado' agora é um JSON string de um array de strings
        # Ex: '["...enc(0)...", "...enc(1)...", "...enc(0)..."]'
        voto_criptografado_json_string = data['votoCriptografado']
        
        # O contrato armazena isso como bytes puros
        voto_bytes = voto_criptografado_json_string.encode('utf-8')
        
        recibo_bytes = bytes.fromhex(data['reciboDoAluno'].replace('0x', ''))
        nullifier_bytes = bytes.fromhex(data['nullifierHash'].replace('0x', ''))
        proof_bytes_list = [bytes.fromhex(p.replace('0x', '')) for p in data['merkleProof']]
        
        nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
        tx = contrato.functions.votar(
            voto_bytes, recibo_bytes, nullifier_bytes, proof_bytes_list
        ).build_transaction({'from': RELAYER_ADDRESS, 'nonce': nonce, 'gas': 3000000})
        
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"[RELAYE]: Transação enviada! Hash: {tx_hash.hex()}. Aguardando recibo...")
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        if tx_receipt.status == 0:
            raise Exception("A transação foi revertida pelo contrato.")

        # --- SUCESSO! Armazena o voto no nosso "Quadro de Avisos" (BD) ---
        votacao = Votacao.query.filter_by(contract_address=data['contract_address']).first()
        if votacao:
            novo_voto_db = VotoArmazenado(
                votacao_id=votacao.id, 
                voto_criptografado_json=voto_criptografado_json_string
            )
            db.session.add(novo_voto_db)
            db.session.commit()
            print("[RELAYER]: Voto salvo no Quadro de Avisos (BD).")
        else:
            print("[RELAYER] ERRO: Votação não encontrada no BD para salvar o voto.")
        # -------------------------------------------------------------

        print(f"[RELAYER]: Voto computado com sucesso! Bloco: {tx_receipt.blockNumber}")
        return jsonify(sucesso=True, mensagem="Voto computado com sucesso!", tx_hash=tx_hash.hex()), 200
    except Exception as e:
        print(f"ERRO NO RELAYER: {e}")
        return jsonify(sucesso=False, mensagem=f"Erro do Relayer: {e}"), 500

# --- ROTA 9 (NOVA ROTA DE APURAÇÃO) ---
@app.route('/api/apurar-votos/<string:contract_address>', methods=['GET'])
def apurar_votos(contract_address):
    # try:
    votacao = Votacao.query.filter_by(contract_address=contract_address).first()
    if not votacao:
        abort(404, description="Votação não encontrada.")
        
    # 1. Recria as chaves Paillier a partir do BD
    if not all([votacao.paillier_n, votacao.paillier_g, votacao.paillier_p, votacao.paillier_q]):
        abort(500, description="Erro: Chaves Paillier não encontradas para esta votação.")

    public_key = paillier.PaillierPublicKey(
        n=int(votacao.paillier_n)
        # 'g' não é necessário para recriar a chave pública na 'phe'
    )
    private_key = paillier.PaillierPrivateKey(
        public_key, p=int(votacao.paillier_p), q=int(votacao.paillier_q)
    )
    
    # 2. Pega a lista de chapas na ordem correta
    lista_chapas = Chapa.query.filter_by(votacao_id=votacao.id).order_by(Chapa.numero_chapa.asc()).all()
    num_chapas = len(lista_chapas)
    if num_chapas == 0:
        return jsonify({"mensagem": "Nenhuma chapa inscrita.", "resultados": []})

    # 3. Inicializa o "Tally" (contagem) com zeros criptografados
    tally_criptografado = [public_key.encrypt(0) for _ in range(num_chapas)]

    # 4. Busca todos os votos do nosso "Quadro de Avisos" (BD)
    votos_db = VotoArmazenado.query.filter_by(votacao_id=votacao.id).all()
    
    # 5. SOMA HOMOMÓRFICA
    print(f"Iniciando apuração de {len(votos_db)} votos...")
    for voto_db in votos_db:
        # Carrega o array de strings: '["...enc(0)...", "...enc(1)..."]'
        voto_array_str = json.loads(voto_db.voto_criptografado_json)
        
        if len(voto_array_str) != num_chapas:
            print(f"AVISO: Ignorando voto mal formado (tamanho {len(voto_array_str)} != {num_chapas})")
            continue
            
        # Soma este voto ao Tally principal
        for i in range(num_chapas):
            try:
                voto_i_str = voto_array_str[i]
                # Recria o objeto EncryptedNumber
                voto_i_obj = paillier.EncryptedNumber(public_key, int(voto_i_str))
                # A MÁGICA: Soma os envelopes criptografados
                tally_criptografado[i] = tally_criptografado[i] + voto_i_obj
            except Exception as e:
                print(f"AVISO: Ignorando envelope individual mal formado. Erro: {e}")
    
    print("Soma homomórfica concluída. Descriptografando totais...")
    
    # 6. Descriptografa os TOTAIS
    resultados_finais = []
    for i in range(num_chapas):
        chapa = lista_chapas[i]
        # Descriptografa apenas o Tally final
        total_votos = private_key.decrypt(tally_criptografado[i])
        
        resultados_finais.append({
            "numero_chapa": chapa.numero_chapa,
            "nome_chapa": chapa.nome_chapa,
            "total_votos": total_votos
        })
        
    print("Apuração finalizada.")
    return jsonify({
        "mensagem": f"Apuração concluída. {len(votos_db)} votos válidos processados.",
        "resultados": resultados_finais
    })

    # except Exception as e:
    #     print(f"ERRO NA APURAÇÃO: {e}")
    #     abort(500, description=f"Erro interno na apuração: {e}")

# --- ROTA 10 (NOVA ROTA - DETALHES DA VOTAÇÃO) ---
# (Endpoint para a "sobre-screen" do frontend)
@app.route('/api/votacao-detalhes/<string:contract_address>', methods=['GET'])
def get_votacao_detalhes(contract_address):
    def format_iso(dt):
        return dt.isoformat() + 'Z' if dt else None
    """
    Busca os detalhes de uma votação específica para a tela "Sobre".
    """
    try:
        votacao = Votacao.query.filter_by(contract_address=contract_address).first()
        if not votacao:
            abort(404, description="Votação não encontrada.")
        
  
        membros_comissao = Comissao.query.filter_by(votacao_id=votacao.id).all()
        if membros_comissao:
            comissao_formatada = [f"{membro.nome}<br>({membro.email})" for membro in membros_comissao]
        else:
            comissao_formatada = ["Não Definido"]


        
        return jsonify({
            "campus": votacao.campus,
            "data_assembleia_geral": format_iso(votacao.data_assembleia_geral),
            
            # Datas de Inscrição (podem ser None)
            "data_inicio_chapa": format_iso(votacao.data_inicio_chapa),
            "data_fim_chapa": format_iso(votacao.data_fim_chapa),
            
            # Datas de Votação (podem ser None)
            "data_inicio_votacao": format_iso(votacao.data_inicio_votacao),
            "data_fim_votacao": format_iso(votacao.data_fim_votacao),
            "curso": votacao.curso,
            "admin_wallet_proponente": votacao.admin_wallet_proponente,
            "estado_contrato": votacao.estado_contrato,
            
            # Comissão (usando o placeholder)
            "comissao": comissao_formatada
        })

    except Exception as e:
        print(f"ERRO AO BUSCAR DETALHES: {e}")
        abort(500, description=f"Erro interno ao buscar detalhes: {e}")

@app.route('/api/julgar-chapa', methods=['POST'])
def julgar_chapa():
    data = request.json
    if not all(k in data for k in ['chapa_id', 'aprovado']): # aprovado: boolean
        abort(400, description="Dados incompletos.")

    chapa_id = data['chapa_id']
    aprovado = data['aprovado']

    chapa = Chapa.query.get(chapa_id)
    if not chapa: abort(404, description="Chapa não encontrada.")

    try:
        if aprovado:
            chapa.situacao = True # Aprova a chapa
            db.session.commit()
            return jsonify(message=f"Chapa '{chapa.nome_chapa}' aprovada com sucesso!"), 200
        else:
            # Se rejeitado, deletamos a chapa (ou poderíamos ter um status 'rejeitado')
            db.session.delete(chapa)
            db.session.commit()
            return jsonify(message=f"Chapa '{chapa.nome_chapa}' foi rejeitada e removida."), 200
            
    except Exception as e:
        db.session.rollback()
        abort(500, description=f"Erro ao julgar chapa: {e}")

@app.route('/api/chapas-pendentes/<string:contract_address>', methods=['GET'])
def get_chapas_pendentes(contract_address):
    # Nota: Em um sistema real, você verificaria a sessão do usuário aqui também.
    # Por simplicidade, assumimos que o frontend só chama isso se autenticado.
    
    votacao = Votacao.query.filter_by(contract_address=contract_address).first()
    if not votacao: abort(404, description="Votação não encontrada.")

    # Busca chapas com situacao=False
    chapas = Chapa.query.filter_by(votacao_id=votacao.id, situacao=False).all()
    
    resultado = []
    for chapa in chapas:
        resultado.append({
            "id": chapa.id,
            "numero": chapa.numero_chapa,
            "nome": chapa.nome_chapa,
            "proposta": chapa.proposta
        })
    
    return jsonify(resultado), 200

@app.route('/api/cadastrar-comissao', methods=['POST'])
def cadastrar_comissao():
    data = request.json
    
    # 1. Validação correta, baseada no seu JavaScript
    required_fields = ['contract_address', 'nomes', 'matriculas', 'emails']
    if not all(k in data for k in required_fields):
        abort(400, description="Dados incompletos: Faltando contract_address, nomes, matriculas ou emails.")
        
    contract_address = data['contract_address']
    nomes = data['nomes']
    matriculas = data['matriculas']
    emails = data['emails']

    # 2. Verifica se as listas têm o mesmo tamanho
    if not (len(nomes) == len(matriculas) == len(emails)):
        abort(400, description="Erro nos dados: As listas (nomes, matriculas, emails) têm tamanhos diferentes.")

    if len(nomes) == 0:
        abort(400, description="Nenhum membro da comissão foi enviado.")

    try:
        # 3. Encontra a Votação
        votacao = Votacao.query.filter_by(contract_address=contract_address).first()
        if not votacao:
            abort(404, description="Votação não encontrada com este contract_address.")

        # 5. Valida CADA membro ANTES de salvar no BD
        novos_membros_objetos = [] # Lista temporária
        for i in range(len(nomes)):
            nome_membro = nomes[i]
            matricula_membro = matriculas[i]
            email_membro = emails[i]

            # Verificação 1: Checa o email institucional (sem mudança)
            if not email_membro.endswith("@ufpi.edu.br"):
                return jsonify(message=f"O aluno '{nome_membro}' ({email_membro}) não possui email institucional."), 400
                # abort(400, description=f"O membro '{nome_membro}' ({email_membro}) não possui um email institucional válido (@ufpi.edu.br).")

            # Verificação 2: Checa se a matrícula existe NO BANCO (MUDANÇA)
            # Esta consulta é muito rápida pois usa o índice da tabela AlunoValido
            aluno_existe = AlunoValido.query.filter_by(
                votacao_id=votacao.id, 
                matricula=matricula_membro
            ).first()  # .first() é otimizado para parar na primeira ocorrência

            if not aluno_existe:
                return jsonify(message=f"O aluno '{nome_membro}' ({matricula_membro}) não foi encontrado."), 400
                #abort(400, description=f"O membro '{nome_membro}' (matrícula {matricula_membro}) não foi encontrado na lista de alunos desta votação.")

            nome_frontend_normalizado = normalize_name(nome_membro)
            nome_db_normalizado = normalize_name(aluno_existe.nome)

            if nome_frontend_normalizado != nome_db_normalizado:
                return jsonify(message=f"O nome '{nome_membro}' não corresponde ao nome registrado para a matrícula {matricula_membro}. Esperado: '{aluno_existe.nome}'."), 400
                # abort(400, description=f"O nome '{nome_membro}' não corresponde ao nome registrado para a matrícula {matricula_membro}. Esperado: '{aluno_existe.nome}'.")

            # Se passou nas validações, cria o objeto (sem mudança)
            membro = Comissao(
                votacao_id=votacao.id,
                nome=nome_membro,
                matricula=matricula_membro,
                email=email_membro
            )
            novos_membros_objetos.append(membro)

        # --- FIM DA VALIDAÇÃO RÁPIDA ---

        # 6. Limpa a comissão antiga (sem mudança)
        Comissao.query.filter_by(votacao_id=votacao.id).delete()

        # 7. Adiciona os novos membros validados (sem mudança)
        db.session.add_all(novos_membros_objetos)
        db.session.commit()
        
        # 8. Retorna sucesso (sem mudança)
        return jsonify(message=f"Comissão com {len(novos_membros_objetos)} membros cadastrada com sucesso!"), 201

    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO CADASTRAR COMISSÃO: {e}")
        # Retorna a descrição do erro (ex: "O membro '...' não foi encontrado...")
        return jsonify(message=f"A comissão possui alunos com emails iguais."), 500
        # abort(500, description=f"Erro interno ao salvar a comissão: {e}")

@app.route('/api/get-comissao-data')
def get_comissao_data():
    data = session.pop('comissao_data', None)
    if not data: return jsonify({"autenticado": False}), 401
    return jsonify(data), 200

# --- ROTA 12 (NOVA - SALVAR DATAS) ---
@app.route('/api/salvar-datas', methods=['POST'])
def salvar_datas():
    data = request.json
    
    # 1. Validação básica
    campos_necessarios = ['contract_address', 'inicio_chapa', 'fim_chapa', 'inicio_votacao', 'fim_votacao']
    if not all(k in data for k in campos_necessarios):
        abort(400, description="Todos os campos de data são obrigatórios.")

    try:
        # 2. Busca a votação
        votacao = Votacao.query.filter_by(contract_address=data['contract_address']).first()
        if not votacao:
            abort(404, description="Votação não encontrada.")

        # 3. Converte strings para objetos datetime
        inicio_chapa = datetime.fromisoformat(data['inicio_chapa'])
        fim_chapa = datetime.fromisoformat(data['fim_chapa'])
        inicio_votacao = datetime.fromisoformat(data['inicio_votacao'])
        fim_votacao = datetime.fromisoformat(data['fim_votacao'])

        # 4. Validação Lógica (Cronologia)
        # Regra: Início Chapa < Fim Chapa <= Início Votação < Fim Votação
        if inicio_chapa >= fim_chapa:
            abort(400, description="Erro: O fim da inscrição de chapa deve ser depois do início.")
        
        if fim_chapa > inicio_votacao:
            abort(400, description="Erro: A votação não pode começar antes do fim das inscrições de chapa.")
            
        if inicio_votacao >= fim_votacao:
            abort(400, description="Erro: O fim da votação deve ser depois do início.")

        # 5. Atualiza o Banco de Dados
        votacao.data_inicio_chapa = inicio_chapa
        votacao.data_fim_chapa = fim_chapa
        votacao.data_inicio_votacao = inicio_votacao
        votacao.data_fim_votacao = fim_votacao

        db.session.commit()

        return jsonify(message="Datas definidas com sucesso!"), 200

    except ValueError:
        abort(400, description="Formato de data inválido.")
    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO SALVAR DATAS: {e}")
        abort(500, description=f"Erro interno: {e}")


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    app.run(debug=True, port=5000)