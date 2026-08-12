const fs = require('fs');

const routeFiles = [
  'backend/src/routes/customers.ts',
  'backend/src/routes/products.ts',
  'backend/src/routes/challans.ts',
  'backend/src/routes/employees.ts'
];

routeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const code = fs.readFileSync(file, 'utf8');
    const lines = code.split('\n');
    console.log(`=== ${file} ===`);
    lines.forEach((line, index) => {
      if (line.includes('authorizeRoles') || line.includes('router.get(')) {
        console.log(`${index + 1}: ${line.trim()}`);
      }
    });
  }
});
