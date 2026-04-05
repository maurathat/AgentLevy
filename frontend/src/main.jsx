import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { marked } from "marked";

import deckSourceMarkdown from "../../demo/HACKATHON_DECK_V2.md?raw";
import ercDraftMarkdown from "../../docs/erc-draft-vteai.md?raw";
import x402ComparisonSvgMarkup from "../../demo/x402-comparison.svg?raw";
import slidesHtmlSource from "../../preview/exports/hackathon-slides-v2.html?raw";
import agentLevyLogoUrl from "../../assets/logos/agentlevy-logo-horizontal.svg";
import agentLevyIconUrl from "../../demo/Logos/files/agentlevy-icon-128.png";
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

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n*/);

  if (!match) {
    return { metadata: {}, body: markdown.trim() };
  }

  const metadata = {};
  for (const line of match[1].split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    metadata[key] = value;
  }

  return {
    metadata,
    body: markdown.slice(match[0].length).trim(),
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripLeadingTitle(markdown, title) {
  if (!title) return markdown.trim();

  const titlePattern = new RegExp(`^#\\s+${escapeRegExp(title)}\\s*\\n+`);
  return markdown.replace(titlePattern, "").trim();
}

function extractSimpleSummary(markdown) {
  const match = markdown.match(/^## Simple Summary\s+([\s\S]*?)(?=\n##\s|\n#\s|$)/m);
  if (!match) return "";

  return match[1]
    .split(/\n\s*\n/)[0]
    .replace(/\n/g, " ")
    .trim();
}

function hasMeaningfulMeta(value) {
  return Boolean(value) && value !== "<TBD>";
}

function formatDraftDate(value) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

function buildSlidesHtml(deckSourceUrl, options = {}) {
  const { fullscreen = false } = options;

  const fullscreenCss = fullscreen
    ? `
        .chrome {
          display: none !important;
        }

        .viewport {
          padding: 0 !important;
        }

        .deck {
          width: 100vw !important;
          height: 100vh !important;
        }

        .slide {
          border-radius: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
        }
      `
    : "";

  const fullscreenScript = fullscreen
    ? `
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'agentlevy-slides-next') {
          next();
        }

        if (event.data?.type === 'agentlevy-slides-prev') {
          prev();
        }
      });

      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          window.parent.postMessage({ type: 'agentlevy-close-slides-fullscreen' }, '*');
        }
      });
    `
    : "";

  return slidesHtmlSource
    .replaceAll("../../assets/logos/agentlevy-logo-horizontal.svg", agentLevyLogoUrl)
    .replace(
      '<img src="../../demo/x402-comparison.svg" alt="Standard x402 versus AgentLevy x402 comparison" />',
      x402ComparisonSvgMarkup
    )
    .replaceAll('href="../../demo/HACKATHON_DECK_V2.md"', `href="${deckSourceUrl}" target="_blank" rel="noreferrer"`)
    .replaceAll('href="index.html"', 'href="#"')
    .replaceAll('href="verifier-process.html"', 'href="#"')
    .replace(
      "</style>",
      `
        .back-link,
        #notesBtn,
        .notes-panel {
          display: none !important;
        }
        ${fullscreenCss}
      </style>`
    )
    .replace("</script>", `${fullscreenScript}</script>`);
}

function Shell() {
  const [page, setPage] = useState(getPageFromHash);
  const [slidesFullscreenOpen, setSlidesFullscreenOpen] = useState(false);

  const draftDocument = useMemo(() => {
    const { metadata, body } = parseFrontmatter(ercDraftMarkdown);
    const content = stripLeadingTitle(body, metadata.title);

    return {
      metadata,
      summary: extractSimpleSummary(content) || metadata.description || "",
      html: marked.parse(content),
    };
  }, []);
  const deckSourceUrl = useBlobUrl(deckSourceMarkdown, "text/markdown");
  const draftSourceUrl = useBlobUrl(ercDraftMarkdown, "text/markdown");

  const slidesHtml = useMemo(() => buildSlidesHtml(deckSourceUrl), [deckSourceUrl]);
  const fullscreenSlidesHtml = useMemo(
    () => buildSlidesHtml(deckSourceUrl, { fullscreen: true }),
    [deckSourceUrl]
  );
  const slidesUrl = useBlobUrl(slidesHtml, "text/html");
  const fullscreenSlidesUrl = useBlobUrl(fullscreenSlidesHtml, "text/html");

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = agentLevyIconUrl;
  }, []);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === "agentlevy-close-slides-fullscreen") {
        setSlidesFullscreenOpen(false);
      }
    }

    if (slidesFullscreenOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("message", handleMessage);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("message", handleMessage);
    };
  }, [slidesFullscreenOpen]);

  function navigate(nextPage) {
    window.location.hash = nextPage;
  }

  return (
    <div
      style={{
        fontFamily: '"Calibri Light", Calibri, Arial, sans-serif',
        backgroundColor: "#070B18",
        backgroundImage:
          "radial-gradient(circle at top right, rgba(0, 212, 255, 0.10), transparent 28%), radial-gradient(circle at 15% 0%, rgba(123, 97, 255, 0.08), transparent 24%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 42px 42px, 42px 42px",
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

        .erc-content ul,
        .erc-content ol {
          padding-left: 1.4rem;
        }

        .erc-content li + li {
          margin-top: 0.38rem;
        }

        .erc-content strong {
          color: #ffffff;
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
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            marginRight: "16px",
          }}
        >
          <img
            src={agentLevyIconUrl}
            alt="AgentLevy robot logo"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "block",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
            }}
          />
          <span style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>
            Agent<span style={{ color: "#00D4FF" }}>Levy</span>
          </span>
        </div>
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
        {page === "slides" && (
          <SlidesPage slidesUrl={slidesUrl} onOpenFullscreen={() => setSlidesFullscreenOpen(true)} />
        )}
        {page === "erc-draft" && (
          <DraftPage
            draftHtml={draftDocument.html}
            draftSourceUrl={draftSourceUrl}
            draftMeta={draftDocument.metadata}
            draftSummary={draftDocument.summary}
          />
        )}
      </div>

      {slidesFullscreenOpen && (
        <FullscreenSlidesOverlay
          slidesUrl={fullscreenSlidesUrl}
          onClose={() => setSlidesFullscreenOpen(false)}
        />
      )}
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

