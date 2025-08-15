// Importa a biblioteca Dexie para podermos acessar o IndexedDB
self.importScripts("https://unpkg.com/dexie@3/dist/dexie.js");

// Cria uma conexão com o mesmo banco de dados definido na aplicação
const db = new self.Dexie("ScanProDB");
db.version(1).stores({
  conferencesOutbox: "++id, timestamp",
});

// Listener para o evento 'sync'
self.addEventListener("sync", (event) => {
  // A tag 'sync-conferences' é a que registramos na nossa página de scanner
  if (event.tag === "sync-conferences") {
    // waitUntil garante que o service worker não será encerrado antes da tarefa terminar
    event.waitUntil(syncConferences());
  }
});

async function syncConferences() {
  console.log("[Service Worker] Iniciando sincronização de conferências...");

  const conferencesToSync = await db.conferencesOutbox.toArray();

  if (conferencesToSync.length === 0) {
    console.log(
      "[Service Worker] Nenhuma conferência na outbox para sincronizar."
    );
    return;
  }

  for (const item of conferencesToSync) {
    try {
      const response = await fetch("/api/conferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item.conferenceData),
      });

      if (response.ok) {
        console.log(
          `[Service Worker] Conferência ID:${item.id} enviada com sucesso!`
        );
        // Se foi enviado com sucesso, remove da outbox
        await db.conferencesOutbox.delete(item.id);
      } else {
        console.error(
          `[Service Worker] Falha ao enviar conferência ID:${item.id}. Status: ${response.status}`
        );
        // Se a API falhar, a conferência permanecerá na outbox para a próxima tentativa
      }
    } catch (error) {
      console.error(
        `[Service Worker] Erro de rede ao tentar enviar conferência ID:${item.id}.`,
        error
      );
      // Se houver um erro de rede, para a sincronização e tenta novamente mais tarde.
      // O navegador irá disparar o evento 'sync' novamente.
      throw error;
    }
  }

  console.log("[Service Worker] Sincronização de conferências concluída.");
}
