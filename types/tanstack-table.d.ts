import "@tanstack/react-table";
import { ConferenceData, RowData } from "./index"; // A interface RowData pode precisar ser importada ou já estar disponível

declare module "@tanstack/react-table" {
  // Adicionamos o comentário abaixo para desativar o alerta de variável não utilizada
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    openPeripheralsModal?: (data: Partial<ConferenceData>) => void;
  }
}
