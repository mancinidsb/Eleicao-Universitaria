import requests
from bs4 import BeautifulSoup
import re

class Raspagem:
    def __init__(self, nome_curso):
        self.nome_curso = nome_curso.upper()
        self.dicionario = {}  # Agora: {matricula: nome}
        self.raspagem()
    
    def raspagem(self):
        """Realiza toda a cadeia de raspagem de dados"""
        try:
            # Passo 1: Buscar o curso na página principal
            url_base = "https://sigaa.ufpi.br/sigaa/public/curso/"
            url_lista = "https://sigaa.ufpi.br/sigaa/public/curso/lista.jsf?nivel=G&aba=p-graduacao"
            
            response = requests.get(url_lista)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Encontrar a linha do curso específico
            curso_encontrado = False
            link_curso = None
            
            for tr in soup.find_all('tr', class_=['linhaPar', 'linhaImpar']):
                tds = tr.find_all('td')
                if tds and self.nome_curso in tds[0].get_text().strip():
                    # Encontrar o link para a página do curso
                    link_tag = tr.find('a', href=re.compile(r'portal\.jsf'))
                    if link_tag:
                        link_curso = link_tag['href']
                        curso_encontrado = True
                        break
            
            if not curso_encontrado or not link_curso:
                print(f"Curso '{self.nome_curso}' não encontrado!")
                return
            
            # Passo 2: Acessar a página do curso
            url_curso = url_base + link_curso
            response_curso = requests.get(url_curso)
            soup_curso = BeautifulSoup(response_curso.content, 'html.parser')
            
            # Passo 3: Encontrar o link para alunos ativos
            link_alunos_tag = soup_curso.find('a', class_='alunos', href=re.compile(r'alunos\.jsf'))
            if not link_alunos_tag:
                print("Link para alunos ativos não encontrado!")
                return
            
            link_alunos = link_alunos_tag['href']
            
            # Passo 4: Acessar a página de alunos ativos
            url_alunos = url_base + link_alunos
            response_alunos = requests.get(url_alunos)
            soup_alunos = BeautifulSoup(response_alunos.content, 'html.parser')
            
            # Passo 5: Extrair dados dos alunos
            self._extrair_dados_alunos(soup_alunos)
            
        except Exception as e:
            print(f"Erro durante a raspagem: {e}")
    
    def _extrair_dados_alunos(self, soup):
        """Extrai matrícula e nome dos alunos da página"""
        # Procurar a tabela de alunos
        tabela = soup.find('table', class_='listagem')
        
        if not tabela:
            print("Tabela de alunos não encontrada!")
            return
        
        # Extrair linhas da tabela (ignorando cabeçalho)
        linhas = tabela.find_all('tr')[1:]  # Pula o cabeçalho
        
        for i, linha in enumerate(linhas):
            colunas = linha.find_all('td')
            
            if len(colunas) >= 2:
                matricula = colunas[0].get_text().strip()
                nome = colunas[1].get_text().strip()
                
                # Adicionar ao dicionário (agora direto: matricula -> nome)
                if matricula and nome:
                    self.dicionario[matricula] = nome
        
        print(f"Foram encontrados {len(self.dicionario)} alunos no curso {self.nome_curso}")
    
    def existe_matricula(self, matricula):
        """Procura se a matrícula existe no dicionário"""
        if matricula in self.dicionario:
            return {"matricula": matricula, "nome": self.dicionario[matricula]}
        return None
    
    def existe_nome(self, nome):
        """Procura se o nome existe no dicionário (busca parcial)"""
        nome = nome.upper()
        resultados = {}
        
        for matricula, nome_aluno in self.dicionario.items():
            if nome in nome_aluno.upper():
                resultados[matricula] = nome_aluno
        
        return resultados if resultados else None
    
    def listar_todos_alunos(self):
        """Retorna todos os alunos"""
        return self.dicionario
    
    def quantidade_alunos(self):
        """Retorna a quantidade de alunos encontrados"""
        return len(self.dicionario)
    
    def buscar_por_parte_nome(self, parte_nome):
        """Busca alunos por parte do nome (case insensitive)"""
        parte_nome = parte_nome.upper()
        return {matricula: nome for matricula, nome in self.dicionario.items() 
                if parte_nome in nome.upper()}

# Função conforme solicitada - AGORA RETORNANDO DICIONÁRIO SIMPLES
def pegar_infos(nome_curso):
    """
    Função que realiza a raspagem completa e retorna dicionário com dados dos alunos
    
    Args:
        nome_curso (str): Nome do curso a ser pesquisado
    
    Returns:
        dict: Dicionário SIMPLES com {matricula: nome}
    """
    raspagem = Raspagem(nome_curso)
    return raspagem.dicionario

# Exemplo de uso
if __name__ == "__main__":
    # Exemplo de uso da classe
    curso = input("\nDigite o nome do curso: ").strip()
    raspagem = Raspagem(curso)
    
    # Testando as funções
    print(f"\nTotal de alunos: {raspagem.quantidade_alunos()}")
    
    # Buscar por matrícula específica
    if raspagem.dicionario:
        matricula_test = list(raspagem.dicionario.keys())[0]
        resultado = raspagem.existe_matricula(matricula_test)
        print(f"\nBusca por matrícula {matricula_test}: {resultado}")
    
    # Buscar por nome
    if raspagem.dicionario:
        primeiro_nome = list(raspagem.dicionario.values())[0].split()[0]
        resultado_nome = raspagem.existe_nome(primeiro_nome)
        print(f"\nBusca por nome '{primeiro_nome}': {resultado_nome}")
    
    # Listar todos os alunos (agora formato mais simples)
    print(f"\nTodos os alunos (formato simples):")
    for matricula, nome in raspagem.listar_todos_alunos().items():
        print(f"  {matricula}: {nome}")
    
    # Usando a função específica - AGORA RETORNA DICIONÁRIO SIMPLES
    print(f"\nUsando a função pegar_infos():")
    dados_curso = pegar_infos(curso)
    print(f"Retornou {len(dados_curso)} alunos")
    print(f"Tipo do retorno: {type(dados_curso)}")
    print(f"Exemplo de item: {list(dados_curso.items())[0] if dados_curso else 'Nenhum dado'}")