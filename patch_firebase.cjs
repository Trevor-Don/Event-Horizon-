const fs = require('fs');
let code = fs.readFileSync('firebase.ts', 'utf8');

code = code.replace(
  "import { getFirestore, doc, getDocFromServer, setDoc, deleteDoc, getDocs, collection, query } from 'firebase/firestore';",
  "import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, doc, getDocFromServer, setDoc, deleteDoc, getDocs, collection, query } from 'firebase/firestore';"
);

code = code.replace(
  "export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);",
  `export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, firebaseConfig.firestoreDatabaseId);`
);

fs.writeFileSync('firebase.ts', code);
console.log("Patched firebase.ts");
