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

  // Invalid Tailwind classes
  content = content.replace(/text-text-primary/g, "text-primary");
  content = content.replace(/text-text-secondary/g, "text-secondary");
  content = content.replace(/text-text-muted/g, "text-muted");

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files updated: ' + modifiedFiles);
