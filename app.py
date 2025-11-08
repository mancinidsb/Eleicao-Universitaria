# from flask import Flask, request, jsonify, abort
# from flask_cors import CORS
# import json
# import os
# import hashlib # Ainda necessário para o _hash_pair
# from flask_sqlalchemy import SQLAlchemy
# from sqlalchemy import or_
# from typing import Tuple, List, Dict

# # Importa a biblioteca Web3
# from web3 import Web3

# app = Flask(__name__)
# CORS(app)

# # --- CONFIGURAÇÃO WEB3 E DO RELAYER ---
# RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/8FaeERMnNWGASM_ePLx7I"
# _RELAYER_ADDRESS_RAW = "0x21dcfc33545acecf7bffa27b33261deeb6667622" 
# RELAYER_PRIVATE_KEY = "4910711ef868cdbeee8ff20ef7787b4402f609ba1c03f9b05db4c97cb396b53d"

# CONTRACT_JSON_PATH = 'contract.json'
# if not os.path.exists(CONTRACT_JSON_PATH):
#     print("ERRO: contract.json não encontrado.")
#     exit()
# with open(CONTRACT_JSON_PATH, 'r') as f:
#     CONTRACT_ABI = json.load(f).get('abi')
#     if not CONTRACT_ABI:
#         print("ERRO: ABI não encontrado em contract.json")
#         exit()

# # Conecta ao nó Ethereum
# web3 = Web3(Web3.HTTPProvider(RPC_URL))
# RELAYER_ADDRESS = web3.to_checksum_address(_RELAYER_ADDRESS_RAW) # Correção de Checksum
# if not web3.is_connected():
#     print(f"ERRO: Falha ao conectar ao nó Ethereum em {RPC_URL}")
#     exit()
# else:
#     print(f"Conectado ao nó Ethereum (Chain ID: {web3.eth.chain_id})")

# # --- Configuração do Banco de Dados SQLite ---
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'votacoes.db')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# db = SQLAlchemy(app)

# # --- Modelos do Banco de Dados (sem mudanças) ---
# class Votacao(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     campus = db.Column(db.String(100), nullable=False)
#     curso = db.Column(db.String(100), nullable=False)
#     sigaa_link = db.Column(db.String(255), nullable=False)
#     admin_wallet = db.Column(db.String(42), nullable=False) 
#     contract_address = db.Column(db.String(42), nullable=False, unique=True)
#     chapas = db.relationship('Chapa', backref='votacao', lazy=True, cascade="all, delete-orphan")

# class Chapa(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     nome_chapa = db.Column(db.String(100), nullable=False)
#     proposta = db.Column(db.Text, nullable=False)
#     numero_chapa = db.Column(db.Integer, nullable=False) 
#     votacao_id = db.Column(db.Integer, db.ForeignKey('votacao.id'), nullable=False)

# # --- Constante de Segredo ---
# SEGREDO_ELEICAO = "ufpi-eleicao-2025.2"

# # --- LÓGICA DA MERKLE TREE (CORRIGIDA COM WEB3.PY) ---

# def _get_nullifier(matricula: str) -> str:
#     """Gera o hash nullifier para uma matrícula."""
#     # CORRIGIDO: Usa web3.keccak
#     return web3.keccak(text=f"{matricula}-{SEGREDO_ELEICAO}").hex()

# def _get_all_leaves(lista_de_matriculas: List[str]) -> List[str]:
#     """Gera e ordena todas as folhas (nullifiers)."""
#     leaves = [_get_nullifier(m) for m in lista_de_matriculas]
#     leaves.sort()
#     return leaves

# def _hash_pair(left: str, right: str) -> str:
#     """Combina e hasheia um par de hashes (strings hex)."""
#     if left > right: left, right = right, left
#     # CORRIGIDO: Usa web3.keccak e concatena bytes
#     left_bytes = bytes.fromhex(left.replace("0x", ""))
#     right_bytes = bytes.fromhex(right.replace("0x", ""))
#     return web3.keccak(left_bytes + right_bytes).hex()

