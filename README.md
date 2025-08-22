# ScanPRO - Sistema de Conferência de Ativos

<p align="center">
  <img src="public/Logo.svg" alt="ScanPRO Logo" width="250"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/framework-Next.js-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/linguagem-Typescript-blue?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/backend-Firebase-orange?logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/PWA-Offline--First-purple?logo=pwa" alt="PWA">
  <img src="https://img.shields.io/badge/estilo-Tailwind%20CSS-blue?logo=tailwind-css" alt="Tailwind CSS">
</p>

**ScanPRO** é uma aplicação web full-stack robusta e escalável, projetada para a gestão e conferência de ativos (notebooks) através da leitura de QR Codes. Agora, evoluído para um **Progressive Web App (PWA)**, o sistema garante funcionalidade contínua mesmo em ambientes offline, otimizando o fluxo de trabalho de equipes de TI e logística.

---

## Índice

- [ScanPRO - Sistema de Conferência de Ativos](#scanpro---sistema-de-conferência-de-ativos)
  - [Índice](#índice)
  - [Visão Geral](#visão-geral)
  - [Principais Funcionalidades](#principais-funcionalidades)
  - [Stack de Tecnologia](#stack-de-tecnologia)
  - [Começando](#começando)
    - [Pré-requisitos](#pré-requisitos)
    - [Instalação](#instalação)
  - [Estrutura do Projeto](#estrutura-do-projeto)
  - [Deploy](#deploy)

## Visão Geral

O objetivo principal do ScanPRO é substituir processos manuais de controle de inventário por um fluxo digital, ágil e à prova de erros. Os técnicos utilizam a câmera de seus celulares para realizar conferências diárias, garantindo que cada dispositivo seja contabilizado. Gestores e administradores têm acesso a dashboards, relatórios e ferramentas de gestão completas para supervisionar todo o processo.

Com a transformação em PWA, a aplicação agora oferece uma experiência "app-like", com a capacidade de funcionar offline e sincronizar dados em segundo plano, tornando-a uma ferramenta de campo ainda mais confiável.

## Principais Funcionalidades

- ✅ **Arquitetura PWA (Progressive Web App):**

  - **Modo de Conferência Offline:** Técnicos podem realizar conferências completas sem conexão com a internet. Os dados são salvos localmente no dispositivo.
  - **Sincronização em Segundo Plano:** As conferências salvas offline são enviadas automaticamente para o servidor assim que uma conexão estável é restabelecida.

- ✅ **Autenticação Segura e Robusta:**

  - Login baseado em email/senha com três níveis de acesso (`Técnico`, `Admin`, `Master`).
  - Arquitetura de sessão segura com cookies `HttpOnly` e `middleware` para proteção de rotas no servidor.

- ✅ **Gestão Completa de Ativos:**

  - Interfaces CRUD para administradores gerenciarem Projetos, UMs e Notebooks, incluindo S/N, Patrimônio e Status.
  - Gestão do ciclo de vida do ativo, com histórico de eventos e status de manutenção.
  - Cadastro em lote via importação de arquivos CSV.

- ✅ **Relatórios e Análises:**

  - Página de relatórios completa com busca, filtros dinâmicos e paginação no lado do servidor para alta performance.
  - Exportação dos relatórios (completos ou filtrados) para o formato CSV.

- ✅ **Fluxo de Conferência Inteligente:**

  - Interface otimizada para dispositivos móveis que utiliza a câmera para a conferência de ativos.
  - Periféricos configuráveis por Unidade Móvel (UM) para um fluxo de conferência mais preciso.

- ✅ **Notificações em Tempo Real:**

  - Envio automático de resumos de conferência para um grupo no Telegram.
  - Disparo de Notificações Push para os dispositivos dos técnicos (PWA).

- ✅ **Geração de QR Code:**
  - Ferramenta para gerar e imprimir/baixar etiquetas de QR Code, tanto individualmente quanto em lote, com opções de personalização.

## Stack de Tecnologia

O projeto foi construído com foco em performance, escalabilidade e qualidade de código, utilizando as seguintes tecnologias:

- **Framework:** [Next.js](https://nextjs.org/) 14+ (com App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [TailwindCSS](https://tailwindcss.com/)
- **Backend & Banco de Dados:** [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore)
- **PWA e Service Worker:** [@ducanh2912/next-pwa](https://github.com/DuCanh2912/next-pwa)
- **Banco de Dados Offline:** [dexie.js](https://dexie.org/)
- **Notificações Push:** [web-push](https://github.com/web-push-libs/web-push)
- **Manipulação de Arquivos (Frontend):** [jszip](https://stuk.github.io/jszip/), [file-saver](https://github.com/eligrey/FileSaver.js/) & [papaparse](https://www.papaparse.com/)
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
    Crie um arquivo chamado `.env.local` na raiz do projeto e adicione suas credenciais.

    ```env
    # Firebase - Credenciais do Cliente
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

    # Notificações Push (VAPID Keys)
    NEXT_PUBLIC_VAPID_PUBLIC_KEY="SUA_CHAVE_PUBLICA_VAPID"
    VAPID_PRIVATE_KEY="SUA_CHAVE_PRIVADA_VAPID"
    ```

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

---

## Estrutura do Projeto

A estrutura de arquivos foi organizada para garantir a escalabilidade e a manutenibilidade do código:

- `app/`: Contém todas as rotas da aplicação, utilizando o App Router do Next.js.
  - `(admin)` e `(user)`: Grupos de rotas para organizar os layouts e permissões.
  - `api/`: Rotas de backend para ações no servidor (autenticação, notificações, etc.).
- `components/`: Componentes React reutilizáveis.
- `context/`: Contextos React para gestão de estado global (ex: `AuthContext`).
- `lib/`: Módulos de utilidade e configuração, incluindo a configuração do Firebase e do Dexie.
- `providers/`: Componentes de "provider" para envolver a aplicação.
- `public/`: Arquivos estáticos, incluindo ícones, manifesto do PWA e scripts do Service Worker.
- `scripts/`: Scripts de utilidade para o projeto (ex: copiar arquivos no postinstall).
- `types/`: Definições de tipos e interfaces TypeScript.

## Deploy

A aplicação está configurada para deploy contínuo na **Vercel**. Qualquer `push` para a branch `main` irá acionar um novo build e deploy de produção. As variáveis de ambiente devem ser configuradas no painel de "Environment Variables" do projeto na Vercel..
