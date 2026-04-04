/**
 * Taxai Dashboard — AgentLevy
 * Shows CFO/operator real-time levy accumulation
 * Reads LevySettled events from Treasury.sol via RPC
 *
 * cd dashboard && npm install && npm run dev
 */

import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Treasury ABI — only what the dashboard needs
const TREASURY_ABI = [
  "function getTreasuryBalance() view returns (uint256)",
  "function totalLevyCollected() view returns (uint256)",
  "function totalTasksSettled() view returns (uint256)",
  "function totalTaskVolume() view returns (uint256)",
  "function getLevyHistoryCount() view returns (uint256)",
  "function getLevyRecord(uint256 index) view returns (tuple(bytes32 taskId, address agentA, address agentB, uint256 taskFee, uint256 levyAmount, uint256 timestamp, bytes32 attestationHash))",
  "function levyBasisPoints() view returns (uint256)",
  "event LevySettled(bytes32 indexed taskId, address indexed agentA, address indexed agentB, uint256 taskFee, uint256 levyAmount, string serviceId, bytes32 attestationHash, uint256 timestamp)",
];

const COSTON2_RPC      = "https://coston2-api.flare.network/ext/C/rpc";
const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS || "";

export default function App() {
  const [levyRecords, setLevyRecords]         = useState([]);
  const [totalCollected, setTotalCollected]   = useState("0");
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [totalTasks, setTotalTasks]           = useState("0");
  const [levyRate, setLevyRate]               = useState("0");
  const [loading, setLoading]                 = useState(true);
  const [lastUpdated, setLastUpdated]         = useState(null);
  const [error, setError]                     = useState(null);

  async function loadData() {
    if (!TREASURY_ADDRESS) {
      setError("VITE_TREASURY_ADDRESS not set in .env");
      setLoading(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(COSTON2_RPC);
      const contract = new ethers.Contract(TREASURY_ADDRESS, TREASURY_ABI, provider);

      const [total, balance, rate, tasks, count] = await Promise.all([
        contract.totalLevyCollected(),
        contract.getTreasuryBalance(),
        contract.levyBasisPoints(),
        contract.totalTasksSettled(),
        contract.getLevyHistoryCount(),
      ]);

      setTotalCollected(ethers.formatEther(total));
      setTreasuryBalance(ethers.formatEther(balance));
      setLevyRate(rate.toString());
      setTotalTasks(tasks.toString());

      // Load levy records
      const records = [];
      for (let i = 0; i < Math.min(Number(count), 50); i++) {
        const r = await contract.getLevyRecord(i);
        records.push({
          taskId:          r.taskId.slice(0, 10) + "...",
          agentA:          r.agentA.slice(0, 6) + "..." + r.agentA.slice(-4),
          agentB:          r.agentB.slice(0, 6) + "..." + r.agentB.slice(-4),
          taskFee:         ethers.formatEther(r.taskFee),
          levyAmount:      ethers.formatEther(r.levyAmount),
          timestamp:       new Date(Number(r.timestamp) * 1000).toLocaleString(),
          attestationHash: r.attestationHash.slice(0, 10) + "...",
        });
      }

      setLevyRecords(records.reverse());
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  function exportCSV() {
    const headers = ["Task ID", "Agent A", "Agent B", "Task Fee (FLR)", "Levy (FLR)", "Timestamp", "Attestation"];
    const rows = levyRecords.map(r =>
      [r.taskId, r.agentA, r.agentB, r.taskFee, r.levyAmount, r.timestamp, r.attestationHash].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentlevy_audit_${Date.now()}.csv`;
    a.click();
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#070B18", minHeight: "100vh", color: "#F5F7FA", padding: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
            Taxai <span style={{ color: "#00D4FF" }}>Dashboard</span>
          </h1>
          <p style={{ color: "#8A96B0", fontSize: "13px", margin: "4px 0 0" }}>
            AgentLevy Protocol · Coston2 Testnet · {lastUpdated ? `Updated ${lastUpdated}` : "Loading..."}
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{ background: "#1A2235", color: "#00D4FF", border: "1px solid #2A3A55", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}
        >
          Export Audit CSV
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#2A1520", border: "1px solid #FF4466", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", color: "#FF4466", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Total Levy Collected", value: `${totalCollected} FLR`, color: "#00D4FF" },
          { label: "Treasury Balance",     value: `${treasuryBalance} FLR`, color: "#00FF88" },
          { label: "Tasks Settled",        value: totalTasks, color: "#FF9500" },
          { label: "Levy Rate",            value: `${levyRate} bps (${Number(levyRate) / 100}%)`, color: "#AA88FF" },
        ].map((card, i) => (
          <div key={i} style={{ background: "#0F1629", borderRadius: "12px", padding: "20px", border: "1px solid #1A2235" }}>
            <p style={{ color: "#8A96B0", fontSize: "12px", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</p>
            <p style={{ color: card.color, fontSize: "20px", fontWeight: "700", margin: 0 }}>{loading ? "..." : card.value}</p>
          </div>
        ))}
      </div>

      {/* Levy History Table */}
      <div style={{ background: "#0F1629", borderRadius: "12px", border: "1px solid #1A2235", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1A2235" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Levy Settlement History</h2>
        </div>

        {loading ? (
          <p style={{ padding: "20px", color: "#8A96B0", textAlign: "center" }}>Loading from Coston2...</p>
        ) : levyRecords.length === 0 ? (
          <p style={{ padding: "20px", color: "#8A96B0", textAlign: "center" }}>No settlements yet. Run the demo: node sdk/agentWallet.js --demo</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1A2235" }}>
                {["Task ID", "Agent A", "Agent B", "Task Fee", "Levy", "Timestamp", "Attestation"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#8A96B0", fontWeight: "500", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {levyRecords.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1A2235" }}>
                  <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#00D4FF" }}>{r.taskId}</td>
                  <td style={{ padding: "10px 16px", fontFamily: "monospace" }}>{r.agentA}</td>
                  <td style={{ padding: "10px 16px", fontFamily: "monospace" }}>{r.agentB}</td>
                  <td style={{ padding: "10px 16px", color: "#00FF88" }}>{r.taskFee} FLR</td>
                  <td style={{ padding: "10px 16px", color: "#FF9500" }}>{r.levyAmount} FLR</td>
                  <td style={{ padding: "10px 16px", color: "#8A96B0" }}>{r.timestamp}</td>
                  <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#AA88FF" }}>{r.attestationHash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", color: "#3A4A65", fontSize: "12px", marginTop: "32px" }}>
        AgentLevy Protocol · ETHGlobal Cannes 2026 · Flare + XRPL
      </p>
    </div>
  );
}
