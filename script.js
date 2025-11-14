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

document.addEventListener('DOMContentLoaded', () => {

    // --- API URL ---
    // Mude para o seu URL do NGROK ou http://127.0.0.1:5000
    const API_URL = 'https://ballastic-latricia-delectably.ngrok-free.dev';
            
    // --- Seletores das Telas ---
    const homeScreen = document.getElementById('home-screen');
    // ... (todos os seus seletores estão corretos) ...
    const createScreen = document.getElementById('create-screen');
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
    const data_inicio_chapa = document.getElementById('data-inicio-chapa');
    const data_fim_chapa = document.getElementById('data-fim-chapa');
    const data_inicio_votacao = document.getElementById('data-inicio-votacao');
    const data_fim_votacao = document.getElementById('data-fim-votacao');
    const agora = new Date();
    data_inicio_chapa.value = formatarDataParaInput(agora);
    agora.setMinutes(agora.getMinutes() +5);
    data_fim_chapa.value = formatarDataParaInput(agora); 
    agora.setMinutes(agora.getMinutes() + 5);
    data_inicio_votacao.value = formatarDataParaInput(agora);
    agora.setMinutes(agora.getMinutes() + 10);
    data_fim_votacao.value = formatarDataParaInput(agora);
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
        voteScreen.classList.add('hidden');
        chapaScreen.classList.add('hidden');
        votarScreen.classList.add('hidden');
        screenToShow.classList.remove('hidden');
    }
    // ... (seus listeners de navegação estão corretos) ...
    btnShowCreate.addEventListener('click', (e) => { e.preventDefault(); showScreen(createScreen); });
    btnShowVote.addEventListener('click', (e) => { e.preventDefault(); showScreen(voteScreen); fetchVotacoes(); });
    btnBackHome.addEventListener('click', () => showScreen(homeScreen));
    btnBackHome2.addEventListener('click', () => showScreen(homeScreen));
    btnBackToList.addEventListener('click', () => showScreen(voteScreen));
    btnBackToList2.addEventListener('click', () => showScreen(voteScreen));

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
        const dataInicioChapa = document.getElementById('data-inicio-chapa').value;
        const dataFimChapa = document.getElementById('data-fim-chapa').value;
        const dataInicioVotacao = document.getElementById('data-inicio-votacao').value;
        const dataFimVotacao = document.getElementById('data-fim-votacao').value;

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

            const contract = await factory.deploy(merkleRoot, relayerAddress);

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
                    data_inicio_chapa: dataInicioChapa,
                    data_fim_chapa: dataFimChapa,
                    data_inicio_votacao: dataInicioVotacao,
                    data_fim_votacao: dataFimVotacao
                })
            });

            if (!responseSave.ok) throw new Error('Falha ao salvar dados no backend.');
            
            metamaskStatus.textContent = `Votação criada! Contrato: ${contractAddress}`;
            metamaskStatus.classList.add('text-green-600');
            btnSubmitPoll.textContent = 'Votação Criada!';
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
            btnSubmitPoll.disabled = false;
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
            let url = 'https://ballastic-latricia-delectably.ngrok-free.dev/api/votacoes'; 
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

            const estadoTexto = votacao.estado_contrato_str;
            let estadoCor = 'text-gray-600';
            if (estadoTexto.includes('Aberta')) estadoCor = 'text-green-600';
            if (estadoTexto.includes('Encerrada')) estadoCor = 'text-red-600';
            if (estadoTexto.includes('Aguardando')) estadoCor = 'text-blue-600';
            
            let botoesHTML = '';

            let data_fim_chapa = new Date(votacao.data_fim_chapa);
            let data_inicio_votacao = new Date(votacao.data_inicio_votacao);
            let data_fim_votacao = new Date(votacao.data_fim_votacao);

            const options = {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,   // Garante o formato 24h
                timeZone: 'UTC'  // ESSENCIAL: Usa o horário UTC (GMT) original
            };

            data_fim_chapa = new Intl.DateTimeFormat('pt-BR', options).format(data_fim_chapa);
            data_inicio_votacao = new Intl.DateTimeFormat('pt-BR', options).format(data_inicio_votacao);
            data_fim_votacao = new Intl.DateTimeFormat('pt-BR', options).format(data_fim_votacao);

            let data_final = '';

            
            // (0=Pendente, 1=Inscricao, 2=Votacao, 3=Encerrada)
            switch(votacao.estado_contrato_int) {
                case 0: // Pendente
                    if (estadoTexto.includes('Aguardando')) {
                        botoesHTML = `<span class="text-sm text-gray-500">Aguardando início das inscrições.</span>`;
                    } else { // 'Inscrição Aberta' (baseado na data do app)
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Inscrever Chapa</button>`;
                        data_final = `${data_fim_chapa.replace(',', '')}`;
                    }
                    break;
                case 1: // Inscricao
                    if (estadoTexto.includes('Encerrada')) { // Data do app já passou
                        botoesHTML = `<span class="text-sm text-gray-500">Inscrição encerrada. Aguardando votação.</span>`;
                        data_final = `${data_inicio_votacao}`;
                    } else {
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Inscrever Chapa</button>`;
                        data_final = `${data_fim_chapa.replace(',', '')}`;
                    } 
                    break;
                case 2: // Votacao
                    if (estadoTexto.includes('Encerrada')) { // Data do app já passou
                        botoesHTML = `<span class="text-sm text-gray-500">Votação encerrada. Aguardando apuração.</span>`;
                        data_final = `${data_fim_votacao.replace(',', '')}`;
                    } else {
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-votar-agora w-full flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Votar Agora</button>`;
                        data_final = `${data_fim_votacao.replace(',', '')}`;
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

});