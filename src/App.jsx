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

  return (
    <main>
      <header className="topbar"><div className="brand-mark">RB</div><div><p className="eyebrow">Riverside Books</p><h1>Staff operations</h1></div><button className="refresh" type="button" onClick={loadData}>Refresh data</button></header>
      <section className="intro"><div><p className="eyebrow">Daily view</p><h2>Keep the shelves moving.</h2><p className="muted">Live stock levels and pickup prep, all in one place.</p></div><div className="connection"><span className="status-dot" /> Shared database connected</div></section>
      {error && <div className="alert error">Could not load shared data: {error}</div>}
      {notice && <div className="alert success">{notice}</div>}
      <section className="stats"><div><span>Catalog</span><strong>{books.length}</strong><small>books listed</small></div><div><span>Low stock</span><strong>{inventoryRows.filter((row) => row.low).length}</strong><small>need attention</small></div><div><span>Pickup queue</span><strong>{purchases.length}</strong><small>pre-orders pending</small></div></section>
      <section className="workspace">
        <div className="section-heading"><div><p className="eyebrow">Inventory</p><h2>Stock levels</h2></div><label className="filter"><input type="checkbox" checked={showLowStock} onChange={(event) => setShowLowStock(event.target.checked)} /> Show low stock only</label></div>
        <div className="table-wrap"><table><thead><tr><th>Book</th><th>On shelf</th><th>Threshold</th><th>Last order</th><th>Reorder</th><th>Adjust</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="empty">Loading live inventory...</td></tr> : inventoryRows.length === 0 ? <tr><td colSpan="6" className="empty">No inventory matches this filter.</td></tr> : inventoryRows.map((row) => <tr key={row.book_id}><td><strong>{row.title}</strong><small>{row.book_id}</small></td><td><span className={`quantity ${row.low ? 'low' : ''}`}>{row.qty_in_stock ?? 0}</span></td><td>{row.low_stock_threshold ?? 0}</td><td>{row.last_order_qty ?? 0} copies <small>{row.last_order_date ? new Date(row.last_order_date).toLocaleDateString() : 'No date'}</small></td><td>{row.needs_reorder ? <span className="flag">Needs reorder</span> : <span className="fine">On track</span>}</td><td><div className="adjust"><button aria-label={`Decrease ${row.title} stock`} disabled={updatingId === row.book_id} onClick={() => adjustStock(row.book_id, row.qty_in_stock, -1)}>-</button><button aria-label={`Increase ${row.title} stock`} disabled={updatingId === row.book_id} onClick={() => adjustStock(row.book_id, row.qty_in_stock, 1)}>+</button></div></td></tr>)}</tbody></table></div>
      </section>
      <section className="workspace pickup"><div className="section-heading"><div><p className="eyebrow">Fulfillment</p><h2>Pre-orders to pull</h2></div><span className="count-pill">{purchases.length} pending</span></div><div className="orders">{loading ? <p className="empty">Loading pickup queue...</p> : purchases.length === 0 ? <p className="empty">No pending pre-orders right now.</p> : purchasesWithTitles.map((purchase) => <article className="order" key={purchase.purchase_id}><div className="order-icon">{String(purchase.quantity ?? 1).padStart(2, '0')}</div><div className="order-info"><strong>{purchase.title ?? purchase.item_id ?? purchase.book_id ?? 'Book order'}</strong><span>Order {purchase.purchase_id} · {purchase.quantity ?? 1} copy{purchase.quantity === 1 ? '' : 'ies'}</span><small>{purchase.date ? new Date(purchase.date).toLocaleDateString() : 'Date unavailable'}</small></div><button className="ready" disabled={updatingId === purchase.purchase_id} onClick={() => markReady(purchase.purchase_id)}>{updatingId === purchase.purchase_id ? 'Updating...' : 'Mark ready for pickup'}</button></article>)}</div></section>
      <footer>Riverside Books <span>•</span> Staff dashboard</footer>
    </main>
  )
}

export default App
