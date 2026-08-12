const fs = require('fs');
const file = 'frontend/src/App.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('=== activeTab === "dashboard" ===');
lines.forEach((line, index) => {
  if (line.includes("activeTab === 'dashboard'") || line.includes('activeTab === "dashboard"')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});

console.log('=== dashboardSubTab ===');
lines.forEach((line, index) => {
  if (line.includes('dashboardSubTab') && line.includes('===') || line.includes('setDashboardSubTab')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
