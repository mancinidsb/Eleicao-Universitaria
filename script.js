// // document.addEventListener('DOMContentLoaded', () => {
            
// //     // --- Seletores das Telas ---
// //     const homeScreen = document.getElementById('home-screen');
// //     const createScreen = document.getElementById('create-screen');
// //     const voteScreen = document.getElementById('vote-screen');
// //     const chapaScreen = document.getElementById('chapa-screen');
// //     const votarScreen = document.getElementById('votar-screen'); // NOVO

// //     // --- Seletores Tela 1 (Home) ---
// //     const btnShowCreate = document.getElementById('btn-show-create');
// //     const btnShowVote = document.getElementById('btn-show-vote'); 

// //     // --- Seletores Tela 2 (Criar) ---
// //     const btnBackHome = document.getElementById('btn-back-home');
// //     const btnConnectMetamask = document.getElementById('btn-connect-metamask');
// //     const metamaskStatus = document.getElementById('metamask-status');
// //     const createPollForm = document.getElementById('create-poll-form');
// //     const walletAddressInput = document.getElementById('wallet-address');
// //     const btnSubmitPoll = document.getElementById('btn-submit-poll');

// //     // --- Seletores Tela 3 (Votar/Lista) ---
// //     const btnBackHome2 = document.getElementById('btn-back-home-2'); 
// //     const searchForm = document.getElementById('search-form'); 
// //     const searchInput = document.getElementById('search-input'); 
// //     const votacoesList = document.getElementById('votacoes-list'); 
// //     const votacoesStatus = document.getElementById('votacoes-status'); 

// //     // --- Seletores Tela 4 (Inscrever Chapa) ---
// //     const btnBackToList = document.getElementById('btn-back-to-list');
// //     const chapaForm = document.getElementById('chapa-form');
// //     const chapaStatus = document.getElementById('chapa-status');
// //     const btnSubmitChapa = document.getElementById('btn-submit-chapa');
// //     const chapaContractAddressInput = document.getElementById('chapa-contract-address');

// //     // --- NOVO: Seletores Tela 5 (Votar) ---
// //     const btnBackToList2 = document.getElementById('btn-back-to-list-2');
// //     const votarTitulo = document.getElementById('votar-titulo');
// //     const votarAuthForm = document.getElementById('votar-auth-form');
// //     const votarVoteForm = document.getElementById('votar-vote-form');
// //     const votarContractAddressInput = document.getElementById('votar-contract-address');
// //     const votarMatriculaInput = document.getElementById('votar-matricula');
// //     const votarAuthStatus = document.getElementById('votar-auth-status');
// //     const btnSubmitAuth = document.getElementById('btn-submit-auth');
// //     const votarChapasList = document.getElementById('votar-chapas-list');
// //     const votarVoteStatus = document.getElementById('votar-vote-status');
// //     const btnSubmitVoto = document.getElementById('btn-submit-voto');

// //     // --- NOVO: Variáveis de estado para o voto ---
// //     let currentVoteState = {
// //         contractAddress: null,
// //         merkleProof: null,
// //         nullifierHash: null
// //     };

// //     // --- Funções de Navegação ---
// //     function showScreen(screenToShow) {
// //         homeScreen.classList.add('hidden');
// //         createScreen.classList.add('hidden');
// //         voteScreen.classList.add('hidden');
// //         chapaScreen.classList.add('hidden');
// //         votarScreen.classList.add('hidden'); // NOVO
// //         screenToShow.classList.remove('hidden');
// //     }

// //     btnShowCreate.addEventListener('click', (e) => { e.preventDefault(); showScreen(createScreen); });
// //     btnShowVote.addEventListener('click', (e) => { e.preventDefault(); showScreen(voteScreen); fetchVotacoes(); });
// //     btnBackHome.addEventListener('click', () => showScreen(homeScreen));
// //     btnBackHome2.addEventListener('click', () => showScreen(homeScreen));
// //     btnBackToList.addEventListener('click', () => showScreen(voteScreen));
// //     btnBackToList2.addEventListener('click', () => showScreen(voteScreen)); // NOVO

// //     // --- Lógica Tela 2 (Criar Votação) ---
// //     btnConnectMetamask.addEventListener('click', async () => { /* (código sem mudanças) */ 
// //         metamaskStatus.textContent = 'Abrindo o MetaMask...';
// //         metamaskStatus.classList.remove('text-red-500', 'text-green-600');
// //         metamaskStatus.classList.add('text-blue-600');
// //         if (typeof window.ethereum !== 'undefined') {
// //             try {
// //                 const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
// //                 const account = accounts[0];
// //                 metamaskStatus.textContent = `Conectado: ${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
// //                 metamaskStatus.classList.remove('text-blue-600', 'text-red-500');
// //                 metamaskStatus.classList.add('text-green-600');
// //                 walletAddressInput.value = account;
// //                 btnConnectMetamask.querySelector('span').textContent = 'Conta Conectada';
// //                 btnConnectMetamask.disabled = true;
// //                 btnSubmitPoll.disabled = false;
// //             } catch (err) {
// //                 let errorMsg = err.code === 4001 ? 'Você rejeitou a conexão.' : 'Erro ao conectar.';
// //                 metamaskStatus.textContent = errorMsg;
// //                 metamaskStatus.classList.add('text-red-500');
// //             }
// //         } else {
// //             metamaskStatus.textContent = 'Erro: Por favor, instale a MetaMask.';
// //             metamaskStatus.classList.add('text-red-500');
// //         }
// //     });
// //     createPollForm.addEventListener('submit', async (evento) => { /* (código sem mudanças) */
// //         evento.preventDefault(); 
// //         btnSubmitPoll.textContent = 'Enviando...';
// //         btnSubmitPoll.disabled = true;
// //         metamaskStatus.classList.remove('text-red-500', 'text-green-600');
        
// //         const sigaaLink = document.getElementById('sigaa-link').value;
// //         const adminAddress = walletAddressInput.value;
// //         const campusName = document.getElementById('campus-name').value;
// //         const cursoName = document.getElementById('curso-name').value;

// //         try {
// //             metamaskStatus.textContent = 'Gerando Merkle Root no servidor...';
// //             metamaskStatus.classList.add('text-blue-600');
            
// //             const responseInfo = await fetch('http://127.0.0.1:5000/api/prepare-deploy', {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json' },
// //                 body: JSON.stringify({ sigaa_link: sigaaLink })
// //             });
            
// //             if (!responseInfo.ok) {
// //                 const errData = await responseInfo.json();
// //                 throw new Error(errData.description || 'Falha ao buscar dados do backend.');
// //             }
            
