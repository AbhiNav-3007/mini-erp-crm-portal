import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || '${API_BASE}'

function App() {
  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm })
  }

  // Navigation & Auth States
  const [activeTab, setActiveTab] = useState('landing') // 'landing', 'login', 'activate', 'dashboard'
  const [dashboardSubTab, setDashboardSubTab] = useState('summary') // 'summary', 'customers', 'products', 'challans', 'employees', 'audits'
  const [selectedRole, setSelectedRole] = useState('Admin')
  const [serverStatus, setServerStatus] = useState('connecting')
  const [darkMode, setDarkMode] = useState(false)
  const [uiAlert, setUiAlert] = useState(null) // { message: string, type: string }
  const [confirmModal, setConfirmModal] = useState(null) // { message: string, onConfirm: () => void }

  // Logged-in User Context
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  // Auth Forms States
  const [loginId, setLoginId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [actRole, setActRole] = useState('Sales')
  const [actId, setActId] = useState('')
  const [actName, setActName] = useState('')
  const [actDate, setActDate] = useState('')
  const [actPassword, setActPassword] = useState('')
  const [showActPassword, setShowActPassword] = useState(false)
  const [actSuccess, setActSuccess] = useState('')
  const [actError, setActError] = useState('')

  // Customer Management States
  const [customers, setCustomers] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerPage, setCustomerPage] = useState(1)
  const [totalCustomerPages, setTotalCustomerPages] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  // Follow-Up Notes States
  const [customerNotes, setCustomerNotes] = useState([])
  const [newNoteText, setNewNoteText] = useState('')
  const [noteError, setNoteError] = useState('')

  // Create / Edit Customer Forms States
  const [showCustomerForm, setShowCustomerForm] = useState(false) // false, 'create', 'edit'
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custBusiness, setCustBusiness] = useState('')
  const [custGst, setCustGst] = useState('')
  const [custType, setCustType] = useState('Retail')
  const [custAddress, setCustAddress] = useState('')
  const [custStatus, setCustStatus] = useState('Lead')
  const [custFormError, setCustFormError] = useState('')

  // Product Catalog States
  const [products, setProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [totalProductPages, setTotalProductPages] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [productMovements, setProductMovements] = useState([])

  // Create / Edit Product Form States
  const [showProductForm, setShowProductForm] = useState(false) // false, 'create', 'edit'
  const [prodName, setProdName] = useState('')
  const [prodSku, setProdSku] = useState('')
  const [prodCategory, setProdCategory] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodMinAlert, setProdMinAlert] = useState(5)
  const [prodLocation, setProdLocation] = useState('')
  const [prodInitialStock, setProdInitialStock] = useState(0)
  const [prodFormError, setProdFormError] = useState('')

  // Stock IN Form States
  const [showStockInForm, setShowStockInForm] = useState(false)
  const [stockInQty, setStockInQty] = useState('')
  const [stockInReason, setStockInReason] = useState('')
  const [stockInError, setStockInError] = useState('')

  // Employee Roster Management States (Admin-Only)
  const [employees, setEmployees] = useState([])
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [empId, setEmpId] = useState('')
  const [empName, setEmpName] = useState('')
  const [empRole, setEmpRole] = useState('Sales')
  const [empDate, setEmpDate] = useState('')
  const [empFormError, setEmpFormError] = useState('')

  // Sales Challan Management States (Phase 17 & 18)
  const [challans, setChallans] = useState([])
  const [challanPage, setChallanPage] = useState(1)
  const [totalChallanPages, setTotalChallanPages] = useState(1)
  const [selectedChallan, setSelectedChallan] = useState(null)
  const [challanStatusFilter, setChallanStatusFilter] = useState('')
  const [showChallanForm, setShowChallanForm] = useState(false)
  
  // Challan Creation Form Nested State
  const [challanCustId, setChallanCustId] = useState('')
  const [challanItems, setChallanItems] = useState([{ product_id: '', quantity: 1, unit_price: 0, available_stock: 0 }])
  const [challanFormError, setChallanFormError] = useState('')

  // Challan Edit States (Phase 19 Accounts Auditing)
  const [isEditingChallan, setIsEditingChallan] = useState(false)
  const [editChallanItems, setEditChallanItems] = useState([])
  const [editChallanError, setEditChallanError] = useState('')
  const [auditLogs, setAuditLogs] = useState([])

  // Auto-dismiss custom UI alert toast
  useEffect(() => {
    if (uiAlert) {
      const timer = setTimeout(() => setUiAlert(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [uiAlert])

  // Sync state with back button and fetch health status
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
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
    }

    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab)
      } else {
        setActiveTab('landing')
      }
    };

    window.addEventListener('popstate', handlePopState)
    // Check server status immediately and poll every 5 seconds
    const checkHealth = () => {
      fetch('${API_BASE}/api/health')
        .then((res) => {
          if (res.ok) setServerStatus('online')
          else setServerStatus('offline')
        })
        .catch(() => setServerStatus('offline'))
    }

    checkHealth()
    const healthInterval = setInterval(checkHealth, 5000)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      clearInterval(healthInterval)
    }
  }, [])

  // Fetch Customers
  useEffect(() => {
    if (!token) return

    // If on dashboard, load all customers for dropdown selectors as well (limit=100)
    const limitVal = dashboardSubTab === 'challans' ? '100' : '8'
    const queryParams = new URLSearchParams({
      search: customerSearch,
      page: customerPage.toString(),
      limit: limitVal
    })

    fetch(`${API_BASE}/api/customers?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout()
        }
        return res.json()
      })
      .then((resData) => {
        if (resData.status === 'success') {
          setCustomers(resData.data)
          setTotalCustomerPages(resData.pagination.totalPages)
        }
      })
      .catch((err) => console.error('Error fetching customers:', err))
  }, [token, customerSearch, customerPage, dashboardSubTab])

  // Fetch Products & Low-stock Alerts
  useEffect(() => {
    if (!token) return

    const limitVal = dashboardSubTab === 'challans' ? '100' : '8'
    const queryParams = new URLSearchParams({
      search: productSearch,
      page: productPage.toString(),
      limit: limitVal
    })

    fetch(`${API_BASE}/api/products?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success') {
          setProducts(resData.data)
          setTotalProductPages(resData.pagination.totalPages)
        }
      })
      .catch((err) => console.error('Error fetching products:', err))

    fetch('${API_BASE}/api/products/low-stock', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success') {
          setLowStockProducts(resData.data)
        }
      })
      .catch((err) => console.error('Error fetching low stock:', err))

  }, [token, productSearch, productPage, dashboardSubTab])

  // Fetch Notes for Selected Customer
  useEffect(() => {
    if (!token || !selectedCustomer) {
      setCustomerNotes([])
      return
    }

    fetch(`${API_BASE}/api/customers/${selectedCustomer.id}/notes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success') {
          setCustomerNotes(resData.data)
        }
      })
      .catch((err) => console.error('Error fetching customer notes:', err))
  }, [token, selectedCustomer])

  // Fetch Movements for Selected Product
  useEffect(() => {
    if (!token || !selectedProduct) {
      setProductMovements([])
      return
    }

    fetch(`${API_BASE}/api/products/${selectedProduct.id}/movements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success') {
          setProductMovements(resData.data)
        }
      })
      .catch((err) => console.error('Error fetching movements:', err))
  }, [token, selectedProduct])

  // Fetch Employee Roster (Admin-Only)
  const fetchEmployeeRoster = () => {
    if (!token || user?.role !== 'Admin') return

    fetch('${API_BASE}/api/employees', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success') {
          setEmployees(resData.data)
        }
      })
      .catch((err) => console.error('Error fetching employee roster:', err))
  }

  // Trigger employee roster query
  useEffect(() => {
    if (dashboardSubTab === 'employees' || (dashboardSubTab === 'summary' && user?.role === 'Admin')) {
      fetchEmployeeRoster()
    }
  }, [token, dashboardSubTab, user])

  // Fetch System Audit Logs (Admin-Only)
  const fetchAuditLogs = () => {
    if (!token || user?.role !== 'Admin') return

    fetch('${API_BASE}/api/employees/audit-logs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success') {
          setAuditLogs(resData.data)
        }
      })
      .catch((err) => console.error('Error fetching audit logs:', err))
  }

  // Trigger audit logs query
  useEffect(() => {
    if (dashboardSubTab === 'audits') {
      fetchAuditLogs()
    }
  }, [token, dashboardSubTab])

  // Fetch Challans (Phase 17 & 18)
  useEffect(() => {
    if (!token) return

    const queryParams = new URLSearchParams({
      page: challanPage.toString(),
      limit: '8',
      status: challanStatusFilter
    })

    fetch(`${API_BASE}/api/challans?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success') {
          setChallans(resData.data)
          setTotalChallanPages(resData.pagination.totalPages)
        }
      })
      .catch((err) => console.error('Error fetching challans:', err))
  }, [token, challanPage, challanStatusFilter])

  // Fetch Nested Items for Selected Challan
  useEffect(() => {
    if (!token || !selectedChallan) return

    fetch(`${API_BASE}/api/challans/${selectedChallan.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success') {
          setSelectedChallan(resData.data)
        }
      })
      .catch((err) => console.error('Error fetching challan details:', err))
  }, [token, selectedChallan?.id])

  // Custom navigation
  const navigateTo = (tab) => {
    setActiveTab(tab)
    setLoginError('')
    setActError('')
    setActSuccess('')
    window.history.pushState({ tab: tab }, '', `#${tab}`)
  };

  // Sign In Action
  const handleLogin = (e) => {
    e.preventDefault()
    setLoginError('')

    fetch('${API_BASE}/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: loginId, password: loginPassword, role: selectedRole })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          setToken(data.token)
          setUser(data.user)
          // Keep inputs populated momentarily so browser password managers capture the submission successfully
          setTimeout(() => {
            setLoginId('')
            setLoginPassword('')
          }, 1000)
          navigateTo('dashboard')
        } else {
          setLoginError(data.message)
        }
      })
      .catch(() => setLoginError('Failed to connect to authentication service'))
  }

  // Account Activation Action
  const handleActivate = (e) => {
    e.preventDefault()
    setActError('')
    setActSuccess('')

    fetch('${API_BASE}/api/auth/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: actId,
        name: actName,
        role: actRole,
        joining_date: actDate,
        password: actPassword
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setActSuccess(data.message)
          setActId('')
          setActName('')
          setActDate('')
          setActPassword('')
        } else {
          setActError(data.message)
        }
      })
      .catch(() => setActError('Failed to connect to activation service'))
  }

  // Pre-register Employee Action (Admin-Only)
  const handleCreateEmployee = (e) => {
    e.preventDefault()
    setEmpFormError('')

    fetch('${API_BASE}/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: empId,
        name: empName,
        role: empRole,
        joining_date: empDate
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setEmpId('')
          setEmpName('')
          setEmpDate('')
          setShowEmployeeForm(false)
          fetchEmployeeRoster()
        } else {
          setEmpFormError(data.message)
        }
      })
      .catch(() => setEmpFormError('Failed to register employee record'))
  }

  // Approve employee registration request (Admin-only)
  const handleApproveEmployee = (id) => {
    showConfirm(`Are you sure you want to APPROVE the registration request for employee: ${id}?`, () => {
      fetch(`${API_BASE}/api/employees/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
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
  }

  // Delete employee record (Admin-only)
  const handleDeleteEmployee = (id) => {
    if (!window.confirm(`Are you sure you want to permanently DELETE employee: ${id}? This action cannot be undone.`)) return

    fetch(`${API_BASE}/api/employees/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
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
      .catch(() => setUiAlert({ message: 'Failed to delete employee profile', type: 'error' }))
  }

  // Save Customer
  const handleSaveCustomer = (e) => {
    e.preventDefault()
    setCustFormError('')

    const payload = {
      name: custName,
      mobile_number: custPhone,
      email: custEmail,
      business_name: custBusiness,
      gst_number: custGst,
      customer_type: custType,
      address: custAddress,
      status: custStatus
    }

    const url = showCustomerForm === 'edit'
      ? `${API_BASE}/api/customers/${selectedCustomer.id}`
      : '${API_BASE}/api/customers'

    const method = showCustomerForm === 'edit' ? 'PUT' : 'POST'

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setCustomerPage(1)
          setCustomerSearch('')
          setShowCustomerForm(false)
          setSelectedCustomer(null)
          resetCustomerFormFields()
          setCustomerSearch(' ')
          setTimeout(() => setCustomerSearch(''), 100)
        } else {
          setCustFormError(data.message)
        }
      })
      .catch(() => setCustFormError('Failed to save customer record'))
  }

  // Save Customer Follow-up Note
  const handleAddNote = (e) => {
    e.preventDefault()
    setNoteError('')

    if (!newNoteText.trim()) return

    fetch(`${API_BASE}/api/customers/${selectedCustomer.id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ note: newNoteText })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setNewNoteText('')
          setSelectedCustomer({ ...selectedCustomer })
        } else {
          setNoteError(data.message)
        }
      })
      .catch(() => setNoteError('Failed to save follow-up note'))
  }

  // Save Product
  const handleSaveProduct = (e) => {
    e.preventDefault()
    setProdFormError('')

    const payload = {
      name: prodName,
      sku: prodSku,
      category: prodCategory,
      unit_price: parseFloat(prodPrice),
      minimum_stock_alert: parseInt(prodMinAlert),
      location: prodLocation,
      current_stock: parseInt(prodInitialStock)
    }

    const url = showProductForm === 'edit'
      ? `${API_BASE}/api/products/${selectedProduct.id}`
      : '${API_BASE}/api/products'

    const method = showProductForm === 'edit' ? 'PUT' : 'POST'

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setProductPage(1)
          setProductSearch('')
          setShowProductForm(false)
          setSelectedProduct(null)
          resetProductFormFields()
          setProductSearch(' ')
          setTimeout(() => setProductSearch(''), 100)
        } else {
          setProdFormError(data.message)
        }
      })
      .catch(() => setProdFormError('Failed to save product record'))
  }

  // Record Stock IN
  const handleStockInSubmit = (e) => {
    e.preventDefault()
    setStockInError('')

    fetch(`${API_BASE}/api/products/${selectedProduct.id}/stock-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity: stockInQty, reason: stockInReason })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setStockInQty('')
          setStockInReason('')
          setShowStockInForm(false)
          const updatedProduct = { ...selectedProduct, current_stock: selectedProduct.current_stock + parseInt(stockInQty) }
          setSelectedProduct(updatedProduct)
          setProductSearch(' ')
          setTimeout(() => setProductSearch(''), 100)
        } else {
          setStockInError(data.message)
        }
      })
      .catch(() => setStockInError('Failed to record stock entry'))
  }

  // Phase 17: Save Challan Draft
  const handleCreateChallanSubmit = (e) => {
    e.preventDefault()
    setChallanFormError('')

    if (!challanCustId) {
      setChallanFormError('Please select a customer')
      return
    }

    const hasEmptyProduct = challanItems.some(item => !item.product_id || !item.quantity)
    if (hasEmptyProduct) {
      setChallanFormError('All items must have a product selected and a quantity')
      return
    }

    const hasInsufficientStock = challanItems.some(item => {
      const prod = products.find(p => p.id === parseInt(item.product_id))
      return prod && parseInt(item.quantity) > prod.current_stock
    })
    if (hasInsufficientStock) {
      setChallanFormError('One or more products has quantity unavailable in stock')
      return
    }

    fetch('${API_BASE}/api/challans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customer_id: challanCustId, items: challanItems })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setShowChallanForm(false)
          setSelectedChallan(null)
          setChallanPage(1)
          setChallanCustId('')
          setChallanItems([{ product_id: '', quantity: 1, unit_price: 0, available_stock: 0 }])
          // Re-fetch trigger
          setChallanStatusFilter(' ')
          setTimeout(() => setChallanStatusFilter(''), 100)
        } else {
          setChallanFormError(data.message)
        }
      })
      .catch(() => setChallanFormError('Failed to create sales challan draft'))
  }

  // Phase 18: Confirm Challan
  const handleConfirmChallan = (challanId) => {
    showConfirm('Are you sure you want to CONFIRM this challan? This will permanently deduct product inventory levels.', () => {
      fetch(`${API_BASE}/api/challans/${challanId}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            setSelectedChallan(null)
            setUiAlert({ message: data.message || 'Challan confirmed successfully', type: 'success' })
            // Trigger reload
            setChallanStatusFilter(' ')
            setTimeout(() => setChallanStatusFilter(''), 100)
          } else {
            setUiAlert({ message: data.message, type: 'error' })
          }
        })
        .catch(() => setUiAlert({ message: 'Failed to confirm challan', type: 'error' }))
    })
  }

  // Phase 18: Cancel Challan (Reverses stock level checks)
  const handleCancelChallan = (challanId) => {
    showConfirm('Are you sure you want to CANCEL this challan? Stock balances will be returned if it was already confirmed.', () => {
      fetch(`${API_BASE}/api/challans/${challanId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            setSelectedChallan(null)
            setUiAlert({ message: data.message || 'Challan cancelled successfully', type: 'success' })
            // Trigger reload
            setChallanStatusFilter(' ')
            setTimeout(() => setChallanStatusFilter(''), 100)
          } else {
            setUiAlert({ message: data.message, type: 'error' })
          }
        })
        .catch(() => setUiAlert({ message: 'Failed to cancel challan', type: 'error' }))
    })
  }

  // Phase 19: Save Accounts Edit to Challan Items
  const handleSaveChallanEdits = (challanId) => {
    setEditChallanError('')

    fetch(`${API_BASE}/api/challans/${challanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items: editChallanItems })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setIsEditingChallan(false)
          setSelectedChallan({ id: challanId }) // Re-trigger details fetch
          // Reload lists
          setChallanStatusFilter(' ')
          setTimeout(() => setChallanStatusFilter(''), 100)
        } else {
          setEditChallanError(data.message)
        }
      })
      .catch(() => setEditChallanError('Failed to save challan adjustments'))
  }

  const handleEditChallanItemChange = (index, field, value) => {
    const updated = [...editChallanItems]
    if (field === 'quantity') {
      updated[index].quantity = parseInt(value) || 0
    } else if (field === 'unit_price') {
      updated[index].unit_price = parseFloat(value) || 0
    }
    setEditChallanItems(updated)
  }

  // Challan Form Line Items Actions
  const handleAddChallanItemRow = () => {
    setChallanItems([...challanItems, { product_id: '', quantity: 1, unit_price: 0, available_stock: 0 }])
  }

  const handleRemoveChallanItemRow = (index) => {
    const updated = challanItems.filter((_, i) => i !== index)
    setChallanItems(updated)
  }

  const handleChallanItemChange = (index, field, value) => {
    const updated = [...challanItems]
    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value))
      updated[index].product_id = value
      updated[index].unit_price = prod ? prod.unit_price : 0
      updated[index].available_stock = prod ? prod.current_stock : 0
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value) || 0
    }
    setChallanItems(updated)
  }

  const resetCustomerFormFields = () => {
    setCustName('')
    setCustPhone('')
    setCustEmail('')
    setCustBusiness('')
    setCustGst('')
    setCustType('Retail')
    setCustAddress('')
    setCustStatus('Lead')
    setCustFormError('')
  }

  const openEditCustomer = (customer) => {
    setSelectedCustomer(customer)
    setCustName(customer.name)
    setCustPhone(customer.mobile_number)
    setCustEmail(customer.email)
    setCustBusiness(customer.business_name)
    setCustGst(customer.gst_number || '')
    setCustType(customer.customer_type)
    setCustAddress(customer.address)
    setCustStatus(customer.status)
    setShowCustomerForm('edit')
  }

  const resetProductFormFields = () => {
    setProdName('')
    setProdSku('')
    setProdCategory('')
    setProdPrice('')
    setProdMinAlert(5)
    setProdLocation('')
    setProdInitialStock(0)
    setProdFormError('')
  }

  const openEditProduct = (product) => {
    setSelectedProduct(product)
    setProdName(product.name)
    setProdSku(product.sku)
    setProdCategory(product.category)
    setProdPrice(product.unit_price)
    setProdMinAlert(product.minimum_stock_alert)
    setProdLocation(product.location || '')
    setProdInitialStock(product.current_stock)
    setShowProductForm('edit')
  }

  // Logout Action
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setSelectedCustomer(null)
    setSelectedProduct(null)
    setSelectedChallan(null)
    setEmployees([])
    navigateTo('landing')
  }

  const roles = [
    {
      name: 'Admin',
      cardStyle: 'bg-purple-50 border-purple-200 hover:border-purple-300',
      badgeStyle: 'bg-purple-100 text-purple-800',
      bulletStyle: 'bg-purple-600',
      description: 'Manages employee accounts, pre-creates staff records, and checks audit logs.',
      features: ['Employee Management', 'Audit History', 'Access Controls']
    },
    {
      name: 'Sales',
      cardStyle: 'bg-blue-50 border-blue-200 hover:border-blue-300',
      badgeStyle: 'bg-blue-100 text-blue-800',
      bulletStyle: 'bg-blue-600',
      description: 'Manages customer records, adds follow-up comments, and creates product challans.',
      features: ['Customer Records', 'Follow-up Comments', 'Sales Challans']
    },
    {
      name: 'Warehouse',
      cardStyle: 'bg-amber-50 border-amber-200 hover:border-amber-300',
      badgeStyle: 'bg-amber-100 text-amber-800',
      bulletStyle: 'bg-amber-600',
      description: 'Manages product entries, checks current stock levels, and records stock updates.',
      features: ['Product Catalog', 'Stock In Registry', 'Stock Movement History']
    },
    {
      name: 'Accounts',
      cardStyle: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
      badgeStyle: 'bg-emerald-100 text-emerald-800',
      bulletStyle: 'bg-emerald-600',
      description: 'Checks completed challans, reviews customer balances, and logs adjustments.',
      features: ['Challan Ledgers', 'Financial Overview', 'Adjustment Logs']
    }
  ]

  return (
    <div className={`min-h-screen ${darkMode ? 'dark-theme-app bg-black' : 'bg-slate-100'} text-slate-700 flex flex-col justify-between font-sans transition-all duration-300`}>
      {/* Custom Confirmation Modal Dialog */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 transform transition-all scale-100 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <span className="text-xl font-bold">âš ï¸</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirm Action
              </h3>
            </div>
            <p className="text-sm text-slate-650 dark:text-slate-350 mt-4 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic UI Alert Toast Notification */}
      {uiAlert && (
        <div className={`fixed top-5 right-5 z-[9999] max-w-sm w-full bg-white dark:bg-slate-900 border-l-4 ${uiAlert.type === 'success' ? 'border-green-500' : 'border-red-500'} shadow-xl rounded-r-lg p-4 flex items-start gap-3 animate-pulse-slow`}>
          <div className="flex-1 text-left">
            <span className={`block text-xs font-bold ${uiAlert.type === 'success' ? 'text-green-500' : 'text-slate-400'} uppercase tracking-wider`}>
              {uiAlert.type === 'success' ? 'Success' : 'System Alert'}
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{uiAlert.message}</p>
          </div>
          <button 
            onClick={() => setUiAlert(null)}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 font-black text-xs cursor-pointer px-1"
          >
            âœ•
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="cursor-pointer" onClick={() => token ? navigateTo('dashboard') : navigateTo('landing')}>
              <span className="font-bold text-xl text-slate-800">
                ERP Portal
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${
                serverStatus === 'online' ? 'bg-green-600' : 'bg-red-600'
              }`} />
              <span className="text-slate-600">
                {serverStatus === 'online' ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 mr-1.5 rounded transition text-xs font-bold flex items-center gap-1 border border-slate-250/70 bg-white cursor-pointer ${
                darkMode ? 'hover:bg-[#2e3b62]' : 'hover:bg-slate-50'
              }`}
              title="Toggle theme mode"
            >
              {darkMode ? 'â˜€ï¸ Light' : 'ðŸŒ™ Dark'}
            </button>
            {!token ? (
              <>
                <button
                  onClick={() => navigateTo('landing')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    activeTab === 'landing' ? 'text-slate-800 bg-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => navigateTo('login')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    activeTab === 'login' ? 'text-slate-800 bg-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigateTo('activate')}
                  className="px-3 py-1.5 rounded text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  Activate Account
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                  {user?.role}: {user?.name || user?.id}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                >
                  Log Out
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        
        {/* Landing Page */}
        {activeTab === 'landing' && (
          <div className="space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Mini ERP + CRM Operations Portal
              </h1>
              <p className="text-slate-600 text-base leading-relaxed">
                A simple business operations dashboard designed to manage customer details, check stock levels, and issue sales challans.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => navigateTo('login')}
                  className="px-5 py-2.5 rounded font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                >
                  Enter Operations Console
                </button>
                <button
                  onClick={() => navigateTo('activate')}
                  className="px-5 py-2.5 rounded font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                >
                  Activation Guide
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-center text-slate-800">Operational Profiles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {roles.map((role) => (
                  <div
                    key={role.name}
                    className={`p-5 rounded border ${role.cardStyle} flex flex-col justify-between shadow-sm hover:shadow transition`}
                  >
                    <div className="space-y-3">
                      <div className={`w-10 h-10 rounded flex items-center justify-center font-bold ${role.badgeStyle}`}>
                        {role.name[0]}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {role.name}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1.5">
                      {role.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${role.bulletStyle}`} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Login Page */}
        {activeTab === 'login' && (
          <div className="max-w-md mx-auto bg-white border border-slate-200 p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 space-y-6 text-left">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Sign In</h2>
              <p className="text-sm text-slate-500">Select your active role to log in</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['Admin', 'Sales', 'Warehouse', 'Accounts'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    selectedRole === role
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {loginError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg text-center font-medium">{loginError}</p>}

            <form onSubmit={handleLogin} className="space-y-4" action="#" method="POST">
              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                  placeholder="e.g. AD-001"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="toggle-login-pass"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="w-4 h-4 border border-slate-300 rounded"
                />
                <label htmlFor="toggle-login-pass" className="text-sm text-slate-500 font-medium cursor-pointer select-none">
                  See Password
                </label>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm text-base cursor-pointer">
                Sign In
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 pt-2">
              Not activated?  
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline ml-1" onClick={() => navigateTo('activate')}>
                Activate account here
              </span>
            </p>
          </div>
        )}

        {/* Activation Page */}
        {activeTab === 'activate' && (
          <div className="max-w-md mx-auto bg-white border border-slate-200 p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 space-y-6 text-left">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Activate Account</h2>
              <p className="text-sm text-slate-500">Validate your pre-created registration details</p>
            </div>

            {actError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg text-center font-medium">{actError}</p>}
            {actSuccess && <p className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg text-center font-medium">{actSuccess}</p>}

            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Role Profile
                </label>
                <select 
                  value={actRole}
                  onChange={(e) => setActRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition text-slate-700"
                >
                  <option>Admin</option>
                  <option>Sales</option>
                  <option>Warehouse</option>
                  <option>Accounts</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  required
                  value={actId}
                  onChange={(e) => setActId(e.target.value)}
                  placeholder="ID assigned by administrator"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  placeholder="Official name"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  required
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition text-slate-650"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type={showActPassword ? 'text' : 'password'}
                  required
                  value={actPassword}
                  onChange={(e) => setActPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="toggle-act-pass"
                  checked={showActPassword}
                  onChange={() => setShowActPassword(!showActPassword)}
                  className="w-4 h-4 border border-slate-300 rounded"
                />
                <label htmlFor="toggle-act-pass" className="text-sm text-slate-500 font-medium cursor-pointer select-none">
                  See Password
                </label>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm text-base cursor-pointer">
                Activate Account
              </button>
            </form>
          </div>
        )}

        {/* Logged In Operations Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Sidebar menu */}
            <div className="bg-white border border-slate-200 rounded p-4 flex flex-col gap-2 h-fit">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Modules</h3>
              <button
                onClick={() => setDashboardSubTab('summary')}
                className={`w-full py-2 px-3 text-left rounded text-sm font-medium transition ${
                  dashboardSubTab === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Dashboard Summary
              </button>
              <button
                onClick={() => setDashboardSubTab('customers')}
                className={`w-full py-2 px-3 text-left rounded text-sm font-medium transition ${
                  dashboardSubTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Customers CRM
              </button>
              <button
                onClick={() => setDashboardSubTab('products')}
                className={`w-full py-2 px-3 text-left rounded text-sm font-medium transition ${
                  dashboardSubTab === 'products' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Product Inventory
              </button>
              <button
                onClick={() => setDashboardSubTab('challans')}
                className={`w-full py-2 px-3 text-left rounded text-sm font-medium transition ${
                  dashboardSubTab === 'challans' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Sales Challans
              </button>
              {user?.role === 'Admin' && (
                <>
                  <button
                    onClick={() => setDashboardSubTab('employees')}
                    className={`w-full py-2 px-3 text-left rounded text-sm font-medium transition ${
                      dashboardSubTab === 'employees' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Employee Roster
                  </button>
                  <button
                    onClick={() => {
                      setDashboardSubTab('audits')
                      fetchAuditLogs()
                    }}
                    className={`w-full py-2 px-3 text-left rounded text-sm font-medium transition ${
                      dashboardSubTab === 'audits' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    System Audits
                  </button>
                </>
              )}
            </div>

            {/* Dashboard Content Pane */}
            <div className="md:col-span-3 space-y-6">
              
              {/* Summary Dashboard Overview (Phase 20 Summary Widgets) */}
              {dashboardSubTab === 'summary' && (
                <div className="space-y-6">
                  
                  {/* Greeting header */}
                  <div className="bg-white border border-slate-200 rounded p-6 shadow-sm text-left">
                    <h2 className="text-xl font-bold text-slate-900">Welcome Back, {user?.name || user?.id}!</h2>
                    <p className="text-xs text-slate-400 mt-1">Role: <span className="font-semibold">{user?.role}</span> &bull; ERP portal central console overview</p>
                  </div>

                  {/* Admin summary widgets */}
                  {user?.role === 'Admin' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Employees</span>
                        <p className="text-2xl font-black text-slate-800 mt-1">{employees.length || 3}</p>
                        <span className="text-[9px] text-slate-450 block mt-1">Staff registered on roster</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Pending Approvals</span>
                        <p className="text-2xl font-black text-blue-600 mt-1">
                          {employees.filter(e => !e.is_activated).length}
                        </p>
                        <span className="text-[9px] text-slate-450 block mt-1">Requires Administrator review</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Low Stock Alerts</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{lowStockProducts.length}</p>
                        <span className="text-[9px] text-slate-450 block mt-1">Items below threshold</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Challans</span>
                        <p className="text-2xl font-black text-slate-800 mt-1">{challans.length}</p>
                        <span className="text-[9px] text-slate-450 block mt-1">Drafts and Confirmed bills</span>
                      </div>
                    </div>
                  )}

                  {/* Sales summary widgets */}
                  {user?.role === 'Sales' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">CRM Directory</span>
                        <p className="text-2xl font-black text-slate-800 mt-1">{customers.length}</p>
                        <span className="text-[9px] text-slate-450 block mt-1">Total customer clients</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">My Draft Challans</span>
                        <p className="text-2xl font-black text-blue-600 mt-1">
                          {challans.filter(ch => ch.status === 'Draft').length}
                        </p>
                        <span className="text-[9px] text-slate-450 block mt-1">Sales drafts pending confirmation</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Active Contacts</span>
                        <p className="text-2xl font-black text-green-600 mt-1">
                          {customers.filter(c => c.status === 'Active').length}
                        </p>
                        <span className="text-[9px] text-slate-450 block mt-1">Regular business buyers</span>
                      </div>
                    </div>
                  )}

                  {/* Warehouse summary widgets */}
                  {user?.role === 'Warehouse' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Catalog Catalog</span>
                        <p className="text-2xl font-black text-slate-800 mt-1">{products.length}</p>
                        <span className="text-[9px] text-slate-450 block mt-1">Tracked SKU items</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Low Stock Warning</span>
                        <p className={`text-2xl font-black mt-1 ${lowStockProducts.length > 0 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                          {lowStockProducts.length}
                        </p>
                        <span className="text-[9px] text-slate-450 block mt-1">Needs Stock IN recording</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total In Stock</span>
                        <p className="text-2xl font-black text-green-600 mt-1">
                          {products.reduce((sum, p) => sum + p.current_stock, 0)} units
                        </p>
                        <span className="text-[9px] text-slate-450 block mt-1">Sum of all warehouse items</span>
                      </div>
                    </div>
                  )}

                  {/* Accounts summary widgets */}
                  {user?.role === 'Accounts' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Confirmed Ledger</span>
                        <p className="text-2xl font-black text-green-600 mt-1">
                          {challans.filter(ch => ch.status === 'Confirmed').length}
                        </p>
                        <span className="text-[9px] text-slate-450 block mt-1">Billed challan files</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Buyers Registered</span>
                        <p className="text-2xl font-black text-slate-800 mt-1">{customers.length}</p>
                        <span className="text-[9px] text-slate-450 block mt-1">Active customer bases</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Catalog Registry</span>
                        <p className="text-2xl font-black text-slate-800 mt-1">{products.length}</p>
                        <span className="text-[9px] text-slate-450 block mt-1">Active items tracked</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Shortcuts */}
                  <div className="bg-white border border-slate-200 rounded p-6 shadow-sm text-left space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Quick Actions Console</h3>
                    <div className="flex flex-wrap gap-2">
                      {(user?.role === 'Admin' || user?.role === 'Sales') && (
                        <>
                          <button
                            onClick={() => { setDashboardSubTab('customers'); setShowCustomerForm('create'); }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-sm"
                          >
                            + New Customer Profile
                          </button>
                          <button
                            onClick={() => { setDashboardSubTab('challans'); setShowChallanForm(true); }}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition shadow-sm"
                          >
                            + Issue Challan Invoice
                          </button>
                        </>
                      )}
                      {(user?.role === 'Admin' || user?.role === 'Warehouse') && (
                        <button
                          onClick={() => { setDashboardSubTab('products'); setShowProductForm('create'); }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-sm"
                        >
                          + Add Product SKU
                        </button>
                      )}
                      {user?.role === 'Accounts' && (
                        <button
                          onClick={() => setDashboardSubTab('challans')}
                          className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition shadow-sm"
                        >
                          Audit Sales Ledgers
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Customers CRM Tab */}
              {dashboardSubTab === 'customers' && (
                <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6">
                  
                  {/* Title & Actions bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Customer CRM Directory</h2>
                      <p className="text-xs text-slate-400">View customer profiles and log follow-up updates</p>
                    </div>
                    
                    {/* Add Customer Button */}
                    {(user?.role === 'Admin' || user?.role === 'Sales') && !showCustomerForm && (
                      <button
                        onClick={() => {
                          resetCustomerFormFields()
                          setShowCustomerForm('create')
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition"
                      >
                        + Add Customer
                      </button>
                    )}
                  </div>

                  {/* Customer Form */}
                  {showCustomerForm && (
                    <form onSubmit={handleSaveCustomer} className="bg-slate-50 border border-slate-200 p-5 rounded space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 text-left">
                        {showCustomerForm === 'edit' ? 'Edit Customer Profile' : 'New Customer Profile'}
                      </h3>

                      {custFormError && <p className="text-xs text-red-650 bg-red-50 border border-red-200 p-2.5 rounded text-left">{custFormError}</p>}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Customer Name</label>
                          <input
                            type="text"
                            required
                            value={custName}
                            onChange={(e) => setCustName(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Business Name</label>
                          <input
                            type="text"
                            required
                            value={custBusiness}
                            onChange={(e) => setCustBusiness(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Mobile Number</label>
                          <input
                            type="text"
                            required
                            value={custPhone}
                            onChange={(e) => setCustPhone(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                          <input
                            type="email"
                            required
                            value={custEmail}
                            onChange={(e) => setCustEmail(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">GST Number (Optional)</label>
                          <input
                            type="text"
                            value={custGst}
                            onChange={(e) => setCustGst(e.target.value)}
                            placeholder="e.g. 27AAAAA1111A1Z1"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Customer Type</label>
                          <select
                            value={custType}
                            onChange={(e) => setCustType(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700"
                          >
                            <option>Retail</option>
                            <option>Wholesale</option>
                            <option>Distributor</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                          <select
                            value={custStatus}
                            onChange={(e) => setCustStatus(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700"
                          >
                            <option>Lead</option>
                            <option>Active</option>
                            <option>Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-left">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Address Details</label>
                        <textarea
                          required
                          value={custAddress}
                          onChange={(e) => setCustAddress(e.target.value)}
                          rows={2}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomerForm(false)
                            setSelectedCustomer(null)
                            resetCustomerFormFields()
                          }}
                          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                        >
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List View & Search */}
                  {!showCustomerForm && (
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Search customers by name or business..."
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value)
                            setCustomerPage(1)
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        
                        {/* List column */}
                        <div className="lg:col-span-2 border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden bg-white">
                          {customers.length === 0 ? (
                            <p className="p-8 text-center text-sm text-slate-400">No customers found.</p>
                          ) : (
                            customers.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => setSelectedCustomer(c)}
                                className={`p-3 text-left cursor-pointer transition flex justify-between items-center ${
                                  selectedCustomer?.id === c.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                                  <p className="text-[10px] text-slate-450">{c.business_name}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  c.status === 'Active' ? 'bg-green-100 text-green-800' :
                                  c.status === 'Inactive' ? 'bg-slate-200 text-slate-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {c.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Detail View column */}
                        <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded p-4 text-left space-y-4">
                          {selectedCustomer ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                <div>
                                  <h3 className="font-extrabold text-slate-900 text-sm">{selectedCustomer.name}</h3>
                                  <p className="text-xs text-slate-550">{selectedCustomer.business_name} &bull; <span className="font-bold">{selectedCustomer.customer_type}</span></p>
                                </div>
                                {(user?.role === 'Admin' || user?.role === 'Sales') && (
                                  <button
                                    onClick={() => openEditCustomer(selectedCustomer)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded"
                                  >
                                    Edit Details
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Mobile</span>
                                  <span className="text-slate-800">{selectedCustomer.mobile_number}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Email</span>
                                  <span className="text-slate-800">{selectedCustomer.email}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">GSTIN</span>
                                  <span className="text-slate-800">{selectedCustomer.gst_number || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Address</span>
                                  <span className="text-slate-800 block leading-tight">{selectedCustomer.address}</span>
                                </div>
                              </div>

                              {/* Follow-up Notes Interface */}
                              <div className="border-t border-slate-200 pt-3 space-y-3">
                                <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Follow-Up Log</h4>
                                
                                {(user?.role === 'Admin' || user?.role === 'Sales') && (
                                  <form onSubmit={handleAddNote} className="space-y-1.5">
                                    {noteError && <p className="text-[10px] text-red-650">{noteError}</p>}
                                    <textarea
                                      value={newNoteText}
                                      onChange={(e) => setNewNoteText(e.target.value)}
                                      placeholder="Add operational update or call notes..."
                                      rows={2}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-blue-600 transition"
                                    />
                                    <div className="flex justify-end">
                                      <button type="submit" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold">
                                        Log Comment
                                      </button>
                                    </div>
                                  </form>
                                )}

                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                  {customerNotes.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">No notes logged for this customer.</p>
                                  ) : (
                                    customerNotes.map((n) => (
                                      <div key={n.id} className="bg-white border border-slate-200 p-2.5 rounded text-[11px] space-y-1">
                                        <p className="text-slate-700 leading-tight">{n.note}</p>
                                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                                          <span>By: {n.employee_name}</span>
                                          <span>{new Date(n.created_at).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 text-xs text-center">
                              <p>Select a customer to view complete profile details and log active follow-up notes.</p>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Customer Pagination */}
                      {totalCustomerPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            disabled={customerPage === 1}
                            onClick={() => setCustomerPage(customerPage - 1)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold rounded disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <span className="text-xs text-slate-500 font-medium">Page {customerPage} of {totalCustomerPages}</span>
                          <button
                            disabled={customerPage === totalCustomerPages}
                            onClick={() => setCustomerPage(customerPage + 1)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold rounded disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* Product Catalog Tab */}
              {dashboardSubTab === 'products' && (
                <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6">
                  
                  {lowStockProducts.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-xs font-semibold flex items-center gap-2 text-left">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
                      <span>
                        Low Stock Alert: {lowStockProducts.length} product(s) require inventory replenishment!
                      </span>
                    </div>
                  )}

                  {/* Title & Actions bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Inventory Catalog</h2>
                      <p className="text-xs text-slate-400">View items, check stock levels, and record stock entry updates</p>
                    </div>

                    {(user?.role === 'Admin' || user?.role === 'Warehouse' || user?.role === 'Sales') && !showProductForm && (
                      <button
                        onClick={() => {
                          resetProductFormFields()
                          setShowProductForm('create')
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition"
                      >
                        + Add Product
                      </button>
                    )}
                  </div>

                  {/* Product Form */}
                  {showProductForm && (
                    <form onSubmit={handleSaveProduct} className="bg-slate-50 border border-slate-200 p-5 rounded space-y-4 text-left">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                        {showProductForm === 'edit' ? 'Edit Product Item' : 'New Product Registration'}
                      </h3>

                      {prodFormError && <p className="text-xs text-red-650 bg-red-50 border border-red-200 p-2.5 rounded">{prodFormError}</p>}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Product Name</label>
                          <input
                            type="text"
                            required
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            placeholder="e.g. Copper Wire spool"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">SKU Code</label>
                          <input
                            type="text"
                            required
                            disabled={showProductForm === 'edit'}
                            value={prodSku}
                            onChange={(e) => setProdSku(e.target.value)}
                            placeholder="e.g. ELEC-COP-001"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-450"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                          <input
                            type="text"
                            required
                            value={prodCategory}
                            onChange={(e) => setProdCategory(e.target.value)}
                            placeholder="e.g. Raw Material"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Unit Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={prodPrice}
                            onChange={(e) => setProdPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Min Stock Alert Threshold</label>
                          <input
                            type="number"
                            required
                            value={prodMinAlert}
                            onChange={(e) => setProdMinAlert(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Warehouse Location</label>
                          <input
                            type="text"
                            value={prodLocation}
                            onChange={(e) => setProdLocation(e.target.value)}
                            placeholder="e.g. Row A-Rack 3"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        {(showProductForm === 'create' || showProductForm === 'edit') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">
                              {showProductForm === 'edit' ? 'Adjust Current Stock' : 'Initial Stock Count'}
                            </label>
                            <input
                              type="number"
                              value={prodInitialStock}
                              onChange={(e) => setProdInitialStock(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductForm(false)
                            setSelectedProduct(null)
                            resetProductFormFields()
                          }}
                          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                        >
                          Save Product
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List View & Search */}
                  {!showProductForm && (
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Search products by name or SKU..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value)
                            setProductPage(1)
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        
                        {/* Products list column */}
                        <div className="lg:col-span-2 border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden bg-white">
                          {products.length === 0 ? (
                            <p className="p-8 text-center text-sm text-slate-400">No products registered.</p>
                          ) : (
                            products.map((p) => {
                              const isLow = p.current_stock <= p.minimum_stock_alert
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedProduct(p)
                                    setShowStockInForm(false)
                                  }}
                                  className={`p-3 text-left cursor-pointer transition flex justify-between items-center ${
                                    selectedProduct?.id === p.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                                    <p className="text-[10px] text-slate-450">SKU: {p.sku} &bull; Lvl: {p.current_stock}</p>
                                  </div>
                                  {isLow ? (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800">
                                      In Stock
                                    </span>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>

                        {/* Product Detail Panel */}
                        <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded p-4 text-left space-y-4">
                          {selectedProduct ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                <div>
                                  <h3 className="font-extrabold text-slate-900 text-sm">{selectedProduct.name}</h3>
                                  <p className="text-[11px] text-slate-500">SKU: <span className="font-semibold">{selectedProduct.sku}</span> &bull; Category: {selectedProduct.category}</p>
                                </div>
                                {(user?.role === 'Admin' || user?.role === 'Warehouse' || user?.role === 'Sales') && (
                                  <button
                                    onClick={() => openEditProduct(selectedProduct)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded"
                                  >
                                    Edit Details
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-3 text-xs bg-white border border-slate-250/60 p-3 rounded shadow-sm">
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Stock level</span>
                                  <span className={`font-bold ${
                                    selectedProduct.current_stock <= selectedProduct.minimum_stock_alert ? 'text-amber-600' : 'text-slate-800'
                                  }`}>
                                    {selectedProduct.current_stock} units
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Unit Price</span>
                                  <span className="text-slate-800 font-medium">${selectedProduct.unit_price}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Location</span>
                                  <span className="text-slate-850 font-medium">{selectedProduct.location || 'Not Set'}</span>
                                </div>
                              </div>

                              {/* Stock IN Action Panel */}
                              {(user?.role === 'Admin' || user?.role === 'Warehouse') && (
                                <div className="border-t border-slate-250/50 pt-3">
                                  {!showStockInForm ? (
                                    <button
                                      onClick={() => {
                                        setStockInError('')
                                        setShowStockInForm(true)
                                      }}
                                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold text-center transition"
                                    >
                                      + Record Stock IN
                                    </button>
                                  ) : (
                                    <form onSubmit={handleStockInSubmit} className="bg-white border border-slate-200 p-3.5 rounded space-y-3">
                                      <h4 className="text-xs font-bold text-slate-800">Inventory Stock IN Entry</h4>
                                      {stockInError && <p className="text-[10px] text-red-655">{stockInError}</p>}
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-1">
                                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Quantity</label>
                                          <input
                                            type="number"
                                            required
                                            value={stockInQty}
                                            onChange={(e) => setStockInQty(e.target.value)}
                                            placeholder="QTY"
                                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs"
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Reason / Batch Notes</label>
                                          <input
                                            type="text"
                                            required
                                            value={stockInReason}
                                            onChange={(e) => setStockInReason(e.target.value)}
                                            placeholder="e.g. New Shipment received"
                                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setShowStockInForm(false)}
                                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-[10px] font-bold"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                                        >
                                          Submit Entry
                                        </button>
                                      </div>
                                    </form>
                                  )}
                                </div>
                              )}

                              {/* Stock Movement History Logs */}
                              <div className="border-t border-slate-200 pt-3 space-y-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Movement Log History</h4>
                                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                  {productMovements.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">No inventory movements recorded for this item.</p>
                                  ) : (
                                    productMovements.map((m) => (
                                      <div key={m.id} className="bg-white border border-slate-200 p-2 rounded text-[11px] flex justify-between items-center">
                                        <div>
                                          <p className="text-slate-700 font-medium leading-tight">{m.reason}</p>
                                          <span className="text-[9px] text-slate-400 block font-bold">By: {m.employee_name} &bull; {new Date(m.timestamp).toLocaleString()}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                          m.movement_type === 'IN' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                          {m.movement_type === 'IN' ? '+' : '-'}{m.quantity}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 text-xs text-center">
                              <p>Select a catalog item to view details, low stock check levels, and inventory movements.</p>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Pagination Controls */}
                      {totalProductPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            disabled={productPage === 1}
                            onClick={() => setProductPage(productPage - 1)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold rounded disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <span className="text-xs text-slate-500 font-medium">Page {productPage} of {totalProductPages}</span>
                          <button
                            disabled={productPage === totalProductPages}
                            onClick={() => setProductPage(productPage + 1)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold rounded disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* Sales Challan Console Tab (Phases 17 & 18) */}
              {dashboardSubTab === 'challans' && (
                <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6 text-left">
                  
                  {/* Title & Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Sales Challan Register</h2>
                      <p className="text-xs text-slate-400">Issue sales invoices, pre-reserve products, and confirm drafts</p>
                    </div>

                    {(user?.role === 'Admin' || user?.role === 'Sales' || user?.role === 'Accounts') && !showChallanForm && (
                      <button
                        onClick={() => {
                          setChallanFormError('')
                          setChallanCustId('')
                          setChallanItems([{ product_id: '', quantity: 1, unit_price: 0, available_stock: 0 }])
                          setShowChallanForm(true)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition"
                      >
                        + Create Challan
                      </button>
                    )}
                  </div>

                  {/* Multi-Item Challan Creation Form */}
                  {showChallanForm && (
                    <form onSubmit={handleCreateChallanSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                        Issue New Sales Challan Draft
                      </h3>

                      {challanFormError && <p className="text-xs text-red-650 bg-red-50 border border-red-200 p-2.5 rounded">{challanFormError}</p>}

                      {/* Customer Selector */}
                      <div className="max-w-md">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Select Customer</label>
                        <select
                          required
                          value={challanCustId}
                          onChange={(e) => setChallanCustId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700"
                        >
                          <option value="">-- Choose Customer --</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.business_name})</option>
                          ))}
                        </select>
                      </div>

                      {/* Nested Item List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Line Items</h4>
                        
                        <div className="space-y-2.5">
                          {challanItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3 rounded border border-slate-200/80 shadow-sm">
                              {/* Product select */}
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Product</label>
                                <select
                                  required
                                  value={item.product_id}
                                  onChange={(e) => handleChallanItemChange(index, 'product_id', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-700"
                                >
                                  <option value="">-- Choose Product --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                                  ))}
                                </select>
                              </div>

                              {/* Price display */}
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Unit Price</label>
                                <span className="text-xs font-semibold block text-slate-700 p-1.5 bg-slate-50 border border-slate-200 rounded">
                                  ${item.unit_price}
                                </span>
                              </div>

                              {/* Available level */}
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">In Stock</label>
                                <span className={`text-xs font-bold block p-1.5 bg-slate-50 border border-slate-200 rounded ${
                                  item.available_stock < item.quantity ? 'text-red-650' : 'text-green-750'
                                }`}>
                                  {item.available_stock} units
                                </span>
                              </div>

                              {/* Quantity input */}
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={item.quantity}
                                  onChange={(e) => handleChallanItemChange(index, 'quantity', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs"
                                />
                              </div>

                              {/* Action */}
                              <div className="sm:col-span-2 text-right pt-4">
                                {challanItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChallanItemRow(index)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold rounded"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Row Button */}
                        <button
                          type="button"
                          onClick={handleAddChallanItemRow}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded transition"
                        >
                          + Add Line Item
                        </button>
                      </div>

                      <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowChallanForm(false)
                            setChallanCustId('')
                            setChallanItems([{ product_id: '', quantity: 1, unit_price: 0, available_stock: 0 }])
                          }}
                          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                        >
                          Create Draft
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List View & Detail Panel */}
                  {!showChallanForm && (
                    <div className="space-y-4">
                      
                      {/* Filter Bar */}
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        {['', 'Draft', 'Confirmed', 'Cancelled'].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setChallanStatusFilter(status)
                              setChallanPage(1)
                            }}
                            className={`px-3 py-1 rounded text-xs font-bold border transition ${
                              challanStatusFilter === status
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {status === '' ? 'All Status' : status}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        
                        {/* Challans List */}
                        <div className="lg:col-span-3 border border-slate-200 rounded divide-y divide-slate-100 bg-white overflow-hidden">
                          {challans.length === 0 ? (
                            <p className="p-8 text-center text-sm text-slate-400 italic">No sales challans recorded.</p>
                          ) : (
                            challans.map((ch) => (
                              <div
                                key={ch.id}
                                onClick={() => {
                                  if (selectedChallan?.id === ch.id && selectedChallan?.items) return
                                  setSelectedChallan({ id: ch.id })
                                }} // Trigger useEffect detail fetch
                                className={`p-3 text-left cursor-pointer transition flex justify-between items-center ${
                                  selectedChallan?.id === ch.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900">{ch.challan_number}</h4>
                                  <p className="text-[10px] text-slate-450">{ch.customer_name} &bull; {ch.total_quantity} items</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-slate-400 font-bold">{new Date(ch.created_at).toLocaleDateString()}</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    ch.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                    ch.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-800'
                                  }`}>
                                    {ch.status}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Challan Detail View (Phase 18 Confirmation Actions) */}
                        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded p-4 h-fit min-h-[300px] space-y-4">
                          {selectedChallan && selectedChallan.items ? (
                            <div className="space-y-4 text-xs">
                              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                <div>
                                  <h3 className="font-extrabold text-slate-900 text-sm">{selectedChallan.challan_number}</h3>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Created by: {selectedChallan.creator_name} &bull; {new Date(selectedChallan.created_at).toLocaleString()}</p>
                                </div>
                                {(user?.role === 'Admin' || user?.role === 'Accounts') && selectedChallan.status !== 'Cancelled' && !isEditingChallan && (
                                  <button
                                    onClick={() => {
                                      setEditChallanError('')
                                      setEditChallanItems(selectedChallan.items.map(item => ({ ...item })))
                                      setIsEditingChallan(true)
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded"
                                  >
                                    Edit Items
                                  </button>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Client details</span>
                                <p className="text-slate-800 font-bold text-xs">{selectedChallan.customer_name}</p>
                                <p className="text-[10px] text-slate-500 leading-none">{selectedChallan.customer_business}</p>
                              </div>

                              {/* Items list */}
                              <div className="space-y-1.5 pt-2">
                                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Line Items Summary</span>
                                
                                {isEditingChallan ? (
                                  <div className="space-y-2">
                                    {editChallanError && <p className="text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-200">{editChallanError}</p>}
                                    {editChallanItems.map((item, idx) => (
                                      <div key={item.id} className="bg-white border border-slate-200 p-2.5 rounded shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-[10px]">
                                        <div className="sm:col-span-6 text-left">
                                          <p className="font-bold text-slate-800">{item.product_name}</p>
                                          <span className="text-[8px] text-slate-400 block font-bold">SKU: {item.product_sku}</span>
                                        </div>
                                        <div className="sm:col-span-3 text-left">
                                          <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Qty</label>
                                          <input
                                            type="number"
                                            min="1"
                                            required
                                            value={item.quantity}
                                            onChange={(e) => handleEditChallanItemChange(idx, 'quantity', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-xs font-semibold"
                                          />
                                        </div>
                                        <div className="sm:col-span-3 text-left">
                                          <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Price</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={item.unit_price}
                                            onChange={(e) => handleEditChallanItemChange(idx, 'unit_price', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-xs font-semibold"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                    <div className="flex gap-1.5 justify-end pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setIsEditingChallan(false)}
                                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[10px]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveChallanEdits(selectedChallan.id)}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px]"
                                      >
                                        Save Changes
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border border-slate-200 rounded divide-y divide-slate-200 bg-white overflow-hidden">
                                    {selectedChallan.items.map((item) => (
                                      <div key={item.id} className="p-2 flex justify-between items-center text-[10px]">
                                        <div>
                                          <p className="font-semibold text-slate-850">{item.product_name}</p>
                                          <span className="text-[8px] text-slate-400 block font-bold">SKU: {item.product_sku}</span>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium text-slate-700">{item.quantity} x ${item.unit_price}</p>
                                          <span className="font-bold text-slate-900">${(item.quantity * item.unit_price).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                           {/* Challan Status Operations (Confirm & Cancel) */}
                              <div className="border-t border-slate-200 pt-3 space-y-2">
                                <div className="flex justify-between items-center pb-1">
                                  <span className="font-bold text-slate-550">Current Status:</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    selectedChallan.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                    selectedChallan.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-800'
                                  }`}>
                                    {selectedChallan.status}
                                  </span>
                                </div>

                                {/* PDF Export Action - Always available */}
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-center transition shadow-sm text-xs cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  ðŸ“„ Export Invoice as PDF
                                </button>

                                {/* Actions for Draft Challans */}
                                {selectedChallan.status === 'Draft' && (user?.role === 'Admin' || user?.role === 'Sales' || user?.role === 'Accounts') && (
                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleCancelChallan(selectedChallan.id)}
                                      className="py-1.5 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 rounded font-bold text-center transition"
                                    >
                                      Cancel Draft
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmChallan(selectedChallan.id)}
                                      className="py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-center transition"
                                    >
                                      Confirm Challan
                                    </button>
                                  </div>
                                )}

                                {/* Actions for Confirmed Challans */}
                                {selectedChallan.status === 'Confirmed' && (user?.role === 'Admin' || user?.role === 'Sales' || user?.role === 'Accounts') && (
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleCancelChallan(selectedChallan.id)}
                                      className="w-full py-1.5 bg-red-50 hover:bg-red-100 border border-red-255 text-red-700 rounded font-bold text-center transition"
                                    >
                                      Cancel & Reverse Stock
                                    </button>
                                  </div>
                                )}
                              </div>                      </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center min-h-[250px] text-slate-400 text-xs text-center">
                              <p>Select a sales challan to view detailed items list, status history, and perform confirmation checks.</p>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Challan Pagination */}
                      {totalChallanPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            disabled={challanPage === 1}
                            onClick={() => setChallanPage(challanPage - 1)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold rounded disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <span className="text-xs text-slate-500 font-medium">Page {challanPage} of {totalChallanPages}</span>
                          <button
                            disabled={challanPage === totalChallanPages}
                            onClick={() => setChallanPage(challanPage + 1)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold rounded disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* Roster tab */}
              {dashboardSubTab === 'employees' && user?.role === 'Admin' && (
                <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6 text-left">
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Registered Employee Roster</h2>
                      <p className="text-xs text-slate-400">Pre-register new employees and view active user profiles</p>
                    </div>

                    {!showEmployeeForm && (
                      <button
                        onClick={() => {
                          setEmpFormError('')
                          setShowEmployeeForm(true)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition"
                      >
                        + Pre-register Employee
                      </button>
                    )}
                  </div>

                  {showEmployeeForm && (
                    <form onSubmit={handleCreateEmployee} className="bg-slate-50 border border-slate-200 p-5 rounded space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                        Pre-Register Employee Account
                      </h3>

                      {empFormError && <p className="text-xs text-red-650 bg-red-50 border border-red-200 p-2.5 rounded">{empFormError}</p>}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Employee ID (Must match prefix)</label>
                          <input
                            type="text"
                            required
                            value={empId}
                            onChange={(e) => setEmpId(e.target.value)}
                            placeholder="e.g. SL-002, WH-003, AC-004"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                          <p className="text-[10px] text-slate-450 mt-0.5">Admin: AD-, Sales: SL-, Warehouse: WH-, Accounts: AC-</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={empName}
                            onChange={(e) => setEmpName(e.target.value)}
                            placeholder="Employee name"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Assigned Role</label>
                          <select
                            value={empRole}
                            onChange={(e) => setEmpRole(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700"
                          >
                            <option>Admin</option>
                            <option>Sales</option>
                            <option>Warehouse</option>
                            <option>Accounts</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Joining Date</label>
                          <input
                            type="date"
                            required
                            value={empDate}
                            onChange={(e) => setEmpDate(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-650"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmployeeForm(false)
                            setEmpId('')
                            setEmpName('')
                            setEmpDate('')
                            setEmpFormError('')
                          }}
                          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                        >
                          Register Profile
                        </button>
                      </div>
                    </form>
                  )}

                  {!showEmployeeForm && (
                    <div className="border border-slate-200 rounded overflow-hidden bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                            <th className="p-3">ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Joining Date</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {employees.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 italic">No employees found.</td>
                            </tr>
                          ) : (
                            employees.map((emp) => (
                              <tr key={emp.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{emp.id}</td>
                                <td className="p-3 font-medium">{emp.name}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    emp.role === 'Admin' ? 'bg-purple-50 border border-purple-200 text-purple-700' :
                                    emp.role === 'Sales' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
                                    emp.role === 'Warehouse' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                                    'bg-green-50 border border-green-200 text-green-700'
                                  }`}>
                                    {emp.role}
                                  </span>
                                </td>
                                <td className="p-3">{new Date(emp.joining_date).toLocaleDateString()}</td>
                                <td className="p-3 text-center flex items-center justify-center gap-2">
                                  {emp.is_activated ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-800">
                                      Activated
                                    </span>
                                  ) : (
                                    <>
                                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-800">
                                        Pending
                                      </span>
                                      <button
                                        onClick={() => handleApproveEmployee(emp.id)}
                                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded transition"
                                      >
                                        Approve
                                      </button>
                                    </>
                                  )}
                                  {emp.id !== user?.id && (
                                    <button
                                      onClick={() => handleDeleteEmployee(emp.id)}
                                      className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded transition"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* System Audits Tab (Admin-Only) */}
              {dashboardSubTab === 'audits' && user?.role === 'Admin' && (
                <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6 text-left">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">System Activity Audit Trail</h2>
                    <p className="text-xs text-slate-400">Review historical data modifications logged by the system</p>
                  </div>

                  <div className="border border-slate-200 rounded overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-3">Ref ID</th>
                          <th className="p-3">Table</th>
                          <th className="p-3">Field</th>
                          <th className="p-3">Original Value</th>
                          <th className="p-3">Modified Value</th>
                          <th className="p-3">Changed By</th>
                          <th className="p-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 italic">No activity logs recorded.</td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-800">#{log.record_id}</td>
                              <td className="p-3 font-medium text-slate-650">{log.table_name}</td>
                              <td className="p-3"><span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[10px]">{log.field_name}</span></td>
                              <td className="p-3 text-red-650 font-bold">{log.old_value}</td>
                              <td className="p-3 text-green-750 font-bold">{log.new_value}</td>
                              <td className="p-3">
                                <span className="font-semibold">{log.employee_name}</span>
                                <span className="text-[10px] text-slate-400 block">({log.employee_role})</span>
                              </td>
                              <td className="p-3 text-slate-450">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-555">
        &copy; {new Date().getFullYear()} ERP Portal. All rights reserved.
      </footer>

      {/* Hidden Printable Invoice Wrapper for Phase 21 Export PDF */}
      {selectedChallan && selectedChallan.items && (
        <div id="printable-invoice" className="hidden print:block p-8 bg-white text-black text-left text-sm max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Sales Invoice / Challan</h1>
              <p className="text-xs text-slate-500 mt-1">Invoice Number: <span className="font-bold">{selectedChallan.challan_number}</span></p>
              <p className="text-xs text-slate-500">Date Issued: {new Date(selectedChallan.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-800">Mini ERP + CRM Corporate Distribution Center</h2>
              <p className="text-xs text-slate-500">Plot No. 45, Industrial Area Phase II, Corporate Hub, India</p>
              <p className="text-xs text-slate-500">GSTIN: 27AAAAA1111A1Z1 &bull; contact@wholesaleportals.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To (Buyer)</h3>
              <p className="font-bold text-slate-900 text-base">{selectedChallan.customer_business}</p>
              <p className="text-xs text-slate-700 font-medium">Contact: {selectedChallan.customer_name}</p>
              <p className="text-xs text-slate-650">Mobile: {selectedChallan.customer_mobile || 'N/A'} | Email: {selectedChallan.customer_email || 'N/A'}</p>
              <p className="text-xs text-slate-650 mt-1">Address: {selectedChallan.customer_address || 'N/A'}</p>
              <p className="text-xs text-slate-650">Type: {selectedChallan.customer_type} | Account: {selectedChallan.customer_status}</p>
              <p className="text-xs text-slate-650">GSTIN: {selectedChallan.customer_gst || 'N/A'}</p>
            </div>
            <div className="text-right flex flex-col justify-between h-full">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Status</h3>
                <span className="status-badge inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 uppercase">
                  {selectedChallan.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-4">Issued by representative: <span className="font-semibold text-slate-800">{selectedChallan.creator_name}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items Detail</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-350 text-slate-700 font-bold">
                  <th className="p-3">Product Catalog SKU</th>
                  <th className="p-3">Item Details</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-center">Quantity</th>
                  <th className="p-3 text-right">Total Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {selectedChallan.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-semibold text-slate-800">{item.product_sku}</td>
                    <td className="p-3 font-medium">{item.product_name}</td>
                    <td className="p-3 text-right">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right font-bold">${(item.quantity * Number(item.unit_price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-350">
            <div className="w-64 space-y-1.5 text-right text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Subtotal Amount:</span>
                <span>${selectedChallan.items.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Tax Rate (GST 18%):</span>
                <span>$0.00 (Inclusive)</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 border-t border-slate-900 pt-1.5 text-sm">
                <span>Total Amount Due:</span>
                <span>${selectedChallan.items.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="italic">Notes: Received in good condition. Returns are only accepted within 7 days of confirmation.</p>
            </div>
            <div className="text-right flex flex-col justify-end items-end h-16">
              <div className="w-40 border-b border-slate-900 mb-1" />
              <p className="font-bold text-slate-800">Authorized Signature</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

