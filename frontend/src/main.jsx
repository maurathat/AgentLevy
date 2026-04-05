import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { marked } from "marked";

import deckSourceMarkdown from "../../demo/HACKATHON_DECK_V2.md?raw";
import ercDraftMarkdown from "../../docs/erc-draft-vteai.md?raw";
import x402ComparisonUrl from "../../demo/Screen Shots for Project Submission/x402-comparison.svg";
import slidesHtmlSource from "../../preview/exports/hackathon-slides-v2.html?raw";
import agentLevyLogoUrl from "../../assets/logos/agentlevy-logo-horizontal.svg";
import AgentDemo from "./AgentDemo.jsx";

const NAV_ITEMS = [
  { id: "demo", label: "Demo" },
  { id: "slides", label: "Slides" },
  { id: "erc-draft", label: "ERC Draft" },
];

marked.setOptions({
  gfm: true,
  breaks: true,
});

function getPageFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  return NAV_ITEMS.some((item) => item.id === hash) ? hash : "demo";
}

function useBlobUrl(content, type) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const blob = new Blob([content], { type });
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [content, type]);

  return url;
}

function buildSlidesHtml(deckSourceUrl) {
  return slidesHtmlSource
    .replaceAll("../../assets/logos/agentlevy-logo-horizontal.svg", agentLevyLogoUrl)
    .replaceAll("../../demo/Screen%20Shots%20for%20Project%20Submission/x402-comparison.svg", x402ComparisonUrl)
    .replaceAll('href="../../demo/HACKATHON_DECK_V2.md"', `href="${deckSourceUrl}" target="_blank" rel="noreferrer"`)
    .replaceAll('href="index.html"', 'href="#"')
    .replaceAll('href="verifier-process.html"', 'href="#"');
}

function Shell() {
  const [page, setPage] = useState(getPageFromHash);

  const draftHtml = useMemo(() => marked.parse(ercDraftMarkdown), []);
  const deckSourceUrl = useBlobUrl(deckSourceMarkdown, "text/markdown");
  const draftSourceUrl = useBlobUrl(ercDraftMarkdown, "text/markdown");

  const slidesHtml = useMemo(() => buildSlidesHtml(deckSourceUrl), [deckSourceUrl]);
  const slidesUrl = useBlobUrl(slidesHtml, "text/html");

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(nextPage) {
    window.location.hash = nextPage;
  }

  return (
    <div
      style={{
        fontFamily: '"Calibri Light", Calibri, Arial, sans-serif',
        background:
          "radial-gradient(circle at top right, rgba(0, 212, 255, 0.10), transparent 28%), radial-gradient(circle at 15% 0%, rgba(123, 97, 255, 0.08), transparent 24%), #070B18",
        minHeight: "100vh",
        color: "#F5F7FA",
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,11,24,0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginRight: "16px" }}>
          Agent<span style={{ color: "#00D4FF" }}>Levy</span>
        </span>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            style={{
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              borderRadius: "8px",
              border: page === item.id ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
              background: page === item.id ? "rgba(0,212,255,0.08)" : "transparent",
              color: page === item.id ? "#00D4FF" : "rgba(255,255,255,0.4)",
              transition: "all 0.2s",
              outline: "none",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "28px 24px 40px" }}>
        {page === "demo" && <AgentDemo />}
        {page === "slides" && <SlidesPage slidesUrl={slidesUrl} deckSourceUrl={deckSourceUrl} />}
        {page === "erc-draft" && <DraftPage draftHtml={draftHtml} draftSourceUrl={draftSourceUrl} />}
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, description, actions = [] }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "22px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ maxWidth: "760px" }}>
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
          {eyebrow}
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
          {title}
        </h1>
        <p style={{ color: "#8A96B0", fontSize: "14px", margin: "10px 0 0" }}>{description}</p>
      </div>

      {actions.length > 0 && (
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {actions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target={action.target || "_blank"}
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: "999px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
                color: action.primary ? "#03151E" : "#00D4FF",
                background: action.primary ? "#00D4FF" : "#121C32",
                border: action.primary ? "1px solid #00D4FF" : "1px solid #243452",
              }}
            >
              {action.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SlidesPage({ slidesUrl, deckSourceUrl }) {
  return (
    <>
      <PageIntro
        eyebrow="Presentation"
        title="Hackathon slides embedded in the localhost app"
        description="The full deck is now available directly in the frontend so you can review the presentation without leaving the demo environment."
        actions={[
          { label: "Open Full Deck", href: slidesUrl, primary: true },
          { label: "Open Deck Source", href: deckSourceUrl },
        ]}
      />

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
            padding: "14px 18px",
            borderBottom: "1px solid #223354",
            color: "#8A96B0",
            fontSize: "13px",
          }}
        >
          Use the deck controls inside the embedded presentation. If you want the deck in a separate browser tab, use
          {" "}
          <span style={{ color: "#FFFFFF" }}>Open Full Deck</span>.
        </div>

        <iframe
          title="AgentLevy Hackathon Slides"
          src={slidesUrl}
          style={{
            display: "block",
            width: "100%",
            minHeight: "78vh",
            border: 0,
            background: "#050A14",
          }}
        />
      </div>
    </>
  );
}

function DraftPage({ draftHtml, draftSourceUrl }) {
  return (
    <>
      <PageIntro
        eyebrow="Standards Draft"
        title="ERC draft rendered inside the localhost app"
        description="The ERC-VTEAI draft is now readable directly from the frontend so you can review the standard alongside the demo and slides."
        actions={[{ label: "Open Raw Markdown", href: draftSourceUrl, primary: true }]}
      />

      <div
        style={{
          background: "linear-gradient(180deg, rgba(17,27,49,0.96), rgba(15,22,41,0.98))",
          borderRadius: "22px",
          border: "1px solid #223354",
          overflow: "hidden",
          boxShadow: "0 24px 50px rgba(0,0,0,0.24)",
        }}
      >
        <div className="erc-content" dangerouslySetInnerHTML={{ __html: draftHtml }} style={{ padding: "26px 28px 34px" }} />
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>
);