# def _build_tree_levels(leaves: List[str]) -> List[List[str]]:
#     """Constrói a árvore e retorna todos os níveis, de baixo para cima."""
#     if not leaves: 
#         # CORRIGIDO: Usa web3.keccak
#         return [[ web3.keccak(b"").hex() ]] if not leaves else [[]]
        
#     levels = [leaves]
#     current_level = leaves
    
#     while len(current_level) > 1:
#         new_level = []
#         for i in range(0, len(current_level), 2):
#             left = current_level[i]
#             right = current_level[i+1] if (i+1) < len(current_level) else left
#             parent_hash = _hash_pair(left, right)
#             new_level.append(parent_hash)
        
#         levels.append(new_level)
#         current_level = new_level
    
#     return levels # Retorna [folhas, nivel1, nivel2, ..., raiz]

# def _get_merkle_proof(leaf_hash: str, levels: List[List[str]]) -> List[str]:
#     """Obtém a prova Merkle para uma folha específica."""
#     proof = []
#     current_hash = leaf_hash
    
#     for i in range(len(levels) - 1):
#         current_level = levels[i]
#         try:
#             idx = current_level.index(current_hash)
#         except ValueError:
#             raise Exception("Erro de lógica: Folha não encontrada na árvore.")
#         if idx % 2 == 0:
#             sibling_idx = idx + 1
#             sibling = current_level[sibling_idx] if sibling_idx < len(current_level) else current_hash
#         else:
#             sibling_idx = idx - 1
#             sibling = current_level[sibling_idx]
        
#         proof.append(f"0x{sibling.replace('0x','')}") # Adiciona o irmão à prova
        
#         left, right = (current_hash, sibling) if idx % 2 == 0 else (sibling, current_hash)
#         current_hash = _hash_pair(left, right)

#     root = levels[-1][0] if levels[-1] else web3.keccak(b"").hex()
#     if current_hash != root:
#         raise Exception("Falha ao construir a prova, a raiz não bate.")

#     return proof

# # --- Função de Simulação de Scraping ---
# def _simular_scraping_sigaa(sigaa_link: str) -> List[str]:
#     print(f"Simulando scraping do link: {sigaa_link}")
#     return [
#         "20169004867", "20229038498", "20189016391", "2019011094", 
#         "20239005810", "20179128705", "20259019706", "20229047951"
#     ]

# # --- Função Auxiliar Web3 (sem mudanças) ---
# def get_contract_instance(contract_address: str):
#     """Pega uma instância do contrato web3 para interagir."""
#     try:
#         address = web3.to_checksum_address(contract_address)
#         return web3.eth.contract(address=address, abi=CONTRACT_ABI)
#     except Exception as e:
#         print(f"Erro ao carregar contrato {contract_address}: {e}")
#         return None

# # --- Rota 1 (Prepare Deploy) ---
# @app.route('/api/prepare-deploy', methods=['POST'])
# def prepare_deploy_info():
#     data = request.json
#     sigaa_link = data.get('sigaa_link')
#     if not sigaa_link: abort(400, description="Link do SIGAA é obrigatório.")
#     try:
#         lista_alunos = _simular_scraping_sigaa(sigaa_link)
#         leaves = _get_all_leaves(lista_alunos)
#         levels = _build_tree_levels(leaves)
#         merkle_root = levels[-1][0] if levels[-1] else web3.keccak(b"").hex()
#         merkle_root_hex = f"0x{merkle_root.replace('0x','')}"
#         print(f"Merkle Root (Keccak256/Web3) gerada: {merkle_root_hex}")
        
