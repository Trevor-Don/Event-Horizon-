const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const oldToggle = `  const toggleSaveEvent = (event: NewsEvent) => {
      setSavedEvents(prev => {
          if (prev.some(e => e.id === event.id)) {
              return prev.filter(e => e.id !== event.id);
          } else {
              return [...prev, event];
          }
      });
  };`;

const newToggle = `  const toggleSaveEvent = async (event: NewsEvent) => {
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
             try { handleFirestoreError(err, isSaved ? OperationType.DELETE : OperationType.CREATE, \`users/\${auth.currentUser.uid}/savedEvents\`); } catch (e) {}
          }
      }
  };`;

if (code.includes(oldToggle)) {
  code = code.replace(oldToggle, newToggle);
  fs.writeFileSync('App.tsx', code);
  console.log("Fixed toggleSaveEvent");
} else {
  console.log("Could not find oldToggle in App.tsx");
}
