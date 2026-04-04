import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AgentDemo from './AgentDemo.jsx';

const NAV_ITEMS = [
  { id: 'demo',      label: 'Demo' },
  { id: 'slides',    label: 'Slides' },
  { id: 'erc-draft', label: 'ERC Draft' },
]

function Shell() {
  const [page, setPage] = useState('demo')

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: '#070B18', minHeight: '100vh', color: '#F5F7FA' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,11,24,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginRight: '16px' }}>
          Agent<span style={{ color: '#00D4FF' }}>Levy</span>
        </span>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              borderRadius: '8px',
              border: page === item.id ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
              background: page === item.id ? 'rgba(0,212,255,0.08)' : 'transparent',
              color: page === item.id ? '#00D4FF' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s',
              outline: 'none',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Pages */}
      {page === 'demo'      && <AgentDemo />}
      {page === 'slides'    && <EmptyPage title="Slides" />}
      {page === 'erc-draft' && <EmptyPage title="ERC Draft" />}
    </div>
  )
}

function EmptyPage({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 53px)', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
      {title}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>
)
