/**
 * AgentDemo — 3-task walkthrough of Agent A ↔ Agent B communication
 *
 * Layout:
 *   Top row: [Task Queue (left, 280px)] | [Completed Jobs (right, flex)]
 *   Bottom:  Live Execution Panel (full width, only when running)
 */

import { useState, useRef } from 'react'

// ─── Shared mock addresses ────────────────────────────────────────────────────
const AGENTS = {
  A: { short: '0xA1b2…A9b0' },
  B: { short: '0xDeAd…4567' },
}

// ─── Glass design tokens ──────────────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}
const glassInner = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
}
const muted = { color: 'rgba(255,255,255,0.35)' }
const mono  = { fontFamily: "ui-monospace,'SF Mono',Consolas,monospace" }
const HERO_POINTS = [
  { label: 'Commit the spec', value: 'The taskSpecHash fixes the brief before work begins' },
  { label: 'Escrow the payment', value: 'Funds stay locked on Flare while the result is checked' },
  { label: 'Settle on attestation', value: 'Payout releases only after verifier confirmation' },
]

// ─── 3 distinct tasks ─────────────────────────────────────────────────────────
const TASK_QUEUE = [
  {
    idx: 0,
    taskIdShort: '0x7f3a…4b5c',
    name: 'product-scrape',
    description: 'Scrape product price from e-commerce URL',
    payment: '1.00 USDT0',
    payout: '0.99 USDT0',
    fee: '0.01 USDT0',
    txHash1: '0xaaaa1111bbbb2222cccc3333',
    txHash2: '0xbbbb2222cccc3333dddd4444',
    attestation: '0xd4e5f6a7…c1d2e3f4',
    blockNumber: 8421589,
    resultData: { price: '$29.99', title: 'Widget Pro X', inStock: true },
    resultSummary: 'price: $29.99 · Widget Pro X · inStock: true',
  },
  {
    idx: 1,
    taskIdShort: '0xa1b2…9e0f',
    name: 'ftso-price-feed',
    description: 'Fetch FLR/USD price from Flare FTSO oracle',
    payment: '0.50 USDT0',
    payout: '0.495 USDT0',
    fee: '0.005 USDT0',
    txHash1: '0xcccc3333dddd4444eeee5555',
    txHash2: '0xdddd4444eeee5555ffff6666',
    attestation: '0xe5f6a7b8…d3e4f5a6',
    blockNumber: 8422103,
    resultData: { symbol: 'FLR/USD', price: '0.0243', confidence: '99.2%', epoch: 847291 },
    resultSummary: 'FLR/USD: $0.0243 · conf: 99.2% · epoch: 847291',
  },
  {
    idx: 2,
    taskIdShort: '0xc3d4…f1a2',
    name: 'nft-floor-price',
    description: 'Fetch NFT collection floor price and 24h volume',
    payment: '0.75 USDT0',
    payout: '0.7425 USDT0',
    fee: '0.0075 USDT0',
    txHash1: '0xeeee5555ffff66667777aaaa',
    txHash2: '0xffff66667777aaaa8888bbbb',
    attestation: '0xf7a8b9c0…e5f6a7b8',
    blockNumber: 8422891,
    resultData: { collection: 'Flare Punks', floor: '420 FLR', volume24h: '12,400 FLR', listed: 47 },
    resultSummary: 'Flare Punks · floor: 420 FLR · vol: 12,400 FLR',
  },
]

