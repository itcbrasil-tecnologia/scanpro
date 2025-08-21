import "@tanstack/react-table";
import { ConferenceData, MaintenanceNotebook, UserProfile } from "./index";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    openPeripheralsModal?: (data: Partial<ConferenceData>) => void;
    openHistoryModal?: (notebook: MaintenanceNotebook) => void;
    onEdit?: (user: UserProfile) => void;
    onDelete?: (user: UserProfile) => void;
    openDetailsModal?: (hostnames: string[]) => void;
    // ADICIONADO: Função para o modal de resumo no dashboard
    openSummaryModal?: (conference: ConferenceData) => void;
  }
}
