// Importa a biblioteca Dexie para podermos acessar o IndexedDB
self.importScripts("https://unpkg.com/dexie@3/dist/dexie.js");

// Cria uma conexão com o mesmo banco de dados definido na aplicação
const db = new self.Dexie("ScanProDB");
db.version(1).stores({
  conferencesOutbox: "++id, timestamp",
});

// --- LÓGICA DE SINCRONIZAÇÃO DE CONFERÊNCIAS (JÁ EXISTENTE) ---
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-conferences") {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.conferenceData),
      });

      if (response.ok) {
        console.log(
          `[Service Worker] Conferência ID:${item.id} enviada com sucesso!`
        );
        await db.conferencesOutbox.delete(item.id);
      } else {
        console.error(
          `[Service Worker] Falha ao enviar conferência ID:${item.id}. Status: ${response.status}`
        );
      }
    } catch (error) {
      console.error(
        `[Service Worker] Erro de rede ao tentar enviar conferência ID:${item.id}.`,
        error
      );
      throw error;
    }
  }

  console.log("[Service Worker] Sincronização de conferências concluída.");
}

// --- NOVA LÓGICA PARA RECEBER E EXIBIR NOTIFICAÇÕES PUSH ---
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Notificação Push recebida.");

  // Extrai os dados da notificação. Esperamos um JSON com title, body, etc.
  const data = event.data.json();

  const title = data.title || "ScanPRO";
  const options = {
    body: data.body || "Você tem uma nova notificação.",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png", // Ícone para a barra de status do Android
  };

  // Garante que o Service Worker não seja encerrado antes da notificação ser exibida
  event.waitUntil(self.registration.showNotification(title, options));
});
