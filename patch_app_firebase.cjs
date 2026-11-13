const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Imports
code = code.replace(
  "import { SavedEventsList } from \"./components/SavedEventsList\";",
  `import { SavedEventsList } from "./components/SavedEventsList";
import { auth, db, handleFirestoreError, OperationType, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';`
);

// Add user state
code = code.replace(
  "const [events, setEvents] = useState<NewsEvent[]>([]);",
  `const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<NewsEvent[]>([]);`
);

// Add useEffect for Auth
const authEffect = `
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
         try {
           const prefDoc = await getDoc(doc(db, 'users', u.uid));
           if (prefDoc.exists() && prefDoc.data().preferences) {
              setSettings(s => ({...s, userPreferences: prefDoc.data().preferences}));
           } else {
              await setDoc(doc(db, 'users', u.uid), { preferences: {} }, { merge: true });
           }
           const savedDocs = await getDocs(collection(db, \`users/\${u.uid}/savedEvents\`));
           const evs = savedDocs.docs.map(d => d.data() as NewsEvent);
           setSavedEvents(evs);
         } catch (err) {
           handleFirestoreError(err, OperationType.GET, \`users/\${u.uid}\`);
         }
      } else {
         setSavedEvents([]);
         const localPrefs = localStorage.getItem('eh_user_prefs');
         if (localPrefs) setSettings(s => ({...s, userPreferences: JSON.parse(localPrefs)}));
      }
    });
    return unsubscribe;
  }, []);
`;

// Replace the old localStorage useEffect
code = code.replace(
  /useEffect\(\(\) => {\s+try {\s+const prefs = localStorage\.getItem\('eh_user_prefs'\);\s+if \(prefs\) {\s+setSettings\(s => \(\{ \.\.\.s, userPreferences: JSON\.parse\(prefs\) \}\)\);\s+}\s+} catch \(e\) {}\s+}, \[\]\);/,
  authEffect
);

// Update toggleSaveEvent
const newToggle = `const toggleSaveEvent = async (event: NewsEvent) => {
      const isSaved = savedEvents.some(e => e.id === event.id);
      
      setSavedEvents(prev => {
          if (isSaved) return prev.filter(e => e.id !== event.id);
          return [...prev, event];
      });

      if (auth.currentUser) {
          try {
             if (isSaved) {
                await deleteDoc(doc(db, \`users/\${auth.currentUser.uid}/savedEvents\`, event.id));
             } else {
                await setDoc(doc(db, \`users/\${auth.currentUser.uid}/savedEvents\`, event.id), event);
             }
          } catch (err) {
             console.error("Save event failed", err);
             // We can't use handleFirestoreError here directly if we don't want to crash the UI, but let's do it for compliance:
             try { handleFirestoreError(err, isSaved ? OperationType.DELETE : OperationType.CREATE, \`users/\${auth.currentUser.uid}/savedEvents\`); } catch (e) {}
          }
      }
  };`;

code = code.replace(/const toggleSaveEvent = \(event: NewsEvent\) => \{[\s\S]*?\};\n  \};/m, newToggle);

// Update handleReadTime
code = code.replace(
  "localStorage.setItem('eh_user_prefs', JSON.stringify(newPrefs));",
  `localStorage.setItem('eh_user_prefs', JSON.stringify(newPrefs));
              if (auth.currentUser) {
                  setDoc(doc(db, \`users/\${auth.currentUser.uid}\`), { preferences: newPrefs }, { merge: true })
                    .catch(e => console.error(e));
              }`
);

// Update top bar to include login
const oldTopBarStart = `<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">\n        <UserIcon />\n      </div>`;
const newTopBarStart = `<div className="flex-shrink-0">
        {user ? (
            <img 
              src={user.photoURL || ''} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full cursor-pointer border border-gray-200"
              onClick={() => signOut(auth)}
              title="Click to sign out"
            />
        ) : (
            <button 
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="px-4 py-2 bg-theme-purple text-white rounded-full text-xs font-bold hover:bg-opacity-90"
            >
              Sign In
            </button>
        )}
      </div>`;

code = code.replace(oldTopBarStart, newTopBarStart);

fs.writeFileSync('App.tsx', code);
console.log("Patched App.tsx with Firebase auth and persistence");
