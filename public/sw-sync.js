// ATUALIZADO: Importa a cópia local do Dexie
self.importScripts("/dexie.min.js");

const db = new self.Dexie("ScanProDB");
db.version(1).stores({
  conferencesOutbox: "++id, timestamp",
});

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

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Notificação Push recebida.");

  const data = event.data.json();

  const title = data.title || "ScanPRO";
  const options = {
    body: data.body || "Você tem uma nova notificação.",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
