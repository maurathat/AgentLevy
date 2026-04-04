/**
 * AgentDemo — 3-task walkthrough of Agent A ↔ Agent B communication
 * Each task runs through all 5 protocol steps; results accumulate in a table.
 */

import { useState, useRef } from 'react'

// ─── Shared mock addresses ────────────────────────────────────────────────────
const AGENTS = {
  A: { short: '0xA1b2…A9b0' },
  B: { short: '0xDeAd…4567' },
}

// ─── 3 distinct tasks ─────────────────────────────────────────────────────────
const TASK_QUEUE = [
  {
    idx: 0,
    taskIdShort: '0x7f3a…4b5c',
    name: 'product-scrape',
    description: 'Scrape product price from e-commerce URL',
    payment: '1.00 USDC',
    payout: '0.99 USDC',
    levy: '0.01 USDC',
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
    payment: '0.50 USDC',
    payout: '0.495 USDC',
    levy: '0.005 USDC',
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
    payment: '0.75 USDC',
    payout: '0.7425 USDC',
    levy: '0.0075 USDC',
    txHash1: '0xeeee5555ffff66667777aaaa',
    txHash2: '0xffff66667777aaaa8888bbbb',
    attestation: '0xf7a8b9c0…e5f6a7b8',
    blockNumber: 8422891,
    resultData: { collection: 'Flare Punks', floor: '420 FLR', volume24h: '12,400 FLR', listed: 47 },
    resultSummary: 'Flare Punks · floor: 420 FLR · vol: 12,400 FLR',
  },
]