// //             const { abi, bytecode, merkleRoot, relayerAddress } = await responseInfo.json();
            
// //             metamaskStatus.textContent = 'Abra o MetaMask para aprovar o deploy...';
            
// //             const provider = new ethers.BrowserProvider(window.ethereum);
// //             const signer = await provider.getSigner(); 
// //             const factory = new ethers.ContractFactory(abi, bytecode, signer);
// //             const contract = await factory.deploy(merkleRoot, relayerAddress);

// //             metamaskStatus.textContent = 'Aguardando confirmação da rede...';
// //             await contract.waitForDeployment();
            
// //             const contractAddress = await contract.getAddress();
// //             metamaskStatus.textContent = 'Salvando dados no servidor...';
            
// //             const responseSave = await fetch('http://127.0.0.1:5000/api/criar-votacao', {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json' },
// //                 body: JSON.stringify({
// //                     sigaa_link: sigaaLink,
// //                     admin_wallet: adminAddress,
// //                     contract_address: contractAddress,
// //                     campus: campusName,
// //                     curso: cursoName
// //                 })
// //             });

// //             if (!responseSave.ok) throw new Error('Falha ao salvar dados no backend.');
            
// //             metamaskStatus.textContent = `Votação criada! Contrato: ${contractAddress.substring(0, 6)}...`;
// //             metamaskStatus.classList.add('text-green-600');
// //             btnSubmitPoll.textContent = 'Votação Criada!';

// //         } catch (err) {
// //             console.error("Erro no processo de deploy:", err);
// //             let errorMsg = err.code === 'ACTION_REJECTED' ? 'Você rejeitou a transação.' : err.message;
// //             metamaskStatus.textContent = errorMsg;
// //             metamaskStatus.classList.add('text-red-500');
// //             btnSubmitPoll.textContent = 'Criar Votação';
// //             btnSubmitPoll.disabled = false;
// //         }
// //     });

// //     // --- Lógica Tela 3 (Listar/Buscar Votações) ---
// //     async function fetchVotacoes(searchTerm = '') { /* (código sem mudanças) */
// //         votacoesList.innerHTML = ''; 
// //         votacoesStatus.textContent = 'Carregando votações...';

// //         try {
// //             let url = 'http://127.0.0.1:5000/api/votacoes';
// //             if (searchTerm) {
// //                 url += `?search=${encodeURIComponent(searchTerm)}`;
// //             }

// //             const response = await fetch(url);
// //             if (!response.ok) {
// //                 throw new Error('Não foi possível buscar as votações.');
// //             }

// //             const votacoes = await response.json();
// //             renderVotacoes(votacoes);

// //         } catch (err) {
// //             console.error("Erro ao buscar votações:", err);
// //             votacoesStatus.textContent = err.message;
// //             votacoesStatus.classList.add('text-red-500');
// //         }
// //     }
// //     function renderVotacoes(votacoes) { /* (código sem mudanças) */
// //         votacoesList.innerHTML = ''; 
        
// //         if (votacoes.length === 0) {
// //             votacoesStatus.textContent = 'Nenhuma votação encontrada.';
// //             return;
// //         }

// //         votacoesStatus.textContent = ''; 
        
// //         votacoes.forEach(votacao => {
// //             const card = document.createElement('div');
// //             card.className = 'border rounded-lg p-4 shadow-sm bg-gray-50';
            
// //             const formatWallet = (wallet) => `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;

// //             // Salva o nome da votação no card para usarmos no título da Tela 5
// //             card.dataset.pollName = `${votacao.curso} (${votacao.campus})`;

// //             card.innerHTML = `
// //                 <h3 class="font-semibold text-lg text-blue-700">${votacao.campus}</h3>
// //                 <p class="text-gray-700">${votacao.curso}</p>
// //                 <div class="mt-3 border-t pt-2">
// //                     <p class="text-sm text-gray-600">
// //                         Proponente: <span class="font-mono text-gray-900">${formatWallet(votacao.admin_wallet)}</span>
// //                     </p>
// //                     <p class="text-sm text-gray-600">
// //                         Contrato: <span class="font-mono text-gray-900">${formatWallet(votacao.contract_address)}</span>
// //                     </p>
// //                 </div>
// //                 <div class="mt-4 flex flex-col sm:flex-row gap-2">
// //                     <button data-contract="${votacao.contract_address}" class="btn-votar-agora w-full flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
// //                         Votar Agora
// //                     </button>
// //                     <button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
// //                         Inscrever Chapa
// //                     </button>
// //                 </div>
// //             `;
// //             votacoesList.appendChild(card);
// //         });
// //     }
// //     searchForm.addEventListener('submit', (e) => { /* (código sem mudanças) */
// //         e.preventDefault();
// //         const searchTerm = searchInput.value;
// //         fetchVotacoes(searchTerm);
// //     });

// //     // --- Lógica Tela 4 (Inscrição de Chapa) ---
// //     votacoesList.addEventListener('click', (e) => {
// //         const target = e.target;
// //         const contractAddress = target.dataset.contract;
// //         if (!contractAddress) return; 

// //         if (target.classList.contains('btn-votar-agora')) {
// //             console.log("Clicou em VOTAR AGORA no contrato:", contractAddress);
            
// //             // NOVO: Prepara e mostra a tela de votação (Tela 5)
// //             const pollName = target.closest('[data-poll-name]').dataset.pollName;
// //             prepareVotarScreen(contractAddress, pollName);
// //             showScreen(votarScreen);
        
// //         } else if (target.classList.contains('btn-inscrever-chapa')) {
// //             console.log("Clicou em INSCREVER CHAPA no contrato:", contractAddress);
            
// //             chapaContractAddressInput.value = contractAddress;
// //             chapaForm.reset();
// //             chapaStatus.textContent = '';
// //             chapaStatus.classList.remove('text-red-500', 'text-green-600');
// //             btnSubmitChapa.disabled = false;
// //             btnSubmitChapa.textContent = 'Enviar Inscrição';

// //             showScreen(chapaScreen);
// //         }
// //     });
// //     chapaForm.addEventListener('submit', async (e) => { /* (código atualizado para chamar o backend) */
// //         e.preventDefault();
// //         btnSubmitChapa.disabled = true;
// //         btnSubmitChapa.textContent = 'Enviando...';
// //         chapaStatus.textContent = '';
// //         chapaStatus.classList.remove('text-red-500', 'text-green-600');

// //         try {
// //             const chapaName = document.getElementById('chapa-name').value;
// //             const chapaProposal = document.getElementById('chapa-proposal').value;
// //             const contractAddress = chapaContractAddressInput.value;

