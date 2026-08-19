const fs = require('fs');

const files = [
  'app/updates/page.tsx',
  'app/trip/[shareToken]/page.tsx',
  'app/driver/page.tsx',
  'app/driver/earnings/page.tsx',
  'app/dashboard/page.tsx',
  'app/admin/page.tsx'
];

let modifiedFiles = 0;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  content = content.replace(/'#111111'/g, "'var(--background)'");
  content = content.replace(/'#171717'/g, "'var(--surface-card)'");
  content = content.replace(/'#1e1e1e'/g, "'var(--border)'");
  content = content.replace(/'#f5f5f5'/g, "'var(--foreground)'");
  content = content.replace(/'#222222'/g, "'var(--border-default)'");
  content = content.replace(/'#222'/g, "'var(--border-default)'");
  content = content.replace(/'#333333'/g, "'var(--border-subtle)'");
  content = content.replace(/'#333'/g, "'var(--border-subtle)'");
  
  content = content.replace(/"#111111"/g, '"var(--background)"');
  content = content.replace(/"#171717"/g, '"var(--surface-card)"');
  content = content.replace(/"#1e1e1e"/g, '"var(--border)"');
  content = content.replace(/"#f5f5f5"/g, '"var(--foreground)"');

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files updated: ' + modifiedFiles);
