// --- MUDANÇA PAILLIER ---
// Importa a biblioteca de criptografia Paillier
import * as paillier from 'paillier-bigint';

function formatarDataParaInput(data) {
  // ... (função idêntica)
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

// function formatarDataSimples(dataString) {
//     if (!dataString) return null;
//     try {
//         const data = new Date(dataString);
//         const options = {
//             year: 'numeric', month: '2-digit', day: '2-digit',
//             hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
//         };
//         // Retorna no formato: 14/11/2025, 16:48
//         return new Intl.DateTimeFormat('pt-BR', options).format(data).replace(',', '');
//     } catch (e) {
//         return dataString; // Retorna a string original se falhar
//     }
// }

function formatarData(dataString) {
    if (!dataString) return null;
    try {
        // Se a string vier sem o 'Z' no final (comum no SQLite), 
        // adicionamos para garantir que o JS leia como UTC puro.
        if (!dataString.endsWith('Z')) {
            dataString += 'Z';
        }
        
        const data = new Date(dataString);
        
        const options = {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', 
            timeZone: 'UTC' // <--- O SEGREDO: Força mostrar o horário original
        };
        
        return new Intl.DateTimeFormat('pt-BR', options).format(data).replace(',', '');
    } catch (e) {
        return dataString;
    }
}

function formatarDataSimples(dataString) {
    if (!dataString) return '---';
    
    try {
        // 1. Cria o objeto Data
        const data = new Date(dataString);

        // 2. Opções para FORÇAR o navegador a usar UTC
        // Isso ignora o fuso horário do seu computador
        const options = {
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit', 
            minute: '2-digit', 
            timeZone: 'UTC' // <--- ESSENCIAL: Mantém o horário original do BD
        };
        
        // 3. Formata (pt-BR usa dd/mm/aaaa)
        // O replace remove a vírgula que o navegador coloca entre data e hora
        return new Intl.DateTimeFormat('pt-BR', options).format(data).replace(',', '');
        
    } catch (e) {
        console.error("Erro data:", e);
        return dataString;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // --- API URL ---
    // Mude para o seu URL do NGROK ou http://127.0.0.1:5000
    // const API_URL = 'https://ballastic-latricia-delectably.ngrok-free.dev';
    const API_URL = 'http://127.0.0.1:5000';
            
    // --- Seletores das Telas ---
    const homeScreen = document.getElementById('home-screen');
    // ... (todos os seus seletores estão corretos) ...
    const createScreen = document.getElementById('create-screen');

    const aboutScreen = document.getElementById('about-screen');

    const comissaoCadastroScreen = document.getElementById('comissao-cadastro-screen');

    const btnBackToList3 = document.getElementById('btn-back-to-list-3');
    const sobreScreen = document.getElementById('sobre-screen');
    const btnBackFromSobre = document.getElementById('btn-back-from-sobre');
    const sobreContractAddressInput = document.getElementById('sobre-contract-address');
    const sobreStatus = document.getElementById('sobre-status');
    const sobreCampus = document.getElementById('sobre-campus');
    const sobreDataAssembleia = document.getElementById('sobre-data-assembleia');
    const sobreDataInscricao = document.getElementById('sobre-data-inscricao');
    const sobreDataVotacao = document.getElementById('sobre-data-votacao');
    const sobreComissao = document.getElementById('sobre-comissao');
    const sobreCurso = document.getElementById('sobre-curso');
    const datasModal = document.getElementById('datas-modal');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const modalBackdrop = datasModal.querySelector('.modal-backdrop');


    const voteScreen = document.getElementById('vote-screen');
    const chapaScreen = document.getElementById('chapa-screen');
    const votarScreen = document.getElementById('votar-screen');
    const btnShowCreate = document.getElementById('btn-show-create');
    const btnShowVote = document.getElementById('btn-show-vote'); 
    const btnBackHome = document.getElementById('btn-back-home');
    const btnConnectMetamask = document.getElementById('btn-connect-metamask');
    const metamaskStatus = document.getElementById('metamask-status');
    const createPollForm = document.getElementById('create-poll-form');
    const walletAddressInput = document.getElementById('wallet-address');
    const btnSubmitPoll = document.getElementById('btn-submit-poll');
    const avaliarChapasScreen = document.getElementById('avaliar-chapas-screen');
    const listaChapasPendentes = document.getElementById('lista-chapas-pendentes');
    const avaliarStatus = document.getElementById('avaliar-status');
    const btnBackFromAvaliar = document.getElementById('btn-back-from-avaliar');
    const avaliarWelcomeMsg = document.getElementById('avaliar-welcome-msg');
    const btnBackHome2 = document.getElementById('btn-back-home-2'); 
    const searchForm = document.getElementById('search-form'); 
    const searchInput = document.getElementById('search-input'); 
    const votacoesList = document.getElementById('votacoes-list'); 
    const votacoesStatus = document.getElementById('votacoes-status'); 
    const btnBackToList = document.getElementById('btn-back-to-list');
    const chapaForm = document.getElementById('chapa-form');
    const chapaStatus = document.getElementById('chapa-status');
    const btnSubmitChapa = document.getElementById('btn-submit-chapa');
    const chapaContractAddressInput = document.getElementById('chapa-contract-address');
    const btnBackToList2 = document.getElementById('btn-back-to-list-2');
    const votarTitulo = document.getElementById('votar-titulo');
    const votarAuthStep = document.getElementById('votar-auth-step');
    const votarVoteForm = document.getElementById('votar-vote-form');
    const votarContractAddressInput = document.getElementById('votar-contract-address');
    const votarMatriculaInput = document.getElementById('votar-matricula');
    const votarAuthStatus = document.getElementById('votar-auth-status');
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const votarChapasList = document.getElementById('votar-chapas-list');
    const votarVoteStatus = document.getElementById('votar-vote-status');
    const btnSubmitVoto = document.getElementById('btn-submit-voto');
    const votarUserInfoTitulo = document.getElementById('votar-user-info-titulo');
    const btnAvaliarChapas = document.getElementById('btn-avaliar-chapas');
    const infoSobreVotacao = document.getElementById('info-sobre-votacao');
    let currentVotacaoAdmin = null; 
    // let contadorComissao = 0;

    const btnBackSobreVotacao = document.getElementById('btn-back-sobre-votacao');

    const btnInserirComissao = document.getElementById('btn-inserir-comissao'); 


    // const comissaoCadastroScreen = document.getElementById('comissao-cadastro-screen');
    // const btnInserirComissao = document.getElementById('btn-inserir-comissao');
    const btnBackToSobre = document.getElementById('btn-back-to-sobre');
    const formComissao = document.getElementById('form-comissao');
    const listaComissaoContainer = document.getElementById('lista-comissao-container');
    const btnAddComissao = document.getElementById('btn-add-comissao');
    const comissaoSaveStatus = document.getElementById('comissao-save-status');
    let contadorComissao = 0; // Variável para controlar os IDs



    // --- MUDANÇA PAILLIER ---
    // Variáveis de estado para o voto (ATUALIZADAS)
    let currentVoteState = {
        contractAddress: null,
        merkleProof: null,
        nullifierHash: null,
        // Dados Paillier
        paillier_n: null,
        paillier_g: null,
        num_chapas: 0,
        paillier_publicKey: null // O objeto de chave pública JS
    };

    // --- Funções de Navegação (Sem Mudanças) ---
    function showScreen(screenToShow) {
        homeScreen.classList.add('hidden');
        createScreen.classList.add('hidden');
        aboutScreen.classList.add('hidden');
        voteScreen.classList.add('hidden');
        chapaScreen.classList.add('hidden');
        votarScreen.classList.add('hidden');
        comissaoCadastroScreen.classList.add('hidden');
        avaliarChapasScreen.classList.add('hidden');

        screenToShow.classList.remove('hidden');
        

        // screenToShow.classList.remove('hidden');
    }
    // ... (seus listeners de navegação estão corretos) ...
    btnShowCreate.addEventListener('click', (e) => { e.preventDefault(); showScreen(createScreen); });
    btnShowVote.addEventListener('click', (e) => { e.preventDefault(); showScreen(voteScreen); fetchVotacoes(); });
    btnBackHome.addEventListener('click', () => showScreen(homeScreen));
    btnBackHome2.addEventListener('click', () => showScreen(homeScreen));
    btnBackToList.addEventListener('click', () => showScreen(voteScreen));
    btnBackToList2.addEventListener('click', () => showScreen(voteScreen));
    btnBackToList3.addEventListener('click', () => showScreen(voteScreen));
    btnBackSobreVotacao.addEventListener('click', () => showScreen(aboutScreen));
    btnFecharModal.addEventListener('click', () => datasModal.classList.add('hidden'));
    modalBackdrop.addEventListener('click', () => datasModal.classList.add('hidden'));

    // --- Lógica Tela 2 (Criar Votação) (Sem Mudanças) ---
    // Seu código de 'btnConnectMetamask' e 'createPollForm' está correto
    // ... (código idêntico omitido por brevidade) ...
    btnConnectMetamask.addEventListener('click', async () => { 
        metamaskStatus.textContent = 'Abrindo o MetaMask...';
        metamaskStatus.classList.remove('text-red-500', 'text-green-600');
        metamaskStatus.classList.add('text-blue-600');
        
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                metamaskStatus.textContent = `Conectado: ${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
                metamaskStatus.classList.remove('text-blue-600', 'text-red-500');
                metamaskStatus.classList.add('text-green-600');
                
                walletAddressInput.value = account;
                btnConnectMetamask.querySelector('span').textContent = 'Conta Conectada';
                btnConnectMetamask.disabled = true;
                btnSubmitPoll.disabled = false;

            } catch (err) {
                let errorMsg = err.code === 4001 ? 'Você rejeitou a conexão.' : 'Erro ao conectar.';
                metamaskStatus.textContent = errorMsg;
                metamaskStatus.classList.add('text-red-500');
            }
        } else {
            metamaskStatus.textContent = 'Erro: Por favor, instale a MetaMask.';
            metamaskStatus.classList.add('text-red-500');
        }
    });

    createPollForm.addEventListener('submit', async (evento) => {
        evento.preventDefault(); 
        btnSubmitPoll.textContent = 'Enviando...';
        btnSubmitPoll.disabled = true;
        metamaskStatus.classList.remove('text-red-500', 'text-green-600');
        
        const sigaaLink = document.getElementById('sigaa-link').value;
        const adminAddress = walletAddressInput.value;
        const campusName = document.getElementById('campus-name').value;
        const cursoName = document.getElementById('curso-name').value;
        // const dataInicioChapa = document.getElementById('data-inicio-chapa').value;
        // const dataFimChapa = document.getElementById('data-fim-chapa').value;
        // const dataInicioVotacao = document.getElementById('data-inicio-votacao').value;
        // const dataFimVotacao = document.getElementById('data-fim-votacao').value;
        const dataAssembleiaGeral = document.getElementById('data-assembleia').value;

        try {
            metamaskStatus.textContent = 'Servidor está gerando Merkle Root...';
            metamaskStatus.classList.add('text-blue-600');

            const responseInfo = await fetch(`${API_URL}/api/prepare-deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sigaa_link: sigaaLink })
            });
            
            if (!responseInfo.ok) {
                const errData = await responseInfo.json();
                throw new Error(errData.description || 'Falha ao buscar dados do backend.');
            }
            
            const { abi, bytecode, merkleRoot, relayerAddress } = await responseInfo.json();
            
            metamaskStatus.textContent = 'Abra o MetaMask para aprovar o deploy...';
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factory = new ethers.ContractFactory(abi, bytecode, signer);

            const contract = await factory.deploy(merkleRoot, relayerAddress, campusName, cursoName, dataAssembleiaGeral);

            metamaskStatus.textContent = 'Aguardando confirmação da rede...';
            await contract.waitForDeployment();
            
            const contractAddress = await contract.getAddress();
            console.log("Contrato implantado com sucesso em:", contractAddress);

            metamaskStatus.textContent = 'Salvando dados no servidor...';
            
            const responseSave = await fetch(`${API_URL}/api/criar-votacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    sigaa_link: sigaaLink,
                    admin_wallet: adminAddress,
                    contract_address: contractAddress,
                    campus: campusName,
                    curso: cursoName,
                    data_assembleia_geral: dataAssembleiaGeral
                    // data_inicio_chapa: dataInicioChapa,
                    // data_fim_chapa: dataFimChapa,
                    // data_inicio_votacao: dataInicioVotacao,
                    // data_fim_votacao: dataFimVotacao
                })
            });

            if (!responseSave.ok) throw new Error('Falha ao salvar dados no backend.');
            
            metamaskStatus.textContent = `Votação criada! Contrato: ${contractAddress}`;
            metamaskStatus.classList.add('text-green-600');
            btnSubmitPoll.textContent = 'Votação Criada!';
            btnSubmitPoll.disabled=false
            createPollForm.reset();

        } catch (err) {
            console.error("Erro no processo de deploy:", err);
            let errorMsg = 'Erro desconhecido.';
            if (err.code === 'ACTION_REJECTED') { 
                errorMsg = 'Você rejeitou a transação no MetaMask.';
            } else if (err.message) {
                errorMsg = err.message;
            }
            metamaskStatus.textContent = errorMsg;
            metamaskStatus.classList.add('text-red-500');
            btnSubmitPoll.textContent = 'Fazer Deploy (Pagar Gás)';
            // btnSubmitPoll.disabled = false;
        }
    });

    // --- Lógica Tela 3 (Listar/Buscar Votações) ---
    async function fetchVotacoes(searchTerm = '') { 
        // ... (código idêntico) ...
        votacoesList.innerHTML = ''; 
        votacoesStatus.textContent = 'Carregando votações...';
        try {
            let url = `${API_URL}/api/votacoes`;
            if (searchTerm) { url += `?search=${encodeURIComponent(searchTerm)}`; }
            
            const response = await fetch(url, { credentials: 'include' }); 
            if (!response.ok) { throw new Error('Não foi possível buscar as votações.'); }
            
            const votacoes = await response.json(); 
            renderVotacoes(votacoes);
        } catch (err) {
            votacoesStatus.textContent = err.message;
            votacoesStatus.classList.add('text-red-500');
        }
    }

    // --- MUDANÇA: Atualizado o renderVotacoes para a apuração ---
    // --- Lógica Tela 3 (Listar/Buscar Votações) ---
    async function fetchVotacoes(searchTerm = '') { 
        votacoesList.innerHTML = ''; 
        votacoesStatus.textContent = 'Carregando votações...';
        // debugger;
        try {
            let url = `${API_URL}/api/votacoes`; 
            if (searchTerm) { url += `?search=${encodeURIComponent(searchTerm)}`; }
            
            // Inclui 'credentials' para que a sessão do Flask funcione
            const response = await fetch(url, { credentials: 'include' }); 
            
            if (!response.ok) { throw new Error('Não foi possível buscar as votações.'); }
            
            const votacoes = await response.json(); 
            renderVotacoes(votacoes);
        } catch (err) {
            votacoesStatus.textContent = err.message;
            votacoesStatus.classList.add('text-red-500');
        }
    }

    function renderVotacoes(votacoes) {
        votacoesList.innerHTML = ''; 
        if (votacoes.length === 0) { votacoesStatus.textContent = 'Nenhuma votação encontrada.'; return; }
        votacoesStatus.textContent = ''; 
        
        votacoes.forEach(votacao => {
            const card = document.createElement('div');
            card.className = 'border rounded-lg p-4 shadow-sm bg-gray-50';
            const formatWallet = (wallet) => wallet ? `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}` : 'N/A';
            card.dataset.pollName = `${votacao.curso} (${votacao.campus})`;

            let estadoTexto = votacao.estado_contrato_str;
            let estadoCor = 'text-gray-600';
            if (estadoTexto.includes('Aberta')) estadoCor = 'text-green-600';
            if (estadoTexto.includes('Encerrada')) estadoCor = 'text-red-600';
            if (estadoTexto.includes('Aguardando')) estadoCor = 'text-blue-600';
            
            let botoesHTML = '';


            const options = {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,   // Garante o formato 24h
                timeZone: 'UTC'  // ESSENCIAL: Usa o horário UTC (GMT) original
            };


            let data_final = '';

            let menu=0;
            let texto="Aguardando";
            // (0=Pendente, 1=Inscricao, 2=Votacao, 3=Encerrada)
            switch(menu){//votacao.estado_contrato_int) {
                case 0: // Pendente
                    if (texto.includes('Aguardando')){//estadoTexto.includes('Aguardando')) {
                        // botoesHTML = `<span class="text-sm text-gray-500">Aguardando início das inscrições.</span>`;
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-saber-mais w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Saber Mais</button>`;
                        estadoTexto=""
                    } else { // 'Inscrição Aberta' (baseado na data do app)
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Inscrever Chapa</button>`;
                        // data_final = `${data_fim_chapa.replace(',', '')}`;
                    }
                    break;
                case 1: // Inscricao
                    if (estadoTexto.includes('Encerrada')) { // Data do app já passou
                        botoesHTML = `<span class="text-sm text-gray-500">Inscrição encerrada. Aguardando votação.</span>`;
                        // data_final = `${data_inicio_votacao}`;
                    } else {
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Inscrever Chapa</button>`;
                        // data_final = `${data_fim_chapa.replace(',', '')}`;
                    } 
                    break;
                case 2: // Votacao
                    if (estadoTexto.includes('Encerrada')) { // Data do app já passou
                        botoesHTML = `<span class="text-sm text-gray-500">Votação encerrada. Aguardando apuração.</span>`;
                        data_final = `${data_fim_votacao.replace(',', '')}`;
                    } else {
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-votar-agora w-full flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Votar Agora</button>`;
                        // data_final = `${data_fim_votacao.replace(',', '')}`;
                    }
                    break;
                case 3: // Encerrada
                    botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-ver-resultado w-full flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Ver Resultado</button>`;
                    break;
                default:
                    botoesHTML = `<span class="text-sm text-red-500">Erro de estado no contrato.</span>`;
            }



            card.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-semibold text-lg text-blue-700">${votacao.campus}</h3>
                    <span class="font-medium ${estadoCor}">${estadoTexto}</span>
                    <span class="font-medium text-yellow-700">${data_final}</span>
                </div>
                <p class="text-gray-700">${votacao.curso}</p>
                <div class="mt-3 border-t pt-2">
                    <p class="text-sm text-gray-600">
                        Proponente: <span class="font-mono text-gray-900">${formatWallet(votacao.admin_wallet_proponente)}</span>
                    </p>
                    <p class="text-sm text-gray-600">
                        Contrato: <span class="font-mono text-gray-900">${formatWallet(votacao.contract_address)}</span>
                    </p>
                </div>
                <div class="mt-4 flex flex-col sm:flex-row gap-2">
                    ${botoesHTML}
                </div>
            `;
            votacoesList.appendChild(card);
        });
    }
    
    searchForm.addEventListener('submit', (e) => { 
        e.preventDefault();
        const searchTerm = searchInput.value;
        fetchVotacoes(searchTerm);
    });

    btnInserirComissao.addEventListener('click', async () => {
        
        // 1. Verifica se o admin foi carregado
        if (!currentVotacaoAdmin) {
            alert("Erro: Endereço do admin não encontrado. Recarregue a página.");
            return;
        }

        // 2. Verifica se o MetaMask está instalado
        if (typeof window.ethereum === 'undefined') {
            alert("Por favor, instale o MetaMask para executar esta ação.");
            return;
        }

        let userAddress;
        try {
            // 3. Pede para o usuário conectar (ABRE O POP-UP)
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                alert("Você precisa conectar uma carteira para continuar.");
                return;
            }
            userAddress = accounts[0];

        } catch (err) {
            console.error("Erro ao conectar MetaMask:", err);
            if (err.code === 4001) {
                alert("Você rejeitou a conexão com o MetaMask.");
            } else {
                alert("Erro ao conectar MetaMask.");
            }
            return;
        }

        // 4. Compara o endereço conectado com o admin (usa ethers.getAddress)
        const checksumAdmin = ethers.getAddress(currentVotacaoAdmin);
        const checksumUser = ethers.getAddress(userAddress);
        const action = btnInserirComissao.dataset.action;

        if (action === 'inscrever') {
            // === AÇÃO PÚBLICA ===
            // Qualquer carteira conectada pode inscrever chapa
            
            // AÇÃO: IR PARA TELA DE INSCRIÇÃO DE CHAPA
            chapaContractAddressInput.value = sobreContractAddressInput.value;

            let searchTerm = `${sobreContractAddressInput.value}`;
            let url = `${API_URL}/api/votacoes`;
            url += `?search=${encodeURIComponent(searchTerm)}`;
            const response = await fetch(url, { credentials: 'include' });
            
            // Limpa o formulário de chapa
            chapaForm.reset();
            chapaStatus.textContent = '';
            btnSubmitChapa.disabled = false;
            btnSubmitChapa.textContent = 'Enviar Inscrição';
            
            // Navega para a tela
            showScreen(chapaScreen);
        }else if (action==='votar'){
            // console.log("VOTAR")
            // showScreen(votarScreen);
            const contractAddress = sobreContractAddressInput.value;
            const campus = sobreCampus.textContent;
            const curso = sobreCurso.textContent;
            const pollName = `${curso} (${campus})`;
            prepareVotarScreen(contractAddress, pollName);
            showScreen(votarScreen);
        }
        
        else{

            if (checksumUser === checksumAdmin) {
            // SUCESSO: É o admin!
            
            // --- DECISÃO: QUAL TELA ABRIR? ---
                const action = btnInserirComissao.dataset.action;

                if (action === 'datas') {
                    // ABRIR MODAL DE DATAS
                    document.getElementById('modal-datas-contract-address').value = sobreContractAddressInput.value;
                    // (Opcional: Limpar os inputs de data antes de abrir)
                    datasModal.classList.remove('hidden');
                }else if (action==='inscrever'){

                    let searchTerm = `${sobreContractAddressInput.value}`;
                    let url = `${API_URL}/api/votacoes`;
                    url += `?search=${encodeURIComponent(searchTerm)}`; 
                    
                    const response = await fetch(url, { credentials: 'include' }); 
                    if (!response.ok) { throw new Error('Não foi possível buscar as votações.'); }
                    
                    const votacoes = await response.json(); 


                    chapaContractAddressInput.value = sobreContractAddressInput.value;
                    chapaForm.reset();
                    chapaStatus.textContent = '';
                    btnSubmitChapa.disabled = false;
                    btnSubmitChapa.textContent = 'Enviar Inscrição';
                    showScreen(chapaScreen);

                } 
                else {
                    // ABRIR TELA DE COMISSÃO (Comportamento original)
                    listaComissaoContainer.innerHTML = '';
                    contadorComissao = 0; 
                    adicionarBlocoMembro(); 
                    comissaoSaveStatus.textContent = '';
                    showScreen(comissaoCadastroScreen);
                }

            } else {
                alert("Acesso Negado: Você não é o admin desta votação.");
            }
        }

      
    });

    // --- MUDANÇA: Atualizado o listener de clique para a apuração ---
    votacoesList.addEventListener('click', async (e) => {
        const target = e.target;
        const contractAddress = target.dataset.contract;
        if (!contractAddress) return; 

        if (target.classList.contains('btn-votar-agora')) {
            const pollName = target.closest('[data-poll-name]').dataset.pollName;
            prepareVotarScreen(contractAddress, pollName);
            showScreen(votarScreen);
        
        } else if (target.classList.contains('btn-inscrever-chapa')) {
            chapaContractAddressInput.value = contractAddress;
            chapaForm.reset();
            chapaStatus.textContent = '';
            btnSubmitChapa.disabled = false;
            btnSubmitChapa.textContent = 'Enviar Inscrição';
            showScreen(chapaScreen);
            
        } else if (target.classList.contains('btn-ver-resultado')) {
            // --- LÓGICA DE APURAÇÃO ---
            const card = target.closest('.border');
            if (!card){
                return;
            }
            let statusDiv = card.querySelector('.resultado-status');
            if (!statusDiv) {
                statusDiv = document.createElement('div');
                statusDiv.className = 'resultado-status text-sm text-blue-600 mt-2 p-2 border-t';
                card.appendChild(statusDiv);
            }
            statusDiv.textContent = 'Buscando apuração...';

            try {
                const response = await fetch(`${API_URL}/api/apurar-votos/${contractAddress}`, {
                    method: 'GET', // (Opcional, mas boa prática)
                    headers: {
                    // ISSO É O MAIS IMPORTANTE
                    'ngrok-skip-browser-warning': 'true'
                    }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.description || 'Falha ao buscar apuração.');

                let resultadoHTML = `<strong class="block mb-1">${data.mensagem}</strong><ul class="list-disc pl-5">`;
                data.resultados.forEach(r => {
                    resultadoHTML += `<li><strong>${r.nome_chapa}:</strong> ${r.total_votos} votos</li>`;
                });
                resultadoHTML += `</ul>`;
                statusDiv.innerHTML = resultadoHTML;
                statusDiv.classList.remove('text-blue-600');
                statusDiv.classList.add('text-gray-800');

            } catch (err) {
                statusDiv.textContent = `Erro na apuração: ${err.message}`;
                statusDiv.classList.add('text-red-500');
            }
        }else if (target.classList.contains('btn-saber-mais')){
            prepareSobreScreen(contractAddress)
            showScreen(aboutScreen);
        }
    });

    async function prepareSobreScreen(contractAddress){
        // 1. Reset visual
        sobreStatus.textContent = 'Carregando detalhes...';
        currentVotacaoAdmin = null; 
        btnInserirComissao.classList.add('hidden'); 
        btnAvaliarChapas.classList.add('hidden');
        
        // Reset do texto original do botão
        btnInserirComissao.textContent = "";
        btnInserirComissao.dataset.action = "comissao"; 

        const resultadosAntigos = document.querySelectorAll('#sobre-resultados-container');
        resultadosAntigos.forEach(el => el.remove());


        // Reset dos campos para "..." enquanto carrega
        sobreContractAddressInput.value = contractAddress;
        sobreCampus.textContent = '...';
        sobreCurso.textContent = '...';
        sobreDataAssembleia.textContent = '...';
        sobreDataInscricao.textContent = '...';
        sobreDataVotacao.textContent = '...';
        sobreComissao.innerHTML = '...';

        try {
            const response = await fetch(`${API_URL}/api/votacao-detalhes/${contractAddress}`, {
                    method: 'GET',
                    headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (!response.ok) throw new Error('Erro ao carregar detalhes.');
            const data = await response.json();

            sobreStatus.textContent = '';
            
            // --- LÓGICA DO BOTÃO (ADMIN/DATAS) ---
            if (data.admin_wallet_proponente) {
                currentVotacaoAdmin = data.admin_wallet_proponente;
                btnInserirComissao.classList.remove('hidden'); 
                let searchTerm = `${contractAddress}`

                let url2 = `${API_URL}/api/votacoes`;
                if (searchTerm) { url2 += `?search=${encodeURIComponent(searchTerm)}`; }
                
                const response2 = await fetch(url2, { credentials: 'include' }); 

                
                
                const comissaoExiste = data.comissao && 
                Array.isArray(data.comissao) && 
                data.comissao.length > 0 && 
                !data.comissao[0].includes("Não Definido");
                
                if (comissaoExiste) {
                    const agora = new Date();
                    let dataComissao = null;
                    let inicioInscricao = null;
                    let inicioVotacao = null;
                    let fimInscricao = null;
                    let fimVotacao = null;
                    try{

                        inicioInscricao = data.data_inicio_chapa.replace(' ', 'T');
                        inicioInscricao = new Date(inicioInscricao);
                        inicioInscricao.setHours(inicioInscricao.getHours() +3);

                        dataComissao = data.data_assembleia_geral.replace(' ', 'T');
                        dataComissao = new Date(dataComissao);
                        dataComissao.setHours(dataComissao.getHours() +3);

                        fimInscricao = data.data_fim_chapa.replace(' ', 'T');
                        fimInscricao = new Date(fimInscricao);
                        fimInscricao.setHours(fimInscricao.getHours() +3);
    
                        inicioVotacao = data.data_inicio_votacao.replace(' ', 'T');
                        inicioVotacao = new Date(inicioVotacao);
                        inicioVotacao.setHours(inicioVotacao.getHours() +3);

                        fimVotacao = data.data_fim_votacao.replace(' ', 'T');
                        fimVotacao = new Date(fimVotacao);
                        fimVotacao.setHours(fimVotacao.getHours() +3);


                    } catch {

                    }


                    

                    if(agora.getTime() >= fimInscricao && agora.getTime()<fimVotacao && agora.getTime()>= inicioVotacao && inicioVotacao!=null){
                        btnInserirComissao.textContent = "Votar";
                        btnInserirComissao.dataset.action = "votar";
                        btnAvaliarChapas.classList.add('hidden');
                    }

                    else if(agora.getTime() < inicioVotacao && agora.getTime()> fimInscricao && inicioVotacao!=null && inicioInscricao!=null){
                        btnInserirComissao.classList.add('hidden');

                        sobreStatus.textContent = 'Aguardando Votação';
                    }else if(agora.getTime()>=fimVotacao && fimVotacao!=null){
                        btnInserirComissao.classList.add('hidden'); // Esconde botões de ação
                        sobreStatus.textContent = 'Votação Encerrada';
                        sobreStatus.className = 'text-center font-bold text-red-600 mt-4';

                        // Chama a função para buscar e exibir os resultados
                        await exibirResultadosNaTelaSobre(contractAddress);
                    } 

                    else if (agora.getTime() >= inicioInscricao && agora.getTime() < fimInscricao && inicioInscricao!=null) {
                        btnInserirComissao.textContent = "Inscrever Chapa";
                        btnInserirComissao.dataset.action = "inscrever";
                        btnInserirComissao.className = "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300";
                        btnAvaliarChapas.classList.remove('hidden');
                    }else{
                        if (inicioVotacao!=null){
                            btnInserirComissao.classList.add('hidden');
                            sobreStatus.textContent = 'Aguardando Inscrição';
                        }else{

                            btnInserirComissao.textContent = "Definir Datas";
                            btnInserirComissao.dataset.action = "datas"; 
                            btnInserirComissao.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                            btnInserirComissao.classList.add('bg-green-600', 'hover:bg-green-700'); 
                        }


                    }
                } else {
                    const agora = new Date();
                    
                    let dataComissao = data.data_assembleia_geral.replace(' ', 'T');
                    dataComissao = new Date(dataComissao);
                    dataComissao.setHours(dataComissao.getHours() +3);

                    if (agora.getTime()<dataComissao && dataComissao!=null){
                        btnInserirComissao.classList.add('hidden');
                        sobreStatus.textContent = 'Aguardando Comissão';
                    }else{

                        btnInserirComissao.textContent = "Inserir Comissão";
                        btnInserirComissao.dataset.action = "comissao";
                        btnInserirComissao.classList.add('bg-blue-600', 'hover:bg-blue-700');
                        btnInserirComissao.classList.remove('bg-green-600', 'hover:bg-green-700');
                    }
                }
            }
            
            // --- PREENCHIMENTO DOS DADOS (ESTAVA FALTANDO ISSO) ---
            sobreCampus.textContent = data.campus || 'Não Definido';
            sobreCurso.textContent = data.curso || 'Não Definido'; // Adicionado Curso
            sobreDataAssembleia.textContent = formatarDataSimples(data.data_assembleia_geral) || 'Não Definido';
            
            sobreDataInscricao.textContent = data.data_inicio_chapa ? 
                `${formatarDataSimples(data.data_inicio_chapa)} - ${formatarDataSimples(data.data_fim_chapa)}` 
                : 'Não Definido';
            
            sobreDataVotacao.textContent = data.data_inicio_votacao ? 
                `${formatarDataSimples(data.data_inicio_votacao)} - ${formatarDataSimples(data.data_fim_votacao)}` 
                : 'Não Definido';

            if (data.comissao && Array.isArray(data.comissao)) {
                // Usa mb-2 para dar espaço entre os nomes
                sobreComissao.innerHTML = data.comissao.map(membro => `<p class="mb-2">${membro}</p>`).join('');
            } else {
                sobreComissao.textContent = 'Não Definido';
            }

            

        } catch (err) {
            sobreStatus.textContent = err.message;
            sobreStatus.classList.add('text-red-500');
        }
    }

    async function exibirResultadosNaTelaSobre(contractAddress) {
        const containerSobre = document.querySelector('#about-screen .border-b'); // Pega o container principal de info
        
        // Cria div de resultados
        const divResultados = document.createElement('div');
        divResultados.id = 'sobre-resultados-container';
        divResultados.className = 'mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200';
        divResultados.innerHTML = '<p class="text-center text-gray-600 font-bold animate-pulse">Calculando apuração...</p>';
        
        // Insere logo após o bloco de informações
        containerSobre.parentNode.insertBefore(divResultados, document.getElementById('sobre-status'));

        try {
            const response = await fetch(`${API_URL}/api/apurar-votos/${contractAddress}`, {
                method: 'GET',
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.description || 'Erro na apuração.');

            // Monta o HTML dos resultados
            let html = `
                <h3 class="text-xl font-bold text-gray-800 mb-4 text-center border-b pb-2">Resultado Final</h3>
                <ul class="space-y-3">
            `;

            // Ordena por total de votos (maior para menor)
            data.resultados.sort((a, b) => b.total_votos - a.total_votos);

            data.resultados.forEach((r, index) => {
                // Destaque para o vencedor (índice 0)
                const colorClass = index === 0 ? 'text-green-700 font-bold' : 'text-gray-700';
                const icon = index === 0 ? '🏆' : '•';
                
                html += `
                    <li class="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                        <span class="${colorClass} text-lg">
                            ${icon} Chapa ${r.numero_chapa} - ${r.nome_chapa}
                        </span>
                        <span class="bg-gray-200 text-gray-800 py-1 px-3 rounded-full font-mono font-bold">
                            ${r.total_votos} votos
                        </span>
                    </li>
                `;
            });

            html += `</ul>
                <p class="text-xs text-center text-gray-500 mt-4 pt-2 border-t">
                    ${data.mensagem}
                </p>
            `;

            divResultados.innerHTML = html;

        } catch (err) {
            divResultados.innerHTML = `
                <p class="text-center text-red-500 font-bold">Não foi possível carregar o resultado.</p>
                <p class="text-center text-xs text-red-400">${err.message}</p>
            `;
        }
    }

    function adicionarBlocoMembro() {
        contadorComissao++; // Incrementa o contador

        const novoBloco = document.createElement('div');
        novoBloco.className = 'bloco-membro border rounded-lg p-4 space-y-3 relative bg-gray-50';

        novoBloco.innerHTML = `
            <h3 class="font-semibold text-gray-800">Membro ${contadorComissao}</h3>
            
            <div>
                <label for="comissao-nome-${contadorComissao}" class="block text-sm font-medium text-gray-700">Nome</label>
                <input type="text" id="comissao-nome-${contadorComissao}" name="nome[]" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
            </div>
            
            <div>
                <label for="comissao-matricula-${contadorComissao}" class="block text-sm font-medium text-gray-700">Matrícula</label>
                <input type="text" id="comissao-matricula-${contadorComissao}" name="matricula[]" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
            </div>
            
            <div>
                <label for="comissao-email-${contadorComissao}" class="block text-sm font-medium text-gray-700">Email Institucional</label>
                <input type="email" id="comissao-email-${contadorComissao}" name="email[]" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
            </div>

            <button type="button" class="btn-remover-membro absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-xl" title="Remover Membro">&times;</button>
        `;
        
        listaComissaoContainer.appendChild(novoBloco);
    }

    // Listener para o botão "Adicionar Membro"
    btnAddComissao.addEventListener('click', adicionarBlocoMembro);

    // Listener para os botões "Remover" (usando delegação de evento)
    listaComissaoContainer.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('btn-remover-membro')) {
            // Pega o 'div' pai (o bloco-membro) e o remove
            const blocoParaRemover = evento.target.closest('.bloco-membro');
            blocoParaRemover.remove();

            // Atualiza a numeração dos blocos restantes
            const todosBlocos = listaComissaoContainer.querySelectorAll('.bloco-membro');
            todosBlocos.forEach((bloco, index) => {
                bloco.querySelector('h3').textContent = `Membro ${index + 1}`;
            });
        }
    });

    document.getElementById('form-datas-modal').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const statusEl = document.getElementById('modal-datas-status');
        statusEl.textContent = "Salvando...";
        statusEl.className = "text-center mt-2 text-sm font-bold text-blue-600";
        
        // 1. Captura os dados dos inputs
        const contractAddress = document.getElementById('modal-datas-contract-address').value;
        const inicioChapa = document.getElementById('modal-inicio-chapa').value;
        const fimChapa = document.getElementById('modal-fim-chapa').value;
        const inicioVotacao = document.getElementById('modal-inicio-votacao').value;
        const fimVotacao = document.getElementById('modal-fim-votacao').value;

        try {
            // 2. Envia para o Backend
            const response = await fetch(`${API_URL}/api/salvar-datas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contract_address: contractAddress,
                    inicio_chapa: inicioChapa,
                    fim_chapa: fimChapa,
                    inicio_votacao: inicioVotacao,
                    fim_votacao: fimVotacao
                })
            });

            // 3. Verifica erros
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.description || "Erro ao salvar datas.");
            }

            // 4. Sucesso
            statusEl.textContent = "Datas Salvas com Sucesso!";
            statusEl.className = "text-center mt-2 text-sm font-bold text-green-600";

            // Fecha o modal e atualiza a tela "Sobre" após 1.5 segundos
            setTimeout(() => {
                datasModal.classList.add('hidden');
                prepareSobreScreen(contractAddress); // Recarrega os dados na tela
            }, 1500);

        } catch (err) {
            console.error(err);
            statusEl.textContent = err.message;
            statusEl.className = "text-center mt-2 text-sm font-bold text-red-600";
        }
    });

    // Listener para "Salvar Comissão"
    formComissao.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        comissaoSaveStatus.textContent = 'Salvando...';
        comissaoSaveStatus.classList.remove('text-red-500', 'text-green-600');
        comissaoSaveStatus.classList.add('text-blue-600');

        const formData = new FormData(formComissao);
        const nomes = formData.getAll('nome[]');
        const matriculas = formData.getAll('matricula[]');
        const emails = formData.getAll('email[]');
        const contractAddress = document.getElementById('sobre-contract-address').value;

        // Aqui você enviaria os dados para o seu backend (API)
        console.log("Salvando comissão para o contrato:", contractAddress);
        console.log("Nomes:", nomes);
        console.log("Matrículas:", matriculas);
        console.log("Emails:", emails);

        try {
            // --- Exemplo de como enviar para o backend ---
            const response = await fetch(`${API_URL}/api/cadastrar-comissao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contract_address: contractAddress,
                    nomes: nomes,
                    matriculas: matriculas,
                    emails: emails
                })
            });
            if (!response.ok){
                const errData = await response.json();
                throw new Error(`${errData['message']}`);
            }
            // Simulação de sucesso (Remova isso quando tiver a API)
            // await new Promise(resolve => setTimeout(resolve, 1000)); 

            comissaoSaveStatus.textContent = 'Comissão salva com sucesso!';
            comissaoSaveStatus.classList.add('text-green-600');
            
            // Opcional: Voltar para a tela "Sobre" após salvar
            setTimeout(() => {

                showScreen(aboutScreen);
                // Você pode querer recarregar os dados da tela "Sobre" aqui
                prepareSobreScreen(contractAddress);
            }, 2000);

        } catch (err) {
            comissaoSaveStatus.textContent = `Erro: ${err.message}`;
            comissaoSaveStatus.classList.add('text-red-500');
        }
    });

    // --- Lógica Tela 4 (Inscrição de Chapa) (Sem Mudanças) ---
    // ... (código idêntico omitido por brevidade) ...
    chapaForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        btnSubmitChapa.disabled = true;
        btnSubmitChapa.textContent = 'Enviando...';
        chapaStatus.textContent = '';
        try {
            const chapaName = document.getElementById('chapa-name').value;
            const chapaProposal = document.getElementById('chapa-proposal').value;
            const contractAddress = chapaContractAddressInput.value;
            
            const response = await fetch(`${API_URL}/api/inscrever-chapa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', 
                body: JSON.stringify({
                    contract_address: contractAddress,
                    chapa_name: chapaName,
                    chapa_proposal: chapaProposal
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.description || 'Falha ao inscrever chapa.');
            }
            const data = await response.json();
            chapaStatus.textContent = `Chapa inscrita com sucesso! Seu número é: ${data.numero_chapa}`;
            chapaStatus.classList.add('text-green-600');
            setTimeout(() => { showScreen(voteScreen); fetchVotacoes(); }, 2000);
        } catch (err) {
            chapaStatus.textContent = err.message;
            chapaStatus.classList.add('text-red-500');
            btnSubmitChapa.disabled = false;
            btnSubmitChapa.textContent = 'Enviar Inscrição';
        }
    });

    btnAvaliarChapas.addEventListener('click', () => {
        const contractAddress = sobreContractAddressInput.value;
        
        // Abre o pop-up do Google com o modo 'comissao'
        const authUrl = `${API_URL}/api/auth/google?contract_address=${contractAddress}&mode=comissao`;
        
        // avaliarStatus.textContent = "Aguardando autenticação da comissão...";
        avaliarStatus.textContent = "";
        // Opcional: mostrar algum feedback visual de carregamento
        window.open(authUrl, '_blank', 'width=500,height=600');
    });

    btnBackFromAvaliar.addEventListener('click', () => {
        showScreen(aboutScreen);
    });


    // --- Lógica Tela 5 (Votar) ---
    function prepareVotarScreen(contractAddress, pollName) {
        // --- MUDANÇA PAILLIER ---
        // Reseta todo o estado de voto, incluindo as chaves Paillier
        currentVoteState = {
            contractAddress: null, merkleProof: null, nullifierHash: null,
            paillier_n: null, paillier_g: null, num_chapas: 0, paillier_publicKey: null
        };
        // ------------------------

        votarTitulo.textContent = `Votar em: ${pollName}`;
        votarContractAddressInput.value = contractAddress;
        
        votarAuthStep.classList.remove('hidden'); 
        votarVoteForm.classList.add('hidden');    
        votarMatriculaInput.value = '';
        votarAuthStatus.textContent = '';
        votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
        if (btnGoogleLogin) btnGoogleLogin.disabled = false;
    }

    // ... (btnGoogleLogin listener está correto) ...
    btnGoogleLogin.addEventListener('click', (e) => {
        const btn = e.target;
        btn.disabled = true;
        votarAuthStatus.textContent = 'Aguardando Google...';
        votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
        votarAuthStatus.classList.add('text-blue-600');

        const contractAddress = votarContractAddressInput.value;
        const matricula = votarMatriculaInput.value;
        
        if (!matricula) {
             votarAuthStatus.textContent = 'Por favor, insira sua matrícula primeiro.';
             votarAuthStatus.classList.add('text-red-500');
             btn.disabled = false;
             return;
        }

        const authUrl = `${API_URL}/api/auth/google?contract_address=${contractAddress}&matricula=${matricula}`;
        window.open(authUrl, '_blank', 'width=500,height=600');
        votarAuthStatus.textContent = '';
        btn.disabled = false;
    });

    // --- MUDANÇA PAILLIER ---
    // Atualizado para receber e criar a Chave Pública Paillier
    window.addEventListener('message', async (event) => {
        // console.log(event.data)
        if (event.data === 'auth_success') {
            if (votarScreen.classList.contains('hidden')) return; 
            votarAuthStatus.textContent = 'Google OK. Verificando provas e chave criptográfica...';
            
            try {
                const response = await fetch(`${API_URL}/api/get-vote-data`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                if (!response.ok || !data.autenticado) {
                    throw new Error(data.mensagem || "Falha na autenticação ou sessão expirada.");
                }

                votarAuthStatus.textContent = 'Aluno autenticado e chave pública recebida!';
                votarAuthStatus.classList.add('text-green-600');

                // --- SALVA O ESTADO DE VOTAÇÃO (INCLUINDO PAILLIER) ---
                currentVoteState.contractAddress = data.contract_address;
                currentVoteState.merkleProof = data.merkleProof;
                currentVoteState.nullifierHash = data.nullifierHash;
                currentVoteState.paillier_n = data.paillier_n;
                currentVoteState.paillier_g = data.paillier_g;
                currentVoteState.num_chapas = data.num_chapas;

                // --- CRIA O OBJETO DE CHAVE PÚBLICA PAILLIER NO JS ---
                // 'paillier' é global graças ao 'import * as paillier'
                if (typeof paillier === 'undefined' || typeof paillier.PublicKey === 'undefined') {
                    throw new Error('Biblioteca Paillier não foi carregada corretamente.');
                }
                
                // A biblioteca JS 'paillier-bigint' sabe ler o formato da 'phe'
                currentVoteState.paillier_publicKey = new paillier.PublicKey(
                    BigInt(data.paillier_n),
                    BigInt(data.paillier_g)
                );
                console.log("Chave pública Paillier recriada no frontend.");
                // ----------------------------------------------------

                renderChapasParaVotar(data.chapas, data.aluno_info);
                votarAuthStep.classList.add('hidden');
                
                votarVoteForm.classList.remove('hidden');
                votarVoteForm.reset();
                votarVoteStatus.textContent = '';
                btnSubmitVoto.disabled = false;

            } catch (err) {
                console.error("Erro no 'message' event:", err);
                votarAuthStatus.textContent = err.message;
                votarAuthStatus.classList.add('text-red-500');
                if(btnGoogleLogin) { btnGoogleLogin.disabled = false; }
            }
        }
        if (event.data === 'auth_comissao_success') {
             try {
                // Busca os dados da sessão que o backend salvou
                const response = await fetch(`${API_URL}/api/get-comissao-data`, { credentials: 'include' });
                const data = await response.json();
                
                if (!data.autenticado) throw new Error("Falha na autenticação.");

                // Sucesso! Mostra a tela de avaliação
                avaliarWelcomeMsg.textContent = `Bem-vindo(a), ${data.membro_nome}. Avalie as candidaturas abaixo.`;
                
                // Busca e renderiza as chapas pendentes
                await fetchAndRenderChapasPendentes(data.contract_address);
                
                showScreen(avaliarChapasScreen);

            } catch (err) {
                alert("Erro ao acessar área da comissão: " + err.message);
            }
        }
    });

    // ... (renderChapasParaVotar está correto) ...
    function renderChapasParaVotar(chapas, alunoInfo) {
        votarChapasList.innerHTML = ''; 
        if (alunoInfo) {
            votarUserInfoTitulo.innerHTML = `2. Escolha sua Chapa<p class="text-sm font-normal text-gray-600">Logado como: ${alunoInfo.nome} (${alunoInfo.email})</p>`;
        }
        if (chapas.length === 0) {
            votarChapasList.innerHTML = '<p class="text-center text-red-500">Nenhuma chapa inscrita.</p>';
            btnSubmitVoto.disabled = true;
            return;
        }
        btnSubmitVoto.disabled = false;
        chapas.forEach(chapa => {
            const label = document.createElement('label');
            label.className = 'block border rounded-lg p-3 hover:bg-gray-50 cursor-pointer';
            const propostaCurta = chapa.proposta.length > 100 ? chapa.proposta.substring(0, 100) + '...' : chapa.proposta;
            label.innerHTML = `
                <input type="radio" name="chapa-selecionada" value="${chapa.numero}" class="mr-2" required>
                <span class="font-semibold text-lg">Chapa ${chapa.numero} - ${chapa.nome}</span>
                <p class="text-sm text-gray-600 ml-6">${propostaCurta}</p>
            `;
            votarChapasList.appendChild(label);
        });
    }

    // --- MUDANÇA PAILLIER ---
    // O GRANDE FINAL: CRIPTOGRAFANDO O VOTO
    votarVoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSubmitVoto.disabled = true;
        btnSubmitVoto.textContent = 'Enviando Voto...';
        votarVoteStatus.textContent = 'Preparando seu voto...';
        votarVoteStatus.classList.remove('text-red-500', 'text-green-600');
        votarVoteStatus.classList.add('text-blue-600');

        try {
            const formData = new FormData(votarVoteForm);
            const numeroChapaSelecionada = formData.get('chapa-selecionada'); // Ex: "1", "2", ...
            if (!numeroChapaSelecionada) { throw new Error("Você precisa selecionar uma chapa."); }

            votarVoteStatus.textContent = 'Criptografando voto (Paillier)...';
            
            // --- LÓGICA DE CRIPTOGRAFIA HELIOS/PAILLIER ---
            
            const numChapas = currentVoteState.num_chapas;
            const publicKey = currentVoteState.paillier_publicKey;
            if (!publicKey) { throw new Error("Chave de criptografia não encontrada."); }

            const chapaIndex = parseInt(numeroChapaSelecionada) - 1; // Converte "1" -> 0, "2" -> 1
            
            // 1. Cria o array de voto puro: [0, 0, 1, 0]
            const voteArrayPuro = [];
            for (let i = 0; i < numChapas; i++) {
                voteArrayPuro.push(BigInt(i === chapaIndex ? 1 : 0));
            }
            
            // 2. Criptografa CADA item do array
            // (Isto pode demorar alguns segundos, é normal)
            const encryptedArray = voteArrayPuro.map(votoPuro => {
                // A mágica do Paillier.js
                return publicKey.encrypt(votoPuro).toString();
            });
            
            // 3. O voto final é o JSON string desse array de strings
            const votoCriptografado = JSON.stringify(encryptedArray);
            
            // -----------------------------------------------
            
            votarVoteStatus.textContent = 'Voto criptografado. Gerando recibo...';
            
            // O recibo é o hash do voto criptografado (o JSON string)
            const reciboDoAluno = ethers.keccak256(ethers.toUtf8Bytes(votoCriptografado));
            
            const payload = {
                contract_address: currentVoteState.contractAddress,
                votoCriptografado: votoCriptografado, // <-- O JSON criptografado
                reciboDoAluno: reciboDoAluno,
                nullifierHash: currentVoteState.nullifierHash,
                merkleProof: currentVoteState.merkleProof
            };
            
            votarVoteStatus.textContent = 'Enviando ao Relayer...';

            const response = await fetch(`${API_URL}/api/votar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', 
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok || !data.sucesso) {
                throw new Error(data.mensagem || 'Falha ao enviar o voto.');
            }

            votarVoteStatus.textContent = `Voto enviado com sucesso! (Hash: ${data.tx_hash.substring(0, 10)}...)`;
            votarVoteStatus.classList.add('text-green-600');

            setTimeout(() => {
                showScreen(voteScreen);
                fetchVotacoes(); // Atualiza a lista de votações
            }, 3000);

        } catch (err) {
            console.error("Erro ao criptografar ou votar:", err);
            votarVoteStatus.textContent = err.message;
            votarVoteStatus.classList.add('text-red-500');
            btnSubmitVoto.disabled = false;
            btnSubmitVoto.textContent = 'Enviar Voto (Grátis)';
        }
    });

    async function fetchAndRenderChapasPendentes(contractAddress) {
        listaChapasPendentes.innerHTML = '<p class="text-center text-gray-500">Carregando...</p>';
        
        try {
            const response = await fetch(`${API_URL}/api/chapas-pendentes/${contractAddress}`, {
                method: 'GET',
                headers: {
                    // Este cabeçalho é a chave mágica para o Ngrok liberar a API
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            // ---------------------

            if (!response.ok) {
                // Se der erro (ex: 404 ou 500), tenta ler o erro do JSON ou texto
                const text = await response.text(); 
                throw new Error(text || 'Erro na requisição');
            }
            
            const chapas = await response.json();

            listaChapasPendentes.innerHTML = '';

            if (chapas.length === 0) {
                listaChapasPendentes.innerHTML = '<p class="text-center text-gray-500">Nenhuma chapa pendente de avaliação.</p>';
                return;
            }

            chapas.forEach(chapa => {
                const card = document.createElement('div');
                card.className = "border border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm";
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-bold text-gray-800">Chapa ${chapa.numero}: ${chapa.nome}</h3>
                    </div>
                    <p class="text-gray-700 text-sm mb-4 bg-white p-3 rounded border">${chapa.proposta}</p>
                    <div class="flex gap-3">
                        <button class="btn-aprovar flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition" data-id="${chapa.id}">
                            Aprovar
                        </button>
                        <button class="btn-rejeitar flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition" data-id="${chapa.id}">
                            Rejeitar
                        </button>
                    </div>
                `;
                listaChapasPendentes.appendChild(card);
            });

        } catch (err) {
            listaChapasPendentes.innerHTML = `<p class="text-center text-red-500">Erro ao buscar chapas: ${err.message}</p>`;
        }
    }

    // Delegação de eventos para os botões Aprovar/Rejeitar
    listaChapasPendentes.addEventListener('click', async (e) => {
        const target = e.target;
        const chapaId = target.dataset.id;
        if (!chapaId) return;

        let aprovado = false;
        if (target.classList.contains('btn-aprovar')) aprovado = true;
        else if (target.classList.contains('btn-rejeitar')) aprovado = false;
        else return; // Clicou fora dos botões

        if (!confirm(`Tem certeza que deseja ${aprovado ? 'APROVAR' : 'REJEITAR'} esta chapa?`)) return;

        // UI Feedback
        target.disabled = true;
        target.textContent = "Processando...";

        try {
            const response = await fetch(`${API_URL}/api/julgar-chapa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapa_id: chapaId, aprovado: aprovado })
            });

            const resData = await response.json();
            if (!response.ok) throw new Error(resData.description || "Erro ao processar.");

            alert(resData.message);
            
            // Recarrega a lista (remove o card processado)
            const contractAddress = sobreContractAddressInput.value; // Pega o endereço atual
            fetchAndRenderChapasPendentes(contractAddress);

        } catch (err) {
            alert("Erro: " + err.message);
            target.disabled = false;
            target.textContent = aprovado ? "Aprovar" : "Rejeitar";
        }
    });

});
