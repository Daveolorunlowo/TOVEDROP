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

  // Replace Tailwind hardcoded backgrounds
  content = content.replace(/bg-\[#111\]/g, "bg-background");
  content = content.replace(/bg-\[#111111\]/g, "bg-background");
  content = content.replace(/bg-\[#171717\]/g, "bg-card");
  content = content.replace(/bg-\[#1e1e1e\]/g, "bg-card");

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files updated: ' + modifiedFiles);