#         return jsonify(
#             abi=CONTRACT_ABI, 
#             bytecode=json.load(open(CONTRACT_JSON_PATH))['bytecode'],
#             merkleRoot=merkle_root_hex,
#             relayerAddress=RELAYER_ADDRESS
#         )
#     except Exception as e: 
#         print(f"Erro ao preparar deploy: {e}")
#         abort(500, description=f"Erro ao gerar Merkle Root: {e}")

# # --- Rota 2 (Criar Votação) ---
# @app.route('/api/criar-votacao', methods=['POST'])
# def criar_votacao():
#     data = request.json
#     if not all(k in data for k in ['sigaa_link', 'admin_wallet', 'contract_address', 'campus', 'curso']):
#         abort(400, description="Dados incompletos recebidos.")
#     try:
#         nova_votacao = Votacao(
#             campus=data['campus'], curso=data['curso'], sigaa_link=data['sigaa_link'],
#             admin_wallet=data['admin_wallet'], contract_address=data['contract_address']
#         )
#         db.session.add(nova_votacao)
#         db.session.commit()
#     except Exception as e:
#         db.session.rollback()
#         abort(500, description=f"Erro ao salvar dados no banco: {e}")
#     return jsonify(message="Votação salva com sucesso no banco de dados!"), 201

# # --- Rota 3 (Listar Votações) ---
# @app.route('/api/votacoes', methods=['GET'])
# def get_votacoes():
#     try:
#         search_term = request.args.get('search', '') 
#         query = Votacao.query
#         if search_term:
#             search_filter = f"%{search_term}%"
#             query = query.filter(or_(Votacao.campus.ilike(search_filter), Votacao.curso.ilike(search_filter), Votacao.admin_wallet.ilike(search_filter)))
#         votacoes = query.order_by(Votacao.id.desc()).all()
#         resultado = [{"id": v.id, "campus": v.campus, "curso": v.curso, "admin_wallet": v.admin_wallet, "contract_address": v.contract_address} for v in votacoes]
#         return jsonify(resultado), 200
#     except Exception as e: abort(500, description=f"Erro ao buscar dados no servidor: {e}")

# # --- Rota 4 (Inscrever Chapa) ---
# @app.route('/api/inscrever-chapa', methods=['POST'])
# def inscrever_chapa():
#     data = request.json
#     if not all(k in data for k in ['contract_address', 'chapa_name', 'chapa_proposal']):
#         abort(400, description="Dados incompletos para inscrever chapa.")
#     try:
#         votacao = Votacao.query.filter_by(contract_address=data['contract_address']).first()
#         if not votacao: abort(404, description="Votação não encontrada.")
        
#         numero_atual = Chapa.query.filter_by(votacao_id=votacao.id).count()
#         novo_numero_chapa = numero_atual + 1

#         nova_chapa = Chapa(
#             nome_chapa=data['chapa_name'], proposta=data['chapa_proposal'],
#             numero_chapa=novo_numero_chapa, votacao_id=votacao.id
#         )
#         db.session.add(nova_chapa)
#         db.session.commit()
#         return jsonify(message="Chapa inscrita com sucesso!", numero_chapa=novo_numero_chapa), 201
#     except Exception as e:
#         db.session.rollback()
#         abort(500, description=f"Erro interno ao salvar a chapa: {e}")

# # --- ROTA 5 (AUTENTICAR) ---
# @app.route('/api/autenticar', methods=['POST'])
# def autenticar_aluno():
#     data = request.json
#     contract_address = data.get('contract_address')
#     matricula_aluno = data.get('matricula')
    
#     if not contract_address or not matricula_aluno:
#         abort(400, description="Endereço do contrato e matrícula são obrigatórios.")

#     try:
#         votacao = Votacao.query.filter_by(contract_address=contract_address).first()
#         if not votacao:
#             abort(404, description="Votação não encontrada.")

#         lista_completa_matriculas = _simular_scraping_sigaa(votacao.sigaa_link)
        
#         if matricula_aluno not in lista_completa_matriculas:
#             return jsonify({"autenticado": False, "mensagem": "Matrícula não encontrada nesta votação."}), 403
            