// ─── Build steps ──────────────────────────────────────────────────────────────
function buildSteps(t) {
  return [
    {
      id: 1, title: 'Spec Discovery', subtitle: `Agent A → GET /tasks/${t.name}/spec`,
      channel: 'HTTP', channelColor: '#60a5fa',
      agentAStatus: 'Fetching task specification…', agentBStatus: 'Serving /tasks endpoint',
      messages: [
        { dir: 'A→B', label: `GET /tasks/${t.name}/spec`, color: '#60a5fa', type: 'http' },
        { dir: 'B→A', label: '200 OK — TaskSpec returned', color: '#34d399', type: 'http' },
      ],
      payloads: {
        'HTTP Request': `GET http://localhost:3001/tasks/${t.name}/spec\nAccept: application/json`,
        'HTTP Response': JSON.stringify({ taskId: t.name+'-v1', description: t.description, verification: { type: 'json_schema', criteria: { required: Object.keys(t.resultData) } }, payment: { token: '0xaB45…cD89', amount: t.payment, symbol: 'USDT0' } }, null, 2),
      },
    },
    {
      id: 2, title: 'Task Posted On-Chain', subtitle: 'Agent A approves USDT0 + calls postTask()',
      channel: 'Blockchain', channelColor: '#a78bfa',
      agentAStatus: `Approving ${t.payment} + posting task…`, agentBStatus: 'Watching chain for TaskPosted events…',
      messages: [
        { dir: 'A→chain', label: `USDT0.approve(TaskRegistry, ${t.payment})`, color: '#a78bfa', type: 'tx' },
        { dir: 'A→chain', label: `TaskRegistry.postTask(specHash, ${t.payment}, 1hr)`, color: '#a78bfa', type: 'tx' },
        { dir: 'chain→B', label: 'TaskPosted event → Agent B listener', color: '#fbbf24', type: 'event' },
      ],
      payloads: {
        'Transaction': JSON.stringify({ to: 'TaskRegistry', function: 'postTask', args: { specHash: t.taskIdShort, amount: t.payment, token: 'USDT0', timeoutSeconds: 3600 }, txHash: t.txHash1 }, null, 2),
        'TaskPosted Event': JSON.stringify({ event: 'TaskPosted', taskId: t.taskIdShort, poster: AGENTS.A.short, amount: t.payment, deadline: '2026-04-04T14:00:00Z', blockNumber: t.blockNumber - 200 }, null, 2),
      },
    },
    {
      id: 3, title: 'Claim Handshake', subtitle: 'Agent B detects TaskPosted → calls claimTask()',
      channel: 'Blockchain', channelColor: '#a78bfa',
      agentAStatus: 'Polling chain — waiting for TaskClaimed…', agentBStatus: 'Detected TaskPosted — calling claimTask()',
      messages: [
        { dir: 'chain→B', label: 'TaskPosted event received by Agent B watcher', color: '#fbbf24', type: 'event' },
        { dir: 'B→chain', label: `TaskRegistry.claimTask(${t.taskIdShort})`, color: '#a78bfa', type: 'tx' },
        { dir: 'chain→A', label: 'TaskClaimed event — Agent A unblocks', color: '#fbbf24', type: 'event' },
      ],
      payloads: {
        'Event Received': JSON.stringify({ event: 'TaskPosted', taskId: t.taskIdShort, canExecute: true, matchedSpec: t.name+'-v1' }, null, 2),
        'Transaction': JSON.stringify({ to: 'TaskRegistry', function: 'claimTask', args: { taskId: t.taskIdShort }, txHash: t.txHash2 }, null, 2),
        'TaskClaimed Event': JSON.stringify({ event: 'TaskClaimed', taskId: t.taskIdShort, executor: AGENTS.B.short, blockNumber: t.blockNumber - 100 }, null, 2),
      },
    },
    {
      id: 4, title: 'x402 Payment', subtitle: 'Agent A pays on-chain, retries with proof header',
      channel: 'HTTP + Blockchain', channelColor: '#60a5fa',
      agentAStatus: 'Handling 402 → sending USDT0 → retrying…', agentBStatus: 'x402 middleware verifying on-chain transfer',
      messages: [
        { dir: 'A→B', label: `POST /tasks/${t.name}/execute`, color: '#60a5fa', type: 'http' },
        { dir: 'B→A', label: `402 Payment Required — payTo ${AGENTS.B.short}`, color: '#f87171', type: 'http' },
        { dir: 'A→chain', label: `USDT0.transfer(AgentB, ${t.payment})`, color: '#a78bfa', type: 'tx' },
        { dir: 'A→B', label: `POST /tasks/${t.name}/execute  +  X-Payment: {txHash}`, color: '#60a5fa', type: 'http' },
        { dir: 'B→A', label: '200 OK — task result returned', color: '#34d399', type: 'http' },
      ],
      payloads: {
        '402 Response': JSON.stringify({ status: 402, accepts: [{ scheme: 'exact', network: 'coston2', payTo: AGENTS.B.short, maxAmountRequired: t.payment, asset: 'USDT0' }] }, null, 2),
        'X-Payment Header': JSON.stringify({ x402Version: 1, scheme: 'exact', network: 'coston2', payload: { from: AGENTS.A.short, txHash: t.txHash1, amount: t.payment } }, null, 2),
        '200 Response': JSON.stringify({ result: t.resultData }, null, 2),
      },
    },
    {
      id: 5, title: 'Proof & Settlement', subtitle: 'Agent B submits proof; Treasury releases payment',
      channel: 'Blockchain', channelColor: '#34d399',
      agentAStatus: 'Waiting for TaskSettled event…', agentBStatus: 'Hashing result → submitting proof…',
      messages: [
        { dir: 'B→chain', label: 'Verifier.submitProof(taskId, resultHash, attestation)', color: '#a78bfa', type: 'tx' },
        { dir: 'chain→B', label: 'TaskVerified — proof accepted', color: '#34d399', type: 'event' },
        { dir: 'chain→B', label: `Treasury.pay(AgentB, ${t.payout}) — fee 1%`, color: '#34d399', type: 'event' },
        { dir: 'chain→A', label: 'TaskSettled event — Agent A confirms', color: '#fbbf24', type: 'event' },
      ],
      payloads: {
        'submitProof Args': JSON.stringify({ taskId: t.taskIdShort, resultHash: '0x'+t.txHash1.slice(2,26)+'…', attestation: t.attestation, storageURI: 'ipfs://QmX7f9…' }, null, 2),
        'TaskSettled Event': JSON.stringify({ event: 'TaskSettled', taskId: t.taskIdShort, recipient: AGENTS.B.short, amount: t.payout, fee: t.fee, attestationHash: t.attestation, blockNumber: t.blockNumber }, null, 2),
      },
    },
  ]
}

