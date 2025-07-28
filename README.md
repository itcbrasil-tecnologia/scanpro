# ScanPRO - Sistema de Conferência de Ativos

<p align="center">
  <img src="public/Logo.svg" alt="ScanPRO Logo" width="250"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

**ScanPRO** é uma aplicação web full-stack robusta e escalável, projetada para a gestão e conferência de ativos (notebooks) através da leitura de QR Codes. Construído com as mais recentes tecnologias, o sistema oferece uma interface de usuário simples e intuitiva, com diferentes níveis de acesso e funcionalidades para otimizar o fluxo de trabalho de equipes de TI e logística.

---

## Visão Geral

O objetivo principal do ScanPRO é substituir processos manuais de controle de inventário por um fluxo digital, ágil e à prova de erros. Os técnicos utilizam a câmera de seus celulares para realizar conferências diárias, garantindo que cada dispositivo seja contabilizado e esteja em seu devido lugar. Gestores e administradores têm acesso a dashboards, relatórios e ferramentas de gestão completas para supervisionar todo o processo.

- **Perfis de Usuário:** O sistema conta com três níveis de acesso (Técnico, Admin, Master), cada um com permissões e interfaces específicas.
- **Gestão Completa (CRUD):** Interface administrativa para gerenciar Projetos, Unidades Móveis (UMs), Notebooks e Usuários.
- **Fluxo de Conferência:** Uma interface otimizada para dispositivos móveis permite que os técnicos selecionem uma UM e escaneiem os QR Codes dos dispositivos de forma rápida e eficiente.
- **Notificações em Tempo Real:** Após cada conferência, um resumo detalhado é enviado automaticamente para um grupo no Telegram, mantendo os gestores informados.
- **Geração de QR Codes:** Ferramenta integrada para gerar e imprimir etiquetas de QR Code, tanto individualmente quanto em lote, com opções de personalização.

---

## Stack de Tecnologia

O projeto foi construído com foco em performance, escalabilidade e qualidade de código, utilizando as seguintes tecnologias:

- **Framework:** [Next.js](https://nextjs.org/) 14+ (com App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [TailwindCSS](https://tailwindcss.com/)
- **Backend & Banco de Dados:** [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore)
- **Notificações:** [react-hot-toast](https://react-hot-toast.com/)
- **Geração de QR Code:** [qrcode.react](https://github.com/zpao/qrcode.react)
- **Manipulação de Arquivos (Frontend):** [jszip](https://stuk.github.io/jszip/) & [file-saver](https://github.com/eligrey/FileSaver.js/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Deploy:** [Vercel](https://vercel.com/)

---

## Começando

Para executar este projeto localmente, siga os passos abaixo.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Uma conta Firebase com um projeto configurado (Authentication e Firestore ativados).

### Instalação

1.  **Clone o repositório:**

    ```bash
    git clone [https://github.com/seu-usuario/scanpro.git](https://github.com/seu-usuario/scanpro.git)
    cd scanpro
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env.local` na raiz do projeto e adicione suas credenciais do Firebase e do Telegram. Este arquivo **não deve** ser enviado para o GitHub.

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

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

---

## Estrutura do Projeto

A estrutura de arquivos foi organizada para garantir a escalabilidade e a manutenibilidade do código:

- `app/`: Contém todas as rotas da aplicação, utilizando o App Router do Next.js.
  - `(admin)` e `(user)`: Grupos de rotas para organizar os layouts e permissões.
  - `api/`: Rotas de backend seguras para ações no servidor (criação de usuários, notificações).
- `components/`: Componentes React reutilizáveis.
  - `layout/`: Componentes de layout principais (ex: `AdminLayout`).
  - `ui/`: Componentes de UI genéricos (botões, modais, etc.).
- `context/`: Contextos React para gestão de estado global (ex: `AuthContext`).
- `lib/`: Módulos de utilidade e configuração.
  - `firebase/`: Configuração do cliente e do admin do Firebase.
- `providers/`: Componentes de "provider" para envolver a aplicação (ex: `ClientProviders`).
- `types/`: Definições de tipos e interfaces TypeScript.

---

## Funcionalidades Principais

- ✅ **Autenticação Segura:** Login baseado em email/senha com gestão de sessão via Firebase.
- ✅ **Controle de Acesso Baseado em Perfil (RBAC):** Layouts condicionais garantem que os usuários só acessem as páginas permitidas.
- ✅ **Gestão de Projetos, UMs e Notebooks:** Interfaces CRUD completas para administradores.
- ✅ **Exclusão Segura:** Lógica de negócio que previne a exclusão de itens que possuem dependências.
- ✅ **Gestão de Usuários (Apenas Master):** O perfil `MASTER` pode criar, editar e apagar outros usuários.
- ✅ **Scanner de QR Code:** Interface otimizada para celular que utiliza a câmera para a conferência de ativos.
- ✅ **Notificações via Telegram:** Envio automático de resumos de conferência para um chat pré-definido.
- ✅ **Geração de QR Codes On-Demand:** Ferramenta completa para gerar e imprimir/baixar etiquetas de QR Code com múltiplas opções de personalização.
- ✅ **Histórico de Dispositivo:** Rastreabilidade de pendências para qualquer notebook no sistema.

---

## Deploy

A aplicação está configurada para deploy contínuo na **Vercel**. Qualquer `push` para a branch `main` irá acionar um novo build e deploy de produção. As variáveis de ambiente devem ser configuradas no painel de "Environment Variables" do projeto na Vercel.

---

## Como Contribuir

Este projeto é mantido ativamente. Para contribuir:

1.  Crie um fork do repositório.
2.  Crie uma nova branch para a sua feature (`git checkout -b feature/nova-feature`).
3.  Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`).
4.  Faça push para a sua branch (`git push origin feature/nova-feature`).
5.  Abra um Pull Request.

---

_Este README foi gerado em 26 de Julho de 2025._