// ─── Generate the 5 protocol steps for a given task ───────────────────────────
function buildSteps(t) {
  return [
    {
      id: 1,
      title: 'Spec Discovery',
      subtitle: `Agent A → GET /tasks/${t.name}/spec`,
      channel: 'HTTP', channelColor: '#00D4FF',
      agentAStatus: 'Fetching task specification…',
      agentBStatus: 'Serving /tasks endpoint',
      messages: [
        { dir: 'A→B', label: `GET /tasks/${t.name}/spec`, color: '#00D4FF', type: 'http' },
        { dir: 'B→A', label: '200 OK — TaskSpec returned', color: '#00FF88', type: 'http' },
      ],
      payloads: {
        'HTTP Request': `GET http://localhost:3001/tasks/${t.name}/spec\nAccept: application/json`,
        'HTTP Response': JSON.stringify({
          taskId: t.name + '-v1',
          description: t.description,
          verification: { type: 'json_schema', criteria: { required: Object.keys(t.resultData) } },
          payment: { token: '0xaB45…cD89', amount: t.payment, symbol: 'USDC' },
        }, null, 2),
      },
    },
    {
      id: 2,
      title: 'Task Posted On-Chain',
      subtitle: 'Agent A approves USDC + calls postTask()',
      channel: 'Blockchain', channelColor: '#AA88FF',
      agentAStatus: `Approving ${t.payment} + posting task…`,
      agentBStatus: 'Watching chain for TaskPosted events…',
      messages: [
        { dir: 'A→chain', label: `USDC.approve(TaskRegistry, ${t.payment})`, color: '#AA88FF', type: 'tx' },
        { dir: 'A→chain', label: `TaskRegistry.postTask(specHash, ${t.payment}, 1hr)`, color: '#AA88FF', type: 'tx' },
        { dir: 'chain→B', label: 'TaskPosted event → Agent B listener', color: '#FF9500', type: 'event' },
      ],
      payloads: {
        'Transaction': JSON.stringify({
          to: 'TaskRegistry', function: 'postTask',
          args: { specHash: t.taskIdShort, amount: t.payment, token: 'USDC', timeoutSeconds: 3600 },
          txHash: t.txHash1,
        }, null, 2),
        'TaskPosted Event': JSON.stringify({
          event: 'TaskPosted', taskId: t.taskIdShort,
          poster: AGENTS.A.short, amount: t.payment,
          deadline: '2026-04-04T14:00:00Z', blockNumber: t.blockNumber - 200,
        }, null, 2),
      },
    },
    {
      id: 3,
      title: 'Claim Handshake',
      subtitle: 'Agent B detects TaskPosted → calls claimTask()',
      channel: 'Blockchain', channelColor: '#AA88FF',
      agentAStatus: 'Polling chain — waiting for TaskClaimed…',
      agentBStatus: 'Detected TaskPosted — calling claimTask()',
      messages: [
        { dir: 'chain→B', label: 'TaskPosted event received by Agent B watcher', color: '#FF9500', type: 'event' },
        { dir: 'B→chain', label: `TaskRegistry.claimTask(${t.taskIdShort})`, color: '#AA88FF', type: 'tx' },
        { dir: 'chain→A', label: 'TaskClaimed event — Agent A unblocks', color: '#FF9500', type: 'event' },
      ],
      payloads: {
        'Event Received': JSON.stringify({ event: 'TaskPosted', taskId: t.taskIdShort, canExecute: true, matchedSpec: t.name + '-v1' }, null, 2),
        'Transaction': JSON.stringify({ to: 'TaskRegistry', function: 'claimTask', args: { taskId: t.taskIdShort }, txHash: t.txHash2 }, null, 2),
        'TaskClaimed Event': JSON.stringify({ event: 'TaskClaimed', taskId: t.taskIdShort, executor: AGENTS.B.short, blockNumber: t.blockNumber - 100 }, null, 2),
      },
    },
    {
      id: 4,
      title: 'x402 Payment',
      subtitle: 'Agent A pays on-chain, retries with proof header',
      channel: 'HTTP + Blockchain', channelColor: '#00D4FF',
      agentAStatus: 'Handling 402 → sending USDC → retrying…',
      agentBStatus: 'x402 middleware verifying on-chain transfer',
      messages: [
        { dir: 'A→B', label: `POST /tasks/${t.name}/execute`, color: '#00D4FF', type: 'http' },
        { dir: 'B→A', label: `402 Payment Required — payTo ${AGENTS.B.short}`, color: '#FF4466', type: 'http' },
        { dir: 'A→chain', label: `USDC.transfer(AgentB, ${t.payment})`, color: '#AA88FF', type: 'tx' },
        { dir: 'A→B', label: `POST /tasks/${t.name}/execute  +  X-Payment: {txHash}`, color: '#00D4FF', type: 'http' },
        { dir: 'B→A', label: '200 OK — task result returned', color: '#00FF88', type: 'http' },
      ],
      payloads: {
        '402 Response': JSON.stringify({ status: 402, accepts: [{ scheme: 'exact', network: 'coston2', payTo: AGENTS.B.short, maxAmountRequired: t.payment, asset: 'USDC' }] }, null, 2),
        'X-Payment Header': JSON.stringify({ x402Version: 1, scheme: 'exact', network: 'coston2', payload: { from: AGENTS.A.short, txHash: t.txHash1, amount: t.payment } }, null, 2),
        '200 Response': JSON.stringify({ result: t.resultData }, null, 2),
      },
    },
    {
      id: 5,
      title: 'Proof & Settlement',
      subtitle: 'Agent B submits proof; Treasury releases payment',
      channel: 'Blockchain', channelColor: '#00FF88',
      agentAStatus: 'Waiting for TaskSettled event…',
      agentBStatus: 'Hashing result → submitting proof…',
      messages: [
        { dir: 'B→chain', label: 'Verifier.submitProof(taskId, resultHash, attestation)', color: '#AA88FF', type: 'tx' },
        { dir: 'chain→B', label: 'TaskVerified — proof accepted', color: '#00FF88', type: 'event' },
        { dir: 'chain→B', label: `Treasury.pay(AgentB, ${t.payout}) — levy 1%`, color: '#00FF88', type: 'event' },
        { dir: 'chain→A', label: 'TaskSettled event — Agent A confirms', color: '#FF9500', type: 'event' },
      ],
      payloads: {
        'submitProof Args': JSON.stringify({ taskId: t.taskIdShort, resultHash: '0x' + t.txHash1.slice(2, 26) + '…', attestation: t.attestation, storageURI: 'ipfs://QmX7f9…' }, null, 2),
        'TaskSettled Event': JSON.stringify({ event: 'TaskSettled', taskId: t.taskIdShort, recipient: AGENTS.B.short, amount: t.payout, levy: t.levy, attestationHash: t.attestation, blockNumber: t.blockNumber }, null, 2),
      },
    },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms))