#         nullifier_hash = _get_nullifier(matricula_aluno)
#         nullifier_hash_bytes = bytes.fromhex(nullifier_hash.replace("0x", ""))
        
#         contrato = get_contract_instance(votacao.contract_address)
#         if not contrato:
#             abort(500, description="Falha ao carregar o contrato na rede.")
        
#         print(f"Checando nullifier: 0x{nullifier_hash}")
#         ja_votou = contrato.functions.nullifiersUsados(nullifier_hash_bytes).call()
        
#         if ja_votou:
#             print("VOTO DUPLO DETECTADO!")
#             return jsonify({"autenticado": False, "mensagem": "Esta matrícula já foi usada para votar."}), 403

#         all_leaves = _get_all_leaves(lista_completa_matriculas)
#         tree_levels = _build_tree_levels(all_leaves)
#         merkle_proof = _get_merkle_proof(nullifier_hash, tree_levels)
        
#         chapas_db = Chapa.query.filter_by(votacao_id=votacao.id).order_by(Chapa.numero_chapa.asc()).all()
#         chapas_json = [{"numero": c.numero_chapa, "nome": c.nome_chapa, "proposta": c.proposta} for c in chapas_db]

#         print(f"\n[AUTENTICAÇÃO BEM-SUCEDIDA] Matrícula: {matricula_aluno}")
        
#         return jsonify({
#             "autenticado": True,
#             "merkleProof": merkle_proof,
#             "nullifierHash": f"0x{nullifier_hash}",
#             "chapas": chapas_json
#         }), 200

#     except Exception as e:
#         print(f"Erro na autenticação: {e}")
#         abort(500, description=f"Erro interno no servidor: {e}")


# # --- ROTA 6 - Enviar Voto ---
# @app.route('/api/votar', methods=['POST'])
# def relayer_votar():
#     data = request.json
    
#     contract_address = data.get('contract_address')
#     voto_criptografado = data.get('votoCriptografado') 
#     recibo_do_aluno = data.get('reciboDoAluno')     
#     nullifier_hash = data.get('nullifierHash')       
#     merkle_proof = data.get('merkleProof')         

#     if not all([contract_address, voto_criptografado, recibo_do_aluno, nullifier_hash, merkle_proof]):
#         abort(400, description="Dados da transação de voto incompletos.")
        
#     try:
#         print(f"\n[RELAYER]: Recebido pedido de voto para o contrato {contract_address}")
        
#         contrato = get_contract_instance(contract_address)
#         if not contrato:
#             abort(500, description="Falha ao carregar o contrato na rede.")
            
#         voto_bytes = voto_criptografado.encode('utf-8')
#         recibo_bytes = bytes.fromhex(recibo_do_aluno.replace('0x', ''))
#         nullifier_bytes = bytes.fromhex(nullifier_hash.replace('0x', ''))
#         proof_bytes_list = [bytes.fromhex(p.replace('0x', '')) for p in merkle_proof]

#         print(f"[RELAYER]: Construindo transação para {RELAYER_ADDRESS}...")
        
#         nonce = web3.eth.get_transaction_count(RELAYER_ADDRESS)
        
#         tx = contrato.functions.votar(
#             voto_bytes,
#             recibo_bytes,
#             nullifier_bytes,
#             proof_bytes_list
#         ).build_transaction({
#             'from': RELAYER_ADDRESS,
#             'nonce': nonce,
#             'gas': 300000 # Aumenta o limite de gás para a verificação da prova
#         })
        
#         print("[RELAYER]: Assinando transação...")
#         signed_tx = web3.eth.account.sign_transaction(tx, private_key=RELAYER_PRIVATE_KEY)
        