// //             const response = await fetch('http://127.0.0.1:5000/api/inscrever-chapa', {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json' },
// //                 body: JSON.stringify({
// //                     contract_address: contractAddress,
// //                     chapa_name: chapaName,
// //                     chapa_proposal: chapaProposal
// //                 })
// //             });

// //             if (!response.ok) {
// //                 const errData = await response.json();
// //                 throw new Error(errData.description || 'Falha ao inscrever chapa.');
// //             }

// //             const data = await response.json();
// //             chapaStatus.textContent = `Chapa inscrita com sucesso! Seu número é: ${data.numero_chapa}`;
// //             chapaStatus.classList.add('text-green-600');

// //             setTimeout(() => { showScreen(voteScreen); }, 2000);
// //         } catch (err) {
// //             console.error("Erro ao inscrever chapa:", err);
// //             chapaStatus.textContent = err.message;
// //             chapaStatus.classList.add('text-red-500');
// //             btnSubmitChapa.disabled = false;
// //             btnSubmitChapa.textContent = 'Enviar Inscrição';
// //         }
// //     });

// //     // --- NOVO: Lógica Tela 5 (Votar) ---

// //     /**
// //      * Reseta o formulário de votação para seu estado inicial
// //      */
// //     function prepareVotarScreen(contractAddress, pollName) {
// //         // Reseta o estado global
// //         currentVoteState = { contractAddress: null, merkleProof: null, nullifierHash: null };

// //         // Preenche os dados da votação
// //         votarTitulo.textContent = `Votar em: ${pollName}`;
// //         votarContractAddressInput.value = contractAddress;

// //         // Reseta os formulários
// //         votarAuthForm.reset();
// //         votarVoteForm.reset();
        
// //         // Garante que a Etapa 1 (Auth) esteja visível e a Etapa 2 (Voto) oculta
// //         votarAuthForm.classList.remove('hidden');
// //         votarVoteForm.classList.add('hidden');
        
// //         // Limpa status
// //         votarAuthStatus.textContent = '';
// //         votarVoteStatus.textContent = '';
// //         votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
// //         votarVoteStatus.classList.remove('text-red-500', 'text-green-600');
        
// //         // Reativa botões
// //         btnSubmitAuth.disabled = false;
// //         btnSubmitAuth.textContent = 'Autenticar';
// //         btnSubmitVoto.disabled = false;
// //         btnSubmitVoto.textContent = 'Enviar Voto (Grátis)';
// //     }

// //     /**
// //      * Listener para o formulário de autenticação (Etapa 1)
// //      */
// //     votarAuthForm.addEventListener('submit', async (e) => {
// //         e.preventDefault();
        
// //         btnSubmitAuth.disabled = true;
// //         btnSubmitAuth.textContent = 'Autenticando...';
// //         votarAuthStatus.textContent = '';
// //         votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
// //         votarAuthStatus.classList.add('text-blue-600');

// //         const contractAddress = votarContractAddressInput.value;
// //         const matricula = votarMatriculaInput.value;

// //         try {
// //             // Chama a nova Rota 5 do backend
// //             const response = await fetch('http://127.0.0.1:5000/api/autenticar', {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json' },
// //                 body: JSON.stringify({
// //                     contract_address: contractAddress,
// //                     matricula: matricula
// //                 })
// //             });

// //             const data = await response.json();

// //             if (!response.ok) {
// //                 // 'autenticado: false' vem com um erro (ex: 403, 404)
// //                 throw new Error(data.mensagem || data.description || 'Falha na autenticação.');
// //             }

// //             // SUCESSO! Aluno é válido
// //             votarAuthStatus.textContent = 'Aluno autenticado com sucesso!';
// //             votarAuthStatus.classList.remove('text-blue-600');
// //             votarAuthStatus.classList.add('text-green-600');

// //             // Salva as provas no estado global
// //             currentVoteState.contractAddress = contractAddress;
// //             currentVoteState.merkleProof = data.merkleProof;
// //             currentVoteState.nullifierHash = data.nullifierHash;

// //             // Renderiza as chapas (Etapa 2)
// //             renderChapasParaVotar(data.chapas);

// //             // Esconde a Etapa 1 e mostra a Etapa 2
// //             votarAuthForm.classList.add('hidden');
// //             votarVoteForm.classList.remove('hidden');

// //         } catch (err) {
// //             console.error("Erro na autenticação:", err);
// //             votarAuthStatus.textContent = err.message;
// //             votarAuthStatus.classList.add('text-red-500');
// //             btnSubmitAuth.disabled = false;
// //             btnSubmitAuth.textContent = 'Autenticar';
// //         }
// //     });

// //     /**
// //      * Renderiza as chapas (radio buttons) na tela de votação
// //      */
// //     function renderChapasParaVotar(chapas) {
// //         votarChapasList.innerHTML = ''; // Limpa lista anterior
// //         if (chapas.length === 0) {
// //             votarChapasList.innerHTML = '<p class="text-center text-red-500">Nenhuma chapa inscrita para esta votação ainda.</p>';
// //             btnSubmitVoto.disabled = true; // Desativa o botão se não há chapas
// //             return;
// //         }

// //         chapas.forEach(chapa => {
// //             const label = document.createElement('label');
// //             label.className = 'block border rounded-lg p-3 hover:bg-gray-50 cursor-pointer';
            
// //             // Trunca a proposta para exibição
// //             const propostaCurta = chapa.proposta.length > 100 
// //                 ? chapa.proposta.substring(0, 100) + '...' 
// //                 : chapa.proposta;
            
// //             label.innerHTML = `
// //                 <input type="radio" name="chapa-selecionada" value="${chapa.numero}" class="mr-2" required>
// //                 <span class="font-semibold text-lg">Chapa ${chapa.numero} - ${chapa.nome}</span>
// //                 <p class="text-sm text-gray-600 ml-6">${propostaCurta}</p>
// //             `;
// //             votarChapasList.appendChild(label);
// //         });
// //     }

// //     /**
// //      * Listener para o formulário de votação (Etapa 2) - ATUALIZADO
// //      */
// //     votarVoteForm.addEventListener('submit', async (e) => {
// //         e.preventDefault();

// //         btnSubmitVoto.disabled = true;
// //         btnSubmitVoto.textContent = 'Enviando Voto...';
// //         votarVoteStatus.textContent = 'Preparando seu voto...';
// //         votarVoteStatus.classList.remove('text-red-500', 'text-green-600');
// //         votarVoteStatus.classList.add('text-blue-600');

// //         try {
// //             const formData = new FormData(votarVoteForm);
// //             const numeroChapa = formData.get('chapa-selecionada');

// //             if (!numeroChapa) {
// //                 throw new Error("Você precisa selecionar uma chapa.");
// //             }

