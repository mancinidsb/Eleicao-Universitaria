document.addEventListener('DOMContentLoaded', () => {
            
    // --- Seletores das Telas ---
    const homeScreen = document.getElementById('home-screen');
    const createScreen = document.getElementById('create-screen');
    const voteScreen = document.getElementById('vote-screen');
    const chapaScreen = document.getElementById('chapa-screen');

    // --- Seletores Tela 1 (Home) ---
    const btnShowCreate = document.getElementById('btn-show-create');
    const btnShowVote = document.getElementById('btn-show-vote'); 

    // --- Seletores Tela 2 (Criar) ---
    const btnBackHome = document.getElementById('btn-back-home');
    const btnConnectMetamask = document.getElementById('btn-connect-metamask');
    const metamaskStatus = document.getElementById('metamask-status');
    const createPollForm = document.getElementById('create-poll-form');
    const walletAddressInput = document.getElementById('wallet-address');
    const btnSubmitPoll = document.getElementById('btn-submit-poll');

    // --- Seletores Tela 3 (Votar/Lista) ---
    const btnBackHome2 = document.getElementById('btn-back-home-2'); 
    const searchForm = document.getElementById('search-form'); 
    const searchInput = document.getElementById('search-input'); 
    const votacoesList = document.getElementById('votacoes-list'); 
    const votacoesStatus = document.getElementById('votacoes-status'); 

    // --- Seletores Tela 4 (Inscrever Chapa) ---
    const btnBackToList = document.getElementById('btn-back-to-list');
    const chapaForm = document.getElementById('chapa-form');
    const chapaStatus = document.getElementById('chapa-status');
    const btnSubmitChapa = document.getElementById('btn-submit-chapa');
    const chapaContractAddressInput = document.getElementById('chapa-contract-address');

    // --- Funções de Navegação ---
    function showScreen(screenToShow) {
        homeScreen.classList.add('hidden');
        createScreen.classList.add('hidden');
        voteScreen.classList.add('hidden');
        chapaScreen.classList.add('hidden');
        screenToShow.classList.remove('hidden');
    }

    btnShowCreate.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen(createScreen);
    });
    
    btnShowVote.addEventListener('click', (e) => { 
        e.preventDefault();
        showScreen(voteScreen);
        fetchVotacoes(); 
    });
    
    btnBackHome.addEventListener('click', () => showScreen(homeScreen));
    btnBackHome2.addEventListener('click', () => showScreen(homeScreen));
    btnBackToList.addEventListener('click', () => showScreen(voteScreen));

    // --- Lógica Tela 2 (Criar Votação) ---
    
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

        try {
            metamaskStatus.textContent = 'Gerando Merkle Root no servidor...';
            metamaskStatus.classList.add('text-blue-600');
            
            const responseInfo = await fetch('http://127.0.0.1:5000/api/prepare-deploy', {
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
            metamaskStatus.textContent = 'Salvando dados no servidor...';
            
            const responseSave = await fetch('http://127.0.0.1:5000/api/criar-votacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sigaa_link: sigaaLink,
                    admin_wallet: adminAddress,
                    contract_address: contractAddress,
                    campus: campusName,
                    curso: cursoName
                })
            });

            if (!responseSave.ok) throw new Error('Falha ao salvar dados no backend.');
            
            metamaskStatus.textContent = `Votação criada! Contrato: ${contractAddress.substring(0, 6)}...`;
            metamaskStatus.classList.add('text-green-600');
            btnSubmitPoll.textContent = 'Votação Criada!';

        } catch (err) {
            console.error("Erro no processo de deploy:", err);
            let errorMsg = err.code === 'ACTION_REJECTED' ? 'Você rejeitou a transação.' : err.message;
            metamaskStatus.textContent = errorMsg;
            metamaskStatus.classList.add('text-red-500');
            btnSubmitPoll.textContent = 'Criar Votação';
            btnSubmitPoll.disabled = false;
        }
    });

    // --- Lógica Tela 3 (Listar/Buscar Votações) ---
    
    async function fetchVotacoes(searchTerm = '') {
        votacoesList.innerHTML = ''; 
        votacoesStatus.textContent = 'Carregando votações...';

        try {
            let url = 'http://127.0.0.1:5000/api/votacoes';
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Não foi possível buscar as votações.');
            }

            const votacoes = await response.json();
            renderVotacoes(votacoes);

        } catch (err) {
            console.error("Erro ao buscar votações:", err);
            votacoesStatus.textContent = err.message;
            votacoesStatus.classList.add('text-red-500');
        }
    }

    function renderVotacoes(votacoes) {
        votacoesList.innerHTML = ''; 
        
        if (votacoes.length === 0) {
            votacoesStatus.textContent = 'Nenhuma votação encontrada.';
            return;
        }

        votacoesStatus.textContent = ''; 
        
        votacoes.forEach(votacao => {
            const card = document.createElement('div');
            card.className = 'border rounded-lg p-4 shadow-sm bg-gray-50';
            
            const formatWallet = (wallet) => `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;

            card.innerHTML = `
                <h3 class="font-semibold text-lg text-blue-700">${votacao.campus}</h3>
                <p class="text-gray-700">${votacao.curso}</p>
                <div class="mt-3 border-t pt-2">
                    <p class="text-sm text-gray-600">
                        Proponente: <span class="font-mono text-gray-900">${formatWallet(votacao.admin_wallet)}</span>
                    </p>
                    <p class="text-sm text-gray-600">
                        Contrato: <span class="font-mono text-gray-900">${formatWallet(votacao.contract_address)}</span>
                    </p>
                </div>
                <div class="mt-4 flex flex-col sm:flex-row gap-2">
                    <button data-contract="${votacao.contract_address}" class="btn-votar-agora w-full flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                        Votar Agora
                    </button>
                    <button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                        Inscrever Chapa
                    </button>
                </div>
            `;
            votacoesList.appendChild(card);
        });
    }

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchInput.value;
        console.log(`Buscando por: "${searchTerm}"`);
        fetchVotacoes(searchTerm);
    });

    // --- Lógica Tela 4 (Inscrição de Chapa) ---

    // Este listener (para 'Votar Agora' e 'Inscrever Chapa') não muda
    votacoesList.addEventListener('click', (e) => {
        const target = e.target;
        const contractAddress = target.dataset.contract;
        if (!contractAddress) return; 

        if (target.classList.contains('btn-votar-agora')) {
            console.log("Clicou em VOTAR AGORA no contrato:", contractAddress);
            alert('Funcionalidade "Votar Agora" ainda não implementada.');
        
        } else if (target.classList.contains('btn-inscrever-chapa')) {
            console.log("Clicou em INSCREVER CHAPA no contrato:", contractAddress);
            
            chapaContractAddressInput.value = contractAddress;
            
            chapaForm.reset();
            chapaStatus.textContent = '';
            chapaStatus.classList.remove('text-red-500', 'text-green-600');
            btnSubmitChapa.disabled = false;
            btnSubmitChapa.textContent = 'Enviar Inscrição';

            showScreen(chapaScreen);
        }
    });

    // ATUALIZADO: Esta função agora envia os dados para o Flask
    chapaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        btnSubmitChapa.disabled = true;
        btnSubmitChapa.textContent = 'Enviando...';
        chapaStatus.textContent = '';
        chapaStatus.classList.remove('text-red-500', 'text-green-600');

        try {
            // Pega os dados do formulário
            const chapaName = document.getElementById('chapa-name').value;
            const chapaProposal = document.getElementById('chapa-proposal').value;
            const contractAddress = chapaContractAddressInput.value;

            // Envia para a nova rota do backend (Flask)
            const response = await fetch('http://127.0.0.1:5000/api/inscrever-chapa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

            // Pega a resposta do backend (com o número da chapa)
            const data = await response.json();
            
            // Mostra a mensagem de sucesso com o número gerado!
            chapaStatus.textContent = `Chapa inscrita com sucesso! Seu número é: ${data.numero_chapa}`;
            chapaStatus.classList.add('text-green-600');

            // Volta para a lista após 2 segundos
            setTimeout(() => {
                showScreen(voteScreen);
            }, 2000);

        } catch (err) {
            console.error("Erro ao inscrever chapa:", err);
            chapaStatus.textContent = err.message;
            chapaStatus.classList.add('text-red-500');
            btnSubmitChapa.disabled = false;
            btnSubmitChapa.textContent = 'Enviar Inscrição';
        }
    });

}); // Fim do script

