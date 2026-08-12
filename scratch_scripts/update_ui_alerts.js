const fs = require('fs');
const file = 'frontend/src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

// handleCancelChallan
code = code.replace(
  `        if (data.status === 'success') {
          setSelectedChallan(null)`,
  `        if (data.status === 'success') {
          setSelectedChallan(null)
          setUiAlert({ message: data.message || 'Challan cancelled successfully', type: 'success' })`
);

// handleCreateChallanSubmit
code = code.replace(
  `        if (data.status === 'success') {
          setIsCreatingChallan(false)
          fetchChallans()`,
  `        if (data.status === 'success') {
          setIsCreatingChallan(false)
          setUiAlert({ message: 'Challan created successfully', type: 'success' })
          fetchChallans()`
);

// handleSaveCustomer
code = code.replace(
  `        if (data.status === 'success') {
          setIsAddingCustomer(false)
          fetchCustomers()`,
  `        if (data.status === 'success') {
          setIsAddingCustomer(false)
          setUiAlert({ message: 'Customer saved successfully', type: 'success' })
          fetchCustomers()`
);

// handleSaveProduct
code = code.replace(
  `        if (data.status === 'success') {
          setIsAddingProduct(false)
          fetchProducts()`,
  `        if (data.status === 'success') {
          setIsAddingProduct(false)
          setUiAlert({ message: 'Product saved successfully', type: 'success' })
          fetchProducts()`
);

// uiAlert rendering
code = code.replace(
  `      {/* Dynamic UI Alert Toast Notification */}
      {uiAlert && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-white dark:bg-slate-900 border-l-4 border-red-500 shadow-xl rounded-r-lg p-4 flex items-start gap-3 animate-pulse-slow">
          <div className="flex-1 text-left">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">System Alert</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{uiAlert.message}</p>`,
  `      {/* Dynamic UI Alert Toast Notification */}
      {uiAlert && (
        <div className={\`fixed top-5 right-5 z-[9999] max-w-sm w-full bg-white dark:bg-slate-900 border-l-4 \${uiAlert.type === 'success' ? 'border-green-500' : 'border-red-500'} shadow-xl rounded-r-lg p-4 flex items-start gap-3 animate-pulse-slow\`}>
          <div className="flex-1 text-left">
            <span className={\`block text-xs font-bold \${uiAlert.type === 'success' ? 'text-green-500' : 'text-slate-400'} uppercase tracking-wider\`}>
              {uiAlert.type === 'success' ? 'Success' : 'System Alert'}
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{uiAlert.message}</p>`
);

fs.writeFileSync(file, code);
console.log('App.jsx updated with success notifications.');