// //             // 1. Prepara os dados para o Relayer.
// //             // O "voto criptografado" é apenas o número da chapa em string.
// //             // O seu contrato `Voting.sol` aceita `bytes`, então `utf-8` é perfeito.
// //             const votoCriptografado = `Chapa ${numeroChapa}`; // Ex: "Chapa 1"
            
// //             // 2. Gera o recibo do aluno (hash do voto)
// //             // Usamos keccak256 para ser compatível com o Solidity
// //             const reciboDoAluno = ethers.keccak256(ethers.toUtf8Bytes(votoCriptografado));
            
// //             console.log("Enviando voto para o Relayer (/api/votar)...");
// //             console.log("  Voto:", votoCriptografado);
// //             console.log("  Recibo:", reciboDoAluno);
// //             console.log("  Nullifier:", currentVoteState.nullifierHash);

// //             // 3. Monta o payload para o backend (Flask)
// //             const payload = {
// //                 contract_address: currentVoteState.contractAddress,
// //                 votoCriptografado: votoCriptografado,
// //                 reciboDoAluno: reciboDoAluno,
// //                 nullifierHash: currentVoteState.nullifierHash,
// //                 merkleProof: currentVoteState.merkleProof
// //             };

// //             // 4. Envia para a Rota 6 (Relayer)
// //             const response = await fetch('http://127.0.0.1:5000/api/votar', {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json' },
// //                 body: JSON.stringify(payload)
// //             });

// //             const data = await response.json();

// //             if (!response.ok || !data.sucesso) {
// //                 // Se o backend (ou o contrato) deu erro
// //                 throw new Error(data.mensagem || data.description || 'Falha ao enviar o voto.');
// //             }

// //             // SUCESSO!
// //             votarVoteStatus.textContent = `Voto enviado com sucesso! (Hash: ${data.tx_hash.substring(0, 10)}...)`;
// //             votarVoteStatus.classList.remove('text-blue-600');
// //             votarVoteStatus.classList.add('text-green-600');

// //             // Volta para a home após 3 segundos
// //             setTimeout(() => {
// //                 showScreen(homeScreen);
// //             }, 3000);

// //         } catch (err) {
// //             console.error("Erro ao votar:", err);
// //             votarVoteStatus.textContent = err.message;
// //             votarVoteStatus.classList.add('text-red-500');
// //             btnSubmitVoto.disabled = false;
// //             btnSubmitVoto.textContent = 'Enviar Voto (Grátis)';
// //         }
// //     });

// // });


// document.addEventListener('DOMContentLoaded', () => {
            
//     // --- Seletores das Telas ---
//     const homeScreen = document.getElementById('home-screen');
//     const createScreen = document.getElementById('create-screen');
//     const voteScreen = document.getElementById('vote-screen');
//     const chapaScreen = document.getElementById('chapa-screen');
//     const votarScreen = document.getElementById('votar-screen');

//     // --- Seletores Tela 1 (Home) ---
//     const btnShowCreate = document.getElementById('btn-show-create');
//     const btnShowVote = document.getElementById('btn-show-vote'); 

//     // --- Seletores Tela 2 (Criar) ---
//     const btnBackHome = document.getElementById('btn-back-home');
//     const btnConnectMetamask = document.getElementById('btn-connect-metamask');
//     const metamaskStatus = document.getElementById('metamask-status');
//     const createPollForm = document.getElementById('create-poll-form');
//     const walletAddressInput = document.getElementById('wallet-address');
//     const btnSubmitPoll = document.getElementById('btn-submit-poll');

//     // --- Seletores Tela 3 (Votar/Lista) ---
//     const btnBackHome2 = document.getElementById('btn-back-home-2'); 
//     const searchForm = document.getElementById('search-form'); 
//     const searchInput = document.getElementById('search-input'); 
//     const votacoesList = document.getElementById('votacoes-list'); 
//     const votacoesStatus = document.getElementById('votacoes-status'); 

//     // --- Seletores Tela 4 (Inscrever Chapa) ---
//     const btnBackToList = document.getElementById('btn-back-to-list');
//     const chapaForm = document.getElementById('chapa-form');
//     const chapaStatus = document.getElementById('chapa-status');
//     const btnSubmitChapa = document.getElementById('btn-submit-chapa');
//     const chapaContractAddressInput = document.getElementById('chapa-contract-address');

//     // --- Seletores Tela 5 (Votar) ---
//     const btnBackToList2 = document.getElementById('btn-back-to-list-2');
//     const votarTitulo = document.getElementById('votar-titulo');
//     const votarAuthForm = document.getElementById('votar-auth-form'); // Form da Etapa 1
//     const votarVoteForm = document.getElementById('votar-vote-form'); // Form da Etapa 2
//     const votarContractAddressInput = document.getElementById('votar-contract-address');
//     const votarMatriculaInput = document.getElementById('votar-matricula');
//     const votarAuthStatus = document.getElementById('votar-auth-status');
//     const btnSubmitAuth = document.getElementById('btn-submit-auth'); // Botão de Autenticação
//     const votarChapasList = document.getElementById('votar-chapas-list');
//     const votarVoteStatus = document.getElementById('votar-vote-status');
//     const btnSubmitVoto = document.getElementById('btn-submit-voto');
//     const votarUserInfo = document.getElementById('votar-user-info');

//     // --- Variáveis de estado para o voto ---
//     let currentVoteState = {
//         contractAddress: null,
//         merkleProof: null,
//         nullifierHash: null
//     };

//     // --- Funções de Navegação ---
//     function showScreen(screenToShow) {
//         homeScreen.classList.add('hidden');
//         createScreen.classList.add('hidden');
//         voteScreen.classList.add('hidden');
//         chapaScreen.classList.add('hidden');
//         votarScreen.classList.add('hidden');
//         screenToShow.classList.remove('hidden');
//     }

//     btnShowCreate.addEventListener('click', (e) => { e.preventDefault(); showScreen(createScreen); });
//     btnShowVote.addEventListener('click', (e) => { e.preventDefault(); showScreen(voteScreen); fetchVotacoes(); });
//     btnBackHome.addEventListener('click', () => showScreen(homeScreen));
//     btnBackHome2.addEventListener('click', () => showScreen(homeScreen));
//     btnBackToList.addEventListener('click', () => showScreen(voteScreen));
//     btnBackToList2.addEventListener('click', () => showScreen(voteScreen));

