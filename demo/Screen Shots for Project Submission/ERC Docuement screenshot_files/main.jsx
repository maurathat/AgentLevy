import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/main.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=f632bf58"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("/Users/mauraclark/AgentLevy/frontend/src/main.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$(), _s2 = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=f632bf58"; const React = __vite__cjsImport3_react.__esModule ? __vite__cjsImport3_react.default : __vite__cjsImport3_react; const useEffect = __vite__cjsImport3_react["useEffect"]; const useMemo = __vite__cjsImport3_react["useMemo"]; const useState = __vite__cjsImport3_react["useState"];
import __vite__cjsImport4_reactDom_client from "/node_modules/.vite/deps/react-dom_client.js?v=f632bf58"; const ReactDOM = __vite__cjsImport4_reactDom_client.__esModule ? __vite__cjsImport4_reactDom_client.default : __vite__cjsImport4_reactDom_client;
import { marked } from "/node_modules/.vite/deps/marked.js?v=f632bf58";
import deckSourceMarkdown from "/@fs/Users/mauraclark/AgentLevy/demo/HACKATHON_DECK_V2.md?import&raw";
import ercDraftMarkdown from "/@fs/Users/mauraclark/AgentLevy/docs/erc-draft-vteai.md?import&raw";
import x402ComparisonUrl from "/@fs/Users/mauraclark/AgentLevy/demo/Screen Shots for Project Submission/x402-comparison.svg?import";
import slidesHtmlSource from "/@fs/Users/mauraclark/AgentLevy/preview/exports/hackathon-slides-v2.html?import&raw";
import agentLevyLogoUrl from "/@fs/Users/mauraclark/AgentLevy/assets/logos/agentlevy-logo-horizontal.svg?import";
import AgentDemo from "/src/AgentDemo.jsx";
const NAV_ITEMS = [
  { id: "demo", label: "Demo" },
  { id: "slides", label: "Slides" },
  { id: "erc-draft", label: "ERC Draft" }
];
marked.setOptions({
  gfm: true,
  breaks: true
});
function getPageFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  return NAV_ITEMS.some((item) => item.id === hash) ? hash : "demo";
}
function useBlobUrl(content, type) {
  _s();
  const [url, setUrl] = useState("");
  useEffect(() => {
    const blob = new Blob([content], { type });
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [content, type]);
  return url;
}
_s(useBlobUrl, "7HKkcpU9cHVSx2vcifXxNbEsizo=");
function buildSlidesHtml(deckSourceUrl) {
  return slidesHtmlSource.replaceAll("../../assets/logos/agentlevy-logo-horizontal.svg", agentLevyLogoUrl).replaceAll("../../demo/Screen%20Shots%20for%20Project%20Submission/x402-comparison.svg", x402ComparisonUrl).replaceAll('href="../../demo/HACKATHON_DECK_V2.md"', `href="${deckSourceUrl}" target="_blank" rel="noreferrer"`).replaceAll('href="index.html"', 'href="#"').replaceAll('href="verifier-process.html"', 'href="#"');
}
function Shell() {
  _s2();
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
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      style: {
        fontFamily: '"Calibri Light", Calibri, Arial, sans-serif',
        background: "radial-gradient(circle at top right, rgba(0, 212, 255, 0.10), transparent 28%), radial-gradient(circle at 15% 0%, rgba(123, 97, 255, 0.08), transparent 24%), #070B18",
        minHeight: "100vh",
        color: "#F5F7FA"
      },
      children: [
        /* @__PURE__ */ jsxDEV("style", { children: `
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
      ` }, void 0, false, {
          fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
          lineNumber: 103,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV(
          "div",
          {
            style: {
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
              zIndex: 100
            },
            children: [
              /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "15px", fontWeight: "700", color: "#fff", marginRight: "16px" }, children: [
                "Agent",
                /* @__PURE__ */ jsxDEV("span", { style: { color: "#00D4FF" }, children: "Levy" }, void 0, false, {
                  fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
                  lineNumber: 209,
                  columnNumber: 16
                }, this)
              ] }, void 0, true, {
                fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
                lineNumber: 208,
                columnNumber: 9
              }, this),
              NAV_ITEMS.map(
                (item) => /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => navigate(item.id),
                    style: {
                      padding: "6px 16px",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      borderRadius: "8px",
                      border: page === item.id ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
                      background: page === item.id ? "rgba(0,212,255,0.08)" : "transparent",
                      color: page === item.id ? "#00D4FF" : "rgba(255,255,255,0.4)",
                      transition: "all 0.2s",
                      outline: "none"
                    },
                    children: item.label
                  },
                  item.id,
                  false,
                  {
                    fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
                    lineNumber: 212,
                    columnNumber: 9
                  },
                  this
                )
              )
            ]
          },
          void 0,
          true,
          {
            fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
            lineNumber: 193,
            columnNumber: 7
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("div", { style: { maxWidth: "1320px", margin: "0 auto", padding: "28px 24px 40px" }, children: [
          page === "demo" && /* @__PURE__ */ jsxDEV(AgentDemo, {}, void 0, false, {
            fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
            lineNumber: 234,
            columnNumber: 29
          }, this),
          page === "slides" && /* @__PURE__ */ jsxDEV(SlidesPage, { slidesUrl, deckSourceUrl }, void 0, false, {
            fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
            lineNumber: 235,
            columnNumber: 31
          }, this),
          page === "erc-draft" && /* @__PURE__ */ jsxDEV(DraftPage, { draftHtml, draftSourceUrl }, void 0, false, {
            fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
            lineNumber: 236,
            columnNumber: 34
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
          lineNumber: 233,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
      lineNumber: 94,
      columnNumber: 5
    },
    this
  );
}
_s2(Shell, "bpskiDLhrnGy5xasgDbWDhm6u4M=", false, function() {
  return [useBlobUrl, useBlobUrl, useBlobUrl];
});
_c = Shell;
function PageIntro({ eyebrow, title, description, actions = [] }) {
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "22px",
        flexWrap: "wrap"
      },
      children: [
        /* @__PURE__ */ jsxDEV("div", { style: { maxWidth: "760px" }, children: [
          /* @__PURE__ */ jsxDEV(
            "p",
            {
              style: {
                color: "#00D4FF",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 10px"
              },
              children: eyebrow
            },
            void 0,
            false,
            {
              fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
              lineNumber: 255,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "h1",
            {
              style: {
                fontSize: "32px",
                fontFamily: "Georgia, serif",
                lineHeight: 1.02,
                color: "#FFFFFF",
                margin: 0
              },
              children: title
            },
            void 0,
            false,
            {
              fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
              lineNumber: 267,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("p", { style: { color: "#8A96B0", fontSize: "14px", margin: "10px 0 0" }, children: description }, void 0, false, {
            fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
            lineNumber: 278,
            columnNumber: 9
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
          lineNumber: 254,
          columnNumber: 7
        }, this),
        actions.length > 0 && /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }, children: actions.map(
          (action) => /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: action.href,
              target: action.target || "_blank",
              rel: "noreferrer",
              style: {
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: "999px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
                color: action.primary ? "#03151E" : "#00D4FF",
                background: action.primary ? "#00D4FF" : "#121C32",
                border: action.primary ? "1px solid #00D4FF" : "1px solid #243452"
              },
              children: action.label
            },
            action.label,
            false,
            {
              fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
              lineNumber: 284,
              columnNumber: 9
            },
            this
          )
        ) }, void 0, false, {
          fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
          lineNumber: 282,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
      lineNumber: 244,
      columnNumber: 5
    },
    this
  );
}
_c2 = PageIntro;
function SlidesPage({ slidesUrl, deckSourceUrl }) {
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(
      PageIntro,
      {
        eyebrow: "Presentation",
        title: "Hackathon slides embedded in the localhost app",
        description: "The full deck is now available directly in the frontend so you can review the presentation without leaving the demo environment.",
        actions: [
          { label: "Open Full Deck", href: slidesUrl, primary: true },
          { label: "Open Deck Source", href: deckSourceUrl }
        ]
      },
      void 0,
      false,
      {
        fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
        lineNumber: 314,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        style: {
          background: "linear-gradient(180deg, rgba(17,27,49,0.96), rgba(15,22,41,0.98))",
          borderRadius: "22px",
          border: "1px solid #223354",
          overflow: "hidden",
          boxShadow: "0 24px 50px rgba(0,0,0,0.24)"
        },
        children: [
          /* @__PURE__ */ jsxDEV(
            "div",
            {
              style: {
                padding: "14px 18px",
                borderBottom: "1px solid #223354",
                color: "#8A96B0",
                fontSize: "13px"
              },
              children: [
                "Use the deck controls inside the embedded presentation. If you want the deck in a separate browser tab, use",
                " ",
                /* @__PURE__ */ jsxDEV("span", { style: { color: "#FFFFFF" }, children: "Open Full Deck" }, void 0, false, {
                  fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
                  lineNumber: 343,
                  columnNumber: 11
                }, this),
                "."
              ]
            },
            void 0,
            true,
            {
              fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
              lineNumber: 333,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "iframe",
            {
              title: "AgentLevy Hackathon Slides",
              src: slidesUrl,
              style: {
                display: "block",
                width: "100%",
                minHeight: "78vh",
                border: 0,
                background: "#050A14"
              }
            },
            void 0,
            false,
            {
              fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
              lineNumber: 346,
              columnNumber: 9
            },
            this
          )
        ]
      },
      void 0,
      true,
      {
        fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
        lineNumber: 324,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
    lineNumber: 313,
    columnNumber: 5
  }, this);
}
_c3 = SlidesPage;
function DraftPage({ draftHtml, draftSourceUrl }) {
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(
      PageIntro,
      {
        eyebrow: "Standards Draft",
        title: "ERC draft rendered inside the localhost app",
        description: "The ERC-VTEAI draft is now readable directly from the frontend so you can review the standard alongside the demo and slides.",
        actions: [{ label: "Open Raw Markdown", href: draftSourceUrl, primary: true }]
      },
      void 0,
      false,
      {
        fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
        lineNumber: 365,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        style: {
          background: "linear-gradient(180deg, rgba(17,27,49,0.96), rgba(15,22,41,0.98))",
          borderRadius: "22px",
          border: "1px solid #223354",
          overflow: "hidden",
          boxShadow: "0 24px 50px rgba(0,0,0,0.24)"
        },
        children: /* @__PURE__ */ jsxDEV("div", { className: "erc-content", dangerouslySetInnerHTML: { __html: draftHtml }, style: { padding: "26px 28px 34px" } }, void 0, false, {
          fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
          lineNumber: 381,
          columnNumber: 9
        }, this)
      },
      void 0,
      false,
      {
        fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
        lineNumber: 372,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
    lineNumber: 364,
    columnNumber: 5
  }, this);
}
_c4 = DraftPage;
ReactDOM.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxDEV(React.StrictMode, { children: /* @__PURE__ */ jsxDEV(Shell, {}, void 0, false, {
    fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
    lineNumber: 389,
    columnNumber: 5
  }, this) }, void 0, false, {
    fileName: "/Users/mauraclark/AgentLevy/frontend/src/main.jsx",
    lineNumber: 388,
    columnNumber: 3
  }, this)
);
var _c, _c2, _c3, _c4;
$RefreshReg$(_c, "Shell");
$RefreshReg$(_c2, "PageIntro");
$RefreshReg$(_c3, "SlidesPage");
$RefreshReg$(_c4, "DraftPage");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/mauraclark/AgentLevy/frontend/src/main.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/mauraclark/AgentLevy/frontend/src/main.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,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QSxhQUFBRyxLQUFBIiwibmFtZXMiOlsiUmVhY3QiLCJ1c2VFZmZlY3QiLCJ1c2VNZW1vIiwidXNlU3RhdGUiLCJSZWFjdERPTSIsIm1hcmtlZCIsImRlY2tTb3VyY2VNYXJrZG93biIsImVyY0RyYWZ0TWFya2Rvd24iLCJ4NDAyQ29tcGFyaXNvblVybCIsInNsaWRlc0h0bWxTb3VyY2UiLCJhZ2VudExldnlMb2dvVXJsIiwiQWdlbnREZW1vIiwiTkFWX0lURU1TIiwiaWQiLCJsYWJlbCIsInNldE9wdGlvbnMiLCJnZm0iLCJicmVha3MiLCJnZXRQYWdlRnJvbUhhc2giLCJoYXNoIiwid2luZG93IiwibG9jYXRpb24iLCJyZXBsYWNlIiwic29tZSIsIml0ZW0iLCJ1c2VCbG9iVXJsIiwiY29udGVudCIsInR5cGUiLCJfcyIsInVybCIsInNldFVybCIsImJsb2IiLCJCbG9iIiwib2JqZWN0VXJsIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwicmV2b2tlT2JqZWN0VVJMIiwiYnVpbGRTbGlkZXNIdG1sIiwiZGVja1NvdXJjZVVybCIsInJlcGxhY2VBbGwiLCJTaGVsbCIsIl9zMiIsInBhZ2UiLCJzZXRQYWdlIiwiZHJhZnRIdG1sIiwicGFyc2UiLCJkcmFmdFNvdXJjZVVybCIsInNsaWRlc0h0bWwiLCJzbGlkZXNVcmwiLCJoYW5kbGVIYXNoQ2hhbmdlIiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJuYXZpZ2F0ZSIsIm5leHRQYWdlIiwiZm9udEZhbWlseSIsImJhY2tncm91bmQiLCJtaW5IZWlnaHQiLCJjb2xvciIsImRpc3BsYXkiLCJhbGlnbkl0ZW1zIiwiZ2FwIiwicGFkZGluZyIsImJvcmRlckJvdHRvbSIsImJhY2tkcm9wRmlsdGVyIiwiV2Via2l0QmFja2Ryb3BGaWx0ZXIiLCJwb3NpdGlvbiIsInRvcCIsInpJbmRleCIsImZvbnRTaXplIiwiZm9udFdlaWdodCIsIm1hcmdpblJpZ2h0IiwibWFwIiwiY3Vyc29yIiwiYm9yZGVyUmFkaXVzIiwiYm9yZGVyIiwidHJhbnNpdGlvbiIsIm91dGxpbmUiLCJtYXhXaWR0aCIsIm1hcmdpbiIsIlBhZ2VJbnRybyIsImV5ZWJyb3ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiYWN0aW9ucyIsImp1c3RpZnlDb250ZW50IiwibWFyZ2luQm90dG9tIiwiZmxleFdyYXAiLCJsZXR0ZXJTcGFjaW5nIiwidGV4dFRyYW5zZm9ybSIsImxpbmVIZWlnaHQiLCJsZW5ndGgiLCJhY3Rpb24iLCJocmVmIiwidGFyZ2V0IiwidGV4dERlY29yYXRpb24iLCJwcmltYXJ5IiwiX2MyIiwiU2xpZGVzUGFnZSIsIm92ZXJmbG93IiwiYm94U2hhZG93Iiwid2lkdGgiLCJfYzMiLCJEcmFmdFBhZ2UiLCJfX2h0bWwiLCJfYzQiLCJjcmVhdGVSb290IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsInJlbmRlciIsIl9jIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIm1haW4uanN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgUmVhY3RET00gZnJvbSBcInJlYWN0LWRvbS9jbGllbnRcIjtcbmltcG9ydCB7IG1hcmtlZCB9IGZyb20gXCJtYXJrZWRcIjtcblxuaW1wb3J0IGRlY2tTb3VyY2VNYXJrZG93biBmcm9tIFwiLi4vLi4vZGVtby9IQUNLQVRIT05fREVDS19WMi5tZD9yYXdcIjtcbmltcG9ydCBlcmNEcmFmdE1hcmtkb3duIGZyb20gXCIuLi8uLi9kb2NzL2VyYy1kcmFmdC12dGVhaS5tZD9yYXdcIjtcbmltcG9ydCB4NDAyQ29tcGFyaXNvblVybCBmcm9tIFwiLi4vLi4vZGVtby9TY3JlZW4gU2hvdHMgZm9yIFByb2plY3QgU3VibWlzc2lvbi94NDAyLWNvbXBhcmlzb24uc3ZnXCI7XG5pbXBvcnQgc2xpZGVzSHRtbFNvdXJjZSBmcm9tIFwiLi4vLi4vcHJldmlldy9leHBvcnRzL2hhY2thdGhvbi1zbGlkZXMtdjIuaHRtbD9yYXdcIjtcbmltcG9ydCBhZ2VudExldnlMb2dvVXJsIGZyb20gXCIuLi8uLi9hc3NldHMvbG9nb3MvYWdlbnRsZXZ5LWxvZ28taG9yaXpvbnRhbC5zdmdcIjtcbmltcG9ydCBBZ2VudERlbW8gZnJvbSBcIi4vQWdlbnREZW1vLmpzeFwiO1xuXG5jb25zdCBOQVZfSVRFTVMgPSBbXG4gIHsgaWQ6IFwiZGVtb1wiLCBsYWJlbDogXCJEZW1vXCIgfSxcbiAgeyBpZDogXCJzbGlkZXNcIiwgbGFiZWw6IFwiU2xpZGVzXCIgfSxcbiAgeyBpZDogXCJlcmMtZHJhZnRcIiwgbGFiZWw6IFwiRVJDIERyYWZ0XCIgfSxcbl07XG5cbm1hcmtlZC5zZXRPcHRpb25zKHtcbiAgZ2ZtOiB0cnVlLFxuICBicmVha3M6IHRydWUsXG59KTtcblxuZnVuY3Rpb24gZ2V0UGFnZUZyb21IYXNoKCkge1xuICBjb25zdCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZSgvXiMvLCBcIlwiKTtcbiAgcmV0dXJuIE5BVl9JVEVNUy5zb21lKChpdGVtKSA9PiBpdGVtLmlkID09PSBoYXNoKSA/IGhhc2ggOiBcImRlbW9cIjtcbn1cblxuZnVuY3Rpb24gdXNlQmxvYlVybChjb250ZW50LCB0eXBlKSB7XG4gIGNvbnN0IFt1cmwsIHNldFVybF0gPSB1c2VTdGF0ZShcIlwiKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbY29udGVudF0sIHsgdHlwZSB9KTtcbiAgICBjb25zdCBvYmplY3RVcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgIHNldFVybChvYmplY3RVcmwpO1xuXG4gICAgcmV0dXJuICgpID0+IFVSTC5yZXZva2VPYmplY3RVUkwob2JqZWN0VXJsKTtcbiAgfSwgW2NvbnRlbnQsIHR5cGVdKTtcblxuICByZXR1cm4gdXJsO1xufVxuXG5mdW5jdGlvbiBidWlsZFNsaWRlc0h0bWwoZGVja1NvdXJjZVVybCkge1xuICByZXR1cm4gc2xpZGVzSHRtbFNvdXJjZVxuICAgIC5yZXBsYWNlQWxsKFwiLi4vLi4vYXNzZXRzL2xvZ29zL2FnZW50bGV2eS1sb2dvLWhvcml6b250YWwuc3ZnXCIsIGFnZW50TGV2eUxvZ29VcmwpXG4gICAgLnJlcGxhY2VBbGwoXCIuLi8uLi9kZW1vL1NjcmVlbiUyMFNob3RzJTIwZm9yJTIwUHJvamVjdCUyMFN1Ym1pc3Npb24veDQwMi1jb21wYXJpc29uLnN2Z1wiLCB4NDAyQ29tcGFyaXNvblVybClcbiAgICAucmVwbGFjZUFsbCgnaHJlZj1cIi4uLy4uL2RlbW8vSEFDS0FUSE9OX0RFQ0tfVjIubWRcIicsIGBocmVmPVwiJHtkZWNrU291cmNlVXJsfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcImApXG4gICAgLnJlcGxhY2VBbGwoJ2hyZWY9XCJpbmRleC5odG1sXCInLCAnaHJlZj1cIiNcIicpXG4gICAgLnJlcGxhY2VBbGwoJ2hyZWY9XCJ2ZXJpZmllci1wcm9jZXNzLmh0bWxcIicsICdocmVmPVwiI1wiJyk7XG59XG5cbmZ1bmN0aW9uIFNoZWxsKCkge1xuICBjb25zdCBbcGFnZSwgc2V0UGFnZV0gPSB1c2VTdGF0ZShnZXRQYWdlRnJvbUhhc2gpO1xuXG4gIGNvbnN0IGRyYWZ0SHRtbCA9IHVzZU1lbW8oKCkgPT4gbWFya2VkLnBhcnNlKGVyY0RyYWZ0TWFya2Rvd24pLCBbXSk7XG4gIGNvbnN0IGRlY2tTb3VyY2VVcmwgPSB1c2VCbG9iVXJsKGRlY2tTb3VyY2VNYXJrZG93biwgXCJ0ZXh0L21hcmtkb3duXCIpO1xuICBjb25zdCBkcmFmdFNvdXJjZVVybCA9IHVzZUJsb2JVcmwoZXJjRHJhZnRNYXJrZG93biwgXCJ0ZXh0L21hcmtkb3duXCIpO1xuXG4gIGNvbnN0IHNsaWRlc0h0bWwgPSB1c2VNZW1vKCgpID0+IGJ1aWxkU2xpZGVzSHRtbChkZWNrU291cmNlVXJsKSwgW2RlY2tTb3VyY2VVcmxdKTtcbiAgY29uc3Qgc2xpZGVzVXJsID0gdXNlQmxvYlVybChzbGlkZXNIdG1sLCBcInRleHQvaHRtbFwiKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGZ1bmN0aW9uIGhhbmRsZUhhc2hDaGFuZ2UoKSB7XG4gICAgICBzZXRQYWdlKGdldFBhZ2VGcm9tSGFzaCgpKTtcbiAgICB9XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImhhc2hjaGFuZ2VcIiwgaGFuZGxlSGFzaENoYW5nZSk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwiaGFzaGNoYW5nZVwiLCBoYW5kbGVIYXNoQ2hhbmdlKTtcbiAgfSwgW10pO1xuXG4gIGZ1bmN0aW9uIG5hdmlnYXRlKG5leHRQYWdlKSB7XG4gICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBuZXh0UGFnZTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZm9udEZhbWlseTogJ1wiQ2FsaWJyaSBMaWdodFwiLCBDYWxpYnJpLCBBcmlhbCwgc2Fucy1zZXJpZicsXG4gICAgICAgIGJhY2tncm91bmQ6XG4gICAgICAgICAgXCJyYWRpYWwtZ3JhZGllbnQoY2lyY2xlIGF0IHRvcCByaWdodCwgcmdiYSgwLCAyMTIsIDI1NSwgMC4xMCksIHRyYW5zcGFyZW50IDI4JSksIHJhZGlhbC1ncmFkaWVudChjaXJjbGUgYXQgMTUlIDAlLCByZ2JhKDEyMywgOTcsIDI1NSwgMC4wOCksIHRyYW5zcGFyZW50IDI0JSksICMwNzBCMThcIixcbiAgICAgICAgbWluSGVpZ2h0OiBcIjEwMHZoXCIsXG4gICAgICAgIGNvbG9yOiBcIiNGNUY3RkFcIixcbiAgICAgIH19XG4gICAgPlxuICAgICAgPHN0eWxlPntgXG4gICAgICAgIC5lcmMtY29udGVudCB7XG4gICAgICAgICAgY29sb3I6ICNkY2U4ZjY7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuNzI7XG4gICAgICAgICAgZm9udC1zaXplOiAxcmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgLmVyYy1jb250ZW50IGgxLFxuICAgICAgICAuZXJjLWNvbnRlbnQgaDIsXG4gICAgICAgIC5lcmMtY29udGVudCBoMyxcbiAgICAgICAgLmVyYy1jb250ZW50IGg0IHtcbiAgICAgICAgICBmb250LWZhbWlseTogR2VvcmdpYSwgc2VyaWY7XG4gICAgICAgICAgY29sb3I6ICNmZmZmZmY7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMTI7XG4gICAgICAgICAgbWFyZ2luLXRvcDogMS42ZW07XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogMC41NWVtO1xuICAgICAgICB9XG5cbiAgICAgICAgLmVyYy1jb250ZW50IGgxOmZpcnN0LWNoaWxkLFxuICAgICAgICAuZXJjLWNvbnRlbnQgaDI6Zmlyc3QtY2hpbGQge1xuICAgICAgICAgIG1hcmdpbi10b3A6IDA7XG4gICAgICAgIH1cblxuICAgICAgICAuZXJjLWNvbnRlbnQgcCxcbiAgICAgICAgLmVyYy1jb250ZW50IGxpIHtcbiAgICAgICAgICBjb2xvcjogI2RjZThmNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5lcmMtY29udGVudCBhIHtcbiAgICAgICAgICBjb2xvcjogIzAwZDRmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5lcmMtY29udGVudCBociB7XG4gICAgICAgICAgYm9yZGVyOiAwO1xuICAgICAgICAgIGJvcmRlci10b3A6IDFweCBkYXNoZWQgIzIyMzM1NDtcbiAgICAgICAgICBtYXJnaW46IDI2cHggMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5lcmMtY29udGVudCBwcmUge1xuICAgICAgICAgIG92ZXJmbG93OiBhdXRvO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMwOTExMjI7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzFhMmE0NTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAxNnB4O1xuICAgICAgICAgIHBhZGRpbmc6IDE4cHg7XG4gICAgICAgIH1cblxuICAgICAgICAuZXJjLWNvbnRlbnQgY29kZSB7XG4gICAgICAgICAgZm9udC1mYW1pbHk6IHVpLW1vbm9zcGFjZSwgU0ZNb25vLVJlZ3VsYXIsIE1lbmxvLCBtb25vc3BhY2U7XG4gICAgICAgICAgY29sb3I6ICMwMGQ0ZmY7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLCAyMTIsIDI1NSwgMC4wOCk7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgwLCAyMTIsIDI1NSwgMC4xMik7XG4gICAgICAgICAgcGFkZGluZzogMC4xNGVtIDAuMzZlbTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgICAgIH1cblxuICAgICAgICAuZXJjLWNvbnRlbnQgcHJlIGNvZGUge1xuICAgICAgICAgIGNvbG9yOiAjZGNlOGY2O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgIGJvcmRlcjogMDtcbiAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLmVyYy1jb250ZW50IHRhYmxlIHtcbiAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlO1xuICAgICAgICAgIG1hcmdpbjogMjBweCAwO1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAuZXJjLWNvbnRlbnQgdGgsXG4gICAgICAgIC5lcmMtY29udGVudCB0ZCB7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzIyMzM1NDtcbiAgICAgICAgICBwYWRkaW5nOiAxMnB4IDE0cHg7XG4gICAgICAgICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICAgICAgICB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xuICAgICAgICB9XG5cbiAgICAgICAgLmVyYy1jb250ZW50IHRoIHtcbiAgICAgICAgICBjb2xvcjogI2ZmZmZmZjtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDIxMiwgMjU1LCAwLjA4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIEBtZWRpYSAobWF4LXdpZHRoOiA5ODBweCkge1xuICAgICAgICAgIC5lcmMtY29udGVudCB0YWJsZSB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgICAgIG92ZXJmbG93LXg6IGF1dG87XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBgfTwvc3R5bGU+XG5cbiAgICAgIDxkaXZcbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgICAgIGdhcDogXCI4cHhcIixcbiAgICAgICAgICBwYWRkaW5nOiBcIjEycHggMjRweFwiLFxuICAgICAgICAgIGJvcmRlckJvdHRvbTogXCIxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwwLjA2KVwiLFxuICAgICAgICAgIGJhY2tncm91bmQ6IFwicmdiYSg3LDExLDI0LDAuOSlcIixcbiAgICAgICAgICBiYWNrZHJvcEZpbHRlcjogXCJibHVyKDEycHgpXCIsXG4gICAgICAgICAgV2Via2l0QmFja2Ryb3BGaWx0ZXI6IFwiYmx1cigxMnB4KVwiLFxuICAgICAgICAgIHBvc2l0aW9uOiBcInN0aWNreVwiLFxuICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICB6SW5kZXg6IDEwMCxcbiAgICAgICAgfX1cbiAgICAgID5cbiAgICAgICAgPHNwYW4gc3R5bGU9e3sgZm9udFNpemU6IFwiMTVweFwiLCBmb250V2VpZ2h0OiBcIjcwMFwiLCBjb2xvcjogXCIjZmZmXCIsIG1hcmdpblJpZ2h0OiBcIjE2cHhcIiB9fT5cbiAgICAgICAgICBBZ2VudDxzcGFuIHN0eWxlPXt7IGNvbG9yOiBcIiMwMEQ0RkZcIiB9fT5MZXZ5PC9zcGFuPlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIHtOQVZfSVRFTVMubWFwKChpdGVtKSA9PiAoXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAga2V5PXtpdGVtLmlkfVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gbmF2aWdhdGUoaXRlbS5pZCl9XG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBwYWRkaW5nOiBcIjZweCAxNnB4XCIsXG4gICAgICAgICAgICAgIGZvbnRTaXplOiBcIjEzcHhcIixcbiAgICAgICAgICAgICAgZm9udFdlaWdodDogXCI1MDBcIixcbiAgICAgICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgICAgICAgICBib3JkZXI6IHBhZ2UgPT09IGl0ZW0uaWQgPyBcIjFweCBzb2xpZCByZ2JhKDAsMjEyLDI1NSwwLjMpXCIgOiBcIjFweCBzb2xpZCB0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBwYWdlID09PSBpdGVtLmlkID8gXCJyZ2JhKDAsMjEyLDI1NSwwLjA4KVwiIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICBjb2xvcjogcGFnZSA9PT0gaXRlbS5pZCA/IFwiIzAwRDRGRlwiIDogXCJyZ2JhKDI1NSwyNTUsMjU1LDAuNClcIixcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbjogXCJhbGwgMC4yc1wiLFxuICAgICAgICAgICAgICBvdXRsaW5lOiBcIm5vbmVcIixcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAge2l0ZW0ubGFiZWx9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICkpfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgc3R5bGU9e3sgbWF4V2lkdGg6IFwiMTMyMHB4XCIsIG1hcmdpbjogXCIwIGF1dG9cIiwgcGFkZGluZzogXCIyOHB4IDI0cHggNDBweFwiIH19PlxuICAgICAgICB7cGFnZSA9PT0gXCJkZW1vXCIgJiYgPEFnZW50RGVtbyAvPn1cbiAgICAgICAge3BhZ2UgPT09IFwic2xpZGVzXCIgJiYgPFNsaWRlc1BhZ2Ugc2xpZGVzVXJsPXtzbGlkZXNVcmx9IGRlY2tTb3VyY2VVcmw9e2RlY2tTb3VyY2VVcmx9IC8+fVxuICAgICAgICB7cGFnZSA9PT0gXCJlcmMtZHJhZnRcIiAmJiA8RHJhZnRQYWdlIGRyYWZ0SHRtbD17ZHJhZnRIdG1sfSBkcmFmdFNvdXJjZVVybD17ZHJhZnRTb3VyY2VVcmx9IC8+fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIFBhZ2VJbnRybyh7IGV5ZWJyb3csIHRpdGxlLCBkZXNjcmlwdGlvbiwgYWN0aW9ucyA9IFtdIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBzdHlsZT17e1xuICAgICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwic3BhY2UtYmV0d2VlblwiLFxuICAgICAgICBhbGlnbkl0ZW1zOiBcImZsZXgtc3RhcnRcIixcbiAgICAgICAgZ2FwOiBcIjE2cHhcIixcbiAgICAgICAgbWFyZ2luQm90dG9tOiBcIjIycHhcIixcbiAgICAgICAgZmxleFdyYXA6IFwid3JhcFwiLFxuICAgICAgfX1cbiAgICA+XG4gICAgICA8ZGl2IHN0eWxlPXt7IG1heFdpZHRoOiBcIjc2MHB4XCIgfX0+XG4gICAgICAgIDxwXG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGNvbG9yOiBcIiMwMEQ0RkZcIixcbiAgICAgICAgICAgIGZvbnRTaXplOiBcIjEycHhcIixcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiNzAwXCIsXG4gICAgICAgICAgICBsZXR0ZXJTcGFjaW5nOiBcIjAuMThlbVwiLFxuICAgICAgICAgICAgdGV4dFRyYW5zZm9ybTogXCJ1cHBlcmNhc2VcIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIwIDAgMTBweFwiLFxuICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICB7ZXllYnJvd31cbiAgICAgICAgPC9wPlxuICAgICAgICA8aDFcbiAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgZm9udFNpemU6IFwiMzJweFwiLFxuICAgICAgICAgICAgZm9udEZhbWlseTogXCJHZW9yZ2lhLCBzZXJpZlwiLFxuICAgICAgICAgICAgbGluZUhlaWdodDogMS4wMixcbiAgICAgICAgICAgIGNvbG9yOiBcIiNGRkZGRkZcIixcbiAgICAgICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAge3RpdGxlfVxuICAgICAgICA8L2gxPlxuICAgICAgICA8cCBzdHlsZT17eyBjb2xvcjogXCIjOEE5NkIwXCIsIGZvbnRTaXplOiBcIjE0cHhcIiwgbWFyZ2luOiBcIjEwcHggMCAwXCIgfX0+e2Rlc2NyaXB0aW9ufTwvcD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7YWN0aW9ucy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiBcImZsZXhcIiwgZ2FwOiBcIjEwcHhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZmxleFdyYXA6IFwid3JhcFwiIH19PlxuICAgICAgICAgIHthY3Rpb25zLm1hcCgoYWN0aW9uKSA9PiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBrZXk9e2FjdGlvbi5sYWJlbH1cbiAgICAgICAgICAgICAgaHJlZj17YWN0aW9uLmhyZWZ9XG4gICAgICAgICAgICAgIHRhcmdldD17YWN0aW9uLnRhcmdldCB8fCBcIl9ibGFua1wifVxuICAgICAgICAgICAgICByZWw9XCJub3JlZmVycmVyXCJcbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBcImlubGluZS1mbGV4XCIsXG4gICAgICAgICAgICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiBcIjEwcHggMTRweFwiLFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogXCI5OTlweFwiLFxuICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogXCIxM3B4XCIsXG4gICAgICAgICAgICAgICAgZm9udFdlaWdodDogXCI2MDBcIixcbiAgICAgICAgICAgICAgICBjb2xvcjogYWN0aW9uLnByaW1hcnkgPyBcIiMwMzE1MUVcIiA6IFwiIzAwRDRGRlwiLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGFjdGlvbi5wcmltYXJ5ID8gXCIjMDBENEZGXCIgOiBcIiMxMjFDMzJcIixcbiAgICAgICAgICAgICAgICBib3JkZXI6IGFjdGlvbi5wcmltYXJ5ID8gXCIxcHggc29saWQgIzAwRDRGRlwiIDogXCIxcHggc29saWQgIzI0MzQ1MlwiLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7YWN0aW9uLmxhYmVsfVxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIFNsaWRlc1BhZ2UoeyBzbGlkZXNVcmwsIGRlY2tTb3VyY2VVcmwgfSkge1xuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8UGFnZUludHJvXG4gICAgICAgIGV5ZWJyb3c9XCJQcmVzZW50YXRpb25cIlxuICAgICAgICB0aXRsZT1cIkhhY2thdGhvbiBzbGlkZXMgZW1iZWRkZWQgaW4gdGhlIGxvY2FsaG9zdCBhcHBcIlxuICAgICAgICBkZXNjcmlwdGlvbj1cIlRoZSBmdWxsIGRlY2sgaXMgbm93IGF2YWlsYWJsZSBkaXJlY3RseSBpbiB0aGUgZnJvbnRlbmQgc28geW91IGNhbiByZXZpZXcgdGhlIHByZXNlbnRhdGlvbiB3aXRob3V0IGxlYXZpbmcgdGhlIGRlbW8gZW52aXJvbm1lbnQuXCJcbiAgICAgICAgYWN0aW9ucz17W1xuICAgICAgICAgIHsgbGFiZWw6IFwiT3BlbiBGdWxsIERlY2tcIiwgaHJlZjogc2xpZGVzVXJsLCBwcmltYXJ5OiB0cnVlIH0sXG4gICAgICAgICAgeyBsYWJlbDogXCJPcGVuIERlY2sgU291cmNlXCIsIGhyZWY6IGRlY2tTb3VyY2VVcmwgfSxcbiAgICAgICAgXX1cbiAgICAgIC8+XG5cbiAgICAgIDxkaXZcbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBcImxpbmVhci1ncmFkaWVudCgxODBkZWcsIHJnYmEoMTcsMjcsNDksMC45NiksIHJnYmEoMTUsMjIsNDEsMC45OCkpXCIsXG4gICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjIycHhcIixcbiAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkICMyMjMzNTRcIixcbiAgICAgICAgICBvdmVyZmxvdzogXCJoaWRkZW5cIixcbiAgICAgICAgICBib3hTaGFkb3c6IFwiMCAyNHB4IDUwcHggcmdiYSgwLDAsMCwwLjI0KVwiLFxuICAgICAgICB9fVxuICAgICAgPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiMTRweCAxOHB4XCIsXG4gICAgICAgICAgICBib3JkZXJCb3R0b206IFwiMXB4IHNvbGlkICMyMjMzNTRcIixcbiAgICAgICAgICAgIGNvbG9yOiBcIiM4QTk2QjBcIixcbiAgICAgICAgICAgIGZvbnRTaXplOiBcIjEzcHhcIixcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAgVXNlIHRoZSBkZWNrIGNvbnRyb2xzIGluc2lkZSB0aGUgZW1iZWRkZWQgcHJlc2VudGF0aW9uLiBJZiB5b3Ugd2FudCB0aGUgZGVjayBpbiBhIHNlcGFyYXRlIGJyb3dzZXIgdGFiLCB1c2VcbiAgICAgICAgICB7XCIgXCJ9XG4gICAgICAgICAgPHNwYW4gc3R5bGU9e3sgY29sb3I6IFwiI0ZGRkZGRlwiIH19Pk9wZW4gRnVsbCBEZWNrPC9zcGFuPi5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGlmcmFtZVxuICAgICAgICAgIHRpdGxlPVwiQWdlbnRMZXZ5IEhhY2thdGhvbiBTbGlkZXNcIlxuICAgICAgICAgIHNyYz17c2xpZGVzVXJsfVxuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICBkaXNwbGF5OiBcImJsb2NrXCIsXG4gICAgICAgICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiNzh2aFwiLFxuICAgICAgICAgICAgYm9yZGVyOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZDogXCIjMDUwQTE0XCIsXG4gICAgICAgICAgfX1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvPlxuICApO1xufVxuXG5mdW5jdGlvbiBEcmFmdFBhZ2UoeyBkcmFmdEh0bWwsIGRyYWZ0U291cmNlVXJsIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPFBhZ2VJbnRyb1xuICAgICAgICBleWVicm93PVwiU3RhbmRhcmRzIERyYWZ0XCJcbiAgICAgICAgdGl0bGU9XCJFUkMgZHJhZnQgcmVuZGVyZWQgaW5zaWRlIHRoZSBsb2NhbGhvc3QgYXBwXCJcbiAgICAgICAgZGVzY3JpcHRpb249XCJUaGUgRVJDLVZURUFJIGRyYWZ0IGlzIG5vdyByZWFkYWJsZSBkaXJlY3RseSBmcm9tIHRoZSBmcm9udGVuZCBzbyB5b3UgY2FuIHJldmlldyB0aGUgc3RhbmRhcmQgYWxvbmdzaWRlIHRoZSBkZW1vIGFuZCBzbGlkZXMuXCJcbiAgICAgICAgYWN0aW9ucz17W3sgbGFiZWw6IFwiT3BlbiBSYXcgTWFya2Rvd25cIiwgaHJlZjogZHJhZnRTb3VyY2VVcmwsIHByaW1hcnk6IHRydWUgfV19XG4gICAgICAvPlxuXG4gICAgICA8ZGl2XG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgYmFja2dyb3VuZDogXCJsaW5lYXItZ3JhZGllbnQoMTgwZGVnLCByZ2JhKDE3LDI3LDQ5LDAuOTYpLCByZ2JhKDE1LDIyLDQxLDAuOTgpKVwiLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogXCIyMnB4XCIsXG4gICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjMjIzMzU0XCIsXG4gICAgICAgICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG4gICAgICAgICAgYm94U2hhZG93OiBcIjAgMjRweCA1MHB4IHJnYmEoMCwwLDAsMC4yNClcIixcbiAgICAgICAgfX1cbiAgICAgID5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJlcmMtY29udGVudFwiIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogZHJhZnRIdG1sIH19IHN0eWxlPXt7IHBhZGRpbmc6IFwiMjZweCAyOHB4IDM0cHhcIiB9fSAvPlxuICAgICAgPC9kaXY+XG4gICAgPC8+XG4gICk7XG59XG5cblJlYWN0RE9NLmNyZWF0ZVJvb3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyb290XCIpKS5yZW5kZXIoXG4gIDxSZWFjdC5TdHJpY3RNb2RlPlxuICAgIDxTaGVsbCAvPlxuICA8L1JlYWN0LlN0cmljdE1vZGU+XG4pO1xuIl0sImZpbGUiOiIvVXNlcnMvbWF1cmFjbGFyay9BZ2VudExldnkvZnJvbnRlbmQvc3JjL21haW4uanN4In0=