#         print("[RELAYER]: Enviando transação para a rede...")
#         tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
#         print(f"[RELAYER]: Transação enviada! Hash: {tx_hash.hex()}. Aguardando recibo...")
#         tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
#         if tx_receipt.status == 0:
#             raise Exception("A transação foi revertida pelo contrato. (Provavelmente voto duplo ou prova inválida)")

#         print(f"[RELAYER]: Voto computado com sucesso! Bloco: {tx_receipt.blockNumber}")
        
#         return jsonify({
#             "sucesso": True,
#             "mensagem": "Voto computado com sucesso!",
#             "tx_hash": tx_hash.hex(),
#             "blockNumber": tx_receipt.blockNumber
#         }), 200

#     except Exception as e:
#         print(f"ERRO NO RELAYER: {e}")
#         return jsonify({"sucesso": False, "mensagem": f"Erro do Relayer: {e}"}), 500


# if __name__ == '__main__':
#     with app.app_context():
#         db.create_all()
    
#     app.run(debug=True, port=5000)








from flask import Flask, request, jsonify, abort, redirect, url_for, session
from flask_cors import CORS
import json
import os
import hashlib
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_
from typing import Tuple, List, Dict
from web3 import Web3

# NOVO: Imports do Google OAuth
from google_auth_oauthlib.flow import Flow 
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# NOVO: Import para normalizar nomes
from unidecode import unidecode

app = Flask(__name__)
# CORS(app)
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:8000", "http://localhost:8000"])
# NOVO: Chave secreta para a sessão do Flask (necessária para o OAuth)
# Troque por qualquer string aleatória e segura
app.secret_key = 'chave-secreta-muito-segura-trocar-depois' 

# --- CONFIGURAÇÃO WEB3 E DO RELAYER ---
RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/8FaeERMnNWGASM_ePLx7I"
_RELAYER_ADDRESS_RAW = "0x21dcfc33545acecf7bffa27b33261deeb6667622" 
RELAYER_PRIVATE_KEY = "4910711ef868cdbeee8ff20ef7787b4402f609ba1c03f9b05db4c97cb396b53d"

CONTRACT_JSON_PATH = 'contract.json'
if not os.path.exists(CONTRACT_JSON_PATH):
    print("ERRO: contract.json não encontrado.")
    exit()
with open(CONTRACT_JSON_PATH, 'r') as f:
    CONTRACT_ABI = json.load(f).get('abi')
    if not CONTRACT_ABI:
        print("ERRO: ABI não encontrado em contract.json")
        exit()

web3 = Web3(Web3.HTTPProvider(RPC_URL))
RELAYER_ADDRESS = web3.to_checksum_address(_RELAYER_ADDRESS_RAW)
if not web3.is_connected():
    print(f"ERRO: Falha ao conectar ao nó Ethereum em {RPC_URL}")
    exit()
else:
    print(f"Conectado ao nó Ethereum (Chain ID: {web3.eth.chain_id})")

# --- NOVO: Configuração do Google OAuth ---
# Garante que o arquivo baixado do Google existe
CLIENT_SECRETS_FILE = "client_secret.json"
if not os.path.exists(CLIENT_SECRETS_FILE):
    print(f"ERRO: {CLIENT_SECRETS_FILE} não encontrado. Faça o download no Google Cloud Console.")
    exit()
    
# Pega o Client ID para verificar o token
with open(CLIENT_SECRETS_FILE, 'r') as f:
    GOOGLE_CLIENT_ID = json.load(f)['web']['client_id']
    
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1' # Permite HTTP para testes locais
SCOPES = ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']


# --- Configuração do Banco de Dados SQLite ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'votacoes.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Modelos do Banco de Dados (sem mudanças) ---
class Votacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    campus = db.Column(db.String(100), nullable=False)
    curso = db.Column(db.String(100), nullable=False)
    sigaa_link = db.Column(db.String(255), nullable=False)
    admin_wallet = db.Column(db.String(42), nullable=False) 
    contract_address = db.Column(db.String(42), nullable=False, unique=True)
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

