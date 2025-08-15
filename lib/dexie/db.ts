import Dexie, { Table } from "dexie";

// Define a interface para os dados que vamos armazenar.
// É uma boa prática usar a mesma estrutura do Firestore, mas com um ID autoincrementado.
export interface ConferenceOutbox {
  id?: number; // Chave primária autoincrementada
  conferenceData: object; // Objeto com todos os dados da conferência
  timestamp: Date;
}

class ScanProDB extends Dexie {
  // Declara a nossa tabela 'conferencesOutbox'
  public conferencesOutbox!: Table<ConferenceOutbox, number>;

  public constructor() {
    super("ScanProDB"); // O nome do nosso banco de dados no IndexedDB
    this.version(1).stores({
      // Define o schema da nossa tabela:
      // '++id' significa uma chave primária autoincrementada chamada 'id'
      conferencesOutbox: "++id, timestamp",
    });
  }
}

// Exporta uma instância global do nosso banco de dados para ser usada em toda a aplicação.
export const db = new ScanProDB();