//     // --- Lógica Tela 2 (Criar Votação) ---
//     btnConnectMetamask.addEventListener('click', async () => { /* (código sem mudanças) */ 
//         metamaskStatus.textContent = 'Abrindo o MetaMask...';
//         metamaskStatus.classList.remove('text-red-500', 'text-green-600');
//         metamaskStatus.classList.add('text-blue-600');
//         if (typeof window.ethereum !== 'undefined') {
//             try {
//                 const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
//                 const account = accounts[0];
//                 metamaskStatus.textContent = `Conectado: ${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
//                 metamaskStatus.classList.remove('text-blue-600', 'text-red-500');
//                 metamaskStatus.classList.add('text-green-600');
//                 walletAddressInput.value = account;
//                 btnConnectMetamask.querySelector('span').textContent = 'Conta Conectada';
//                 btnConnectMetamask.disabled = true;
//                 btnSubmitPoll.disabled = false;
//             } catch (err) {
//                 let errorMsg = err.code === 4001 ? 'Você rejeitou a conexão.' : 'Erro ao conectar.';
//                 metamaskStatus.textContent = errorMsg;
//                 metamaskStatus.classList.add('text-red-500');
//             }
//         } else {
//             metamaskStatus.textContent = 'Erro: Por favor, instale a MetaMask.';
//             metamaskStatus.classList.add('text-red-500');
//         }
//     });
//     createPollForm.addEventListener('submit', async (evento) => { /* (código sem mudanças) */
//         evento.preventDefault(); 
//         btnSubmitPoll.textContent = 'Enviando...';
//         btnSubmitPoll.disabled = true;
//         metamaskStatus.classList.remove('text-red-500', 'text-green-600');
        
//         const sigaaLink = document.getElementById('sigaa-link').value;
//         const adminAddress = walletAddressInput.value;
//         const campusName = document.getElementById('campus-name').value;
//         const cursoName = document.getElementById('curso-name').value;

//         try {
//             metamaskStatus.textContent = 'Gerando Merkle Root no servidor...';
//             metamaskStatus.classList.add('text-blue-600');
            
//             const responseInfo = await fetch('http://127.0.0.1:5000/api/prepare-deploy', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ sigaa_link: sigaaLink })
//             });
            
//             if (!responseInfo.ok) {
//                 const errData = await responseInfo.json();
//                 throw new Error(errData.description || 'Falha ao buscar dados do backend.');
//             }
            
//             const { abi, bytecode, merkleRoot, relayerAddress } = await responseInfo.json();
            
//             metamaskStatus.textContent = 'Abra o MetaMask para aprovar o deploy...';
            
//             const provider = new ethers.BrowserProvider(window.ethereum);
//             const signer = await provider.getSigner(); 
//             const factory = new ethers.ContractFactory(abi, bytecode, signer);
//             const contract = await factory.deploy(merkleRoot, relayerAddress);

//             metamaskStatus.textContent = 'Aguardando confirmação da rede...';
//             await contract.waitForDeployment();
            
//             const contractAddress = await contract.getAddress();
//             metamaskStatus.textContent = 'Salvando dados no servidor...';
            
//             const responseSave = await fetch('http://127.0.0.1:5000/api/criar-votacao', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     sigaa_link: sigaaLink,
//                     admin_wallet: adminAddress,
//                     contract_address: contractAddress,
//                     campus: campusName,
//                     curso: cursoName
//                 })
//             });

//             if (!responseSave.ok) throw new Error('Falha ao salvar dados no backend.');
            
//             metamaskStatus.textContent = `Votação criada! Contrato: ${contractAddress.substring(0, 6)}...`;
//             metamaskStatus.classList.add('text-green-600');
//             btnSubmitPoll.textContent = 'Votação Criada!';

//         } catch (err) {
//             console.error("Erro no processo de deploy:", err);
//             let errorMsg = err.code === 'ACTION_REJECTED' ? 'Você rejeitou a transação.' : err.message;
//             metamaskStatus.textContent = errorMsg;
//             metamaskStatus.classList.add('text-red-500');
//             btnSubmitPoll.textContent = 'Criar Votação';
//             btnSubmitPoll.disabled = false;
//         }
//     });

//     // --- Lógica Tela 3 (Listar/Buscar Votações) ---
//     async function fetchVotacoes(searchTerm = '') { /* (código sem mudanças) */
//         votacoesList.innerHTML = ''; 
//         votacoesStatus.textContent = 'Carregando votações...';
//         try {
//             let url = 'http://127.0.0.1:5000/api/votacoes';
//             if (searchTerm) { url += `?search=${encodeURIComponent(searchTerm)}`; }
//             const response = await fetch(url);
//             if (!response.ok) { throw new Error('Não foi possível buscar as votações.'); }
//             const votacoes = await response.json();
//             renderVotacoes(votacoes);
//         } catch (err) {
//             votacoesStatus.textContent = err.message;
//             votacoesStatus.classList.add('text-red-500');
//         }
//     }
//     function renderVotacoes(votacoes) { /* (código sem mudanças) */
//         votacoesList.innerHTML = ''; 
//         if (votacoes.length === 0) { votacoesStatus.textContent = 'Nenhuma votação encontrada.'; return; }
//         votacoesStatus.textContent = ''; 
//         votacoes.forEach(votacao => {
//             const card = document.createElement('div');
//             card.className = 'border rounded-lg p-4 shadow-sm bg-gray-50';
//             const formatWallet = (wallet) => `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
//             card.dataset.pollName = `${votacao.curso} (${votacao.campus})`; // Salva o nome
//             card.innerHTML = `
//                 <h3 class="font-semibold text-lg text-blue-700">${votacao.campus}</h3>
//                 <p class="text-gray-700">${votacao.curso}</p>
//                 <div class="mt-3 border-t pt-2">
//                     <p class="text-sm text-gray-600">Proponente: <span class="font-mono text-gray-900">${formatWallet(votacao.admin_wallet)}</span></p>
//                     <p class="text-sm text-gray-600">Contrato: <span class="font-mono text-gray-900">${formatWallet(votacao.contract_address)}</span></p>
//                 </div>
//                 <div class="mt-4 flex flex-col sm:flex-row gap-2">
//                     <button data-contract="${votacao.contract_address}" class="btn-votar-agora w-full flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
//                         Votar Agora
//                     </button>
//                     <button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
//                         Inscrever Chapa
//                     </button>
//                 </div>`;
//             votacoesList.appendChild(card);
//         });
//     }
//     searchForm.addEventListener('submit', (e) => { /* (código sem mudanças) */
//         e.preventDefault();
//         const searchTerm = searchInput.value;
//         fetchVotacoes(searchTerm);
//     });

//     // --- Lógica Tela 4 (Inscrição de Chapa) ---
//     votacoesList.addEventListener('click', (e) => {
//         const target = e.target;
//         const contractAddress = target.dataset.contract;
//         if (!contractAddress) return; 

