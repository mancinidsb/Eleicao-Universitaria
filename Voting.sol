// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importa a biblioteca da OpenZeppelin para verificar a Prova Merkle
// import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/utils/cryptography/MerkleProof.sol";
import "./MerkleProof.sol";
/**
 * @title VotacaoDAO (Versão Focada)
 * @dev Contrato principal que gerencia a eleição.
 * Ele verifica a elegibilidade, impede voto duplo e armazena votos cegos.
 * NÃO inclui a lógica de NFT.
 */
contract Voting {

    // --- DADOS DE CONFIGURAÇÃO (DEFINIDOS NO DEPLOY) ---

    // A raiz da Merkle Tree de todos os alunos ativos
    bytes32 public immutable merkleRoot;

    // O endereço do App Off-chain (Relayer) que paga o gás dos votos
    address public immutable relayerAddress;


    // --- ARMAZENAMENTO DA VOTAÇÃO ---

    // O "Quadro de Avisos" público com os votos criptografados (cegos)
    bytes[] public quadroDeAvisos;

    // O "Quadro de Recibos" para auditoria individual do aluno
    bytes32[] public quadroDeRecibos;

    // Mapeamento para impedir voto duplo
    // Armazena os 'nullifiers' (tickets) que já foram usados
    mapping(bytes32 => bool) public nullifiersUsados;


    /**
     * @dev Construtor. É chamado UMA VEZ durante o deploy.
     * A Chapa Atual (Proponente) paga o gás para executar esta função.
     * @param _merkleRoot A raiz da árvore de alunos (gerada pelo App).
     * @param _relayerAddress O endereço do App que enviará os votos.
     */
    constructor(
        bytes32 _merkleRoot,
        address _relayerAddress
    ) {
        merkleRoot = _merkleRoot;
        relayerAddress = _relayerAddress;
    }


    /**
     * @dev Função principal de votação.
     * SÓ PODE ser chamada pelo Relayer para economizar gás do aluno.
     */
    function votar(
        bytes memory votoCriptografado,
        bytes32 reciboDoAluno,
        bytes32 nullifierHash, // O "ticket" único do aluno
        bytes32[] memory merkleProof // A prova de que o aluno é válido
    ) public {
        
        // --- VERIFICAÇÕES DE SEGURANÇA ---

        // 1. O remetente é o Relayer?
        require(msg.sender == relayerAddress, "DAO: Apenas o Relayer pode enviar votos");

        // 2. Este "ticket" (nullifier) já foi usado? (Impede voto duplo)
        require(!nullifiersUsados[nullifierHash], "DAO: Voto duplo detectado");

        // 3. O aluno é válido? (Verifica a Prova Merkle contra a Raiz)
        bool ehValido = MerkleProof.verify(
            merkleProof,
            merkleRoot,
            nullifierHash
        );
        require(ehValido, "DAO: Prova Merkle invalida, aluno nao esta na lista");

        // --- AÇÕES DE VOTO ---

        // 1. Queima o ticket
        nullifiersUsados[nullifierHash] = true;
        
        // 2. Publica o voto cego e o recibo
        quadroDeAvisos.push(votoCriptografado);
        quadroDeRecibos.push(reciboDoAluno);
    }
}