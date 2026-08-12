const fs = require('fs');

const appJsx = fs.readFileSync('frontend/src/App.jsx', 'utf8');
const linesJsx = appJsx.split('\n');

console.log('=== CONFIRM MATCHES ===');
linesJsx.forEach((line, index) => {
  if (line.includes('confirm') || line.includes('Confirm')) {
    if (line.includes('window.confirm') || line.includes('confirm(')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});

console.log('=== LOGIN FORM SEARCH ===');
let foundLogin = false;
let bracketCount = 0;
let loginLines = [];
linesJsx.forEach((line, index) => {
  if (line.includes('const handleLogin')) {
    foundLogin = true;
  }
  if (foundLogin) {
    loginLines.push(`${index + 1}: ${line}`);
    if (line.includes('{')) bracketCount += (line.match(/{/g) || []).length;
    if (line.includes('}')) bracketCount -= (line.match(/}/g) || []).length;
    if (bracketCount === 0 && loginLines.length > 5) {
      foundLogin = false;
    }
  }
});
console.log(loginLines.slice(0, 40).join('\n'));

console.log('=== LOGIN UI RENDER SEARCH ===');
let foundRender = false;
let renderLines = [];
linesJsx.forEach((line, index) => {
  if (line.includes('activeTab === \'login\'') || line.includes('activeTab === "login"')) {
    foundRender = true;
  }
  if (foundRender) {
    renderLines.push(`${index + 1}: ${line}`);
    if (renderLines.length > 80) {
      foundRender = false;
    }
  }
});
console.log(renderLines.join('\n'));
