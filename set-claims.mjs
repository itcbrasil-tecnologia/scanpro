// Usa a sintaxe de import moderna
import admin from "firebase-admin";

// CORREÇÃO: A sintaxe padrão para importação de JSON agora usa "with" em vez de "assert".
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

// Inicializa o app Firebase Admin com suas credenciais
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();
const auth = admin.auth();

/**
 * Função principal que busca todos os usuários no Firestore e define seus Custom Claims.
 */
async function setClaimsForExistingUsers() {
  console.log("Iniciando a migração de roles para Custom Claims...");

  try {
    const usersSnapshot = await firestore.collection("users").get();

    if (usersSnapshot.empty) {
      console.log("Nenhum usuário encontrado na coleção 'users'. Encerrando.");
      return;
    }

    let successCount = 0;
    const promises = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const uid = userDoc.id;
      const role = userData.role;

      if (role) {
        const promise = auth.setCustomUserClaims(uid, { role: role }).then(() => {
          successCount++;
          console.log(`- Sucesso: Claim { role: '${role}' } definido para o usuário ${uid} (${userData.email})`);
        }).catch(error => {
          console.error(`- ERRO ao definir claim para o usuário ${uid}:`, error.message);
        });
        promises.push(promise);
      } else {
        console.warn(`- Aviso: Usuário ${uid} (${userData.email}) não possui o campo 'role' no Firestore. Pulando.`);
      }
    });

    await Promise.all(promises);

    console.log("\n----------------------------------------------------");
    console.log(`Migração concluída!`);
    console.log(`${successCount} de ${usersSnapshot.size} usuários tiveram seus claims atualizados.`);
    console.log("----------------------------------------------------");

  } catch (error) {
    console.error("\nOcorreu um erro fatal durante a execução do script:", error);
  }
}

// Executa a função principal
setClaimsForExistingUsers();