# --- ATUALIZADO: Função de Simulação de Scraping ---
def _simular_scraping_sigaa(sigaa_link: str) -> Dict[str, str]:
    """
    Simula o scraping, retornando um DICIONÁRIO
    mapeando MATRÍCULA -> NOME
    """
    print(f"Simulando scraping do link: {sigaa_link}")
    # (Dados da sua apresentação)
    return {
        "20169004867": "ADAILTON SILVA PALHANO",
        "20229038498": "ALAN NUNES VELOSO NOGUEIRA",
        "20189016391": "ALAN VITOR BRITO AMORIM",
        "2019011094": "ALEXANDRE JOSE CANTUARIA MONTEIRO ROSA FILHO",
        "20239005810": "ALEX SOARES NUNES",
        "20179128705": "ALINE CRAVIEE FONSECA",
        "20259019706": "ALISSON FLAYNN DE OLIVEIRA PAULO",
        "20229020690": "GUILHERME MANCINI DE SOUSA BARROSO"
    }

# --- NOVO: Função para Normalizar Nomes ---
def normalize_name(name: str) -> str:
    """
    Limpa e normaliza um nome para comparação.
    Ex: "ALAN NUNES VELOSO NOGUEIRA" -> "alan nunes veloso nogueira"
    Ex: "Alan Nunes" -> "alan nunes"
    """
    if not name: return ""
    name = unidecode(name) # Remove acentos
    name = name.lower()   # Converte para minúsculas
    name = ' '.join(name.split()) # Remove espaços extras
    return name


# --- Rota 1 (Prepare Deploy) (ATUALIZADA) ---
@app.route('/api/prepare-deploy', methods=['POST'])
def prepare_deploy_info():
    data = request.json
    sigaa_link = data.get('sigaa_link')
    if not sigaa_link: abort(400, description="Link do SIGAA é obrigatório.")
    try:
        # Pega o dicionário de alunos
        mapa_alunos = _simular_scraping_sigaa(sigaa_link)
        # Pega apenas as matrículas para a Merkle Tree
        lista_de_matriculas = list(mapa_alunos.keys())
        
        leaves = _get_all_leaves(lista_de_matriculas)
        levels = _build_tree_levels(leaves)
        merkle_root = levels[-1][0] if levels[-1] else web3.keccak(b"").hex()
        merkle_root_hex = f"0x{merkle_root.replace('0x','')}"
        
        return jsonify(
            abi=CONTRACT_ABI, 
            bytecode=json.load(open(CONTRACT_JSON_PATH))['bytecode'],
            merkleRoot=merkle_root_hex,
            relayerAddress=RELAYER_ADDRESS
        )
    except Exception as e: 
        print(f"Erro ao preparar deploy: {e}")
        abort(500, description=f"Erro ao gerar Merkle Root: {e}")

# --- Rota 2 (Criar Votação) (Sem mudanças) ---
@app.route('/api/criar-votacao', methods=['POST'])
def criar_votacao():
    # ... (código sem mudanças) ...
    data = request.json
    if not all(k in data for k in ['sigaa_link', 'admin_wallet', 'contract_address', 'campus', 'curso']):
        abort(400, description="Dados incompletos recebidos.")
    try:
        nova_votacao = Votacao(
            campus=data['campus'], curso=data['curso'], sigaa_link=data['sigaa_link'],
            admin_wallet=data['admin_wallet'], contract_address=data['contract_address']
        )
        db.session.add(nova_votacao)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        abort(500, description=f"Erro ao salvar dados no banco: {e}")
    return jsonify(message="Votação salva com sucesso no banco de dados!"), 201

