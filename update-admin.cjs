const fs = require('fs');
const path = 'app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
  "const GOLD = '#f5a623'": "const GOLD = 'var(--orange-brand)'",
  "const GOLD_DIM = 'rgba(245,166,35,0.14)'": "const GOLD_DIM = 'rgba(249, 115, 22, 0.14)'",
  "const NAVY_0 = '#060d1f'": "const NAVY_0 = 'var(--background)'",
  "const NAVY_1 = '#0c1528'": "const NAVY_1 = 'var(--card)'",
  "const NAVY_2 = '#111d35'": "const NAVY_2 = 'var(--surface-elevated)'",
  "const BORDER = 'rgba(255,255,255,0.07)'": "const BORDER = 'var(--border)'",
  "const BORDER_LO = 'rgba(255,255,255,0.04)'": "const BORDER_LO = 'var(--border-subtle)'",
  "const TEXT_HI = '#e8eaf0'": "const TEXT_HI = 'var(--foreground)'",
  "const TEXT_MD = '#8090aa'": "const TEXT_MD = 'var(--muted-foreground)'",
  "const TEXT_LO = '#3d4f6a'": "const TEXT_LO = 'var(--muted-foreground)'",
  "const GREEN = '#34d399'": "const GREEN = 'var(--status-success)'",
  "const GREEN_DIM = 'rgba(52,211,153,0.12)'": "const GREEN_DIM = 'rgba(22, 163, 74, 0.12)'",
  "const RED = '#f87171'": "const RED = 'var(--status-danger)'",
  "const RED_DIM = 'rgba(248,113,113,0.12)'": "const RED_DIM = 'rgba(220, 38, 38, 0.12)'",
  "const BLUE = '#60a5fa'": "const BLUE = '#3b82f6'"
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.replace(key, value);
}

content = content.replace(/rgba\(245,166,35,0\.18\)/g, 'rgba(249, 115, 22, 0.18)');
content = content.replace(/rgba\(245,166,35,0\.04\)/g, 'rgba(249, 115, 22, 0.04)');
content = content.replace(/rgba\(245,166,35,0\.25\)/g, 'rgba(249, 115, 22, 0.25)');
content = content.replace(/rgba\(245,166,35,0\.3\)/g, 'rgba(249, 115, 22, 0.3)');
content = content.replace(/rgba\(245,166,35,0\.14\)/g, 'rgba(249, 115, 22, 0.14)');
content = content.replace(/rgba\(245,166,35,0\.08\)/g, 'rgba(249, 115, 22, 0.08)');
content = content.replace(/rgba\(255,255,255,0\.05\)/g, 'var(--border-subtle)');
content = content.replace(/#000/g, 'var(--primary-foreground)');
content = content.replace(/#e8960a/g, 'var(--orange-dark)');
content = content.replace(/#1a202c/g, 'var(--background)');

fs.writeFileSync(path, content, 'utf8');
console.log('Updated app/admin/page.tsx');
