const fs = require('fs');
const file = 'frontend/src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix initialization tab logic
const oldInit = `    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setActiveTab('dashboard')
    }

    const hash = window.location.hash.replace('#', '')
    if (hash === 'landing' || hash === 'login' || hash === 'activate') {
      setActiveTab(hash)
    }`;

const newInit = `    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    let initialTab = 'landing'

    const hash = window.location.hash.replace('#', '')
    if (hash === 'landing' || hash === 'login' || hash === 'activate') {
      initialTab = hash
    }

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setActiveTab('dashboard')
    } else {
      setActiveTab(initialTab)
    }`;

code = code.replace(oldInit, newInit);

// 2. Fix handleLogin clearing inputs immediately
const oldLoginSuccess = `        if (data.status === 'success') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          setToken(data.token)
          setUser(data.user)
          setLoginId('')
          setLoginPassword('')
          navigateTo('dashboard')`;

const newLoginSuccess = `        if (data.status === 'success') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          setToken(data.token)
          setUser(data.user)
          // Keep inputs populated momentarily so browser password managers capture the submission successfully
          setTimeout(() => {
            setLoginId('')
            setLoginPassword('')
          }, 1000)
          navigateTo('dashboard')`;

code = code.replace(oldLoginSuccess, newLoginSuccess);

// 3. Ensure handleLogout also clears inputs
const oldLogout = `  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    navigateTo('landing')
  }`;

const newLogout = `  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setLoginId('')
    setLoginPassword('')
    navigateTo('landing')
  }`;

code = code.replace(oldLogout, newLogout);

fs.writeFileSync(file, code);
console.log('App.jsx updated with login landing fixes.');
