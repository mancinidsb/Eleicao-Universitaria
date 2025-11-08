document.addEventListener('DOMContentLoaded', () => {
            
    // --- Seletores das Telas ---
    const homeScreen = document.getElementById('home-screen');
    const createScreen = document.getElementById('create-screen');
    const voteScreen = document.getElementById('vote-screen');
    const chapaScreen = document.getElementById('chapa-screen');
    const votarScreen = document.getElementById('votar-screen'); // NOVO

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

    // --- NOVO: Seletores Tela 5 (Votar) ---
    const btnBackToList2 = document.getElementById('btn-back-to-list-2');
    const votarTitulo = document.getElementById('votar-titulo');
    const votarAuthForm = document.getElementById('votar-auth-form');
    const votarVoteForm = document.getElementById('votar-vote-form');
    const votarContractAddressInput = document.getElementById('votar-contract-address');
    const votarMatriculaInput = document.getElementById('votar-matricula');
    const votarAuthStatus = document.getElementById('votar-auth-status');
    const btnSubmitAuth = document.getElementById('btn-submit-auth');
    const votarChapasList = document.getElementById('votar-chapas-list');
    const votarVoteStatus = document.getElementById('votar-vote-status');
    const btnSubmitVoto = document.getElementById('btn-submit-voto');

    // --- NOVO: Variáveis de estado para o voto ---
    let currentVoteState = {
        contractAddress: null,
        merkleProof: null,
        nullifierHash: null
    };

    // --- Funções de Navegação ---
    function showScreen(screenToShow) {
        homeScreen.classList.add('hidden');
        createScreen.classList.add('hidden');
        voteScreen.classList.add('hidden');
        chapaScreen.classList.add('hidden');
        votarScreen.classList.add('hidden'); // NOVO
        screenToShow.classList.remove('hidden');
    }

    btnShowCreate.addEventListener('click', (e) => { e.preventDefault(); showScreen(createScreen); });
    btnShowVote.addEventListener('click', (e) => { e.preventDefault(); showScreen(voteScreen); fetchVotacoes(); });
    btnBackHome.addEventListener('click', () => showScreen(homeScreen));
    btnBackHome2.addEventListener('click', () => showScreen(homeScreen));
    btnBackToList.addEventListener('click', () => showScreen(voteScreen));
    btnBackToList2.addEventListener('click', () => showScreen(voteScreen)); // NOVO

    // --- Lógica Tela 2 (Criar Votação) ---
    btnConnectMetamask.addEventListener('click', async () => { /* (código sem mudanças) */ 
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
    createPollForm.addEventListener('submit', async (evento) => { /* (código sem mudanças) */
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
    async function fetchVotacoes(searchTerm = '') { /* (código sem mudanças) */
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
    function renderVotacoes(votacoes) { /* (código sem mudanças) */
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

            // Salva o nome da votação no card para usarmos no título da Tela 5
            card.dataset.pollName = `${votacao.curso} (${votacao.campus})`;

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
    searchForm.addEventListener('submit', (e) => { /* (código sem mudanças) */
        e.preventDefault();
        const searchTerm = searchInput.value;
        fetchVotacoes(searchTerm);
    });

    // --- Lógica Tela 4 (Inscrição de Chapa) ---
    votacoesList.addEventListener('click', (e) => {
        const target = e.target;
        const contractAddress = target.dataset.contract;
        if (!contractAddress) return; 

        if (target.classList.contains('btn-votar-agora')) {
            console.log("Clicou em VOTAR AGORA no contrato:", contractAddress);
            
            // NOVO: Prepara e mostra a tela de votação (Tela 5)
            const pollName = target.closest('[data-poll-name]').dataset.pollName;
            prepareVotarScreen(contractAddress, pollName);
            showScreen(votarScreen);
        
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
    chapaForm.addEventListener('submit', async (e) => { /* (código atualizado para chamar o backend) */
        e.preventDefault();
        btnSubmitChapa.disabled = true;
        btnSubmitChapa.textContent = 'Enviando...';
        chapaStatus.textContent = '';
        chapaStatus.classList.remove('text-red-500', 'text-green-600');

        try {
            const chapaName = document.getElementById('chapa-name').value;
            const chapaProposal = document.getElementById('chapa-proposal').value;
            const contractAddress = chapaContractAddressInput.value;

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

            const data = await response.json();
            chapaStatus.textContent = `Chapa inscrita com sucesso! Seu número é: ${data.numero_chapa}`;
            chapaStatus.classList.add('text-green-600');

            setTimeout(() => { showScreen(voteScreen); }, 2000);
        } catch (err) {
            console.error("Erro ao inscrever chapa:", err);
            chapaStatus.textContent = err.message;
            chapaStatus.classList.add('text-red-500');
            btnSubmitChapa.disabled = false;
            btnSubmitChapa.textContent = 'Enviar Inscrição';
        }
    });

    // --- NOVO: Lógica Tela 5 (Votar) ---

    /**
     * Reseta o formulário de votação para seu estado inicial
     */
    function prepareVotarScreen(contractAddress, pollName) {
        // Reseta o estado global
        currentVoteState = { contractAddress: null, merkleProof: null, nullifierHash: null };

        // Preenche os dados da votação
        votarTitulo.textContent = `Votar em: ${pollName}`;
        votarContractAddressInput.value = contractAddress;

        // Reseta os formulários
        votarAuthForm.reset();
        votarVoteForm.reset();
        
        // Garante que a Etapa 1 (Auth) esteja visível e a Etapa 2 (Voto) oculta
        votarAuthForm.classList.remove('hidden');
        votarVoteForm.classList.add('hidden');
        
        // Limpa status
        votarAuthStatus.textContent = '';
        votarVoteStatus.textContent = '';
        votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
        votarVoteStatus.classList.remove('text-red-500', 'text-green-600');
        
        // Reativa botões
        btnSubmitAuth.disabled = false;
        btnSubmitAuth.textContent = 'Autenticar';
        btnSubmitVoto.disabled = false;
        btnSubmitVoto.textContent = 'Enviar Voto (Grátis)';
    }

    /**
     * Listener para o formulário de autenticação (Etapa 1)
     */
    votarAuthForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btnSubmitAuth.disabled = true;
        btnSubmitAuth.textContent = 'Autenticando...';
        votarAuthStatus.textContent = '';
        votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
        votarAuthStatus.classList.add('text-blue-600');

        const contractAddress = votarContractAddressInput.value;
        const matricula = votarMatriculaInput.value;

        try {
            // Chama a nova Rota 5 do backend
            const response = await fetch('http://127.0.0.1:5000/api/autenticar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contract_address: contractAddress,
                    matricula: matricula
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // 'autenticado: false' vem com um erro (ex: 403, 404)
                throw new Error(data.mensagem || data.description || 'Falha na autenticação.');
            }

            // SUCESSO! Aluno é válido
            votarAuthStatus.textContent = 'Aluno autenticado com sucesso!';
            votarAuthStatus.classList.remove('text-blue-600');
            votarAuthStatus.classList.add('text-green-600');

            // Salva as provas no estado global
            currentVoteState.contractAddress = contractAddress;
            currentVoteState.merkleProof = data.merkleProof;
            currentVoteState.nullifierHash = data.nullifierHash;

            // Renderiza as chapas (Etapa 2)
            renderChapasParaVotar(data.chapas);

            // Esconde a Etapa 1 e mostra a Etapa 2
            votarAuthForm.classList.add('hidden');
            votarVoteForm.classList.remove('hidden');

        } catch (err) {
            console.error("Erro na autenticação:", err);
            votarAuthStatus.textContent = err.message;
            votarAuthStatus.classList.add('text-red-500');
            btnSubmitAuth.disabled = false;
            btnSubmitAuth.textContent = 'Autenticar';
        }
    });

    /**
     * Renderiza as chapas (radio buttons) na tela de votação
     */
    function renderChapasParaVotar(chapas) {
        votarChapasList.innerHTML = ''; // Limpa lista anterior
        if (chapas.length === 0) {
            votarChapasList.innerHTML = '<p class="text-center text-red-500">Nenhuma chapa inscrita para esta votação ainda.</p>';
            btnSubmitVoto.disabled = true; // Desativa o botão se não há chapas
            return;
        }

        chapas.forEach(chapa => {
            const label = document.createElement('label');
            label.className = 'block border rounded-lg p-3 hover:bg-gray-50 cursor-pointer';
            
            // Trunca a proposta para exibição
            const propostaCurta = chapa.proposta.length > 100 
                ? chapa.proposta.substring(0, 100) + '...' 
                : chapa.proposta;
            
            label.innerHTML = `
                <input type="radio" name="chapa-selecionada" value="${chapa.numero}" class="mr-2" required>
                <span class="font-semibold text-lg">Chapa ${chapa.numero} - ${chapa.nome}</span>
                <p class="text-sm text-gray-600 ml-6">${propostaCurta}</p>
            `;
            votarChapasList.appendChild(label);
        });
    }

    /**
     * Listener para o formulário de votação (Etapa 2) - ATUALIZADO
     */
    votarVoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        btnSubmitVoto.disabled = true;
        btnSubmitVoto.textContent = 'Enviando Voto...';
        votarVoteStatus.textContent = 'Preparando seu voto...';
        votarVoteStatus.classList.remove('text-red-500', 'text-green-600');
        votarVoteStatus.classList.add('text-blue-600');

        try {
            const formData = new FormData(votarVoteForm);
            const numeroChapa = formData.get('chapa-selecionada');

            if (!numeroChapa) {
                throw new Error("Você precisa selecionar uma chapa.");
            }

            // 1. Prepara os dados para o Relayer.
            // O "voto criptografado" é apenas o número da chapa em string.
            // O seu contrato `Voting.sol` aceita `bytes`, então `utf-8` é perfeito.
            const votoCriptografado = `Chapa ${numeroChapa}`; // Ex: "Chapa 1"
            
            // 2. Gera o recibo do aluno (hash do voto)
            // Usamos keccak256 para ser compatível com o Solidity
            const reciboDoAluno = ethers.keccak256(ethers.toUtf8Bytes(votoCriptografado));
            
            console.log("Enviando voto para o Relayer (/api/votar)...");
            console.log("  Voto:", votoCriptografado);
            console.log("  Recibo:", reciboDoAluno);
            console.log("  Nullifier:", currentVoteState.nullifierHash);

            // 3. Monta o payload para o backend (Flask)
            const payload = {
                contract_address: currentVoteState.contractAddress,
                votoCriptografado: votoCriptografado,
                reciboDoAluno: reciboDoAluno,
                nullifierHash: currentVoteState.nullifierHash,
                merkleProof: currentVoteState.merkleProof
            };

            // 4. Envia para a Rota 6 (Relayer)
            const response = await fetch('http://127.0.0.1:5000/api/votar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.sucesso) {
                // Se o backend (ou o contrato) deu erro
                throw new Error(data.mensagem || data.description || 'Falha ao enviar o voto.');
            }

            // SUCESSO!
            votarVoteStatus.textContent = `Voto enviado com sucesso! (Hash: ${data.tx_hash.substring(0, 10)}...)`;
            votarVoteStatus.classList.remove('text-blue-600');
            votarVoteStatus.classList.add('text-green-600');

            // Volta para a home após 3 segundos
            setTimeout(() => {
                showScreen(homeScreen);
            }, 3000);

        } catch (err) {
            console.error("Erro ao votar:", err);
            votarVoteStatus.textContent = err.message;
            votarVoteStatus.classList.add('text-red-500');
            btnSubmitVoto.disabled = false;
            btnSubmitVoto.textContent = 'Enviar Voto (Grátis)';
        }
    });

});