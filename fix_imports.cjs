const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const duplicateImportBlock = `import { auth, db, handleFirestoreError, OperationType, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';`;

const regex = new RegExp(duplicateImportBlock.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
let matchCount = (code.match(regex) || []).length;

if (matchCount > 1) {
    // Keep the first one, remove the rest
    let first = true;
    code = code.replace(regex, (match) => {
        if (first) {
            first = false;
            return match;
        }
        return '';
    });
    fs.writeFileSync('App.tsx', code);
    console.log("Fixed duplicate imports");
} else {
    console.log("No duplicate imports found");
}

