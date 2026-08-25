import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabase = createClient(
  'https://wulylpywtdgoxamwlxlu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bHlscHl3dGRnb3hhbXdseGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTgyMjYsImV4cCI6MjEwMjczNDIyNn0.6usgf9zXJ3ewsRrklNPBX1ByrAPybWsd2UGc2BPg_-I',
)

function App() {
  const [books, setBooks] = useState([])
  const [inventory, setInventory] = useState([])
  const [purchases, setPurchases] = useState([])
  const [showLowStock, setShowLowStock] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 820)
  const [storeAppsOpen, setStoreAppsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('all')
  const [activity, setActivity] = useState([])
  const [reorderedIds, setReorderedIds] = useState(() => new Set())
  const [activeTab, setActiveTab] = useState('inventory')
  const [receivingBookId, setReceivingBookId] = useState('')
  const [receivingQuantity, setReceivingQuantity] = useState('')
  const [receivingThreshold, setReceivingThreshold] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [booksResult, inventoryResult, purchasesResult] = await Promise.all([
        supabase.from('Books').select('*'),
        supabase.from('Inventory').select('*'),
        supabase.from('Purchases').select('*').eq('status', 'Pending').eq('order_type', 'Pre-order'),
      ])
      const failed = booksResult.error || inventoryResult.error || purchasesResult.error
      if (failed) throw failed
      setBooks(booksResult.data ?? [])
      setInventory(inventoryResult.data ?? [])
      setPurchases(purchasesResult.data ?? [])
    } catch (loadError) {
      setError(loadError.message ?? 'Unable to load shared data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadData, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const channel = supabase.channel('riverside-operations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Books' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Inventory' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Purchases' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const inventoryRows = useMemo(() => {
    const inventoryById = Object.fromEntries(inventory.map((stock) => [stock.book_id, stock]))
    return books.map((book) => {
      const stock = inventoryById[book.book_id] ?? {}
      return {
        ...stock,
        book_id: book.book_id,
        title: book.title ?? 'Untitled book',
        low: Number(stock.qty_in_stock ?? 0) <= Number(stock.low_stock_threshold ?? 0),
        status: reorderedIds.has(book.book_id) ? 'Reordered' : stock.needs_reorder ? 'Needs Reorder' : Number(stock.qty_in_stock ?? 0) <= Number(stock.low_stock_threshold ?? 0) ? 'Low Stock' : 'In Stock',
      }
    }).filter((row) => {
      const book = books.find((item) => item.book_id === row.book_id)
      const searchableText = `${row.title} ${book?.author ?? ''} ${book?.isbn ?? ''} ${row.book_id}`.toLowerCase()
      return (!showLowStock || row.low) && (!searchQuery || searchableText.includes(searchQuery.toLowerCase())) && (genreFilter === 'all' || book?.genre === genreFilter)
    })
  }, [books, inventory, showLowStock, searchQuery, genreFilter, reorderedIds])

  const purchasesWithTitles = useMemo(() => {
    const booksById = Object.fromEntries(books.map((book) => [book.book_id, book]))
    return purchases.map((purchase) => ({
      ...purchase,
      title: booksById[purchase.book_id ?? purchase.item_id]?.title ?? purchase.title ?? purchase.book_title,
    }))
  }, [books, purchases])

  async function markReady(purchaseId) {
    setUpdatingId(purchaseId)
    try {
      const { error: updateError } = await supabase.from('Purchases').update({ status: 'Ready for Pickup' }).eq('purchase_id', purchaseId)
      if (updateError) throw updateError
      setPurchases((current) => current.filter((purchase) => purchase.purchase_id !== purchaseId))
      setNotice('Order marked ready for pickup.')
      setActivity((current) => [{ id: `${Date.now()}-${purchaseId}`, text: `Order ${purchaseId} marked ready`, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }, ...current].slice(0, 5))
    } catch (updateError) {
      setError(updateError.message ?? 'Could not update this order.')
    } finally { setUpdatingId('') }
  }

  async function adjustStock(bookId, currentQuantity, adjustment) {
    const nextQuantity = Math.max(0, Number(currentQuantity ?? 0) + adjustment)
    setUpdatingId(bookId)
    try {
      const { error: updateError } = await supabase.from('Inventory').update({ qty_in_stock: nextQuantity }).eq('book_id', bookId)
      if (updateError) throw updateError
      setInventory((current) => current.map((stock) => stock.book_id === bookId ? { ...stock, qty_in_stock: nextQuantity } : stock))
      setNotice('Stock level updated.')
      setActivity((current) => [{ id: `${Date.now()}-${bookId}`, text: `Stock adjusted for ${bookId}`, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }, ...current].slice(0, 5))
    } catch (updateError) {
      setError(updateError.message ?? 'Could not update stock.')
    } finally { setUpdatingId('') }
  }

  async function handleReorder(bookId) {
    const previousInventory = inventory
    setUpdatingId(`reorder-${bookId}`)
    setInventory((current) => current.map((stock) => stock.book_id === bookId ? { ...stock, needs_reorder: false } : stock))
    try {
      const { error: updateError } = await supabase.from('Inventory').update({ needs_reorder: false }).eq('book_id', bookId)
      if (updateError) throw updateError
      setNotice('Reorder marked as requested.')
      setReorderedIds((current) => new Set(current).add(bookId))
      setActivity((current) => [{ id: `${Date.now()}-${bookId}`, text: `Reorder requested for ${bookId}`, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }, ...current].slice(0, 5))
    } catch (updateError) {
      setInventory(previousInventory)
      setError(updateError.message ?? 'Could not save the reorder request.')
    } finally { setUpdatingId('') }
  }

  async function receiveShipment(event) {
    event.preventDefault()
    const quantity = Number(receivingQuantity)
    if (!receivingBookId || !Number.isFinite(quantity) || quantity <= 0) return
    const stock = inventory.find((item) => item.book_id === receivingBookId)
    const nextStock = Number(stock?.qty_in_stock ?? 0) + quantity
    const update = { qty_in_stock: nextStock }
    if (receivingThreshold !== '') update.low_stock_threshold = Number(receivingThreshold)
    setUpdatingId(`receive-${receivingBookId}`)
    try {
      const { error: updateError } = await supabase.from('Inventory').update(update).eq('book_id', receivingBookId)
      if (updateError) throw updateError
      setInventory((current) => current.map((item) => item.book_id === receivingBookId ? { ...item, ...update } : item))
      setActivity((current) => [{ id: `${Date.now()}-receive`, text: `Received ${quantity} copies for ${receivingBookId}`, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }, ...current].slice(0, 5))
      setNotice('Shipment received and stock updated.')
      setReceivingQuantity('')
      setReceivingThreshold('')
    } catch (receiveError) {
      setError(receiveError.message ?? 'Could not receive this shipment.')
    } finally { setUpdatingId('') }
  }

  function exportReorderReport() {
    const rows = inventoryRows.filter((row) => row.needs_reorder || row.status === 'Needs Reorder').map((row) => [row.book_id, row.title, row.qty_in_stock ?? 0, row.low_stock_threshold ?? 0, row.reorder_qty ?? '', row.last_order_date ?? ''])
    const csv = [['Book ID', 'Title', 'Qty in stock', 'Low stock threshold', 'Reorder qty', 'Last order date'], ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = 'riverside-reorder-report.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  function showInventory() {
    setActiveTab('inventory')
    document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="app-shell">
      <div className="mobile-header"><button className="mobile-menu" type="button" aria-label={sidebarOpen ? 'Close team app menu' : 'Open team app menu'} onClick={() => setSidebarOpen((open) => !open)}>☰</button><span>Riverside Books</span></div>
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`} aria-label="Riverside Books team apps">
        <button className="sidebar-toggle" title={sidebarOpen ? 'Collapse team app sidebar' : 'Expand team app sidebar'} type="button" aria-label={sidebarOpen ? 'Collapse team app sidebar' : 'Expand team app sidebar'} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? '‹' : '›'}</button>
        <div className="sidebar-brand"><span className="brand-mark" title="Riverside Books"><i /></span>{sidebarOpen && <span><b>Riverside</b><strong>Books</strong></span>}</div>
        {sidebarOpen && <><p className="sidebar-label">Team suite</p><nav className="team-links"><a href="https://riverside-readers-app.vercel.app/" target="_blank" rel="noreferrer" title="Open Riverside Readers in a new tab"><span>↗</span>Customer Ordering & Loyalty <small>↗</small></a><button className="active" type="button" onClick={showInventory}><span>▣</span>Staff Ops & Inventory</button><a href="https://riverside-books-chatbot-khaki.vercel.app/" target="_blank" rel="noreferrer" title="Open Riverside Books Chatbot in a new tab"><span>◌</span>Customer Support Chatbot <small>↗</small></a><a href="https://riverside-social-app.vercel.app/" target="_blank" rel="noreferrer" title="Open Riverside Marketing Content Generator in a new tab"><span>✦</span>Marketing Content Generator <small>↗</small></a><a href="https://pursuit-core.slack.com/archives/C0BQP69G23X/p1787360716063449" target="_blank" rel="noreferrer" title="Open team Slack in a new tab"><span>✧</span>Team Slack <small>↗</small></a></nav><div className="sidebar-foot">Shared Riverside workspace</div></>}
      </aside>
      <main className="main-content">
      <header className="topbar"><a className="brand" href="#inventory"><span className="brand-mark"><i /></span><span><b>Riverside</b><strong>Books</strong></span></a><nav><button className="header-link" type="button" onClick={showInventory}>Inventory</button><a href="#about">About</a><div className="store-apps"><button type="button" aria-expanded={storeAppsOpen} aria-haspopup="true" onClick={() => setStoreAppsOpen((open) => !open)}>Store Apps <span className={storeAppsOpen ? 'chevron up' : 'chevron'}>⌄</span></button>{storeAppsOpen && <div className="store-apps-menu"><a href="https://riverside-readers-app.vercel.app/" target="_blank" rel="noreferrer">Riverside Readers <small>↗</small></a><button type="button" onClick={() => { showInventory(); setStoreAppsOpen(false) }}>Inventory &amp; Shift Control</button><a href="https://riverside-books-chatbot-khaki.vercel.app/" target="_blank" rel="noreferrer">Support Chatbot <small>↗</small></a><a href="https://riverside-social-app.vercel.app/" target="_blank" rel="noreferrer">Marketing Generator <small>↗</small></a><a href="https://pursuit-core.slack.com/archives/C0BQP69G23X/p1787360716063449" target="_blank" rel="noreferrer">Team Slack <small>↗</small></a></div>}</div></nav><button className="refresh" type="button" onClick={loadData}>Refresh data</button></header>
      <section className="intro hero"><div><p className="eyebrow">Staff operations · Portland, Oregon</p><h1 className="hero-title">Riverside Inventory &amp; Shift Control Center</h1><p className="tagline">A live workspace for keeping shelves stocked, orders moving, and every shift in sync.</p></div></section>
      {error && <div className="alert error" role="alert">Could not load shared data: {error}</div>}
      {!loading && inventoryRows.some((row) => row.low) && <div className="low-stock-banner" role="status"><svg aria-hidden="true" className="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><span>{inventoryRows.filter((row) => row.low).length} title{inventoryRows.filter((row) => row.low).length === 1 ? '' : 's'} at or below the low-stock threshold. Review the reorder queue below.</span></div>}
      {notice && <div className="alert success">{notice}</div>}
      <nav className="staff-tabs" aria-label="Staff dashboard sections">{[['inventory', 'Inventory / Stock Control'], ['fulfillment', 'Pre-Order Fulfillment'], ['receiving', 'Stock Inward / Receiving'], ['activity', 'Audit & Activity Log'], ['reports', 'Reports & Reordering']].map(([tab, label]) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{label}</button>)}</nav>
      {activeTab === 'inventory' && <section className="workspace" id="inventory">
        <div className="section-heading"><div><p className="eyebrow">Inventory operations</p><h2>Stock levels</h2></div><div className="table-filters"><label className="search"><span>⌕</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Scan ISBN or search title" aria-label="Scan ISBN or search title" autoComplete="off" /></label><select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} aria-label="Filter by genre"><option value="all">All genres</option>{[...new Set(books.map((book) => book.genre).filter(Boolean))].sort().map((genre) => <option key={genre} value={genre}>{genre}</option>)}</select><label className="filter"><input type="checkbox" checked={showLowStock} onChange={(event) => setShowLowStock(event.target.checked)} /> Low stock only</label></div></div>
        <div className="table-wrap"><table><thead><tr><th>Book</th><th>On shelf</th><th>Threshold</th><th>Last order</th><th>Status</th><th>Adjust</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="empty">Loading live inventory...</td></tr> : inventoryRows.length === 0 ? <tr><td colSpan="6" className="empty">No inventory matches this filter.</td></tr> : inventoryRows.map((row) => <tr key={row.book_id}><td><strong>{row.title}</strong><small>{books.find((book) => book.book_id === row.book_id)?.author ?? row.book_id}</small></td><td><span className={`quantity ${row.low ? 'low' : ''}`}>{row.qty_in_stock ?? 0}</span></td><td>{row.low_stock_threshold ?? 0}</td><td>{row.last_order_qty ?? 0} copies <small>{row.last_order_date ? new Date(row.last_order_date).toLocaleDateString() : 'No date'}</small></td><td>{row.status === 'Reordered' ? <><span className="status-badge reordered">Reordered</span><button className="reorder" disabled={updatingId === `reorder-${row.book_id}`} onClick={() => handleReorder(row.book_id)}>{updatingId === `reorder-${row.book_id}` ? 'Saving...' : 'Request again'}</button></> : row.status === 'Needs Reorder' ? <button className="reorder" disabled={updatingId === `reorder-${row.book_id}`} onClick={() => handleReorder(row.book_id)}>{updatingId === `reorder-${row.book_id}` ? 'Saving...' : 'Needs reorder'}</button> : <span className={`status-badge ${row.low ? 'low-status' : 'in-stock'}`}>{row.status}</span>}</td><td><div className="adjust"><button aria-label={`Decrease ${row.title} stock`} disabled={updatingId === row.book_id} onClick={() => adjustStock(row.book_id, row.qty_in_stock, -1)}>-</button><button aria-label={`Increase ${row.title} stock`} disabled={updatingId === row.book_id} onClick={() => adjustStock(row.book_id, row.qty_in_stock, 1)}>+</button></div></td></tr>)}</tbody></table></div>
      </section>}
      {activeTab === 'fulfillment' && <section className="workspace pickup" id="pre-orders"><div className="section-heading"><div><p className="eyebrow">Fulfillment queue</p><h2>Pre-orders to pull</h2></div><span className="count-pill">{purchases.length} pending</span></div><div className="orders">{loading ? <p className="empty">Loading pickup queue...</p> : purchases.length === 0 ? <p className="empty">No pending pre-orders right now.</p> : purchasesWithTitles.map((purchase) => <article className="order" key={purchase.purchase_id}><div className="order-icon">{String(purchase.quantity ?? 1).padStart(2, '0')}</div><div className="order-info"><strong>{purchase.title ?? purchase.item_id ?? purchase.book_id ?? 'Book order'}</strong><span>Order {purchase.purchase_id} · Customer {purchase.customer_id ?? 'name unavailable'} · {purchase.quantity ?? 1} copy{purchase.quantity === 1 ? '' : 'ies'}</span><small>{purchase.date ? new Date(purchase.date).toLocaleDateString() : 'Date unavailable'}</small></div><button className="ready" disabled={updatingId === purchase.purchase_id} onClick={() => markReady(purchase.purchase_id)}>{updatingId === purchase.purchase_id ? 'Updating...' : 'Mark ready for pickup'}</button></article>)}</div></section>}
      {activeTab === 'receiving' && <section className="workspace receiving"><div className="section-heading"><div><p className="eyebrow">Stock inward</p><h2>Receive a shipment</h2></div></div><form className="receiving-form" onSubmit={receiveShipment}><label>Book<select required value={receivingBookId} onChange={(event) => setReceivingBookId(event.target.value)}><option value="">Choose a title</option>{books.map((book) => <option key={book.book_id} value={book.book_id}>{book.title} ({book.book_id})</option>)}</select></label><label>Copies received<input required min="1" type="number" value={receivingQuantity} onChange={(event) => setReceivingQuantity(event.target.value)} placeholder="e.g. 12" /></label><label>Low-stock threshold<input min="0" type="number" value={receivingThreshold} onChange={(event) => setReceivingThreshold(event.target.value)} placeholder="Leave unchanged" /></label><button className="ready" disabled={updatingId.startsWith('receive-')} type="submit">{updatingId.startsWith('receive-') ? 'Saving...' : 'Add shipment to stock'}</button></form></section>}
      {activeTab === 'activity' && <section className="activity-panel full-panel"><div><p className="eyebrow">Session activity</p><h2>Recent actions</h2></div>{activity.length === 0 ? <p className="empty">Your actions will appear here during this session.</p> : <div className="activity-list">{activity.map((entry) => <div key={entry.id}><span className="activity-dot" /><strong>{entry.text}</strong><small>{entry.time}</small></div>)}</div>}</section>}
      {activeTab === 'reports' && <section className="workspace reports"><div className="section-heading"><div><p className="eyebrow">Reordering</p><h2>Reports & reorder history</h2></div><button className="ready" onClick={exportReorderReport}>Export reorder CSV</button></div><div className="report-list">{inventoryRows.filter((row) => row.needs_reorder || row.status === 'Needs Reorder').map((row) => <div key={row.book_id}><strong>{row.title}</strong><span>{row.qty_in_stock ?? 0} on shelf · reorder {row.reorder_qty ?? 'quantity TBD'}</span></div>)}{inventoryRows.filter((row) => row.needs_reorder || row.status === 'Needs Reorder').length === 0 && <p className="empty">No titles currently need reordering.</p>}</div></section>}
      <section className="about" id="about"><div><p className="eyebrow">About Riverside Books</p><h2>A neighborhood bookstore by the river.</h2><p>Riverside Books is an independent neighborhood bookstore located along the riverfront in Portland, Oregon. We specialize in new books, thoughtful gifts, and hosting friendly literary gatherings for our community.</p></div><address><strong>Our Location & Contact Info</strong><span>428 Riverfront Place, Suite 100<br />Portland, OR 97201</span><a href="tel:+15035550192">(503) 555-0192</a><a href="mailto:hello@riversidebooks.com">hello@riversidebooks.com</a></address></section>
      <footer id="settings"><div><span className="brand-mark"><i /></span><b>Riverside Books</b></div><a href="#inventory">Inventory Management</a><a href="#about">About & Contact</a><a href="#tokens">Design Tokens Reference</a></footer>
      </main>
    </div>
  )
}

export default App
