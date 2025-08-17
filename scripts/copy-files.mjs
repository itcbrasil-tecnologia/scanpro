import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Lógica para obter o __dirname em Módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Origem: O arquivo dexie.min.js dentro de node_modules
const dexieSource = path.join(
  __dirname,
  "..",
  "node_modules",
  "dexie",
  "dist",
  "dexie.min.js"
);

// Destino: A raiz da nossa pasta /public
const dexieDestination = path.join(__dirname, "..", "public", "dexie.min.js");

// Copia o arquivo
fs.copyFile(dexieSource, dexieDestination, (err) => {
  if (err) {
    console.error("Erro ao copiar o arquivo dexie.min.js:", err);
    return;
  }
  console.log("dexie.min.js copiado para a pasta /public com sucesso.");
});
