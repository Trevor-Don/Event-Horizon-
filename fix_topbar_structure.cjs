const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// remove from renderHome
code = code.replace(/<div className="md:hidden">{renderTopBar\(\)}<\/div>\s*/, '');

// place it inside Main Content Area
code = code.replace(
    `      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        <div className="md:hidden">{navTab !== 'Home' && renderTopBar()}</div>`,
    `      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        <div className="md:hidden">{renderTopBar()}</div>`
);

fs.writeFileSync('App.tsx', code);
console.log("Fixed topbar structure");