//         if (target.classList.contains('btn-votar-agora')) {
//             // ATUALIZADO: Prepara a Tela 5
//             const pollName = target.closest('[data-poll-name]').dataset.pollName;
//             prepareVotarScreen(contractAddress, pollName);
//             showScreen(votarScreen);
        
//         } else if (target.classList.contains('btn-inscrever-chapa')) {
//             // (código sem mudanças)
//             chapaContractAddressInput.value = contractAddress;
//             chapaForm.reset();
//             chapaStatus.textContent = '';
//             btnSubmitChapa.disabled = false;
//             btnSubmitChapa.textContent = 'Enviar Inscrição';
//             showScreen(chapaScreen);
//         }
//     });
//     chapaForm.addEventListener('submit', async (e) => { /* (código sem mudanças) */
//         e.preventDefault();
//         btnSubmitChapa.disabled = true;
//         btnSubmitChapa.textContent = 'Enviando...';
//         chapaStatus.textContent = '';
//         try {
//             const chapaName = document.getElementById('chapa-name').value;
//             const chapaProposal = document.getElementById('chapa-proposal').value;
//             const contractAddress = chapaContractAddressInput.value;
//             const response = await fetch('http://127.0.0.1:5000/api/inscrever-chapa', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     contract_address: contractAddress,
//                     chapa_name: chapaName,
//                     chapa_proposal: chapaProposal
//                 })
//             });
//             if (!response.ok) {
//                 const errData = await response.json();
//                 throw new Error(errData.description || 'Falha ao inscrever chapa.');
//             }
//             const data = await response.json();
//             chapaStatus.textContent = `Chapa inscrita com sucesso! Seu número é: ${data.numero_chapa}`;
//             chapaStatus.classList.add('text-green-600');
//             setTimeout(() => { showScreen(voteScreen); }, 2000);
//         } catch (err) {
//             chapaStatus.textContent = err.message;
//             chapaStatus.classList.add('text-red-500');
//             btnSubmitChapa.disabled = false;
//             btnSubmitChapa.textContent = 'Enviar Inscrição';
//         }
//     });

//     // --- ATUALIZADO: Lógica Tela 5 (Votar) ---

//     function prepareVotarScreen(contractAddress, pollName) {
//         currentVoteState = { contractAddress: null, merkleProof: null, nullifierHash: null };
//         votarTitulo.textContent = `Votar em: ${pollName}`;
//         votarContractAddressInput.value = contractAddress;
        
//         votarAuthForm.classList.remove('hidden'); // Mostra a Etapa 1
//         votarVoteForm.classList.add('hidden');    // Esconde a Etapa 2
        
//         votarAuthForm.reset();
//         votarAuthStatus.textContent = '';
//         votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
//         btnSubmitAuth.disabled = false;
//         btnSubmitAuth.textContent = 'Verificar Matrícula e Autenticar com Google';
//     }

//     /**
//      * Listener para o formulário de autenticação (Etapa 1)
//      * AGORA USA O FLUXO DO GOOGLE
//      */
//     votarAuthForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
        
//         btnSubmitAuth.disabled = true;
//         btnSubmitAuth.textContent = 'Aguardando Google...';
//         votarAuthStatus.textContent = 'Abrindo pop-up do Google...';
//         votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
//         votarAuthStatus.classList.add('text-blue-600');

//         const contractAddress = votarContractAddressInput.value;
//         const matricula = votarMatriculaInput.value;

//         if (!matricula) {
//             votarAuthStatus.textContent = 'Por favor, insira sua matrícula.';
//             votarAuthStatus.classList.add('text-red-500');
//             btnSubmitAuth.disabled = false;
//             btnSubmitAuth.textContent = 'Verificar Matrícula e Autenticar com Google';
//             return;
//         }

//         // Abre o Pop-up do Google, passando a matrícula
//         const authUrl = `http://127.0.0.1:5000/api/auth/google?contract_address=${contractAddress}&matricula=${matricula}`;
//         window.open(authUrl, '_blank', 'width=500,height=600');
//     });

//     /**
//      * Escuta a mensagem de sucesso do pop-up
//      */
//     window.addEventListener('message', async (event) => {
//         // Verifica se a mensagem é do nosso pop-up
//         if (event.data === 'auth_success') {
            
//             // Só reage se estivermos na tela de votação
//             if (votarScreen.classList.contains('hidden')) return; 
            
//             votarAuthStatus.textContent = 'Google OK. Verificando provas...';
            
//             try {
//                 // O pop-up fechou, agora pede ao Flask os dados da sessão
//                 // const response = await fetch('http://127.0.0.1:5000/api/get-vote-data');

//                 const response = await fetch('http://127.0.0.1:5000/api/get-vote-data', {
//                     method: 'GET',
//                     credentials: 'include' // <<< A CORREÇÃO
//                 });

//                 const data = await response.json();
                
//                 if (!response.ok || !data.autenticado) {
//                     throw new Error(data.mensagem || "Falha ao buscar dados da sessão.");
//                 }

//                 // SUCESSO!
//                 votarAuthStatus.textContent = 'Aluno autenticado com sucesso!';
//                 votarAuthStatus.classList.remove('text-blue-600');
//                 votarAuthStatus.classList.add('text-green-600');

//                 // Salva as provas
//                 currentVoteState.contractAddress = data.contract_address;
//                 currentVoteState.merkleProof = data.merkleProof;
//                 currentVoteState.nullifierHash = data.nullifierHash;

//                 // Renderiza as chapas e avança a tela
//                 renderChapasParaVotar(data.chapas, data.aluno_info);
//                 votarAuthForm.classList.add('hidden');
    
//                 votarVoteForm.classList.remove('hidden');
//                 votarVoteForm.reset();
//                 votarVoteStatus.textContent = '';
//                 btnSubmitVoto.disabled = false;

//             } catch (err) {
//                 votarAuthStatus.textContent = err.message;
//                 votarAuthStatus.classList.add('text-red-500');
//                 btnSubmitAuth.disabled = false;
//                 btnSubmitAuth.textContent = 'Verificar Matrícula e Autenticar com Google';
//             }
//         }
//     });

//     /**
//      * Renderiza as chapas (radio buttons) na tela de votação
//      */
//     function renderChapasParaVotar(chapas, alunoInfo) {
//         // (código sem mudanças)
//         votarChapasList.innerHTML = ''; 
        
//         // NOVO: Adiciona a info do usuário
//         if (alunoInfo) {
//             votarVoteForm.querySelector('h3').innerHTML = `2. Escolha sua Chapa<p class="text-sm font-normal text-gray-600">Logado como: ${alunoInfo.nome} (${alunoInfo.email})</p>`;
//         }
        
