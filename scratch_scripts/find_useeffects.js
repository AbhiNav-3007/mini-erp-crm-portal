const fs = require('fs');
const file = 'frontend/src/App.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('=== useEffect positions ===');
let openBrackets = 0;
let inEffect = false;
let effectLines = [];

lines.forEach((line, index) => {
  if (line.includes('useEffect(')) {
    inEffect = true;
    effectLines = [];
  }
  if (inEffect) {
    effectLines.push(`${index + 1}: ${line}`);
    if (line.includes('{')) openBrackets += (line.match(/{/g) || []).length;
    if (line.includes('}')) openBrackets -= (line.match(/}/g) || []).length;
    if (line.includes('], [')) {
      // array dependency end
    }
    if (line.includes('}, [') || (line.includes('})') && openBrackets === 0)) {
      console.log(`--- Effect ending at line ${index + 1} ---`);
      console.log(effectLines.slice(0, 5).join('\n'));
      console.log('...');
      console.log(effectLines.slice(-3).join('\n'));
      inEffect = false;
      openBrackets = 0;
    }
  }
});
