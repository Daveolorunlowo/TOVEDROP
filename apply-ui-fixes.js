const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components')];
let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  // 1. Tighter border radii
  content = content.replace(/\brounded-2xl\b/g, "rounded-xl");
  content = content.replace(/\brounded-3xl\b/g, "rounded-2xl");

  // 2. Remove unnecessary shadows (keep lg/xl/2xl for floating modals)
  content = content.replace(/\bshadow-sm\b/g, "");
  // Remove empty spaces left behind
  content = content.replace(/className=" /g, 'className="');
  content = content.replace(/  +/g, ' '); 

  // 3. Remove inline gradients
  content = content.replace(/style={{[^}]*background:\s*'linear-gradient[^}]*}} ?/g, "");
  content = content.replace(/style={{[^}]*backgroundImage:\s*'linear-gradient[^}]*}} ?/g, "");
  
  // 4. Remove tailwind gradients and replace with flat primary
  content = content.replace(/\bbg-gradient-to-[a-z]+\b/g, "bg-primary");
  content = content.replace(/\bfrom-[a-zA-Z0-9-]+\b/g, "");
  content = content.replace(/\bto-[a-zA-Z0-9-]+\b/g, "");
  content = content.replace(/\bvia-[a-zA-Z0-9-]+\b/g, "");

  // Cleanup extra spaces in className strings
  content = content.replace(/className="([^"]+)"/g, (match, p1) => {
      return `className="${p1.trim().replace(/\s{2,}/g, ' ')}"`;
  });

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files updated: ' + modifiedFiles);
