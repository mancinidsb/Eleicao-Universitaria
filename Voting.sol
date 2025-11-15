// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MerkleProof.sol";

/**
 * @title VotacaoDAO (Versão Mestre-Relayer)
 * @dev O Proponente (Chapa) paga o deploy, mas entrega
 * todo o controle ao Relayer (App Off-chain).
 */
contract Voting {

    // --- ESTADOS DA VOTAÇÃO ---
    enum EstadoVotacao {
        Pendente,  // 0: Contrato criado, aguardando início da inscrição
        Inscricao, // 1: Chapas podem se inscrever
        Votacao,   // 2: Alunos podem votar
        Encerrada  // 3: Votação terminada
    }



    EstadoVotacao public estadoAtual;

    // --- DADOS DE CONFIGURAÇÃO (DEFINIDOS NO DEPLOY) ---
    bytes32 public immutable merkleRoot;
    
    // O Relayer (App Flask) é o único mestre do contrato.
    address public immutable relayerAddress;
    
    // (O 'owner' foi removido, o Proponente não tem mais poder)

    // --- ARMAZENAMENTO DA VOTAÇÃO ---
    bytes[] public quadroDeAvisos;
    bytes32[] public quadroDeRecibos;
    mapping(bytes32 => bool) public nullifiersUsados;

    address public immutable chapa_atual;

    string public campus;
    string public curso;
    string public data_assembleia;

    event ComissaoAdicionada(string nome);






    /**
     * @dev Construtor.
     * O Proponente (msg.sender) paga o gás e define o Mestre (Relayer).
     * @param _merkleRoot A raiz Merkle dos alunos.
     * @param _relayerAddress O endereço do App Off-chain (Flask) que será o mestre.
     */
    constructor(
        bytes32 _merkleRoot,
        address _relayerAddress,
        string memory _campus,
        string memory _curso,
        string memory _data_assembleia
    ) {
        merkleRoot = _merkleRoot;
        relayerAddress = _relayerAddress; // Define o mestre
        chapa_atual = msg.sender;
        campus=_campus;
        curso=_curso;
        data_assembleia=_data_assembleia;


        
        // O Proponente (msg.sender) paga o gás, mas não é salvo.
        
        // O contrato começa 'Pendente' até o Relayer 'ligá-lo'.
        estadoAtual = EstadoVotacao.Pendente;
    }

    // --- MODIFICADOR (REGRA DE ACESSO) ---

    // Apenas o App Off-chain (Flask) pode chamar
    modifier apenasRelayer() {
        require(msg.sender == relayerAddress, "Apenas o Relayer (App) pode fazer isso");
        _;
    }

    modifier apenasChapa() {
        require(msg.sender == chapa_atual, "Apenas a Chapa Atual (App) pode fazer isso");
        _;
    }

    function cadastrarComissao(string[] calldata _comissao) public apenasChapa{
        for (uint i = 0; i < _comissao.length; i++) {
            emit ComissaoAdicionada(_comissao[i]);
        }
    }

    // --- FUNÇÕES DE MUDANÇA DE ESTADO (Chamadas pelo Relayer) ---
    // O App Flask (Relayer) chamará estas funções quando as datas
    // salvas no banco de dados forem atingidas.

    /**
     * @dev Abre o período de inscrição de chapas.
     */
    function iniciarInscricao() public apenasRelayer {
        require(estadoAtual == EstadoVotacao.Pendente, "DAO: A inscricao ja foi iniciada");
        estadoAtual = EstadoVotacao.Inscricao;
    }

    /**
     * @dev Fecha a inscrição e abre o período de votação.
     */
    function iniciarVotacao() public apenasRelayer {
        require(estadoAtual == EstadoVotacao.Inscricao, "DAO: As inscricoes nao estao abertas");
        estadoAtual = EstadoVotacao.Votacao;
    }

    /**
     * @dev Fecha o período de votação.
     */
    function encerrarVotacao() public apenasRelayer {
        require(estadoAtual == EstadoVotacao.Votacao, "DAO: A votacao nao esta aberta");
        estadoAtual = EstadoVotacao.Encerrada;
    }


    /**
     * @dev Função principal de votação.
     * SÓ PODE ser chamada pelo Relayer.
     */
    function votar(
        bytes memory votoCriptografado,
        bytes32 reciboDoAluno,
        bytes32 nullifierHash, 
        bytes32[] memory merkleProof 
    ) public apenasRelayer { // Perfeito, 'apenasRelayer'
        
        // --- VERIFICAÇÕES DE SEGURANÇA ---
        
        // Verifica se a votação está no estado correto
        require(estadoAtual == EstadoVotacao.Votacao, "DAO: A votacao nao esta aberta");

        require(!nullifiersUsados[nullifierHash], "DAO: Voto duplo detectado");
        
        bool ehValido = MerkleProof.verify(
            merkleProof,
            merkleRoot,
            nullifierHash
        );
        require(ehValido, "DAO: Prova Merkle invalida, aluno nao esta na lista");

        // --- AÇÕES DE VOTO ---
        nullifiersUsados[nullifierHash] = true;
        quadroDeAvisos.push(votoCriptografado);
        quadroDeRecibos.push(reciboDoAluno);
    }
}