const delay = ms => new Promise(r => setTimeout(r, ms))
const TYPE_ICON = { tx: '⛓', event: '⚡', http: '→' }

// ─── PayloadPanel ─────────────────────────────────────────────────────────────
function PayloadPanel({ payloads }) {
  const tabs = Object.keys(payloads)
  const [tab, setTab] = useState(tabs[0])
  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent',
            color: tab === t ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
            border: tab === t ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            borderRadius: '6px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', outline: 'none',
          }}>{t}</button>
        ))}
      </div>
      <pre style={{
        ...glassInner,
        padding: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.6)',
        lineHeight: '1.6', margin: 0, ...mono,
        maxHeight: '160px', overflowY: 'auto', overflowX: 'auto',
      }}>{payloads[tab]}</pre>
    </div>
  )
}

// ─── FlowDialog ───────────────────────────────────────────────────────────────
function FlowDialog({ open, onClose, msg, step }) {
  if (!open || !msg || !step) return null
  const payloadKeys  = Object.keys(step.payloads)
  const defaultTab   = payloadKeys[Math.min(msg.index, payloadKeys.length - 1)]
  const [tab, setTab] = useState(defaultTab)
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ ...glass, padding: '24px', width: '560px', maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto', position: 'relative', boxShadow: `0 0 48px ${msg.color}18` }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: `${msg.color}15`, border: `1px solid ${msg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
            {TYPE_ICON[msg.type]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{msg.label}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px', background: `${msg.color}15`, color: msg.color, fontWeight: '600', textTransform: 'uppercase' }}>{msg.type}</span>
              <span style={{ fontSize: '10px', ...mono, color: 'rgba(255,255,255,0.25)' }}>{msg.dir}</span>
              <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px', background: `${step.channelColor}12`, color: step.channelColor }}>{step.channel}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px', outline: 'none' }}>×</button>
        </div>

        {/* Step context */}
        <div style={{ ...glassInner, padding: '10px 14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: step.channelColor, fontWeight: '600', marginBottom: '2px' }}>Step {step.id} — {step.title}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{step.subtitle}</div>
        </div>

        {/* Payload tabs */}
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Payload</div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {payloadKeys.map(k => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: tab === k ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: tab === k ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
              border: tab === k ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', outline: 'none',
            }}>{k}</button>
          ))}
        </div>
        <pre style={{ ...glassInner, padding: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', margin: 0, ...mono, overflowX: 'auto', overflowY: 'auto', maxHeight: '260px' }}>
          {step.payloads[tab]}
        </pre>
      </div>
    </div>
  )
}

