import { useEffect, useState } from "react";

import "./App.css";

import type { DashboardSnapshot, JobSnapshot } from "./types/demo";

const API_BASE = "/api";
const DEFAULT_PROMPT =
  "Introduce Steve_ZC as a 0G-powered publisher agent and explain how Woz_ZC completes deterministic marketplace jobs.";
const DEFAULT_SOURCE_TEXT =
  "ETHGlobal Cannes demo task: normalize this sentence, count the words, and prove the result deterministically.";

function App() {
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE_TEXT);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadDashboard = async () => {
    const response = await fetch(`${API_BASE}/status`);
    if (!response.ok) {
      throw new Error(`Demo API unavailable (${response.status}). Start \`npm run demo:server\`.`);
    }
    const snapshot = (await response.json()) as DashboardSnapshot;
    setDashboard(snapshot);
    setError(null);
  };

  useEffect(() => {
    loadDashboard().catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, []);

  const runAction = async (
    action: string,
    path: string,
    body?: Record<string, string>,
  ) => {
    setBusyAction(action);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body || {}),
      });
      const payload = (await response.json()) as DashboardSnapshot | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : `Request failed with ${response.status}`);
      }
      setDashboard(payload);
      setError(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setBusyAction(null);
    }
  };

  const latestJob: JobSnapshot | null = dashboard?.latestJob || null;
  const steve = dashboard?.agents.find((agent) => agent.name === "Steve_ZC") || null;
  const woz = dashboard?.agents.find((agent) => agent.name === "Woz_ZC") || null;

  return (
    <div className="app-container">
      <section className="hero-panel glass-panel">
        <div className="hero-copy">
          <p className="eyebrow">ETHGlobal Cannes • 0G Testnet Demo</p>
          <h1 className="title">Steve_ZC and Woz_ZC on the 0G Inference Layer</h1>
          <p className="hero-text">
            Steve_ZC publishes a deterministic job, Woz_ZC executes it, returns signed proof,
            and Steve_ZC validates the artifact before paying the reward.
          </p>
        </div>
        <div className="hero-status">
          <div className="metric-label">Network</div>
          <div className="metric-value">{dashboard?.network.name || "Loading..."}</div>
          <div className="metric-footnote">
            Chain ID {dashboard?.network.chainId ?? "…"} • {dashboard?.network.currency}
          </div>
          <button className="secondary-btn" onClick={() => loadDashboard().catch((err) => setError(String(err)))}>
            Refresh Snapshot
          </button>
        </div>
      </section>

      {error ? <div className="alert-panel error-panel">{error}</div> : null}

      <section className="dashboard-grid">
        <div className="glass-panel">
          <h2 className="card-title">0G Testnet</h2>
          <div className="data-row">
            <span className="data-label">RPC</span>
            <span className="data-value compact">{dashboard?.network.rpcUrl || "…"}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Explorer</span>
            <span className="data-value compact">{dashboard?.network.explorerUrl || "…"}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Inference Mode</span>
            <span className="data-value">
              {dashboard?.inference.configured ? "0G direct proxy" : "Needs service URL, model, and app key"}
            </span>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="card-title">Steve_ZC</h2>
          <div className="data-row">
            <span className="data-label">Address</span>
            <span className="data-value compact">{steve?.address || "Missing from Keychain"}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Expected</span>
            <span className="data-value compact">{steve?.expectedAddress || "Not set"}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Balance</span>
            <span className="data-value">{steve?.balance0g ? `${steve.balance0g} 0G` : "Unknown"}</span>
          </div>
          <div className="badge-row">
            <span className={`status-pill ${steve?.configured ? "ok" : "warn"}`}>
              {steve?.configured ? "Keychain Ready" : "Missing Key"}
            </span>
            {steve?.addressMatchesExpected === false ? (
              <span className="status-pill danger">Address Mismatch</span>
            ) : null}
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="card-title">Woz_ZC</h2>
          <div className="data-row">
            <span className="data-label">Address</span>
            <span className="data-value compact">{woz?.address || "Will auto-generate into Keychain"}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Balance</span>
            <span className="data-value">{woz?.balance0g ? `${woz.balance0g} 0G` : "Unknown"}</span>
          </div>
          <div className="badge-row">
            <span className={`status-pill ${woz?.configured ? "ok" : "warn"}`}>
              {woz?.configured ? "Ready" : "Created on First Demo Run"}
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-wide">
        <div className="glass-panel">
          <h2 className="card-title">0G Inference</h2>
          <label className="input-label" htmlFor="prompt">
            Steve_ZC Prompt
          </label>
          <textarea
            id="prompt"
            className="text-input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button
            className="action-btn"
            disabled={busyAction !== null}
            onClick={() => runAction("inference", "/inference/steve", { prompt })}
          >
            {busyAction === "inference" ? "Calling 0G Inference..." : "Run Steve_ZC Inference"}
          </button>
          <div className="response-box">
            {dashboard?.inference.lastResponse || "No inference response yet."}
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="card-title">Marketplace Flow</h2>
          <label className="input-label" htmlFor="source-text">
            Deterministic Job Input
          </label>
          <textarea
            id="source-text"
            className="text-input"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
          />
          <button
            className="action-btn"
            disabled={busyAction !== null}
            onClick={() => runAction("marketplace", "/marketplace/run", { sourceText })}
          >
            {busyAction === "marketplace" ? "Running Steve/Woz Demo..." : "Run Steve_ZC → Woz_ZC Demo"}
          </button>
          <div className="stack">
            <div className="mini-card">
              <div className="mini-label">Execution Report</div>
              <div className="mini-value">{latestJob?.executionReport || "No marketplace run yet."}</div>
            </div>
            <div className="mini-card">
              <div className="mini-label">Validator Result</div>
              <div className="mini-value">{latestJob?.validatorResult || "Waiting for proof."}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-wide">
        <div className="glass-panel">
          <h2 className="card-title">Latest Job</h2>
          {latestJob ? (
            <div className="stack">
              <div className="data-row">
                <span className="data-label">Job ID</span>
                <span className="data-value compact">{latestJob.id}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Status</span>
                <span className="data-value">{latestJob.status}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Reward</span>
                <span className="data-value">{latestJob.reward0g} 0G</span>
              </div>
              <div className="job-box">{latestJob.description}</div>
              <div className="criteria-list">
                {latestJob.deterministicCriteria.map((criterion) => (
                  <div key={criterion} className="criteria-item">
                    {criterion}
                  </div>
                ))}
              </div>
              <div className="artifact-grid">
                <div className="mini-card">
                  <div className="mini-label">Normalized Text</div>
                  <div className="mini-value">{latestJob.artifact?.normalizedText || "—"}</div>
                </div>
                <div className="mini-card">
                  <div className="mini-label">Word Count</div>
                  <div className="mini-value">{latestJob.artifact?.wordCount ?? "—"}</div>
                </div>
                <div className="mini-card">
                  <div className="mini-label">SHA-256</div>
                  <div className="mini-value compact">{latestJob.artifact?.sha256 || "—"}</div>
                </div>
                <div className="mini-card">
                  <div className="mini-label">Proof Signer</div>
                  <div className="mini-value compact">{latestJob.proof?.signer || "—"}</div>
                </div>
              </div>
              <div className="mini-card">
                <div className="mini-label">Payment</div>
                <div className="mini-value">
                  {latestJob.payment
                    ? `${latestJob.payment.mode} • ${latestJob.payment.executed ? latestJob.payment.txHash : "not broadcast"}`
                    : "No payment state yet."}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">Run the marketplace demo to publish the first Steve_ZC job.</div>
          )}
        </div>

        <div className="glass-panel">
          <h2 className="card-title">System Log</h2>
          <div className="log-container">
            {(dashboard?.logs || []).map((log) => (
              <div key={log} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
