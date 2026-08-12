const fs = require('fs');
const file = 'frontend/src/App.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('=== Logouts and auth clears ===');
lines.forEach((line, index) => {
  if (line.includes('handleLogout') || line.includes('removeItem') || line.includes('setToken(null)')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
