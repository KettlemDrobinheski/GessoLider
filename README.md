# GessoLider

### Sistema de Orçamentos para Construção a Seco

**React Native · Expo · TypeScript · Expo Router**

O **GessoLider** é uma aplicação desenvolvida para facilitar a elaboração, o cálculo e o gerenciamento de orçamentos para serviços de construção a seco, especialmente drywall.

O projeto nasceu de uma necessidade real: ajudar meu pai, que trabalha no setor, a organizar e preparar seus orçamentos de maneira mais prática e eficiente.

Inicialmente pensado para uso familiar, o GessoLider está sendo desenvolvido com a intenção de, futuramente, atender também outros gesseiros e profissionais da construção a seco.

**Status:** Em desenvolvimento

---

## Objetivo do projeto

Simplificar o processo de elaboração de orçamentos, reduzir tarefas repetitivas e organizar as informações necessárias para a prestação de serviços.

A aplicação busca oferecer uma experiência prática, desde o preenchimento das medidas até a geração do documento final para o cliente.

## Funcionalidades implementadas

- Criação de orçamentos com base nas medidas dos serviços.
- Estimativa de materiais necessários.
- Cálculo e organização dos valores dos orçamentos.
- Cadastro de informações dos clientes.
- Histórico de orçamentos salvos.
- Edição, duplicação e exclusão de orçamentos.
- Acompanhamento do status dos orçamentos.
- Geração e exportação de documentos em PDF.
- Separação entre informações internas de materiais e informações apresentadas ao cliente.
- Armazenamento local dos dados.

## Tecnologias utilizadas

| Tecnologia | Aplicação no projeto |
|---|---|
| React Native | Construção da interface com componentes reutilizáveis |
| Expo | Estrutura e ferramentas de desenvolvimento |
| TypeScript | Tipagem e organização do código |
| Expo Router | Navegação entre as telas |
| AsyncStorage | Persistência local de informações |
| Node.js (`node:test`) | Execução de testes automatizados |
| GitHub Actions | Automação dos testes e da publicação Web |

## Demonstração do sistema

A documentação visual do projeto apresenta sete etapas do funcionamento:

1. Apresentação do aplicativo.
2. Dashboard.
3. Criação de orçamento.
4. Cálculo de materiais.
5. Histórico de orçamentos.
6. Detalhes do orçamento.
7. Visualização do PDF gerado.

As capturas utilizam dados fictícios e demonstram funcionalidades reais da aplicação.

## Desafios técnicos

### Navegação na versão Web

Um dos desafios foi adaptar a navegação da aplicação para funcionar em ambientes de publicação estática, incluindo a abertura de detalhes de orçamentos.

Essa etapa envolveu analisar rotas, identificar incompatibilidades e testar alternativas.

### Geração de PDF

Outro desafio foi implementar a geração de documentos para os clientes, preservando a separação entre os cálculos internos e as informações comerciais apresentadas no orçamento final.

### Publicação e validação

Durante a preparação para o GitHub Pages, também foi necessário investigar diferenças entre o ambiente local e o GitHub Actions, especialmente no reconhecimento de imports CSS pelo TypeScript.

## Aprendizados

O desenvolvimento do GessoLider tem me ajudado a compreender melhor a organização de componentes, a separação de responsabilidades, a validação de informações e a importância dos testes.

Também venho aprendendo a desenvolver funcionalidades passo a passo, identificar problemas, revisar detalhes e melhorar continuamente a experiência de utilização.

Utilizo ferramentas de inteligência artificial como apoio para pesquisa, aprendizado, revisão e desenvolvimento, buscando compreender as soluções aplicadas ao projeto.

## Próximos passos

- Implementar um backend para armazenamento centralizado.
- Adicionar autenticação e controle de acesso.
- Preparar o sistema para diferentes usuários.
- Expandir a utilização para outros profissionais da construção a seco.
- Continuar aprimorando a experiência Web e mobile.

## Executando localmente

**Pré-requisito:** Node.js e npm instalados.

Clone o repositório:

```bash
git clone https://github.com/KettlemDrobinheski/GessoLider.git
```

Entre na pasta:

```bash
cd GessoLider
```

Instale as dependências:

```bash
npm ci
```

Inicie a aplicação Web:

```bash
npx expo start --web
```

Abra o endereço local informado pelo terminal.

## 👩‍💻 Desenvolvimento

**Kettlem Drobinheski**

Estudante de Análise e Desenvolvimento de Sistemas, com interesse em desenvolvimento de software, resolução de problemas e criação de soluções para necessidades reais.

[Meu GitHub](https://github.com/KettlemDrobinheski)

---

**GessoLider — Transformando necessidades reais em soluções tecnológicas.**