// ─── MessageFlow ──────────────────────────────────────────────────────────────
function MessageFlow({ messages, step }) {
  const [dialog, setDialog] = useState(null)
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {messages.map((msg, i) => {
          const toRight = msg.dir.startsWith('A') || msg.dir === 'B→chain'
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', borderRadius: '8px',
              background: `${msg.color}08`,
              border: `1px solid ${msg.color}20`,
              animation: 'fadeIn 0.3s ease-out both',
              animationDelay: `${i * 0.08}s`,
            }}>
              <span style={{ fontSize: '10px', ...mono, color: 'rgba(255,255,255,0.2)', minWidth: '68px' }}>{msg.dir}</span>
              <div style={{ flex: 1, position: 'relative', height: '1px', background: `linear-gradient(90deg, ${msg.color}22, ${msg.color}88, ${msg.color}22)` }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  background: '#070B18', padding: '2px 8px', borderRadius: '4px',
                  fontSize: '11px', color: msg.color, whiteSpace: 'nowrap',
                  border: `1px solid ${msg.color}30`,
                }}>
                  {TYPE_ICON[msg.type]} {msg.label}
                </div>
              </div>
              {toRight
                ? <span style={{ color: msg.color, fontSize: '12px' }}>▶</span>
                : <span style={{ color: msg.color, fontSize: '12px', order: -2 }}>◀</span>
              }
              <span style={{
                fontSize: '9px', padding: '1px 5px', borderRadius: '4px',
                background: `${msg.color}15`, color: msg.color,
                fontWeight: '600', textTransform: 'uppercase', minWidth: '40px', textAlign: 'center',
              }}>{msg.type}</span>
              {step && (
                <button
                  onClick={() => setDialog({ ...msg, index: i })}
                  title="View details"
                  style={{
                    flexShrink: 0, width: '22px', height: '22px', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '11px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${msg.color}18`; e.currentTarget.style.color = msg.color; e.currentTarget.style.borderColor = `${msg.color}40` }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >⋯</button>
              )}
            </div>
          )
        })}
      </div>
      <FlowDialog open={!!dialog} onClose={() => setDialog(null)} msg={dialog} step={step} />
    </>
  )
}

