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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [catalogFilter, setCatalogFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    const [booksResult, inventoryResult, purchasesResult] = await Promise.all([
      supabase.from('Books').select('*'),
      supabase.from('Inventory').select('*'),
      supabase.from('Purchases').select('*').eq('status', 'Pending').eq('order_type', 'Pre-order'),
    ])
    const failed = booksResult.error || inventoryResult.error || purchasesResult.error
    if (failed) setError(failed.message)
    else {
      setBooks(booksResult.data ?? [])
      setInventory(inventoryResult.data ?? [])
      setPurchases(purchasesResult.data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(loadData, 0)
    return () => clearTimeout(timer)
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
      }
    }).filter((row) => !showLowStock || row.low)
  }, [books, inventory, showLowStock])

  const purchasesWithTitles = useMemo(() => {
    const booksById = Object.fromEntries(books.map((book) => [book.book_id, book]))
    return purchases.map((purchase) => ({
      ...purchase,
      title: booksById[purchase.book_id ?? purchase.item_id]?.title ?? purchase.title ?? purchase.book_title,
    }))
  }, [books, purchases])

  const catalogBooks = useMemo(() => {
    const stockById = Object.fromEntries(inventory.map((stock) => [stock.book_id, stock]))
    return books.filter((book) => catalogFilter === 'all' || (catalogFilter === 'staff' ? book.staff_pick : catalogFilter === 'new' ? book.bestseller : true)).slice(0, 6).map((book) => {
      const stock = stockById[book.book_id] ?? {}
      return { ...book, stock, available: Number(stock.qty_in_stock ?? 0) > 0 }
    })
  }, [books, inventory, catalogFilter])

  async function markReady(purchaseId) {
    setUpdatingId(purchaseId)
    const { error: updateError } = await supabase.from('Purchases').update({ status: 'Ready for Pickup' }).eq('purchase_id', purchaseId)
    if (updateError) setError(updateError.message)
    else { setPurchases((current) => current.filter((purchase) => purchase.purchase_id !== purchaseId)); setNotice('Order marked ready for pickup.') }
    setUpdatingId('')
  }

  async function adjustStock(bookId, currentQuantity, adjustment) {
    const nextQuantity = Math.max(0, Number(currentQuantity ?? 0) + adjustment)
    setUpdatingId(bookId)
    const { error: updateError } = await supabase.from('Inventory').update({ qty_in_stock: nextQuantity }).eq('book_id', bookId)
    if (updateError) setError(updateError.message)
    else { setInventory((current) => current.map((stock) => stock.book_id === bookId ? { ...stock, qty_in_stock: nextQuantity } : stock)); setNotice('Stock level updated.') }
    setUpdatingId('')
  }

  async function handleReorder(bookId) {
    const previousInventory = inventory
    setUpdatingId(`reorder-${bookId}`)
    setInventory((current) => current.map((stock) => stock.book_id === bookId ? { ...stock, needs_reorder: false } : stock))
    const { error: updateError } = await supabase.from('Inventory').update({ needs_reorder: false }).eq('book_id', bookId)
    if (updateError) {
      setInventory(previousInventory)
      setError(updateError.message)
    } else {
      setNotice('Reorder marked as requested.')
    }
    setUpdatingId('')
  }

  return (
    <main>
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`} aria-label="Riverside Books team apps">
        <button className="sidebar-toggle" type="button" aria-label={sidebarOpen ? 'Collapse team app sidebar' : 'Expand team app sidebar'} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? '‹' : '›'}</button>
        <div className="sidebar-brand"><span className="brand-mark"><i /></span>{sidebarOpen && <span><b>Riverside</b><strong>Books</strong></span>}</div>
        {sidebarOpen && <><p className="sidebar-label">Team suite</p><nav className="team-links"><a href="https://riverside-readers-app.vercel.app/" target="_blank" rel="noreferrer"><span>↗</span>Customer Ordering & Loyalty</a><a className="active" href="#inventory"><span>▣</span>Staff Ops & Inventory</a><a href="https://riverside-books-chatbot-khaki.vercel.app/" target="_blank" rel="noreferrer"><span>◌</span>Customer Support Chatbot</a><a href="https://pursuit-core.slack.com/archives/C0BQP69G23X/p1787360716063449" target="_blank" rel="noreferrer"><span>✦</span>Team Slack</a></nav><div className="sidebar-foot">Shared Riverside workspace</div></>}
      </aside>
      <header className="topbar"><a className="brand" href="#catalog"><span className="brand-mark"><i /></span><span><b>Riverside</b><strong>Books</strong></span></a><nav><a href="#inventory">Inventory</a><a href="#catalog">Catalog</a><a href="#staff-picks">Staff Picks</a><a href="#settings">Admin Settings</a></nav><button className="refresh" type="button" onClick={loadData}>Refresh data</button></header>
      <div className="promo">A cozy corner for readers, now with teal and sky blue accents <span>↗</span></div>
      <section className="intro hero"><div><p className="eyebrow">Independent bookseller · Since 1987</p><h2>Riverside Books</h2><p className="tagline">Curated staff picks, new arrivals, and a few old favorites worth revisiting on a rainy afternoon.</p><div className="quick-filters"><button className={catalogFilter === 'new' ? 'active' : ''} onClick={() => setCatalogFilter('new')}>Shop new arrivals</button><button className={catalogFilter === 'staff' ? 'active' : ''} onClick={() => setCatalogFilter('staff')}>Staff pick</button><button onClick={() => setCatalogFilter('new')}>New arrival</button><button onClick={() => setCatalogFilter('all')}>Rewards</button></div></div><div className="hero-art" aria-label="Plant and book illustration"><div className="leaf leaf-one" /><div className="leaf leaf-two" /><div className="book-shape" /></div></section>
      {error && <div className="alert error">Could not load shared data: {error}</div>}
      {notice && <div className="alert success">{notice}</div>}
      <section className="catalog" id="catalog"><div className="section-heading"><div><p className="eyebrow">The bookshelf</p><h2>Featured inventory</h2></div><span className="muted">{books.length} titles in the shop</span></div><div className="swatches"><button className={catalogFilter === 'all' ? 'selected' : ''} onClick={() => setCatalogFilter('all')}><i className="swatch green" />All books</button><button className={catalogFilter === 'staff' ? 'selected' : ''} onClick={() => setCatalogFilter('staff')}><i className="swatch teal" />Staff picks</button><button className={catalogFilter === 'new' ? 'selected' : ''} onClick={() => setCatalogFilter('new')}><i className="swatch sky" />New arrivals</button></div><div className="book-grid">{loading ? <p className="empty">Loading the bookshelf...</p> : catalogBooks.map((book, index) => <article className="book-card" key={book.book_id}><div className={`cover cover-${index % 4}`}><span>{book.title?.split(' ').slice(0, 2).join(' ')}</span></div><div className="book-copy"><h3>{book.title}</h3><p>{book.genre ?? 'Literary fiction'}{book.pub_date ? `, ${new Date(book.pub_date).getFullYear()}` : ''}</p><span className={book.available ? 'availability' : 'availability sold-out'}>{book.available ? (book.staff_pick ? 'Staff favorite' : 'Back in stock') : 'Preorder open'}</span></div></article>)}</div></section>
      <section className="workspace" id="inventory">
        <div className="section-heading"><div><p className="eyebrow">Inventory</p><h2>Stock levels</h2></div><label className="filter"><input type="checkbox" checked={showLowStock} onChange={(event) => setShowLowStock(event.target.checked)} /> Show low stock only</label></div>
        <div className="table-wrap"><table><thead><tr><th>Book</th><th>On shelf</th><th>Threshold</th><th>Last order</th><th>Reorder</th><th>Adjust</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="empty">Loading live inventory...</td></tr> : inventoryRows.length === 0 ? <tr><td colSpan="6" className="empty">No inventory matches this filter.</td></tr> : inventoryRows.map((row) => <tr key={row.book_id}><td><strong>{row.title}</strong><small>{row.book_id}</small></td><td><span className={`quantity ${row.low ? 'low' : ''}`}>{row.qty_in_stock ?? 0}</span></td><td>{row.low_stock_threshold ?? 0}</td><td>{row.last_order_qty ?? 0} copies <small>{row.last_order_date ? new Date(row.last_order_date).toLocaleDateString() : 'No date'}</small></td><td>{row.needs_reorder ? <button className="reorder" disabled={updatingId === `reorder-${row.book_id}`} onClick={() => handleReorder(row.book_id)}>{updatingId === `reorder-${row.book_id}` ? 'Saving...' : 'Reorder'}</button> : <span className="fine">Requested</span>}</td><td><div className="adjust"><button aria-label={`Decrease ${row.title} stock`} disabled={updatingId === row.book_id} onClick={() => adjustStock(row.book_id, row.qty_in_stock, -1)}>-</button><button aria-label={`Increase ${row.title} stock`} disabled={updatingId === row.book_id} onClick={() => adjustStock(row.book_id, row.qty_in_stock, 1)}>+</button></div></td></tr>)}</tbody></table></div>
      </section>
      <section className="workspace pickup" id="staff-picks"><div className="section-heading"><div><p className="eyebrow">Fulfillment</p><h2>Pre-orders to pull</h2></div><span className="count-pill">{purchases.length} pending</span></div><div className="orders">{loading ? <p className="empty">Loading pickup queue...</p> : purchases.length === 0 ? <p className="empty">No pending pre-orders right now.</p> : purchasesWithTitles.map((purchase) => <article className="order" key={purchase.purchase_id}><div className="order-icon">{String(purchase.quantity ?? 1).padStart(2, '0')}</div><div className="order-info"><strong>{purchase.title ?? purchase.item_id ?? purchase.book_id ?? 'Book order'}</strong><span>Order {purchase.purchase_id} · {purchase.quantity ?? 1} copy{purchase.quantity === 1 ? '' : 'ies'}</span><small>{purchase.date ? new Date(purchase.date).toLocaleDateString() : 'Date unavailable'}</small></div><button className="ready" disabled={updatingId === purchase.purchase_id} onClick={() => markReady(purchase.purchase_id)}>{updatingId === purchase.purchase_id ? 'Updating...' : 'Mark ready for pickup'}</button></article>)}</div></section>
      <footer id="settings"><div><span className="brand-mark"><i /></span><b>Riverside Books</b></div><a href="#inventory">Inventory Management</a><a href="#tokens">Design Tokens Reference</a><a href="mailto:staff@riversidebooks.example">Team Contact Details</a></footer>
    </main>
  )
}

export default App