const TYPE_ICON = { tx: '⛓', event: '⚡', http: '→' }

// ─── Sub-components ───────────────────────────────────────────────────────────
function AgentBox({ label, role, status, isActive, isDone }) {
  const border = isDone ? '#00FF88' : isActive ? '#00D4FF' : '#1A2235'
  return (
    <div style={{
      background: '#0F1629', border: `1px solid ${border}`, borderRadius: '12px',
      padding: '18px', minHeight: '160px', transition: 'border-color 0.4s, box-shadow 0.4s',
      boxShadow: isActive ? '0 0 20px rgba(0,212,255,0.15)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: isActive ? 'rgba(0,212,255,0.15)' : '#1A2235',
          border: `2px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '700', color: border, transition: 'all 0.4s',
        }}>{label}</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#F5F7FA' }}>Agent {label}</div>
          <div style={{ fontSize: '11px', color: '#8A96B0' }}>{role}</div>
        </div>
        {isDone && <span style={{ marginLeft: 'auto', color: '#00FF88' }}>✓</span>}
      </div>
      <div style={{ background: '#070B18', borderRadius: '6px', padding: '5px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#8A96B0', marginBottom: '10px' }}>
        {AGENTS[label].short}
      </div>
      <div style={{ fontSize: '12px', color: isActive ? '#00D4FF' : '#3A4A65' }}>
        {isActive ? <span>◌ {status}</span> : isDone ? <span style={{ color: '#00FF88' }}>Step complete</span> : 'Idle'}
      </div>
    </div>
  )
}

function MessageFlow({ messages }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {messages.map((msg, i) => {
        const toRight = msg.dir.startsWith('A') || msg.dir === 'B→chain'
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 10px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${msg.color}22`,
            animation: 'fadeIn 0.35s ease-out both',
            animationDelay: `${i * 0.08}s`,
          }}>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4A5A75', minWidth: '68px' }}>{msg.dir}</span>
            <div style={{ flex: 1, position: 'relative', height: '1px', background: `linear-gradient(90deg, ${msg.color}33, ${msg.color}, ${msg.color}33)` }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                background: '#070B18', padding: '2px 8px', borderRadius: '4px',
                fontSize: '11px', color: msg.color, whiteSpace: 'nowrap',
                border: `1px solid ${msg.color}33`,
                fontFamily: msg.type === 'tx' ? 'monospace' : 'inherit',
              }}>
                {TYPE_ICON[msg.type]} {msg.label}
              </div>
            </div>
            {toRight
              ? <span style={{ color: msg.color, fontSize: '12px' }}>►</span>
              : <span style={{ color: msg.color, fontSize: '12px', order: -2 }}>◄</span>
            }
            <span style={{
              fontSize: '10px', padding: '1px 5px', borderRadius: '4px',
              background: `${msg.color}18`, color: msg.color,
              fontWeight: '600', textTransform: 'uppercase', minWidth: '48px', textAlign: 'center',
            }}>{msg.type}</span>
          </div>
        )
      })}
    </div>
  )
}

function PayloadPanel({ payloads }) {
  const tabs = Object.keys(payloads)
  const [tab, setTab] = useState(tabs[0])
  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? '#1A2235' : 'transparent',
            color: tab === t ? '#00D4FF' : '#8A96B0',
            border: tab === t ? '1px solid #2A3A55' : '1px solid transparent',
            borderRadius: '6px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>
      <pre style={{
        background: '#070B18', borderRadius: '8px', padding: '12px',
        fontSize: '11px', color: '#A0B4C8', lineHeight: '1.6', margin: 0,
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        border: '1px solid #1A2235', maxHeight: '180px', overflowY: 'auto', overflowX: 'auto',
      }}>{payloads[tab]}</pre>
    </div>
  )
}