// ─── AgentBox ─────────────────────────────────────────────────────────────────
function AgentBox({ label, role, status, isActive, isDone }) {
  const accent = label === 'A' ? '#60a5fa' : '#a78bfa'
  const borderColor = isDone ? '#34d399' : isActive ? accent : 'rgba(255,255,255,0.06)'
  return (
    <div style={{
      ...glass,
      padding: '16px',
      borderColor,
      boxShadow: isActive ? `0 0 24px ${accent}20` : 'none',
      transition: 'all 0.4s',
      minWidth: '160px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: isActive ? `${accent}20` : 'rgba(255,255,255,0.05)',
          border: `2px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
          transition: 'all 0.4s',
        }}>🤖</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600' }}>{role}</div>
        </div>
        {isDone && <span style={{ marginLeft: 'auto', color: '#34d399', fontSize: '14px' }}>✓</span>}
      </div>
      <div style={{ ...glassInner, padding: '5px 8px', ...mono, fontSize: '10px', ...muted, marginBottom: '8px' }}>
        {AGENTS[label].short}
      </div>
      <div style={{ fontSize: '11px', color: isActive ? accent : 'rgba(255,255,255,0.2)', minHeight: '16px' }}>
        {isActive ? `◌ ${status}` : isDone ? <span style={{ color: '#34d399' }}>Complete</span> : 'Idle'}
      </div>
    </div>
  )
}

function DemoHero() {
  return (
    <div
      style={{
        ...glass,
        position: 'relative',
        overflow: 'hidden',
        padding: '28px',
        minHeight: '260px',
        borderRadius: '24px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 12% 18%, rgba(0,212,255,0.18), transparent 26%),
            radial-gradient(circle at 88% 22%, rgba(123,97,255,0.18), transparent 28%),
            linear-gradient(135deg, rgba(5,11,24,0.96), rgba(10,18,34,0.92))
          `,
        }}
      />

      <div
        className="demo-hero-grid"
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
          gap: '22px',
          alignItems: 'end',
          minHeight: '204px',
        }}
      >
        <div style={{ maxWidth: '760px' }}>
          <div
            style={{
              color: '#00d4ff',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Verified Task Escrow
          </div>

          <h1
            style={{
              margin: 0,
              color: '#ffffff',
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(2.2rem, 4vw, 3.6rem)',
              lineHeight: 1.02,
              maxWidth: '9ch',
            }}
          >
            Pay on proof.
          </h1>

          <p
            style={{
              margin: '14px 0 0',
              color: 'rgba(220,232,246,0.88)',
              fontSize: '1.02rem',
              lineHeight: 1.65,
              maxWidth: '34ch',
            }}
          >
            Commit the spec, escrow on Flare, settle after attestation.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
            {['Committed Task Spec', 'Verifier Attestation', 'Flare Settlement'].map((chip) => (
              <span
                key={chip}
                style={{
                  padding: '8px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#dce8f6',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div
          className="demo-hero-points"
          style={{
            display: 'grid',
            gap: '10px',
            alignSelf: 'stretch',
          }}
        >
          {HERO_POINTS.map((point, index) => (
            <div
              key={point.label}
              style={{
                ...glassInner,
                padding: '14px 16px',
                background: 'rgba(7,11,24,0.48)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: index === 0 ? 'rgba(0,212,255,0.18)' : index === 1 ? 'rgba(123,97,255,0.18)' : 'rgba(0,229,160,0.18)',
                    color: index === 0 ? '#00d4ff' : index === 1 ? '#b39cff' : '#00e5a0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600' }}>{point.label}</div>
              </div>
              <div style={{ color: 'rgba(220,232,246,0.68)', fontSize: '12px', lineHeight: 1.55 }}>{point.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TaskQueuePanel (left column) ─────────────────────────────────────────────
function TaskQueuePanel({ currentTaskIdx, completedTasks, runState, onRun, onReset }) {
  return (
    <div style={{ ...glass, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>Task Queue</div>
          <div style={{ fontSize: '10px', ...muted }}>{TASK_QUEUE.length} tasks</div>
        </div>
        {runState === 'running'
          ? <button onClick={onReset} style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', outline: 'none' }}>Reset</button>
          : <button onClick={onRun} style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.8),rgba(20,184,166,0.8))', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', outline: 'none' }}>
              {runState === 'done' ? 'Run Again' : '▶ Run Demo'}
            </button>
        }
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {TASK_QUEUE.map(task => {
          const done   = completedTasks.some(t => t.idx === task.idx)
          const active = currentTaskIdx === task.idx && !done
          const borderColor = done ? '#34d399' : active ? '#60a5fa' : 'rgba(255,255,255,0.06)'
          return (
            <div key={task.idx} style={{
              ...glassInner,
              padding: '12px',
              borderColor,
              background: active ? 'rgba(96,165,250,0.06)' : done ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s',
              animation: active ? 'pulse-border 2s infinite' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: done ? '#34d399' : active ? '#60a5fa' : 'rgba(255,255,255,0.06)',
                  color: done || active ? '#000' : 'rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: '700', transition: 'all 0.3s',
                }}>{done ? '✓' : task.idx + 1}</div>
                <span style={{ fontSize: '12px', fontWeight: '500', color: active || done ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1 }}>{task.name}</span>
                {done   && <span style={{ fontSize: '9px', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '1px 6px', borderRadius: '4px' }}>DONE</span>}
                {active && <span style={{ fontSize: '9px', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '1px 6px', borderRadius: '4px' }}>LIVE</span>}
              </div>
              <div style={{ fontSize: '10px', ...muted, marginBottom: '2px', paddingLeft: '28px' }}>{task.description}</div>
              <div style={{ fontSize: '10px', color: '#fbbf24', paddingLeft: '28px' }}>{task.payment}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── CompletedJobsPanel (right column) ───────────────────────────────────────
function CompletedJobsPanel({ completedTasks }) {
  const totalFee = completedTasks.reduce((sum, t) => sum + parseFloat(t.fee), 0)

  return (
    <div style={{ ...glass, padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600' }}>Completed Jobs</div>
        <span style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
          {completedTasks.length} / {TASK_QUEUE.length}
        </span>
        {completedTasks.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#fbbf24' }}>
            Fee: {totalFee.toFixed(4)} USDT0
          </span>
        )}
      </div>

      {completedTasks.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', ...muted, fontSize: '13px' }}>
          Completed tasks will appear here
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Task', 'Task ID', 'Result', 'Payout', 'Fee', 'Block', 'Attestation'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', ...muted, fontWeight: '500', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completedTasks.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', animation: 'fadeIn 0.4s ease-out' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{r.name}</span>
                  </td>
                  <td style={{ padding: '10px 12px', ...mono, color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{r.taskIdShort}</td>
                  <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.resultSummary}</td>
                  <td style={{ padding: '10px 12px', color: '#34d399', whiteSpace: 'nowrap' }}>{r.payout}</td>
                  <td style={{ padding: '10px 12px', color: '#fbbf24', whiteSpace: 'nowrap' }}>{r.fee}</td>
                  <td style={{ padding: '10px 12px', ...mono, color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>{r.blockNumber}</td>
                  <td style={{ padding: '10px 12px', ...mono, color: '#a78bfa', fontSize: '11px', whiteSpace: 'nowrap' }}>{r.attestation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── LiveExecutionPanel (bottom) ─────────────────────────────────────────────
function LiveExecutionPanel({ runState, currentTaskIdx, currentStepId, completedSteps, visibleMessages, currentSteps, selectedStepId, setSelectedStepId, logs, logRef }) {
  const selectedStep = currentSteps.find(s => s.id === selectedStepId)
  const isActive = id => currentStepId === id && !completedSteps.has(id) && runState === 'running'
  const currentTask = TASK_QUEUE[currentTaskIdx]

  if (runState === 'idle') {
    return (
      <div style={{ ...glass, padding: '32px', textAlign: 'center', ...muted, fontSize: '13px' }}>
        Click <strong style={{ color: '#60a5fa' }}>▶ Run Demo</strong> to watch the agent communication flow live
      </div>
    )
  }

  return (
    <div style={{ ...glass, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: runState === 'running' ? '#34d399' : '#a78bfa', boxShadow: runState === 'running' ? '0 0 8px #34d399' : 'none', animation: runState === 'running' ? 'pulse-dot 1.5s infinite' : 'none' }} />
        <div style={{ fontSize: '13px', fontWeight: '600' }}>
          Live Execution
          {currentTask && <span style={{ color: '#60a5fa', marginLeft: '8px' }}>{currentTask.name}</span>}
        </div>
        {runState === 'done' && <span style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>ALL DONE</span>}
      </div>

      {/* Main 4-column: Agent A | steps tabs | flow | Agent B */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 160px 1fr 160px', gap: '12px', alignItems: 'stretch' }}>
        <AgentBox label="A" role="Publisher Agent" status={selectedStep?.agentAStatus}
          isActive={currentStepId != null && !completedSteps.has(currentStepId) && runState === 'running'}
          isDone={runState === 'done'} />

        {/* Vertical step tabs */}
        <div style={{ ...glassInner, padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', ...muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Steps</div>
          {(currentSteps.length ? currentSteps : buildSteps(TASK_QUEUE[0])).map(step => {
            const done     = completedSteps.has(step.id)
            const active   = isActive(step.id)
            const selected = selectedStepId === step.id
            const accent   = done ? '#34d399' : active ? '#60a5fa' : 'rgba(255,255,255,0.2)'
            return (
              <button key={step.id} onClick={() => currentSteps.length && setSelectedStepId(step.id)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', outline: 'none', textAlign: 'left',
                border: `1px solid ${selected ? accent : 'transparent'}`,
                background: selected ? `${done ? 'rgba(52,211,153,0.08)' : active ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)'}` : active ? 'rgba(96,165,250,0.05)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                <span style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  background: done ? '#34d399' : active ? '#60a5fa' : 'rgba(255,255,255,0.06)',
                  color: done || active ? '#000' : 'rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: '700', transition: 'all 0.3s',
                }}>{done ? '✓' : step.id}</span>
                <span style={{ fontSize: '11px', fontWeight: '500', color: accent, lineHeight: '1.3' }}>{step.title}</span>
              </button>
            )
          })}
        </div>

        <div style={{ ...glassInner, padding: '16px' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {[['#60a5fa','HTTP req'],['#34d399','200 OK'],['#f87171','402'],['#a78bfa','tx'],['#fbbf24','event']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c }} />
                <span style={{ fontSize: '10px', ...muted }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.15)', marginBottom: '10px', fontWeight: '600' }}>
            <span>← Publisher</span><span>Coston2 Testnet</span><span>Worker →</span>
          </div>

          {(() => {
            const step = currentSteps.find(s => s.id === selectedStepId)
            if (!step) return <div style={{ ...muted, fontSize: '12px', textAlign: 'center', padding: '20px' }}>Select a step to see the flow</div>
            const msgs = completedSteps.has(step.id)
              ? step.messages
              : (visibleMessages[step.id] ?? [])
            return (
              <div>
                <div style={{ fontSize: '10px', color: step.channelColor, fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: completedSteps.has(step.id) ? '#34d399' : step.channelColor, color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '700' }}>
                    {completedSteps.has(step.id) ? '✓' : step.id}
                  </span>
                  Step {step.id} — {step.title}
                  <span style={{ ...muted, fontWeight: '400', marginLeft: '4px' }}>{step.subtitle}</span>
                </div>
                <MessageFlow messages={msgs} step={step} />
              </div>
            )
          })()}
        </div>

        <AgentBox label="B" role="Worker Agent" status={selectedStep?.agentBStatus}
          isActive={currentStepId != null && !completedSteps.has(currentStepId) && runState === 'running'}
          isDone={runState === 'done'} />
      </div>

      {/* Activity log — full width */}
      <div style={{ ...glassInner, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', fontWeight: '600', ...muted }}>
          Activity Log
        </div>
        <div ref={logRef} style={{ flex: 1, padding: '8px 12px', overflowY: 'auto', maxHeight: '160px', ...mono }}>
          {logs.length === 0
            ? <div style={{ ...muted, fontSize: '11px' }}>No activity yet.</div>
            : logs.map((e, i) => {
                const c = { tx: '#a78bfa', event: '#fbbf24', success: '#34d399', error: '#f87171', divider: 'rgba(255,255,255,0.1)', info: 'rgba(255,255,255,0.25)', http: '#60a5fa' }[e.type] || 'rgba(255,255,255,0.4)'
                return (
                  <div key={i} style={{ display: 'flex', gap: '8px', padding: '2px 0', animation: 'fadeIn 0.2s ease-out' }}>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', minWidth: '60px' }}>{e.time}</span>
                    <span style={{ fontSize: '11px', color: c, flex: 1 }}>{e.message}</span>
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AgentDemo() {
  const [runState, setRunState]           = useState('idle')
  const [currentTaskIdx, setCurrentTaskIdx] = useState(-1)
  const [currentStepId, setCurrentStepId] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [visibleMessages, setVisibleMessages] = useState({})
  const [selectedStepId, setSelectedStepId] = useState(null)
  const [currentSteps, setCurrentSteps]   = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [logs, setLogs]                   = useState([])
  const logRef   = useRef(null)
  const abortRef = useRef(false)

  const addLog = (message, type = 'info') =>
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), message, type }])

  const prevLogsLen = useRef(0)
  if (logs.length !== prevLogsLen.current) {
    prevLogsLen.current = logs.length
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }

  const runDemo = async () => {
    abortRef.current = false
    setRunState('running')
    setCompletedTasks([])
    setLogs([])
    addLog('Starting demo — 3 tasks queued…', 'info')
    await delay(400)

    for (const task of TASK_QUEUE) {
      if (abortRef.current) break
      const steps = buildSteps(task)
      setCurrentTaskIdx(task.idx)
      setCurrentStepId(null)
      setCompletedSteps(new Set())
      setVisibleMessages({})
      setSelectedStepId(null)
      setCurrentSteps(steps)
      addLog(`Task ${task.idx + 1}/3 — ${task.name}`, 'info')

      for (const step of steps) {
        if (abortRef.current) break
        setCurrentStepId(step.id)
        setSelectedStepId(step.id)
        addLog(`Step ${step.id}: ${step.title}`, 'info')
        const revealed = []
        setVisibleMessages({ [step.id]: [] })
        for (const msg of step.messages) {
          if (abortRef.current) break
          await delay(800)
          revealed.push(msg)
          setVisibleMessages({ [step.id]: [...revealed] })
          addLog(msg.label, msg.type)
        }
        await delay(1000)
        setCompletedSteps(prev => new Set([...prev, step.id]))
      }

      if (!abortRef.current) {
        await delay(600)
        setCompletedTasks(prev => [...prev, task])
        addLog(`Task ${task.idx + 1} settled — ${task.payout} paid`, 'success')
      }
    }

    if (!abortRef.current) {
      addLog('All 3 tasks complete.', 'success')
      setRunState('done')
    }
  }

  const resetDemo = () => {
    abortRef.current = true
    setRunState('idle')
    setCurrentTaskIdx(-1)
    setCurrentStepId(null)
    setCompletedSteps(new Set())
    setVisibleMessages({})
    setSelectedStepId(null)
    setCurrentSteps([])
    setCompletedTasks([])
    setLogs([])
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(96,165,250,0.3);}50%{box-shadow:0 0 0 6px rgba(96,165,250,0);} }
        @keyframes pulse-dot { 0%,100%{opacity:1;}50%{opacity:0.4;} }

        @media (max-width: 1100px) {
          .demo-hero-grid {
            grid-template-columns: 1fr !important;
          }

          .demo-hero-points {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .demo-hero-points {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <DemoHero />

      {/* ── Top row: Task Queue (left) + Completed Jobs (right) ────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
        <TaskQueuePanel
          currentTaskIdx={currentTaskIdx}
          completedTasks={completedTasks}
          runState={runState}
          onRun={runDemo}
          onReset={resetDemo}
        />
        <CompletedJobsPanel completedTasks={completedTasks} />
      </div>

      {/* ── Bottom: Live Execution Panel ────────────────────────────────────── */}
      <LiveExecutionPanel
        runState={runState}
        currentTaskIdx={currentTaskIdx}
        currentStepId={currentStepId}
        completedSteps={completedSteps}
        visibleMessages={visibleMessages}
        currentSteps={currentSteps}
        selectedStepId={selectedStepId}
        setSelectedStepId={setSelectedStepId}
        logs={logs}
        logRef={logRef}
      />
    </div>
  )
}
