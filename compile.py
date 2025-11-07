import json
import os
from solcx import compile_files, install_solc, set_solc_version

# --- Configuração ---
CONTRACT_FILE = "Voting.sol"
CONTRACT_NAME = "Voting"
OUTPUT_FILE = "contract.json"
# --------------------

def compile_contract():
    """
    Compila o contrato Solidity e salva o ABI e Bytecode em 'contract.json'.
    """
    print("Verificando instalação do solc (compilador)...")
    try:
        # Tenta instalar uma versão compatível (ex: 0.8.20)
        install_solc('0.8.20')
        set_solc_version('0.8.20')
        print("Compilador Solidity (solc v0.8.20) pronto.")
    except Exception as e:
        print(f"Erro ao instalar/configurar o solc: {e}")
        print("Por favor, instale o 'solc' manualmente ou verifique sua versão.")
        return

    print(f"Compilando '{CONTRACT_FILE}'...")
    
    if not os.path.exists(CONTRACT_FILE):
        print(f"ERRO: Arquivo '{CONTRACT_FILE}' não encontrado.")
        return

    try:
        # Compila o arquivo
        compiled_sol = compile_files(
            [CONTRACT_FILE],
            output_values=["abi", "bin"],
            solc_version='0.8.20'
        )

        # Extrai os dados do contrato compilado
        contract_id = f"{CONTRACT_FILE}:{CONTRACT_NAME}"
        contract_interface = compiled_sol.get(contract_id)

        if not contract_interface:
            print(f"ERRO: Não foi possível encontrar o contrato '{CONTRACT_NAME}' em '{CONTRACT_FILE}'.")
            print("Verifique se o nome do contrato está correto.")
            return

        abi = contract_interface['abi']
        bytecode = contract_interface['bin']

        # Prepara os dados para salvar
        output_data = {
            'abi': abi,
            'bytecode': bytecode
        }

        # Salva em 'contract.json'
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(output_data, f, indent=4)
        
        print(f"Sucesso! ABI e Bytecode salvos em '{OUTPUT_FILE}'.")
        print("Você já pode iniciar o backend (app.py).")

    except Exception as e:
        print(f"Erro durante a compilação: {e}")

if __name__ == "__main__":
    # Dependência: py-solc-x
    # Instale com: pip install py-solc-x
    compile_contract()