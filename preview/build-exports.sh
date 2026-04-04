#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/mauraclark/AgentLevy"
OUT_DIR="$ROOT/preview/exports"

mkdir -p "$OUT_DIR"

render_markdown() {
  local src="$1"
  curl --fail --silent --show-error \
    -H "User-Agent: AgentLevyPreviewBuilder/1.0" \
    -H "Content-Type: text/plain; charset=utf-8" \
    --data-binary "@$src" \
    https://api.github.com/markdown/raw
}

write_page() {
  local title="$1"
  local source_path="$2"
  local out_path="$3"
  local html_body

  html_body="$(render_markdown "$source_path")"

  cat > "$out_path" <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        --bg: #070b18;
        --panel: #0f1629;
        --panel-2: #111b31;
        --line: #223354;
        --text: #f5f7fb;
        --muted: #8ea2c3;
        --cyan: #00d4ff;
        --green: #00e5a0;
        --orange: #ff6b35;
        --purple: #7b61ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top right, rgba(0, 212, 255, 0.10), transparent 28%),
          radial-gradient(circle at 15% 0%, rgba(123, 97, 255, 0.08), transparent 24%),
          var(--bg);
        color: var(--text);
        font-family: "Calibri Light", Calibri, Arial, sans-serif;
      }
      .shell {
        max-width: 1120px;
        margin: 0 auto;
        padding: 32px 20px 64px;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 22px;
      }
      .home {
        color: var(--cyan);
        text-decoration: none;
        font-weight: 700;
      }
      .meta {
        color: var(--muted);
        font-size: 0.95rem;
      }
      .panel {
        background: linear-gradient(180deg, rgba(17,27,49,0.96), rgba(15,22,41,0.98));
        border: 1px solid var(--line);
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.24);
      }
      .hero {
        padding: 26px 30px 20px;
        border-bottom: 1px solid var(--line);
      }
      .eyebrow {
        color: var(--cyan);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 10px;
      }
      h1.hero-title {
        margin: 0;
        font-family: Georgia, serif;
        font-size: clamp(2rem, 3vw, 3.25rem);
        line-height: 1.06;
      }
      .content {
        padding: 32px 30px 44px;
      }
      .content h1,
      .content h2,
      .content h3,
      .content h4 {
        font-family: Georgia, serif;
        line-height: 1.15;
        margin-top: 1.7em;
        margin-bottom: 0.6em;
      }
      .content h1:first-child,
      .content h2:first-child {
        margin-top: 0;
      }
      .content p,
      .content li {
        color: #dce8f6;
        font-size: 1.02rem;
        line-height: 1.72;
      }
      .content ul,
      .content ol {
        padding-left: 1.35rem;
      }
      .content strong {
        color: #ffffff;
      }
      .content a {
        color: var(--cyan);
      }
      .content hr {
        border: 0;
        border-top: 1px dashed var(--line);
        margin: 30px 0;
      }
      .content code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: var(--cyan);
        background: rgba(0, 212, 255, 0.08);
        border: 1px solid rgba(0, 212, 255, 0.12);
        padding: 0.14em 0.36em;
        border-radius: 8px;
      }
      .content pre {
        overflow: auto;
        background: #091122;
        border: 1px solid #1a2a45;
        border-radius: 16px;
        padding: 18px;
      }
      .content pre code {
        background: transparent;
        border: 0;
        color: #dce8f6;
        padding: 0;
      }
      .content table {
        width: 100%;
        border-collapse: collapse;
        margin: 22px 0;
      }
      .content th,
      .content td {
        border: 1px solid #223354;
        padding: 12px 14px;
        text-align: left;
        vertical-align: top;
      }
      .content th {
        color: #ffffff;
        background: rgba(0, 212, 255, 0.08);
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="topbar">
        <a class="home" href="index.html">← Back to static exports</a>
        <div class="meta">Source: ${source_path#$ROOT}</div>
      </div>
      <article class="panel">
        <header class="hero">
          <div class="eyebrow">Standalone Static Export</div>
          <h1 class="hero-title">${title}</h1>
        </header>
        <section class="content">
${html_body}
        </section>
      </article>
    </main>
  </body>
</html>
EOF
}

write_visual_page() {
  local out_path="$OUT_DIR/verifier-process.html"
  cat > "$out_path" <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verifier Process Visual</title>
    <style>
      :root {
        --bg: #070b18;
        --panel: #0f1629;
        --line: #223354;
        --text: #f5f7fb;
        --muted: #8ea2c3;
        --cyan: #00d4ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top right, rgba(0, 212, 255, 0.10), transparent 28%),
          var(--bg);
        color: var(--text);
        font-family: "Calibri Light", Calibri, Arial, sans-serif;
      }
      .shell {
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px 20px 64px;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 22px;
      }
      .home {
        color: var(--cyan);
        text-decoration: none;
        font-weight: 700;
      }
      .meta {
        color: var(--muted);
        font-size: 0.95rem;
      }
      .panel {
        background: linear-gradient(180deg, rgba(17,27,49,0.96), rgba(15,22,41,0.98));
        border: 1px solid var(--line);
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.24);
      }
      .hero {
        padding: 26px 30px 20px;
        border-bottom: 1px solid var(--line);
      }
      .eyebrow {
        color: var(--cyan);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 10px;
      }
      h1 {
        margin: 0;
        font-family: Georgia, serif;
        font-size: clamp(2rem, 3vw, 3.25rem);
        line-height: 1.06;
      }
      .canvas {
        padding: 24px;
      }
      img {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 18px;
        border: 1px solid #1c2945;
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="topbar">
        <a class="home" href="index.html">← Back to static exports</a>
        <div class="meta">Source: /demo/verifier-process.svg</div>
      </div>
      <article class="panel">
        <header class="hero">
          <div class="eyebrow">Standalone Static Export</div>
          <h1>Verifier Process Visual</h1>
        </header>
        <section class="canvas">
          <img src="../../demo/verifier-process.svg" alt="Verifier process visual" />
        </section>
      </article>
    </main>
  </body>
</html>
EOF
}

write_index() {
  cat > "$OUT_DIR/index.html" <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AgentLevy Static Exports</title>
    <style>
      :root {
        --bg: #070b18;
        --panel: #0f1629;
        --panel-2: #111b31;
        --line: #223354;
        --text: #f5f7fb;
        --muted: #8ea2c3;
        --cyan: #00d4ff;
        --green: #00e5a0;
        --orange: #ff6b35;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top right, rgba(0, 212, 255, 0.10), transparent 28%),
          radial-gradient(circle at 15% 0%, rgba(123, 97, 255, 0.08), transparent 24%),
          var(--bg);
        color: var(--text);
        font-family: "Calibri Light", Calibri, Arial, sans-serif;
      }
      .wrap {
        max-width: 1180px;
        margin: 0 auto;
        padding: 56px 24px 72px;
      }
      .eyebrow {
        color: var(--cyan);
        font-size: 13px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        margin-bottom: 14px;
        font-weight: 700;
      }
      h1 {
        margin: 0 0 14px;
        font-family: Georgia, serif;
        font-size: clamp(2.4rem, 4vw, 4.5rem);
        line-height: 0.98;
      }
      .sub {
        max-width: 820px;
        color: var(--muted);
        font-size: 1.08rem;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .banner {
        display: inline-block;
        background: rgba(255, 107, 53, 0.10);
        border: 1px solid rgba(255, 107, 53, 0.75);
        color: #ffd8cb;
        padding: 12px 16px;
        border-radius: 14px;
        font-size: 0.98rem;
        margin-bottom: 34px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
        margin-top: 18px;
      }
      .card {
        background: linear-gradient(180deg, rgba(17,27,49,0.95), rgba(15,22,41,0.95));
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 22px;
        text-decoration: none;
        color: inherit;
        transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
        box-shadow: 0 20px 40px rgba(0,0,0,0.20);
      }
      .card:hover {
        transform: translateY(-2px);
        border-color: rgba(0, 212, 255, 0.45);
        box-shadow: 0 24px 50px rgba(0,0,0,0.28);
      }
      .tag {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 16px;
      }
      .tag.demo { color: #031e24; background: var(--cyan); }
      .tag.docs { color: #062319; background: var(--green); }
      .tag.web { color: #291a08; background: #ffd28a; }
      .card h2 {
        margin: 0 0 10px;
        font-family: Georgia, serif;
        font-size: 1.5rem;
        line-height: 1.1;
      }
      .card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }
      .footer {
        margin-top: 34px;
        color: #6f82a3;
        font-size: 0.95rem;
        line-height: 1.6;
      }
      code {
        color: var(--cyan);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <div class="eyebrow">Standalone Static Exports</div>
      <h1>AgentLevy published-style artifacts</h1>
      <p class="sub">
        These pages are static HTML exports generated from the repo markdown files. They’re intended to make the
        deck, video brief, website brief, and verifier docs easier to review in a browser as if they were published.
      </p>
      <div class="banner">The atomic trust layer for agent-to-agent commerce.</div>

      <section class="grid">
        <a class="card" href="hackathon-deck.html">
          <span class="tag demo">Deck</span>
          <h2>Hackathon Deck</h2>
          <p>Static export of the rebuilt 7-slide deck source.</p>
        </a>
        <a class="card" href="website-content-brief.html">
          <span class="tag web">Website</span>
          <h2>Website Content Brief</h2>
          <p>Static export of the protocol page and demo console content plan.</p>
        </a>
        <a class="card" href="video-production-brief.html">
          <span class="tag demo">Video</span>
          <h2>Video Production Brief</h2>
          <p>Static export of the scene plan, visual treatment, and overlays.</p>
        </a>
        <a class="card" href="verifier-modes.html">
          <span class="tag docs">Docs</span>
          <h2>Verifier Modes</h2>
          <p>Static export of the hackathon-versus-production verifier explainer.</p>
        </a>
        <a class="card" href="jury-outputs-brief.html">
          <span class="tag docs">Docs</span>
          <h2>Jury Outputs Brief</h2>
          <p>Static export aligning the README, video, and website strategy.</p>
        </a>
        <a class="card" href="verifier-process.html">
          <span class="tag demo">Visual</span>
          <h2>Verifier Process Visual</h2>
          <p>Direct browser page for the verifier architecture diagram.</p>
        </a>
      </section>

      <p class="footer">
        Regenerate these exports from the repo root with:<br />
        <code>bash /Users/mauraclark/AgentLevy/preview/build-exports.sh</code>
      </p>
    </main>
  </body>
</html>
EOF
}

write_page "Hackathon Deck" "$ROOT/demo/HACKATHON_DECK.md" "$OUT_DIR/hackathon-deck.html"
write_page "Website Content Brief" "$ROOT/demo/WEBSITE_CONTENT_BRIEF.md" "$OUT_DIR/website-content-brief.html"
write_page "Video Production Brief" "$ROOT/demo/VIDEO_PRODUCTION_BRIEF.md" "$OUT_DIR/video-production-brief.html"
write_page "Verifier Modes" "$ROOT/docs/VERIFIER_MODES.md" "$OUT_DIR/verifier-modes.html"
write_page "Jury Outputs Brief" "$ROOT/docs/JURY_OUTPUTS_BRIEF.md" "$OUT_DIR/jury-outputs-brief.html"
write_visual_page
write_index

echo "Static exports written to $OUT_DIR"
