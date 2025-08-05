# ScanPRO - Sistema de Conferência de Ativos

<p align="center">
  <img src="public/Logo.svg" alt="ScanPRO Logo" width="250"/>
</p>
 
<p align="center">
  <img src="https://img.shields.io/badge/framework-Next.js-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/linguagem-Typescript-blue?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/backend-Firebase-orange?logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/estilo-Tailwind%20CSS-blue?logo=tailwind-css" alt="Tailwind CSS">
</p>
 
[cite_start]**ScanPRO** é uma aplicação web full-stack robusta e escalável, projetada para a gestão e conferência de ativos (notebooks) através da leitura de QR Codes. [cite: 2677] [cite_start]Construído com as mais recentes tecnologias, o sistema oferece uma interface de usuário simples e intuitiva, com diferentes níveis de acesso e funcionalidades para otimizar o fluxo de trabalho de equipes de TI e logística. [cite: 2678, 2679]
 
---
 
## Visão Geral
 
[cite_start]O objetivo principal do ScanPRO é substituir processos manuais de controle de inventário por um fluxo digital, ágil e à prova de erros. [cite: 2680] [cite_start]Os técnicos utilizam a câmera de seus celulares para realizar conferências diárias, garantindo que cada dispositivo seja contabilizado. [cite: 2681] [cite_start]Gestores e administradores têm acesso a dashboards, relatórios e ferramentas de gestão completas para supervisionar todo o processo. [cite: 2682]

- [cite_start]**Perfis de Usuário:** O sistema conta com três níveis de acesso (Técnico, Admin, Master), cada um com permissões e interfaces específicas. [cite: 2683]
- [cite_start]**Gestão Completa de Ativos:** Interface administrativa para gerenciar Projetos, Unidades Móveis (UMs), Notebooks (com status, S/N e patrimônio) e Usuários. [cite: 2684]
- **Ciclo de Vida do Ativo:** Rastreamento completo de eventos para cada ativo, desde sua criação, passando por conferências (sucesso ou falha) e ciclos de manutenção.
- [cite_start]**Fluxo de Conferência Inteligente:** Uma interface otimizada para dispositivos móveis permite que os técnicos selecionem uma UM, escaneiem QR Codes e registrem a contagem de periféricos específicos daquela unidade. [cite: 2685]
- [cite_start]**Notificações em Tempo Real:** Após cada conferência, um resumo detalhado é enviado automaticamente para um grupo no Telegram, mantendo os gestores informados. [cite: 2686]
- [cite_start]**Geração de QR Codes:** Ferramenta integrada para gerar e imprimir etiquetas de QR Code, tanto individualmente quanto em lote, com opções de personalização. [cite: 2687]

---

## Stack de Tecnologia

[cite_start]O projeto foi construído com foco em performance, escalabilidade e qualidade de código, utilizando as seguintes tecnologias: [cite: 2689]