//         if (chapas.length === 0) {
//             votarChapasList.innerHTML = '<p class="text-center text-red-500">Nenhuma chapa inscrita para esta votação ainda.</p>';
//             btnSubmitVoto.disabled = true;
//             return;
//         }

//         chapas.forEach(chapa => {
//             const label = document.createElement('label');
//             label.className = 'block border rounded-lg p-3 hover:bg-gray-50 cursor-pointer';
//             const propostaCurta = chapa.proposta.length > 100 
//                 ? chapa.proposta.substring(0, 100) + '...' 
//                 : chapa.proposta;
//             label.innerHTML = `
//                 <input type="radio" name="chapa-selecionada" value="${chapa.numero}" class="mr-2" required>
//                 <span class="font-semibold text-lg">Chapa ${chapa.numero} - ${chapa.nome}</span>
//                 <p class="text-sm text-gray-600 ml-6">${propostaCurta}</p>
//             `;
//             votarChapasList.appendChild(label);
//         });
//     }

//     /**
//      * Listener para o formulário de votação (Etapa 2)
//      */
//     votarVoteForm.addEventListener('submit', async (e) => {
//         // (código sem mudanças)
//         e.preventDefault();
//         btnSubmitVoto.disabled = true;
//         btnSubmitVoto.textContent = 'Enviando Voto...';
//         votarVoteStatus.textContent = 'Preparando seu voto...';
//         votarVoteStatus.classList.remove('text-red-500', 'text-green-600');
//         votarVoteStatus.classList.add('text-blue-600');

//         try {
//             const formData = new FormData(votarVoteForm);
//             const numeroChapa = formData.get('chapa-selecionada');
//             if (!numeroChapa) { throw new Error("Você precisa selecionar uma chapa."); }

//             const votoCriptografado = `Chapa ${numeroChapa}`;
//             const reciboDoAluno = ethers.keccak256(ethers.toUtf8Bytes(votoCriptografado));
            
//             const payload = {
//                 contract_address: currentVoteState.contractAddress,
//                 votoCriptografado: votoCriptografado,
//                 reciboDoAluno: reciboDoAluno,
//                 nullifierHash: currentVoteState.nullifierHash,
//                 merkleProof: currentVoteState.merkleProof
//             };

//             const response = await fetch('http://127.0.0.1:5000/api/votar', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });
//             const data = await response.json();
//             if (!response.ok || !data.sucesso) {
//                 throw new Error(data.mensagem || 'Falha ao enviar o voto.');
//             }

//             votarVoteStatus.textContent = `Voto enviado com sucesso! (Hash: ${data.tx_hash.substring(0, 10)}...)`;
//             votarVoteStatus.classList.add('text-green-600');

//             setTimeout(() => {
//                 showScreen(homeScreen);
//             }, 3000);

//         } catch (err) {
//             votarVoteStatus.textContent = err.message;
//             votarVoteStatus.classList.add('text-red-500');
//             btnSubmitVoto.disabled = false;
//             btnSubmitVoto.textContent = 'Enviar Voto (Grátis)';
//         }
//     });

// });



