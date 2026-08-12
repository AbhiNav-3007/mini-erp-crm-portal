const fs = require('fs');
const file = 'frontend/src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state right after uiAlert state
code = code.replace(
  `  const [uiAlert, setUiAlert] = useState(null) // { message: string, type: string }`,
  `  const [uiAlert, setUiAlert] = useState(null) // { message: string, type: string }
  const [confirmModal, setConfirmModal] = useState(null) // { message: string, onConfirm: () => void }`
);

// 2. Add showConfirm utility function
code = code.replace(
  `  // Navigation & Auth States`,
  `  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm })
  }

  // Navigation & Auth States`
);

// 3. Replace handleConfirmChallan implementation
const oldConfirmStr = `  // Phase 18: Confirm Challan
  const handleConfirmChallan = (challanId) => {
    if (!window.confirm('Are you sure you want to CONFIRM this challan? This will permanently deduct product inventory levels.')) return

    fetch(\`http://localhost:5001/api/challans/\${challanId}/confirm\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${token}\` }
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
      .catch(() => setUiAlert({ message: 'Failed to confirm challan', type: 'error' }))
  }`;

const newConfirmStr = `  // Phase 18: Confirm Challan
  const handleConfirmChallan = (challanId) => {
    showConfirm('Are you sure you want to CONFIRM this challan? This will permanently deduct product inventory levels.', () => {
      fetch(\`http://localhost:5001/api/challans/\${challanId}/confirm\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\` }
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
  }`;

code = code.replace(oldConfirmStr, newConfirmStr);

// 4. Replace handleCancelChallan implementation
const oldCancelStr = `  // Phase 18: Cancel Challan (Reverses stock level checks)
  const handleCancelChallan = (challanId) => {
    if (!window.confirm('Are you sure you want to CANCEL this challan? Stock balances will be returned if it was already confirmed.')) return

    fetch(\`http://localhost:5001/api/challans/\${challanId}/cancel\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${token}\` }
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
  }`;

const newCancelStr = `  // Phase 18: Cancel Challan (Reverses stock level checks)
  const handleCancelChallan = (challanId) => {
    showConfirm('Are you sure you want to CANCEL this challan? Stock balances will be returned if it was already confirmed.', () => {
      fetch(\`http://localhost:5001/api/challans/\${challanId}/cancel\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\` }
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
  }`;

code = code.replace(oldCancelStr, newCancelStr);

// 5. Inject confirm modal HTML below uiAlert render block
code = code.replace(
  `      {/* Dynamic UI Alert Toast Notification */}`,
  `      {/* Custom Confirmation Modal Dialog */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 transform transition-all scale-100 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <span className="text-xl font-bold">⚠️</span>
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

      {/* Dynamic UI Alert Toast Notification */}`
);

fs.writeFileSync(file, code);
console.log('App.jsx updated with custom confirm modals.');