# --- Rota 3 (Listar Votações) (Sem mudanças) ---
@app.route('/api/votacoes', methods=['GET'])
def get_votacoes():
    # ... (código sem mudanças) ...
    try:
        search_term = request.args.get('search', '') 
        query = Votacao.query
        if search_term:
            search_filter = f"%{search_term}%"
            query = query.filter(or_(Votacao.campus.ilike(search_filter), Votacao.curso.ilike(search_filter), Votacao.admin_wallet.ilike(search_filter)))
        votacoes = query.order_by(Votacao.id.desc()).all()
        resultado = [{"id": v.id, "campus": v.campus, "curso": v.curso, "admin_wallet": v.admin_wallet, "contract_address": v.contract_address} for v in votacoes]
        return jsonify(resultado), 200
    except Exception as e: abort(500, description=f"Erro ao buscar dados no servidor: {e}")

# --- Rota 4 (Inscrever Chapa) (Sem mudanças) ---
@app.route('/api/inscrever-chapa', methods=['POST'])
def inscrever_chapa():
    # ... (código sem mudanças) ...
    data = request.json
    if not all(k in data for k in ['contract_address', 'chapa_name', 'chapa_proposal']):
        abort(400, description="Dados incompletos para inscrever chapa.")
    try:
        votacao = Votacao.query.filter_by(contract_address=data['contract_address']).first()
        if not votacao: abort(404, description="Votação não encontrada.")
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


# --- NOVO: ROTA 5 - Iniciar Login com Google ---
@app.route('/api/auth/google')
def auth_google():
    """
    Recebe a matrícula do frontend, busca o nome no SIGAA,
    salva na sessão e redireciona para o Google.
    """
    contract_address = request.args.get('contract_address')
    matricula = request.args.get('matricula')
    
    if not contract_address or not matricula:
        abort(400, description="Matrícula e endereço do contrato são necessários.")

    # Busca a votação para pegar o link do SIGAA
    votacao = Votacao.query.filter_by(contract_address=contract_address).first()
    if not votacao:
        abort(404, description="Votação não encontrada.")

    # Busca o nome na lista pública
    mapa_alunos = _simular_scraping_sigaa(votacao.sigaa_link)
    if matricula not in mapa_alunos:
        abort(403, description="Matrícula não encontrada na lista pública desta votação.")
        
    nome_sigaa = mapa_alunos[matricula]

    # Salva os dados na sessão para usar no callback
    session['contract_address'] = contract_address
    session['matricula'] = matricula
    session['nome_sigaa_normalizado'] = normalize_name(nome_sigaa)
    
    print(f"[AUTH INICIADA] Matrícula: {matricula}, Nome SIGAA: {nome_sigaa}")

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=url_for('autenticar_callback', _external=True)
    )
    
    authorization_url, state = flow.authorization_url()
    session['state'] = state
    return redirect(authorization_url)