document.addEventListener('DOMContentLoaded', () => {
            
    // --- Seletores das Telas ---
    const homeScreen = document.getElementById('home-screen');
    const createScreen = document.getElementById('create-screen');
    const voteScreen = document.getElementById('vote-screen');
    const chapaScreen = document.getElementById('chapa-screen');
    const votarScreen = document.getElementById('votar-screen');

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

    // --- Seletores Tela 5 (Votar) ---
    const btnBackToList2 = document.getElementById('btn-back-to-list-2');
    const votarTitulo = document.getElementById('votar-titulo');
    const votarAuthStep = document.getElementById('votar-auth-step'); // Div Etapa 1
    const votarVoteForm = document.getElementById('votar-vote-form'); // Form Etapa 2
    const votarContractAddressInput = document.getElementById('votar-contract-address');
    const votarMatriculaInput = document.getElementById('votar-matricula');
    const votarAuthStatus = document.getElementById('votar-auth-status');
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const votarChapasList = document.getElementById('votar-chapas-list');
    const votarVoteStatus = document.getElementById('votar-vote-status');
    const btnSubmitVoto = document.getElementById('btn-submit-voto');
    const votarUserInfoTitulo = document.getElementById('votar-user-info-titulo');

    // --- Variáveis de estado para o voto ---
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
        votarScreen.classList.add('hidden');
        screenToShow.classList.remove('hidden');
    }

    btnShowCreate.addEventListener('click', (e) => { e.preventDefault(); showScreen(createScreen); });
    btnShowVote.addEventListener('click', (e) => { e.preventDefault(); showScreen(voteScreen); fetchVotacoes(); });
    btnBackHome.addEventListener('click', () => showScreen(homeScreen));
    btnBackHome2.addEventListener('click', () => showScreen(homeScreen));
    btnBackToList.addEventListener('click', () => showScreen(voteScreen));
    btnBackToList2.addEventListener('click', () => showScreen(voteScreen));

    // --- Lógica Tela 2 (Criar Votação) (ATUALIZADA) ---
    
    // O Proponente deve conectar a carteira
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
                
                walletAddressInput.value = account; // Salva a carteira do Proponente
                
                btnConnectMetamask.querySelector('span').textContent = 'Conta Conectada';
                btnConnectMetamask.disabled = true;
                btnSubmitPoll.disabled = false; // Habilita o botão de deploy

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
        
        // Lendo todos os campos
        const sigaaLink = document.getElementById('sigaa-link').value;
        const adminAddress = walletAddressInput.value; // Carteira do Proponente
        const campusName = document.getElementById('campus-name').value;
        const cursoName = document.getElementById('curso-name').value;
        const dataInicioChapa = document.getElementById('data-inicio-chapa').value;
        const dataFimChapa = document.getElementById('data-fim-chapa').value;
        const dataInicioVotacao = document.getElementById('data-inicio-votacao').value;
        const dataFimVotacao = document.getElementById('data-fim-votacao').value;

        try {
            // ETAPA 1: Buscar dados do Backend (Merkle Root e Relayer Address)
            metamaskStatus.textContent = 'Servidor está gerando Merkle Root...';
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
            
            // O backend devolve tudo, incluindo o endereço do Mestre (Relayer)
            const { abi, bytecode, merkleRoot, relayerAddress } = await responseInfo.json();
            
            // ETAPA 2: Fazer o Deploy (Pago pelo Proponente)
            metamaskStatus.textContent = 'Abra o MetaMask para aprovar o deploy...';
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(); // O 'signer' é o Proponente
            const factory = new ethers.ContractFactory(abi, bytecode, signer);

            console.log("Fazendo deploy com os argumentos:");
            console.log("  _merkleRoot:", merkleRoot);
            console.log("  _relayerAddress:", relayerAddress);
            
            // Passa os 2 argumentos que o constructor do "Relayer Mestre" espera
            const contract = await factory.deploy(merkleRoot, relayerAddress);

            metamaskStatus.textContent = 'Aguardando confirmação da rede...';
            await contract.waitForDeployment();
            
            const contractAddress = await contract.getAddress();
            console.log("Contrato implantado com sucesso em:", contractAddress);

            // ETAPA 3: Salvar dados no Backend
            metamaskStatus.textContent = 'Salvando dados no servidor...';
            
            const responseSave = await fetch('http://127.0.0.1:5000/api/criar-votacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Envia o cookie de sessão
                body: JSON.stringify({
                    sigaa_link: sigaaLink,
                    admin_wallet: adminAddress, // Carteira do Proponente
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
            
            metamaskStatus.textContent = `Votação criada! Contrato: ${contractAddress.substring(0, 6)}...`;
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
        votacoesList.innerHTML = ''; 
        votacoesStatus.textContent = 'Carregando votações...';
        // debugger;
        try {
            let url = 'http://127.0.0.1:5000/api/votacoes';
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
            
            // (0=Pendente, 1=Inscricao, 2=Votacao, 3=Encerrada)
            switch(votacao.estado_contrato_int) {
                case 0: // Pendente
                    if (estadoTexto.includes('Aguardando')) {
                        botoesHTML = `<span class="text-sm text-gray-500">Aguardando início das inscrições.</span>`;
                    } else { // 'Inscrição Aberta' (baseado na data do app)
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Inscrever Chapa</button>`;
                    }
                    break;
                case 1: // Inscricao
                    if (estadoTexto.includes('Encerrada')) { // Data do app já passou
                        botoesHTML = `<span class="text-sm text-gray-500">Inscrição encerrada. Aguardando votação.</span>`;
                    } else {
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-inscrever-chapa w-full flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Inscrever Chapa</button>`;
                    } 
                    break;
                case 2: // Votacao
                    if (estadoTexto.includes('Encerrada')) { // Data do app já passou
                        botoesHTML = `<span class="text-sm text-gray-500">Votação encerrada. Aguardando apuração.</span>`;
                    } else {
                        botoesHTML = `<button data-contract="${votacao.contract_address}" class="btn-votar-agora w-full flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Votar Agora</button>`;
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

    // --- Lógica Tela 4 (Inscrição de Chapa) (Correta) ---
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
            alert('Funcionalidade "Ver Resultado" ainda não implementada.');
        }
    });

    chapaForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        btnSubmitChapa.disabled = true;
        btnSubmitChapa.textContent = 'Enviando...';
        chapaStatus.textContent = '';
        try {
            const chapaName = document.getElementById('chapa-name').value;
            const chapaProposal = document.getElementById('chapa-proposal').value;
            const contractAddress = chapaContractAddressInput.value;
            
            const response = await fetch('http://127.0.0.1:5000/api/inscrever-chapa', {
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
            setTimeout(() => { showScreen(voteScreen); }, 2000);
        } catch (err) {
            chapaStatus.textContent = err.message;
            chapaStatus.classList.add('text-red-500');
            btnSubmitChapa.disabled = false;
            btnSubmitChapa.textContent = 'Enviar Inscrição';
        }
    });

    // --- Lógica Tela 5 (Votar) (Correta) ---

    function prepareVotarScreen(contractAddress, pollName) {
        currentVoteState = { contractAddress: null, merkleProof: null, nullifierHash: null };
        votarTitulo.textContent = `Votar em: ${pollName}`;
        votarContractAddressInput.value = contractAddress;
        
        votarAuthStep.classList.remove('hidden'); 
        votarVoteForm.classList.add('hidden');    
        
        votarMatriculaInput.value = ''; // Limpa a matrícula
        
        votarAuthStatus.textContent = '';
        votarAuthStatus.classList.remove('text-red-500', 'text-green-600');
        btnGoogleLogin.disabled = false;
    }

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

        const authUrl = `http://127.0.0.1:5000/api/auth/google?contract_address=${contractAddress}&matricula=${matricula}`;
        window.open(authUrl, '_blank', 'width=500,height=600');
    });

    window.addEventListener('message', async (event) => {
        if (event.data === 'auth_success') {
            if (votarScreen.classList.contains('hidden')) return; 
            votarAuthStatus.textContent = 'Google OK. Verificando provas...';
            
            try {
                const response = await fetch('http://127.0.0.1:5000/api/get-vote-data', {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                if (!response.ok || !data.autenticado) {
                    throw new Error(data.mensagem || "Falha na autenticação ou sessão expirada.");
                }

                votarAuthStatus.textContent = 'Aluno autenticado com sucesso!';
                votarAuthStatus.classList.add('text-green-600');

                currentVoteState.contractAddress = data.contract_address;
                currentVoteState.merkleProof = data.merkleProof;
                currentVoteState.nullifierHash = data.nullifierHash;

                renderChapasParaVotar(data.chapas, data.aluno_info);
                votarAuthStep.classList.add('hidden');
                
                votarVoteForm.classList.remove('hidden');
                votarVoteForm.reset();
                votarVoteStatus.textContent = '';
                btnSubmitVoto.disabled = false;

            } catch (err) {
                votarAuthStatus.textContent = err.message;
                votarAuthStatus.classList.add('text-red-500');
                if(btnGoogleLogin) { btnGoogleLogin.disabled = false; }
            }
        }
    });

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
            if (!numeroChapa) { throw new Error("Você precisa selecionar uma chapa."); }

            const votoCriptografado = `Chapa ${numeroChapa}`;
            const reciboDoAluno = ethers.keccak256(ethers.toUtf8Bytes(votoCriptografado));
            
            const payload = {
                contract_address: currentVoteState.contractAddress,
                votoCriptografado: votoCriptografado,
                reciboDoAluno: reciboDoAluno,
                nullifierHash: currentVoteState.nullifierHash,
                merkleProof: currentVoteState.merkleProof
            };

            const response = await fetch('http://127.0.0.1:5000/api/votar', {
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
                showScreen(homeScreen);
            }, 3000);

        } catch (err) {
            votarVoteStatus.textContent = err.message;
            votarVoteStatus.classList.add('text-red-500');
            btnSubmitVoto.disabled = false;
            btnSubmitVoto.textContent = 'Enviar Voto (Grátis)';
        }
    });

});