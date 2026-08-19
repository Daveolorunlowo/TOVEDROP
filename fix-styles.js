const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
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

  // Backgrounds
  content = content.replace(/background:\s*'#111111'/g, "background: 'var(--background)'");
  content = content.replace(/background:\s*'#171717'/g, "background: 'var(--card)'");
  content = content.replace(/background:\s*'#1e1e1e'/g, "background: 'var(--card)'");
  content = content.replace(/background:\s*'#222'/g, "background: 'var(--border)'");
  
  // Colors
  content = content.replace(/color:\s*'#f5f5f5'/g, "color: 'var(--foreground)'");
  content = content.replace(/color:\s*'#555'/g, "color: 'var(--muted-foreground)'");
  content = content.replace(/color:\s*'#888'/g, "color: 'var(--muted-foreground)'");
  content = content.replace(/color:\s*'#444'/g, "color: 'var(--muted-foreground)'");
  content = content.replace(/color:\s*'#333'/g, "color: 'var(--muted-foreground)'");
  content = content.replace(/color:\s*'#eee'/g, "color: 'var(--foreground)'");
  content = content.replace(/color:\s*'black'/g, "color: 'var(--foreground)'");
  content = content.replace(/color:\s*'white'/g, "color: 'var(--foreground)'");

  // Borders
  content = content.replace(/border:\s*'1px solid #222'/g, "border: '1px solid var(--border)'");
  content = content.replace(/border:\s*'1px dashed #222'/g, "border: '1px dashed var(--border)'");
  content = content.replace(/borderBottom:\s*'1px solid #1e1e1e'/g, "borderBottom: '1px solid var(--border)'");
  content = content.replace(/borderColor:\s*'#1e1e1e'/g, "borderColor: 'var(--border)'");
  content = content.replace(/borderTop:\s*'1px solid #1e1e1e'/g, "borderTop: '1px solid var(--border)'");

  // text-black class
  content = content.replace(/text-black/g, "text-foreground");

  if (file.includes('motion')) {
      content = orig;
  }

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files updated: ' + modifiedFiles);