# --- NOVO: ROTA 6 - Callback do Google ---
@app.route('/api/autenticar-callback')
def autenticar_callback():
    """
    Recebe a resposta do Google, COMPARA OS NOMES,
    e retorna as provas Merkle e as chapas.
    """
    try:
        # Segurança: Verifica o 'state'
        if request.args.get('state') != session.get('state'):
            abort(403, "Erro de estado (CSRF).")

        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=url_for('autenticar_callback', _external=True)
        )
        
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials
        
        # Pega as credenciais e verifica o id_token
        id_info = id_token.verify_oauth2_token(
            credentials.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # --- A VERIFICAÇÃO DE SEGURANÇA (COMO VOCÊ PEDIU) ---
        email_google = id_info.get('email')
        dominio_google = id_info.get('hd')
        nome_google = id_info.get('name')
        
        print(f"[AUTH GOOGLE] E-mail verificado: {email_google}, Nome: {nome_google}")

        # 1. Verifica se é institucional
        if dominio_google != "ufpi.edu.br":
             return "<h1>Erro: Apenas e-mails @ufpi.edu.br são permitidos.</h1><script>window.close();</script>", 403

        # 2. Pega os dados da sessão
        matricula = session.get('matricula')
        contract_address = session.get('contract_address')
        nome_sigaa_normalizado = session.get('nome_sigaa_normalizado')
        
        # 3. Normaliza e COMPARA OS NOMES
        nome_google_normalizado = normalize_name(nome_google)
        
        print(f"[COMPARAÇÃO] SIGAA: '{nome_sigaa_normalizado}' vs Google: '{nome_google_normalizado}'")
        
        # ATENÇÃO: Esta é a verificação FRÁGIL que você pediu.
        # Se o nome no Google não for IDÊNTICO ao do SIGAA (após normalização),
        # o aluno legítimo será bloqueado.
        if nome_sigaa_normalizado not in nome_google_normalizado and \
           nome_google_normalizado not in nome_sigaa_normalizado:
            print("[FALHA NA VERIFICAÇÃO DE NOME]")
            return f"<h1>Erro: O nome da sua conta Google ({nome_google}) não corresponde ao nome da matrícula ({nome_sigaa_normalizado}).", 403

        print("[VERIFICAÇÃO DE NOME OK!]")
        
        # --- CHECAGEM DE VOTO DUPLO ---
        nullifier_hash = _get_nullifier(matricula)
        nullifier_hash_bytes = bytes.fromhex(nullifier_hash.replace("0x", ""))
        
        contrato = get_contract_instance(contract_address)
        if not contrato: abort(500, "Falha ao carregar o contrato.")
        
        ja_votou = contrato.functions.nullifiersUsados(nullifier_hash_bytes).call()
        if ja_votou:
            return "<h1>Erro: Esta matrícula já foi usada para votar.</h1><script>window.close();</script>", 403
        
        # --- SUCESSO! GERA AS PROVAS ---
        votacao = Votacao.query.filter_by(contract_address=contract_address).first()
        mapa_alunos = _simular_scraping_sigaa(votacao.sigaa_link)
        lista_completa_matriculas = list(mapa_alunos.keys())
        
        all_leaves = _get_all_leaves(lista_completa_matriculas)
        tree_levels = _build_tree_levels(all_leaves)
        merkle_proof = _get_merkle_proof(nullifier_hash, tree_levels)
        
        chapas_db = Chapa.query.filter_by(votacao_id=votacao.id).order_by(Chapa.numero_chapa.asc()).all()
        chapas_json = [{"numero": c.numero_chapa, "nome": c.nome_chapa, "proposta": c.proposta} for c in chapas_db]

        # Salva as provas na sessão para o frontend pegar
        session['vote_data'] = {
            "autenticado": True,
            "merkleProof": merkle_proof,
            "nullifierHash": f"0x{nullifier_hash}",
            "chapas": chapas_json,
            "contract_address": contract_address,
            "aluno_info": {"email": email_google, "nome": nome_google}
        }
        
        # Fecha o pop-up e avisa o frontend
        return "<script>window.opener.postMessage('auth_success', '*'); window.close();</script>"

    except Exception as e:
        print(f"Erro no callback do Google: {e}")
        return f"<h1>Erro interno do servidor: {e}</h1><script>window.close();</script>", 500

# --- NOVO: ROTA 7 - Frontend Pega os Dados da Sessão ---
@app.route('/api/get-vote-data')
def get_vote_data():
    """
    O frontend chama esta rota após o pop-up fechar para pegar
    os dados da votação que foram salvos na sessão.
    """
    vote_data = session.pop('vote_data', None)
    
    if not vote_data:
        return jsonify({"autenticado": False, "mensagem": "Falha na autenticação ou sessão expirada."}), 404
        
    print(f"\n[DADOS ENTREGUES] Entregando provas para {vote_data['aluno_info']['email']}")
    return jsonify(vote_data), 200

# --- ROTA 8 (antiga Rota 6) - Enviar Voto ---
@app.route('/api/votar', methods=['POST'])
def relayer_votar():
    # ... (código sem mudanças) ...
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
    with app.app_context():
        db.create_all()
    
    app.run(debug=True, port=5000)