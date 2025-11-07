from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import json
import os
import hashlib
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_

app = Flask(__name__)
CORS(app)

CONTRACT_JSON_PATH = 'contract.json'
RELAYER_ADDRESS = "0x21dcfc33545acecf7bffa27b33261deeb6667622" 

# --- Configuração do Banco de Dados SQLite ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'votacoes.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Modelos do Banco de Dados ---

class Votacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    campus = db.Column(db.String(100), nullable=False)
    curso = db.Column(db.String(100), nullable=False)
    sigaa_link = db.Column(db.String(255), nullable=False)
    admin_wallet = db.Column(db.String(42), nullable=False) 
    contract_address = db.Column(db.String(42), nullable=False, unique=True)
    
    # NOVO: Relacionamento para que Votacao.chapas funcione
    chapas = db.relationship('Chapa', backref='votacao', lazy=True)

# NOVO: Tabela para armazenar as chapas inscritas
class Chapa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome_chapa = db.Column(db.String(100), nullable=False)
    proposta = db.Column(db.Text, nullable=False)
    numero_chapa = db.Column(db.Integer, nullable=False) # Gerado pelo sistema
    
    # Chave estrangeira para linkar a chapa à sua votação
    votacao_id = db.Column(db.Integer, db.ForeignKey('votacao.id'), nullable=False)


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

# --- Rota 1 (Prepare Deploy) (Sem mudanças) ---
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

# --- Rota 2 (Criar Votação) (Sem mudanças) ---
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

    print("\n[SALVO NO DB]:", data)
    return jsonify(message="Votação salva com sucesso no banco de dados!"), 201

# --- Rota 3 (Listar Votações) (Sem mudanças) ---
@app.route('/api/votacoes', methods=['GET'])
def get_votacoes():
    try:
        search_term = request.args.get('search', '') 
        query = Votacao.query
        
        if search_term:
            search_filter = f"%{search_term}%"
            query = query.filter(
                or_(
                    Votacao.campus.ilike(search_filter),
                    Votacao.curso.ilike(search_filter),
                    Votacao.admin_wallet.ilike(search_filter)
                )
            )
            
        votacoes = query.order_by(Votacao.id.desc()).all()
        
        resultado = []
        for votacao in votacoes:
            resultado.append({
                "id": votacao.id,
                "campus": votacao.campus,
                "curso": votacao.curso,
                "admin_wallet": votacao.admin_wallet,
                "contract_address": votacao.contract_address
            })
            
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"Erro ao buscar votações: {e}")
        abort(500, description="Erro ao buscar dados no servidor.")


# --- NOVO: ROTA 4 - Inscrever Chapa ---
@app.route('/api/inscrever-chapa', methods=['POST'])
def inscrever_chapa():
    data = request.json
    contract_address = data.get('contract_address')
    chapa_name = data.get('chapa_name')
    chapa_proposal = data.get('chapa_proposal')

    if not all([contract_address, chapa_name, chapa_proposal]):
        abort(400, description="Dados incompletos para inscrever chapa.")

    try:
        # 1. Encontra a votação pai no banco de dados
        votacao = Votacao.query.filter_by(contract_address=contract_address).first()
        if not votacao:
            abort(404, description="Votação não encontrada.")
            
        # 2. LÓGICA DE NEGÓCIO: Calcula o número da chapa
        # Conta quantas chapas *já existem* para esta votação
        numero_atual = Chapa.query.filter_by(votacao_id=votacao.id).count()
        novo_numero_chapa = numero_atual + 1

        # 3. Cria o novo objeto Chapa
        nova_chapa = Chapa(
            nome_chapa=chapa_name,
            proposta=chapa_proposal,
            numero_chapa=novo_numero_chapa,
            votacao_id=votacao.id # Linka com a Votacao
        )
        
        # 4. Salva no banco de dados
        db.session.add(nova_chapa)
        db.session.commit()

        print("\n===================================")
        print("NOVA CHAPA INSCRITA NO BANCO:")
        print(f"  Votação ID: {votacao.id} ({votacao.campus})")
        print(f"  Nome Chapa: {chapa_name}")
        print(f"  Número Gerado: {novo_numero_chapa}")
        print("===================================\n")

        # 5. Retorna sucesso com o número gerado
        return jsonify(
            message="Chapa inscrita com sucesso!",
            numero_chapa=novo_numero_chapa
        ), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao inscrever chapa: {e}")
        abort(500, description="Erro interno ao salvar a chapa.")


if __name__ == '__main__':
    with app.app_context():
        # Isso irá criar as tabelas 'votacao' E 'chapa' se não existirem
        db.create_all()
    
    app.run(debug=True, port=5000)