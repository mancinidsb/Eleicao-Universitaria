from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import json
import os
import hashlib # Importa a biblioteca padrão do Python

app = Flask(__name__)
CORS(app)

CONTRACT_JSON_PATH = 'contract.json'

# Defina o endereço da sua carteira Relayer aqui
# (A conta do App que vai pagar o gás dos votos dos alunos)
RELAYER_ADDRESS = "0x21dcfc33545acecf7bffa27b33261deeb6667622" 


def _simular_scraping_sigaa(sigaa_link: str) -> list[str]:
    """
    FUNÇÃO DE SIMULAÇÃO:
    No seu projeto final, você usaria 'requests' e 'BeautifulSoup' aqui
    para raspar o 'sigaa_link' e extrair a lista de matrículas.
    Por enquanto, vamos usar uma lista fixa.
    """
    print(f"Simulando scraping do link: {sigaa_link}")
    # Lista de alunos da sua apresentação
    lista_de_matriculas = [
        "20169004867", "20229038498", "20189016391",
        "20199011094", "20239005810", "20179128705",
        "20259019706", "20229047951", "20179135666",
        "20229020161", "20249021003", "20179135871"
    ]
    # ... adicione todas as outras matrículas
    return lista_de_matriculas

# --- INÍCIO: LÓGICA MANUAL DA MERKLE TREE ---

def _hash_pair(left: str, right: str) -> str:
    """Combina e hasheia um par de hashes (strings hex)."""
    # Concatena as strings e codifica para bytes antes de hashear
    # A ordem (left, right) é importante.
    return hashlib.sha256((left + right).encode('utf-8')).hexdigest()

def _build_tree_recursive(leaves: list[str]) -> str:
    """Função auxiliar recursiva para construir a árvore."""
    if not leaves:
        return hashlib.sha256(b"").hexdigest() # Raiz para árvore vazia
    
    if len(leaves) == 1:
        return leaves[0] # Chegamos à raiz

    new_level = []
    # Processa as folhas em pares
    for i in range(0, len(leaves), 2):
        left = leaves[i]
        # Se for um número ímpar de folhas, duplica a última
        right = leaves[i+1] if (i+1) < len(leaves) else left
        
        # Garante a ordem para evitar ataques (opcional, mas bom)
        if left > right:
            left, right = right, left
            
        new_level.append(_hash_pair(left, right))
        
    # Chama recursivamente com o novo nível
    return _build_tree_recursive(new_level)

def _gerar_merkle_root(lista_de_matriculas: list[str]) -> str:
    """
    Gera a Merkle Root a partir da lista de alunos (IMPLEMENTAÇÃO MANUAL).
    """
    print("Gerando Merkle Tree (com hashlib manual)...")
    
    segredo_eleicao = "ufpi-eleicao-2025.2" 
    leaves = [] # Lista de folhas (hashes dos alunos)

    for matricula in lista_de_matriculas:
        # O 'nullifier' (hash) é o que impede o voto duplo.
        nullifier_hex = hashlib.sha256(
            f"{matricula}-{segredo_eleicao}".encode()
        ).hexdigest()
        leaves.append(nullifier_hex)
    
    # É uma boa prática ordenar as folhas para uma raiz determinística
    leaves.sort()
    
    # Constrói a árvore
    merkle_root = _build_tree_recursive(leaves)
    merkle_root_hex = f"0x{merkle_root}"
    
    print(f"Merkle Root gerada: {merkle_root_hex}")
    return merkle_root_hex

# --- FIM: LÓGICA MANUAL DA MERKLE TREE ---


# ---
# ROTA 1: Preparar TODOS os dados para o deploy
# ---
@app.route('/api/prepare-deploy', methods=['POST'])
def prepare_deploy_info():
    """
    Recebe o link do SIGAA, gera a Merkle Root, lê o contrato
    e envia TUDO para o frontend.
    """
    data = request.json
    sigaa_link = data.get('sigaa_link')
    
    if not sigaa_link:
        abort(400, description="Link do SIGAA é obrigatório.")

    # 1. Gerar a Merkle Root (agora usa a função manual)
    try:
        lista_alunos = _simular_scraping_sigaa(sigaa_link)
        merkle_root = _gerar_merkle_root(lista_alunos)
    except Exception as e:
        abort(500, description=f"Erro ao gerar Merkle Root: {e}")

    # 2. Ler ABI e Bytecode
    if not os.path.exists(CONTRACT_JSON_PATH):
        print(f"ERRO: Arquivo '{CONTRACT_JSON_PATH}' não encontrado.")
        abort(500, description="Arquivo de contrato não encontrado.")
    
    try:
        with open(CONTRACT_JSON_PATH, 'r') as f:
            contract_data = json.load(f)
        
        abi = contract_data.get('abi')
        bytecode = contract_data.get('bytecode')

        if not abi or not bytecode:
            abort(500, description="ABI ou Bytecode inválido no 'contract.json'.")
            
        print("Enviando ABI, Bytecode, MerkleRoot e RelayerAddress...")
        return jsonify(
            abi=abi, 
            bytecode=bytecode,
            merkleRoot=merkle_root,
            relayerAddress=RELAYER_ADDRESS
        )

    except Exception as e:
        abort(500, description=f"Erro ao ler o arquivo do contrato: {e}")


# ---
# ROTA 2: Salvar os dados da votação (sem mudanças)
# ---
# ---
# ROTA 2: Salvar os dados da votação (ATUALIZADA)
# ---
@app.route('/api/criar-votacao', methods=['POST'])
def criar_votacao():
    """
    Recebe os dados do frontend (APÓS o deploy) e 'salva'
    (neste exemplo, apenas imprimimos no console).
    """
    data = request.json
    
    # Lendo todos os dados enviados pelo frontend
    sigaa_link = data.get('sigaa_link')
    admin_wallet = data.get('admin_wallet')
    contract_address = data.get('contract_address')
    campus = data.get('campus') # NOVO
    curso = data.get('curso')   # NOVO

    # Validação atualizada
    if not all([sigaa_link, admin_wallet, contract_address, campus, curso]):
        abort(400, description="Dados incompletos recebidos. Todos os campos são obrigatórios.")

    # LÓGICA DE BANCO DE DADOS (simulada e atualizada)
    # Aqui você salvaria todos os 5 campos no seu banco de dados
    print("\n===================================")
    print("SALVANDO NOVA VOTAÇÃO NO BANCO:")
    print(f"  Campus: {campus}")
    print(f"  Curso: {curso}")
    print(f"  Link SIGAA: {sigaa_link}")
    print(f"  Admin (Proponente): {admin_wallet}")
    print(f"  Contrato (Deployado): {contract_address}")
    print("===================================\n")

    return jsonify(message="Votação salva com sucesso no backend!"), 201


if __name__ == '__main__':
    app.run(debug=True, port=5000)