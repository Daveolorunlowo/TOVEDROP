const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIp();
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  const newUrl = `http://${ip}:3000`;
  
  if (envContent.match(/^NEXTAUTH_URL=.*$/m)) {
    envContent = envContent.replace(/^NEXTAUTH_URL=.*$/m, `NEXTAUTH_URL="${newUrl}"`);
  } else {
    envContent += `\nNEXTAUTH_URL="${newUrl}"\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Success! Updated .env NEXTAUTH_URL to: ${newUrl}`);
  console.log(`📱 On your phone, visit: ${newUrl}`);
  console.log(`⚠️  Make sure to restart your Next.js server!`);
} else {
  console.error('❌ Could not find .env file in the current directory.');
}
