const fs = require('fs');

const appJsx = fs.readFileSync('frontend/src/App.jsx', 'utf8');
const linesJsx = appJsx.split('\n');
console.log('--- App.jsx matches ---');
linesJsx.forEach((line, index) => {
  if (line.includes('printable') || line.includes('invoice') || line.includes('print')) {
    if (line.includes('id=') || line.includes('class') || line.includes('media') || line.includes('style')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});

const appCss = fs.readFileSync('frontend/src/App.css', 'utf8');
const linesCss = appCss.split('\n');
console.log('--- App.css matches ---');
linesCss.forEach((line, index) => {
  if (line.includes('print') || line.includes('invoice') || line.includes('media')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
