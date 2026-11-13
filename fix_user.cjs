const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  `  const [user, setUser] = useState<User | null>(null);\n  const [user, setUser] = useState<User | null>(null);`,
  `  const [user, setUser] = useState<User | null>(null);`
);

fs.writeFileSync('App.tsx', code);
console.log("Fixed duplicate user");
