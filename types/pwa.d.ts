// Este arquivo estende as interfaces globais do TypeScript para o ambiente do navegador.

// Define a interface para o SyncManager, que é o objeto retornado por `sw.sync`
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

// Estende a interface ServiceWorkerRegistration nativa para incluir a propriedade `sync`
interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}