- [cite_start]**Framework:** [Next.js](https://nextjs.org/) 14+ (com App Router) [cite: 2689]
- [cite_start]**Linguagem:** [TypeScript](https://www.typescriptlang.org/) [cite: 2689]
- [cite_start]**Estilização:** [TailwindCSS](https://tailwindcss.com/) [cite: 2689]
- [cite_start]**Backend & Banco de Dados:** [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore) [cite: 2689]
- [cite_start]**Notificações:** [react-hot-toast](https://react-hot-toast.com/) [cite: 2689]
- [cite_start]**Geração de QR Code:** [qrcode.react](https://github.com/zpao/qrcode.react) [cite: 2689]
- [cite_start]**Manipulação de Arquivos (Frontend):** [jszip](https://stuk.github.io/jszip/) & [file-saver](https://github.com/eligrey/FileSaver.js/) & [papaparse](https://www.papaparse.com/) [cite: 2689]
- [cite_start]**Ícones:** [Lucide React](https://lucide.dev/) [cite: 2689]
- [cite_start]**Deploy:** [Vercel](https://vercel.com/) [cite: 2689]

---

## Começando

[cite_start]Para executar este projeto localmente, siga os passos abaixo. [cite: 21]

### Pré-requisitos

- [cite_start][Node.js](https://nodejs.org/) (versão 18 ou superior) [cite: 2690]
- [cite_start][npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/) [cite: 2690]
- [cite_start]Uma conta Firebase com um projeto configurado (Authentication e Firestore ativados). [cite: 2690]

### Instalação

1.  [cite_start]**Clone o repositório:** [cite: 2691]

    ```bash
    git clone [https://github.com/seu-usuario/scanpro.git](https://github.com/seu-usuario/scanpro.git)
    cd scanpro
    ```

2.  [cite_start]**Instale as dependências:** [cite: 2691]

    ```bash
    npm install
    ```

3.  [cite_start]**Configure as Variáveis de Ambiente:** [cite: 2691]
    Crie um arquivo chamado `.env.local` na raiz do projeto e adicione suas credenciais do Firebase e do Telegram. [cite_start]Este arquivo **não deve** ser enviado para o GitHub. [cite: 2691, 2692, 2693]

    ```env
    # Firebase - Credenciais do Cliente (para o navegador)
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
    NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

    # Firebase - Credenciais do Admin (para as API Routes)
    FIREBASE_PROJECT_ID="seu-projeto"
    FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@seu-projeto.iam.gserviceaccount.com"
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

    # Telegram
    TELEGRAM_BOT_TOKEN="seu-token-do-botfather"
    TELEGRAM_CHAT_ID="id-do-seu-grupo-ou-canal"
    ```

4.  [cite_start]**Execute o servidor de desenvolvimento:** [cite: 2691]
    ```bash
    npm run dev
    ```
    [cite_start]Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação. [cite: 2694]

---

## Estrutura do Projeto

[cite_start]A estrutura de arquivos foi organizada para garantir a escalabilidade e a manutenibilidade do código: [cite: 2695]

- [cite_start]`app/`: Contém todas as rotas da aplicação, utilizando o App Router do Next.js. [cite: 2695]
  - [cite_start]`(admin)` e `(user)`: Grupos de rotas para organizar os layouts e permissões. [cite: 2696]
  - [cite_start]`api/`: Rotas de backend seguras para ações no servidor (criação de usuários, notificações). [cite: 2697]
- [cite_start]`components/`: Componentes React reutilizáveis. [cite: 2698]
  - [cite_start]`layout/`: Componentes de layout principais (ex: `AdminLayout`). [cite: 2698]
  - [cite_start]`ui/`: Componentes de UI genéricos (botões, modais, etc.). [cite: 2699]
- [cite_start]`context/`: Contextos React para gestão de estado global (ex: `AuthContext`). [cite: 2700]
- [cite_start]`lib/`: Módulos de utilidade e configuração. [cite: 2700]
  - [cite_start]`firebase/`: Configuração do cliente e do admin do Firebase. [cite: 2701]
- [cite_start]`providers/`: Componentes de "provider" para envolver a aplicação (ex: `ClientProviders`). [cite: 2702]
- [cite_start]`types/`: Definições de tipos e interfaces TypeScript. [cite: 2703]

---

## Funcionalidades Principais

- [cite_start]✅ **Autenticação Segura:** Login baseado em email/senha com gestão de sessão via Firebase. [cite: 2703]
- [cite_start]✅ **Controle de Acesso Baseado em Perfil (RBAC):** Layouts condicionais garantem que os usuários só acessem as páginas permitidas. [cite: 2704]
- [cite_start]✅ **Gestão Completa de Ativos:** Interfaces CRUD para administradores gerenciarem Projetos, UMs e Notebooks, incluindo S/N, Patrimônio e Status. [cite: 2705]
- ✅ **Gestão de Manutenção de Ativos:** Ferramentas para administradores moverem ativos para o status "Em Manutenção", removendo-os temporariamente das conferências esperadas.
- [cite_start]✅ **Histórico de Vida Completo do Ativo (Lifecycle):** Rastreabilidade total de cada notebook, com um log detalhado de eventos como criação, conferências (sucesso/falha) e ciclos de manutenção. [cite: 2711]
- ✅ **Cadastro em Lote via Importação CSV:** Ferramenta para administradores cadastrarem centenas de notebooks de uma só vez através do upload de uma planilha CSV.
- ✅ **Periféricos Configuráveis por Unidade Móvel (UM):** Flexibilidade para administradores definirem quais periféricos (mouse, carregador, fone, etc.) são esperados em cada UM, tornando o fluxo do técnico mais preciso.
- [cite_start]✅ **Exclusão Segura:** Lógica de negócio que previne a exclusão de itens que possuem dependências (ex: projetos com UMs associadas). [cite: 2706]
- [cite_start]✅ **Gestão de Usuários (Apenas Master):** O perfil `MASTER` pode criar, editar e apagar outros usuários. [cite: 2707]
- [cite_start]✅ **Scanner de QR Code:** Interface otimizada para celular que utiliza a câmera para a conferência de ativos. [cite: 2708]
- [cite_start]✅ **Notificações via Telegram:** Envio automático de resumos de conferência para um chat pré-definido. [cite: 2709]
- [cite_start]✅ **Geração de QR Codes On-Demand:** Ferramenta completa para gerar e imprimir/baixar etiquetas de QR Code com múltiplas opções de personalização. [cite: 2710]

---

## Deploy

[cite_start]A aplicação está configurada para deploy contínuo na **Vercel**. [cite: 2712] [cite_start]Qualquer `push` para a branch `main` irá acionar um novo build e deploy de produção. [cite: 2713] [cite_start]As variáveis de ambiente devem ser configuradas no painel de "Environment Variables" do projeto na Vercel. [cite: 2714]

---

## Como Contribuir

[cite_start]Este projeto é mantido ativamente. [cite: 2715] [cite_start]Para contribuir: [cite: 2716]

1.  [cite_start]Crie um fork do repositório. [cite: 2716]
2.  [cite_start]Crie uma nova branch para a sua feature (`git checkout -b feature/nova-feature`). [cite: 2717]
3.  [cite_start]Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`). [cite: 2718]
4.  [cite_start]Faça push para a sua branch (`git push origin feature/nova-feature`). [cite: 2719]
5.  Abra um Pull Request.