function CompletedTasksTable({ tasks }) {
  if (tasks.length === 0) return null
  const cols = ['#', 'Task', 'Task ID', 'Result', 'Paid', 'Levy', 'Block', 'Attestation']
  return (
    <div style={{ background: '#0F1629', border: '1px solid #1A2235', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #1A2235', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#F5F7FA' }}>Settled Tasks</span>
        <span style={{ background: '#00FF8818', color: '#00FF88', fontSize: '11px', padding: '1px 8px', borderRadius: '10px', fontWeight: '600' }}>
          {tasks.length} / {TASK_QUEUE.length}
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1A2235' }}>
              {cols.map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#8A96B0', fontWeight: '500', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #0D1525', animation: 'fadeIn 0.4s ease-out' }}>
                <td style={{ padding: '10px 14px', color: '#4A5A75', fontWeight: '600' }}>{r.idx}</td>
                <td style={{ padding: '10px 14px', color: '#F5F7FA', fontWeight: '500', whiteSpace: 'nowrap' }}>
                  <span style={{ background: '#00D4FF18', color: '#00D4FF', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{r.name}</span>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#8A96B0', fontSize: '11px' }}>{r.taskIdShort}</td>
                <td style={{ padding: '10px 14px', color: '#C8D6E8', maxWidth: '220px' }}>{r.resultSummary}</td>
                <td style={{ padding: '10px 14px', color: '#00FF88', whiteSpace: 'nowrap' }}>{r.payout}</td>
                <td style={{ padding: '10px 14px', color: '#FF9500', whiteSpace: 'nowrap' }}>{r.levy}</td>
                <td style={{ padding: '10px 14px', color: '#4A5A75', fontFamily: 'monospace', fontSize: '11px' }}>{r.blockNumber}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#AA88FF', fontSize: '11px', whiteSpace: 'nowrap' }}>{r.attestation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AgentDemo() {
  const [runState, setRunState] = useState('idle')   // idle | running | done
  const [currentTaskIdx, setCurrentTaskIdx] = useState(-1)
  const [currentStepId, setCurrentStepId] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [visibleMessages, setVisibleMessages] = useState({})  // stepId → msg[]
  const [selectedStepId, setSelectedStepId] = useState(null)
  const [currentSteps, setCurrentSteps] = useState([])        // steps for active task
  const [completedTasks, setCompletedTasks] = useState([])
  const [logs, setLogs] = useState([])
  const logRef = useRef(null)
  const abortRef = useRef(false)

  const addLog = (message, type = 'info') =>
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), message, type }])

  // Auto-scroll log
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
    addLog('Sending 3 tasks to Agent B…', 'info')
    await delay(400)

    for (const task of TASK_QUEUE) {
      if (abortRef.current) break

      const steps = buildSteps(task)

      // Reset per-task state
      setCurrentTaskIdx(task.idx)
      setCurrentStepId(null)
      setCompletedSteps(new Set())
      setVisibleMessages({})
      setSelectedStepId(null)
      setCurrentSteps(steps)

      addLog('─'.repeat(44), 'divider')
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
        addLog(`Task ${task.idx + 1} settled — ${task.payout} paid to Agent B`, 'success')
      }
    }

    if (!abortRef.current) {
      addLog('─'.repeat(44), 'divider')
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

  const selectedStep = currentSteps.find(s => s.id === selectedStepId)
  const isStepActive = id => currentStepId === id && !completedSteps.has(id) && runState === 'running'

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#070B18', minHeight: '100vh', color: '#F5F7FA', padding: '24px' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,0.3);}50%{box-shadow:0 0 0 6px rgba(0,212,255,0);} }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px', color: '#FFF' }}>
            Agent Communication <span style={{ color: '#00D4FF' }}>Demo</span>
          </h1>
          <p style={{ color: '#8A96B0', fontSize: '13px', margin: 0 }}>
            3 tasks · 5 protocol steps each · results accumulate below
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {runState === 'running' && (
            <button onClick={resetDemo} style={{ background: '#2A1520', color: '#FF4466', border: '1px solid #FF446644', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}>
              Reset
            </button>
          )}
          {runState !== 'running' && (
            <button onClick={runDemo} style={{
              background: 'linear-gradient(135deg,#0066CC,#00D4FF)', color: '#FFF', border: 'none',
              borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              boxShadow: '0 4px 16px rgba(0,212,255,0.3)',
            }}>
              {runState === 'done' ? 'Run Again' : 'Send 3 Tasks'}
            </button>
          )}
        </div>
      </div>

      {/* ── Task queue progress ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {TASK_QUEUE.map(task => {
          const done = completedTasks.some(t => t.idx === task.idx)
          const active = currentTaskIdx === task.idx && !done
          const color = done ? '#00FF88' : active ? '#00D4FF' : '#1A2235'
          return (
            <div key={task.idx} style={{
              flex: 1, background: '#0A0E1C', border: `1px solid ${color}`,
              borderRadius: '10px', padding: '10px 14px', transition: 'all 0.3s',
              animation: active ? 'pulse-border 2s infinite' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: done ? '#00FF88' : active ? '#00D4FF' : '#1A2235',
                  color: done || active ? '#070B18' : '#4A5A75',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '700', transition: 'all 0.3s',
                }}>
                  {done ? '✓' : task.idx + 1}
                </div>
                <span style={{ fontSize: '10px', color: '#4A5A75' }}>Task {task.idx + 1}/3</span>
                {done && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#00FF88' }}>Settled</span>}
                {active && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#00D4FF' }}>Running…</span>}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: active || done ? '#F5F7FA' : '#8A96B0' }}>{task.name}</div>
              <div style={{ fontSize: '11px', color: '#4A5A75', marginTop: '2px' }}>{task.payment}</div>
            </div>
          )
        })}
      </div>

      {/* ── Step progress (current task) ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(currentSteps.length ? currentSteps : buildSteps(TASK_QUEUE[0])).map(step => {
          const done = completedSteps.has(step.id)
          const active = isStepActive(step.id)
          const selected = selectedStepId === step.id
          const color = done ? '#00FF88' : active ? '#00D4FF' : '#1A2235'
          return (
            <div key={step.id} onClick={() => currentSteps.length && setSelectedStepId(step.id)} style={{
              flex: 1, background: selected ? '#0F1629' : '#0A0E1C',
              border: `1px solid ${color}`, borderRadius: '8px', padding: '10px 12px',
              cursor: currentSteps.length ? 'pointer' : 'default', transition: 'all 0.3s',
              opacity: runState === 'idle' ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  background: done ? '#00FF88' : active ? '#00D4FF' : '#1A2235',
                  color: done || active ? '#070B18' : '#4A5A75',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: '700',
                }}>{done ? '✓' : step.id}</div>
                <span style={{ fontSize: '10px', background: `${step.channelColor}18`, color: step.channelColor, padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>{step.channel}</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: '500', color: active || done ? '#F5F7FA' : '#8A96B0', lineHeight: '1.3' }}>{step.title}</div>
            </div>
          )
        })}
      </div>

      {/* ── Main 3-column area ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '185px 1fr 185px', gap: '12px', marginBottom: '16px' }}>
        <AgentBox label="A" role="Buyer / Orchestrator" status={selectedStep?.agentAStatus}
          isActive={currentStepId != null && !completedSteps.has(currentStepId) && runState === 'running'}
          isDone={runState === 'done'} />

        {/* Message flow */}
        <div style={{ background: '#0A0E1C', border: '1px solid #1A2235', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[['#00D4FF','HTTP req'],['#00FF88','HTTP 200'],['#FF4466','402'],['#AA88FF','tx'],['#FF9500','event']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c }} />
                <span style={{ fontSize: '10px', color: '#3A4A65' }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#2A3A55', marginBottom: '10px', fontWeight: '600' }}>
            <span>← Agent A</span><span>Coston2 Testnet</span><span>Agent B →</span>
          </div>

          {runState === 'idle' && (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#3A4A65', fontSize: '13px' }}>
              Click <strong style={{ color: '#00D4FF' }}>Send 3 Tasks</strong> to watch the protocol run live.
            </div>
          )}

          {Object.entries(visibleMessages).map(([stepId, msgs]) => {
            if (!msgs.length) return null
            const step = currentSteps.find(s => s.id === Number(stepId))
            if (!step) return null
            return (
              <div key={stepId}>
                <div style={{ fontSize: '10px', color: step.channelColor, fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{
                    width: '15px', height: '15px', borderRadius: '50%',
                    background: completedSteps.has(step.id) ? '#00FF88' : step.channelColor,
                    color: '#070B18', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '700',
                  }}>{completedSteps.has(step.id) ? '✓' : step.id}</span>
                  Step {step.id} — {step.title}
                </div>
                <MessageFlow messages={msgs} />
              </div>
            )
          })}
        </div>

        <AgentBox label="B" role="Seller / Executor" status={selectedStep?.agentBStatus}
          isActive={currentStepId != null && !completedSteps.has(currentStepId) && runState === 'running'}
          isDone={runState === 'done'} />
      </div>

      {/* ── Step detail (payload panel) ───────────────────────────────────── */}
      {selectedStep && (
        <div style={{
          background: '#0F1629', border: `1px solid ${selectedStep.channelColor}44`,
          borderRadius: '12px', padding: '18px', marginBottom: '16px',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: selectedStep.channelColor, color: '#070B18', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>{selectedStep.id}</div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#F5F7FA' }}>{selectedStep.title}</div>
              <div style={{ fontSize: '11px', color: '#8A96B0' }}>{selectedStep.subtitle}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', borderRadius: '5px', background: `${selectedStep.channelColor}18`, color: selectedStep.channelColor, fontWeight: '600' }}>{selectedStep.channel}</span>
          </div>
          <PayloadPanel payloads={selectedStep.payloads} />
        </div>
      )}

      {/* ── Settled tasks table ───────────────────────────────────────────── */}
      <CompletedTasksTable tasks={completedTasks} />

      {/* ── Activity log ──────────────────────────────────────────────────── */}
      <div style={{ background: '#0A0E1C', border: '1px solid #1A2235', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #1A2235', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#F5F7FA' }}>Activity Log</span>
          {logs.length > 0 && <button onClick={() => setLogs([])} style={{ background: 'none', border: 'none', color: '#3A4A65', fontSize: '11px', cursor: 'pointer' }}>Clear</button>}
        </div>
        <div ref={logRef} style={{ padding: '10px 16px', maxHeight: '180px', overflowY: 'auto', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
          {logs.length === 0
            ? <div style={{ color: '#2A3A55', fontSize: '11px' }}>No activity yet.</div>
            : logs.map((e, i) => {
              const c = { tx: '#AA88FF', event: '#FF9500', success: '#00FF88', error: '#FF4466', divider: '#1A2235', info: '#3A4A65', http: '#00D4FF' }[e.type] || '#8A96B0'
              return (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '3px 0', borderBottom: '1px solid #0D1525', animation: 'fadeIn 0.25s ease-out' }}>
                  <span style={{ color: '#2A3A55', fontSize: '10px', fontFamily: 'monospace', minWidth: '64px' }}>{e.time}</span>
                  <span style={{ fontSize: '11px', color: c, flex: 1 }}>{e.message}</span>
                </div>
              )
            })}
        </div>
      </div>

      <p style={{ textAlign: 'center', color: '#1A2235', fontSize: '11px', marginTop: '20px' }}>
        AgentLevy Protocol · ETHGlobal Cannes 2026 · Flare Coston2 + XRPL
      </p>
    </div>
  )
}
