const fs = require('fs');
const file = 'frontend/src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Only log out on 401 (Unauthorized), not 403 (Forbidden)
code = code.replace(
  `      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          handleLogout()
        }
        return res.json()
      })`,
  `      .then((res) => {
        if (res.status === 401) {
          handleLogout()
        }
        return res.json()
      })`
);

// 2. Add action and method to the form tag
code = code.replace(
  `<form onSubmit={handleLogin} className="space-y-4">`,
  `<form onSubmit={handleLogin} className="space-y-4" action="#" method="POST">`
);

// 3. Update Employee ID input label and attributes
code = code.replace(
  `                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. AD-001"`,
  `                <label htmlFor="username" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. AD-001"`
);

// 4. Update Password input label and attributes
code = code.replace(
  `                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"`,
  `                <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"`
);

fs.writeFileSync(file, code);
console.log('App.jsx updated with final login and routing fixes.');
