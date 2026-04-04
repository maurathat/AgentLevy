/**
 * AgentLevy Frontend
 *
 * Routes:
 *   #dashboard  -> treasury dashboard
 *   #erc-draft  -> rendered ERC draft page from markdown source
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { marked } from "marked";
import ercDraftMarkdown from "../docs/erc-draft-vteai.md?raw";

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

const COSTON2_RPC = "https://coston2-api.flare.network/ext/C/rpc";
const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS || "";
const ERC_DRAFT_TITLE = "ERC Draft";

marked.setOptions({
  gfm: true,
  breaks: true,
});

function getRouteFromHash() {
  return window.location.hash === "#erc-draft" ? "erc-draft" : "dashboard";
}

function NavButton({ active, href, children }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        borderRadius: "999px",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "600",
        color: active ? "#03151E" : "#C9D5EA",
        background: active ? "#00D4FF" : "#121C32",
        border: active ? "1px solid #00D4FF" : "1px solid #243452",
      }}
    >
      {children}
    </a>
  );
}

function Header({ route, onExportCsv }) {
  const subtitle =
    route === "erc-draft"
      ? "Draft standard page rendered from markdown source"
      : "Taxai dashboard · Treasury state and settlement history";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "28px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <p
          style={{
            color: "#00D4FF",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}
        >
          AgentLevy Protocol
        </p>
        <h1
          style={{
            fontSize: "32px",
            fontFamily: "Georgia, serif",
            lineHeight: 1.02,
            color: "#FFFFFF",
            margin: 0,
          }}
        >
          The atomic trust layer for agent-to-agent commerce.
        </h1>
        <p style={{ color: "#8A96B0", fontSize: "14px", margin: "10px 0 0", maxWidth: "760px" }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <NavButton href="#dashboard" active={route === "dashboard"}>
          Dashboard
        </NavButton>
        <NavButton href="#erc-draft" active={route === "erc-draft"}>
          {ERC_DRAFT_TITLE}
        </NavButton>
        {route === "dashboard" && (
          <button
            onClick={onExportCsv}
            style={{
              background: "#1A2235",
              color: "#00D4FF",
              border: "1px solid #2A3A55",
              borderRadius: "999px",
              padding: "10px 14px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            Export Audit CSV
          </button>
        )}
      </div>
    </div>
  );
}

function DashboardView({
  levyRecords,
  totalCollected,
  treasuryBalance,
  totalTasks,
  levyRate,
  loading,
  lastUpdated,
  error,
}) {
  return (
    <>
      <p style={{ color: "#5E7194", fontSize: "12px", marginTop: "-6px", marginBottom: "24px" }}>
        Flare Coston2 · {lastUpdated ? `Updated ${lastUpdated}` : "Loading..."}
      </p>

      {error && (
        <div
          style={{
            background: "#2A1520",
            border: "1px solid #FF4466",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "#FF8A9B",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Levy Collected", value: `${totalCollected} FLR`, color: "#00D4FF" },
          { label: "Treasury Balance", value: `${treasuryBalance} FLR`, color: "#00E5A0" },
          { label: "Tasks Settled", value: totalTasks, color: "#FF6B35" },
          { label: "Levy Rate", value: `${levyRate} bps (${Number(levyRate || 0) / 100}%)`, color: "#A58FFF" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#0F1629",
              borderRadius: "18px",
              padding: "20px",
              border: "1px solid #1A2235",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.18)",
            }}
          >
            <p
              style={{
                color: "#8A96B0",
                fontSize: "11px",
                margin: "0 0 8px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: "700",
              }}
            >
              {card.label}
            </p>
            <p style={{ color: card.color, fontSize: "22px", fontWeight: "700", margin: 0 }}>
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0F1629", borderRadius: "18px", border: "1px solid #1A2235", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #1A2235" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>Levy Settlement History</h2>
        </div>

        {loading ? (
          <p style={{ padding: "24px", color: "#8A96B0", textAlign: "center" }}>Loading from Coston2...</p>
        ) : levyRecords.length === 0 ? (
          <p style={{ padding: "24px", color: "#8A96B0", textAlign: "center" }}>
            No settlements yet. Run the demo: <code>node sdk/agentWallet.js --demo</code>
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1A2235" }}>
                  {["Task ID", "Publisher Agent", "Worker Agent", "Task Fee", "Levy", "Timestamp", "Attestation"].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "#8A96B0",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {levyRecords.map((record, index) => (
                  <tr key={`${record.taskId}-${index}`} style={{ borderBottom: "1px solid #1A2235" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#00D4FF" }}>{record.taskId}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{record.agentA}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{record.agentB}</td>
                    <td style={{ padding: "12px 16px", color: "#00E5A0" }}>{record.taskFee} FLR</td>
                    <td style={{ padding: "12px 16px", color: "#FF6B35" }}>{record.levyAmount} FLR</td>
                    <td style={{ padding: "12px 16px", color: "#8A96B0" }}>{record.timestamp}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#A58FFF" }}>{record.attestationHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function DraftView({ draftHtml }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(17,27,49,0.96), rgba(15,22,41,0.98))",
        borderRadius: "22px",
        border: "1px solid #223354",
        overflow: "hidden",
        boxShadow: "0 24px 50px rgba(0,0,0,0.24)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          padding: "18px 22px",
          borderBottom: "1px solid #223354",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              color: "#00D4FF",
              fontSize: "11px",
              margin: "0 0 6px",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: "700",
            }}
          >
            Standards Draft
          </p>
          <h2 style={{ margin: 0, fontSize: "22px", fontFamily: "Georgia, serif" }}>{ERC_DRAFT_TITLE}</h2>
        </div>

        <a
          href="/erc-draft.md"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 14px",
            borderRadius: "999px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "600",
            color: "#00D4FF",
            background: "#121C32",
            border: "1px solid #243452",
          }}
        >
          Open Raw Markdown
        </a>
      </div>

      <div className="erc-content" dangerouslySetInnerHTML={{ __html: draftHtml }} style={{ padding: "26px 28px 34px" }} />
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash);
  const [levyRecords, setLevyRecords] = useState([]);
  const [totalCollected, setTotalCollected] = useState("0");
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [totalTasks, setTotalTasks] = useState("0");
  const [levyRate, setLevyRate] = useState("0");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [draftHtml, setDraftHtml] = useState("");

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (route !== "erc-draft") {
      return;
    }

    setDraftHtml(marked.parse(ercDraftMarkdown));
  }, [route]);

  useEffect(() => {
    if (route !== "dashboard") {
      return;
    }

    let cancelled = false;

    async function loadData() {
      if (!TREASURY_ADDRESS) {
        if (!cancelled) {
          setError("VITE_TREASURY_ADDRESS not set in .env");
          setLoading(false);
        }
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

        const records = [];
        for (let index = 0; index < Math.min(Number(count), 50); index += 1) {
          const record = await contract.getLevyRecord(index);
          records.push({
            taskId: `${record.taskId.slice(0, 10)}...`,
            agentA: `${record.agentA.slice(0, 6)}...${record.agentA.slice(-4)}`,
            agentB: `${record.agentB.slice(0, 6)}...${record.agentB.slice(-4)}`,
            taskFee: ethers.formatEther(record.taskFee),
            levyAmount: ethers.formatEther(record.levyAmount),
            timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
            attestationHash: `${record.attestationHash.slice(0, 10)}...`,
          });
        }

        if (!cancelled) {
          setTotalCollected(ethers.formatEther(total));
          setTreasuryBalance(ethers.formatEther(balance));
          setLevyRate(rate.toString());
          setTotalTasks(tasks.toString());
          setLevyRecords(records.reverse());
          setLastUpdated(new Date().toLocaleTimeString());
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    loadData();
    const interval = setInterval(loadData, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [route]);

  function exportCSV() {
    const headers = ["Task ID", "Publisher Agent", "Worker Agent", "Task Fee (FLR)", "Levy (FLR)", "Timestamp", "Attestation"];
    const rows = levyRecords.map((record) =>
      [record.taskId, record.agentA, record.agentB, record.taskFee, record.levyAmount, record.timestamp, record.attestationHash].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `agentlevy_audit_${Date.now()}.csv`;
    anchor.click();
  }

  return (
    <div
      style={{
        fontFamily: '"Calibri Light", Calibri, Arial, sans-serif',
        background:
          "radial-gradient(circle at top right, rgba(0, 212, 255, 0.10), transparent 28%), radial-gradient(circle at 15% 0%, rgba(123, 97, 255, 0.08), transparent 24%), #070B18",
        minHeight: "100vh",
        color: "#F5F7FA",
        padding: "28px 24px 40px",
      }}
    >
      <style>{`
        .erc-content {
          color: #dce8f6;
          line-height: 1.72;
          font-size: 1rem;
        }

        .erc-content h1,
        .erc-content h2,
        .erc-content h3,
        .erc-content h4 {
          font-family: Georgia, serif;
          color: #ffffff;
          line-height: 1.12;
          margin-top: 1.6em;
          margin-bottom: 0.55em;
        }

        .erc-content h1:first-child,
        .erc-content h2:first-child {
          margin-top: 0;
        }

        .erc-content p,
        .erc-content li {
          color: #dce8f6;
        }

        .erc-content a {
          color: #00d4ff;
        }

        .erc-content hr {
          border: 0;
          border-top: 1px dashed #223354;
          margin: 26px 0;
        }

        .erc-content pre {
          overflow: auto;
          background: #091122;
          border: 1px solid #1a2a45;
          border-radius: 16px;
          padding: 18px;
        }

        .erc-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: #00d4ff;
          background: rgba(0, 212, 255, 0.08);
          border: 1px solid rgba(0, 212, 255, 0.12);
          padding: 0.14em 0.36em;
          border-radius: 8px;
        }

        .erc-content pre code {
          color: #dce8f6;
          background: transparent;
          border: 0;
          padding: 0;
        }

        .erc-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          overflow: hidden;
        }

        .erc-content th,
        .erc-content td {
          border: 1px solid #223354;
          padding: 12px 14px;
          text-align: left;
          vertical-align: top;
        }

        .erc-content th {
          color: #ffffff;
          background: rgba(0, 212, 255, 0.08);
        }

        @media (max-width: 980px) {
          .erc-content table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>

      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <Header route={route} onExportCsv={exportCSV} />

        {route === "erc-draft" ? (
          <DraftView draftHtml={draftHtml} />
        ) : (
          <DashboardView
            levyRecords={levyRecords}
            totalCollected={totalCollected}
            treasuryBalance={treasuryBalance}
            totalTasks={totalTasks}
            levyRate={levyRate}
            loading={loading}
            lastUpdated={lastUpdated}
            error={error}
          />
        )}

        <p style={{ textAlign: "center", color: "#526784", fontSize: "12px", marginTop: "30px" }}>
          AgentLevy Protocol · ETHGlobal Cannes 2026 · Flare + XRPL + 0G
        </p>
      </div>
    </div>
  );
}
