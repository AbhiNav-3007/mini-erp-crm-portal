const fs = require('fs');
const file = 'frontend/src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Replace handleApproveEmployee
const oldApprove = `  // Approve employee registration request (Admin-only)
  const handleApproveEmployee = (id) => {
    if (!window.confirm(\`Are you sure you want to APPROVE the registration request for employee: \${id}?\`)) return

    fetch(\`http://localhost:5001/api/employees/\${id}/approve\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    })
      .then((res) => res.json())
      .then((data) => {
         if (data.status === 'success') {
           fetchEmployeeRoster()
         } else {
           setUiAlert({ message: data.message, type: 'error' })
         }
       })
      .catch(() => setUiAlert({ message: 'Failed to approve employee registration', type: 'error' }))
  }`;

const newApprove = `  // Approve employee registration request (Admin-only)
  const handleApproveEmployee = (id) => {
    showConfirm(\`Are you sure you want to APPROVE the registration request for employee: \${id}?\`, () => {
      fetch(\`http://localhost:5001/api/employees/\${id}/approve\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      })
        .then((res) => res.json())
        .then((data) => {
           if (data.status === 'success') {
             fetchEmployeeRoster()
             setUiAlert({ message: data.message || 'Employee registration approved successfully', type: 'success' })
           } else {
             setUiAlert({ message: data.message, type: 'error' })
           }
         })
        .catch(() => setUiAlert({ message: 'Failed to approve employee registration', type: 'error' }))
    })
  }`;

code = code.replace(oldApprove, newApprove);

// 2. Replace handleDeleteEmployee
const oldDelete = `  // Delete employee record (Admin-only)
  const handleDeleteEmployee = (id) => {
    if (!window.confirm(\`Are you sure you want to permanently DELETE employee: \${id}? This action cannot be undone.\`)) return

    fetch(\`http://localhost:5001/api/employees/\${id}\`, {
      method: 'DELETE',
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    })
      .then((res) => res.json())
      .then((data) => {
         if (data.status === 'success') {
           fetchEmployeeRoster()
         } else {
           setUiAlert({ message: data.message, type: 'error' })
         }
       })
      .catch(() => setUiAlert({ message: 'Failed to delete employee record', type: 'error' }))
  }`;

const newDelete = `  // Delete employee record (Admin-only)
  const handleDeleteEmployee = (id) => {
    showConfirm(\`Are you sure you want to permanently DELETE employee: \${id}? This action cannot be undone.\`, () => {
      fetch(\`http://localhost:5001/api/employees/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      })
        .then((res) => res.json())
        .then((data) => {
           if (data.status === 'success') {
             fetchEmployeeRoster()
             setUiAlert({ message: data.message || 'Employee record deleted successfully', type: 'success' })
           } else {
             setUiAlert({ message: data.message, type: 'error' })
           }
         })
        .catch(() => setUiAlert({ message: 'Failed to delete employee record', type: 'error' }))
    })
  }`;

code = code.replace(oldDelete, newDelete);

// 3. Update login inputs
code = code.replace(
  `                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. AD-001"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />`,
  `                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. AD-001"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />`
);

code = code.replace(
  `                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />`,
  `                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />`
);

fs.writeFileSync(file, code);
console.log('App.jsx updated.');
