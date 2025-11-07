from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import json
import os
import hashlib
from flask_sqlalchemy import SQLAlchemy # NOVO: Importa o DB

app = Flask(__name__)
CORS(app)

CONTRACT_JSON_PATH = 'contract.json'
RELAYER_ADDRESS = "0x21dcfc33545acecf7bffa27b33261deeb6667622"

# --- NOVO: Configuração do Banco de Dados SQLite ---
# 'app.root_path' é a pasta onde o app.py está.
# O banco 'votacoes.db' será criado lá.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'votacoes.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- NOVO: Definição do Modelo do Banco de Dados ---
# Isso define a "tabela" onde as votações serão salvas.
class Votacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    campus = db.Column(db.String(100), nullable=False)
    curso = db.Column(db.String(100), nullable=False)
    sigaa_link = db.Column(db.String(255), nullable=False)
    admin_wallet = db.Column(db.String(42), nullable=False) # Carteira do Proponente
    contract_address = db.Column(db.String(42), nullable=False, unique=True) # Endereço do Contrato

# --- Lógica da Merkle Tree (Sem mudanças) ---

def _hash_pair(left: str, right: str) -> str:
    return hashlib.sha256((left + right).encode('utf-8')).hexdigest()

def _build_tree_recursive(leaves: list[str]) -> str:
    if not leaves: return hashlib.sha256(b"").hexdigest()
    if len(leaves) == 1: return leaves[0]
    new_level = []
    for i in range(0, len(leaves), 2):
        left = leaves[i]
        right = leaves[i+1] if (i+1) < len(leaves) else left
        if left > right: left, right = right, left
        new_level.append(_hash_pair(left, right))
    return _build_tree_recursive(new_level)

def _gerar_merkle_root(lista_de_matriculas: list[str]) -> str:
    print("Gerando Merkle Tree (com hashlib manual)...")
    segredo_eleicao = "ufpi-eleicao-2025.2" 
    leaves = [hashlib.sha256(f"{m}-{segredo_eleicao}".encode()).hexdigest() for m in lista_de_matriculas]
    leaves.sort()
    merkle_root = _build_tree_recursive(leaves)
    merkle_root_hex = f"0x{merkle_root}"
    print(f"Merkle Root gerada: {merkle_root_hex}")
    return merkle_root_hex

def _simular_scraping_sigaa(sigaa_link: str) -> list[str]:
    print(f"Simulando scraping do link: {sigaa_link}")
    return [
        "20169004867", "20229038498", "20189016391", "20199011094", 
        "20239005810", "20179128705", "20259019706", "20229047951"
    ]

# --- Rota 1 (Sem mudanças) ---
@app.route('/api/prepare-deploy', methods=['POST'])
def prepare_deploy_info():
    data = request.json
    sigaa_link = data.get('sigaa_link')
    if not sigaa_link: abort(400, description="Link do SIGAA é obrigatório.")
    
    try:
        lista_alunos = _simular_scraping_sigaa(sigaa_link)
        merkle_root = _gerar_merkle_root(lista_alunos)
    except Exception as e: abort(500, description=f"Erro ao gerar Merkle Root: {e}")
    
    if not os.path.exists(CONTRACT_JSON_PATH):
        abort(500, description="Arquivo de contrato não encontrado.")
    
    try:
        with open(CONTRACT_JSON_PATH, 'r') as f: contract_data = json.load(f)
        abi = contract_data.get('abi')
        bytecode = contract_data.get('bytecode')
        if not abi or not bytecode: abort(500, description="ABI ou Bytecode inválido.")
            
        return jsonify(
            abi=abi, 
            bytecode=bytecode,
            merkleRoot=merkle_root,
            relayerAddress=RELAYER_ADDRESS
        )
    except Exception as e: abort(500, description=f"Erro ao ler o arquivo: {e}")

# --- ROTA 2 (ATUALIZADA PARA USAR O BANCO DE DADOS) ---
@app.route('/api/criar-votacao', methods=['POST'])
def criar_votacao():
    data = request.json
    
    sigaa_link = data.get('sigaa_link')
    admin_wallet = data.get('admin_wallet')
    contract_address = data.get('contract_address')
    campus = data.get('campus')
    curso = data.get('curso')

    if not all([sigaa_link, admin_wallet, contract_address, campus, curso]):
        abort(400, description="Dados incompletos recebidos.")

    # NOVO: Salva os dados no banco de dados
    try:
        nova_votacao = Votacao(
            campus=campus,
            curso=curso,
            sigaa_link=sigaa_link,
            admin_wallet=admin_wallet,
            contract_address=contract_address
        )
        db.session.add(nova_votacao)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao salvar no DB: {e}")
        abort(500, description="Erro ao salvar dados no banco.")

    # Imprime no console (como antes) para confirmar
    print("\n===================================")
    print("SALVO COM SUCESSO NO BANCO 'votacoes.db':")
    print(f"  Campus: {campus}")
    print(f"  Curso: {curso}")
    print(f"  Contrato: {contract_address}")
    print("===================================\n")

    return jsonify(message="Votação salva com sucesso no banco de dados!"), 201


if __name__ == '__main__':
    # NOVO: Cria o arquivo do banco de dados (se não existir)
    with app.app_context():
        db.create_all()
    
    app.run(debug=True, port=5000)