function SlidesPage({ slidesUrl, onOpenFullscreen }) {
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
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "12px",
          padding: "14px 18px",
          borderBottom: "1px solid #223354",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onOpenFullscreen}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "9px 13px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#03151E",
            background: "#00D4FF",
            border: "1px solid #00D4FF",
            cursor: "pointer",
          }}
        >
          Fullscreen
        </button>
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
  );
}

function FullscreenSlidesOverlay({ slidesUrl, onClose }) {
  const iframeRef = useRef(null);

  function navigateSlides(direction) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: direction === "next" ? "agentlevy-slides-next" : "agentlevy-slides-prev" },
      "*"
    );
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateSlides("next");
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateSlides("prev");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#050A14",
      }}
    >
      <iframe
        ref={iframeRef}
        title="AgentLevy Hackathon Slides Fullscreen"
        src={slidesUrl}
        style={{
          display: "block",
          width: "100vw",
          height: "100vh",
          border: 0,
          background: "#050A14",
        }}
      />

      <button
        type="button"
        onClick={onClose}
        style={{
          position: "fixed",
          top: "18px",
          right: "18px",
          zIndex: 1001,
          width: "42px",
          height: "42px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(7,11,24,0.84)",
          color: "#F5F7FA",
          fontSize: "24px",
          lineHeight: 1,
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        aria-label="Close fullscreen slides"
        title="Close"
      >
        ×
      </button>

      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: "18px",
          transform: "translateX(-50%)",
          zIndex: 1001,
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 10px",
          borderRadius: "999px",
          background: "rgba(7,11,24,0.74)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <button
          type="button"
          onClick={() => navigateSlides("prev")}
          style={{
            width: "36px",
            height: "36px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#F5F7FA",
            fontSize: "18px",
            lineHeight: 1,
            cursor: "pointer",
          }}
          aria-label="Previous slide"
          title="Previous slide"
        >
          ←
        </button>

        <button
          type="button"
          onClick={() => navigateSlides("next")}
          style={{
            width: "36px",
            height: "36px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#F5F7FA",
            fontSize: "18px",
            lineHeight: 1,
            cursor: "pointer",
          }}
          aria-label="Next slide"
          title="Next slide"
        >
          →
        </button>
      </div>
    </div>
  );
}

function DraftPage({ draftHtml, draftSourceUrl, draftMeta, draftSummary }) {
  const metadataItems = [
    { label: "Status", value: draftMeta.status },
    {
      label: "Type",
      value: [draftMeta.type, draftMeta.category].filter(hasMeaningfulMeta).join(" · "),
    },
    {
      label: "Requires",
      value: hasMeaningfulMeta(draftMeta.requires) ? `EIP-${draftMeta.requires}` : null,
    },
    { label: "Created", value: formatDraftDate(draftMeta.created) },
    { label: "Author", value: draftMeta.author },
  ].filter((item) => hasMeaningfulMeta(item.value));

  return (
    <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(180deg, rgba(18,28,50,0.96), rgba(14,20,36,0.98))",
          borderRadius: "22px",
          border: "1px solid #223354",
          padding: "24px 26px",
          marginBottom: "18px",
          boxShadow: "0 24px 50px rgba(0,0,0,0.24)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "18px",
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
              ERC Draft
            </p>
            <h1
              style={{
                fontSize: "34px",
                fontFamily: "Georgia, serif",
                lineHeight: 1.04,
                color: "#FFFFFF",
                margin: 0,
              }}
            >
              {draftMeta.title || "Verified Task Escrow and Attestation Interface"}
            </h1>
            {draftSummary && (
              <p
                style={{
                  color: "#AFC0D8",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  margin: "12px 0 0",
                  maxWidth: "760px",
                }}
              >
                {draftSummary}
              </p>
            )}
          </div>

          <a
            href={draftSourceUrl}
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
              color: "#03151E",
              background: "#00D4FF",
              border: "1px solid #00D4FF",
            }}
          >
            Open Raw Markdown
          </a>
        </div>

        {metadataItems.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            {metadataItems.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span
                  style={{
                    color: "#7F93B4",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </span>
                <span style={{ color: "#F5F7FA", fontSize: "13px", fontWeight: "600" }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>
);
