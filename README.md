# BursaIQ — Stage 02 Demo

BursaIQ is a decision-intelligence prototype for the Bursa Prompt-a-thon final. Its conversational front end is connected to a Microsoft Copilot Studio agent through a small Python gateway, alongside governed metric calculations, visible evidence, simulated departmental access, human verification, and downloadable PDF briefings.

Every included figure and document is synthetic. Nothing in this repository is official Bursa Malaysia information.

## What is implemented

- **BursaIQ Assistant:** the main conversation handles market questions directly, backed by governed market performance, 30-day ADV, market capitalisation, trading velocity, sector/constituent drivers, investor participation and selected international comparisons.
- **Evidence beside the answer:** source, owner, location, calculation and interpretation boundary remain visible.
- **Today’s Intelligence Brief:** a role-aware opening brief prioritises changed signals, active alerts, pending decisions and next actions.
- **Watchlist & Alerts:** demo identities can monitor signals, see the rule behind each alert and reopen the related evidence trail. Watchlists persist locally per identity.
- **Actions in the Decision Canvas:** an answer can move directly into monitoring, Decision Memory, human verification or the management briefing view.
- **Decision Memory:** GCMC, Market Reviewer and Finance identities can inspect the question, rationale, owner, evidence context and status behind past decisions; new records persist locally.
- **Management Briefing:** a printable executive narrative combines the market headline, governed metrics, evidence state and named management priorities.
- **Learn Bursa:** guided learning pathways and plain-language explanations grounded in the local market primer, product overview and new-joiner conduct guide.
- **Ask Reg:** a permissioned regulatory-guidance workspace for the Securities Market demo identity, grounded in a controlled synthetic guide with explicit authority boundaries.
- **Copilot Studio conversations:** the Flask gateway obtains short-lived Direct Line tokens and keeps tokens and Copilot conversation IDs server-side; no credential is exposed to browser JavaScript.
- **Resilient showcase mode:** the pinned demo questions use predefined, source-grounded local answers when Copilot Studio is unavailable, and label the response clearly as a demo fallback.
- **Local preferences:** Settings shows the Copilot connection, automatic analysis, chart motion and the default workspace. A Panel access section lets identities request Ask Reg through a reason-capture dialog without granting access automatically.
- **Optional plugins:** Settings provides locally persisted controls for Web Search, PDF Tools and Spreadsheet Tools, with external connections clearly marked as unconfigured demo capabilities.
- **People-data boundary:** employee, candidate, recruitment and application-status questions are declined before invoking the hosted agent.
- **Real local ingestion:** structured data is loaded from Excel and document text is extracted from PDF files under `Input/`.
- **Human verification:** a reviewer-scoped case queue lets the assigned Data Owner inspect, approve or return answers. Submissions still show the proposed Microsoft Lists → Power Automate email handoff, while the Stage 02 demo persists decisions in a local SQLite audit queue.
- **Expanded Source Health:** reviewer identities can inspect freshness, quality, usage, accountable updater, next review date and overall health beneath Verification Centre.
- **Real PDF export:** ReportLab generates a two-page executive briefing; pypdf verifies that it opens and contains the title, evidence register and synthetic-data label.
- **No local inference stack:** Ollama, Transformers and downloadable model weights are not used by BursaIQ.

## Run the demo

```bash
cd /Users/kimhoong0324/Desktop/BursaIQ-main
./myenv/bin/pip install -r requirements.txt
./myenv/bin/python scripts/seed_demo_data.py
cp .env.example .env
# Paste the Copilot Studio Mobile app Token Endpoint into .env
./myenv/bin/python server.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000). Keep the terminal running during the showcase.

No user sign-in is required. The HTML still opens as a visual preview if the service is unavailable, but live agent conversations, persisted verification and PDF generation require the backend; Copilot Studio conversations also require network access.

## Suggested five-minute showcase

1. **Frame the problem (35 seconds).** “Colleagues spend time gathering figures, interpreting them, checking sources and turning the result into a reusable briefing.”
2. **Open Today’s Brief (45 seconds).** Show the role-aware attention queue, investigate the ADV signal, then add it to the Watchlist.
3. **Ask the hero question (60 seconds).** Ask: `How did the market perform in July?` Open the Decision Canvas and use Actions to save the answer to Decision Memory.
4. **Close the workflow (45 seconds).** Submit the answer for verification, then switch to Arif Rahman to show the reviewer-scoped queue and expanded Source Health.
5. **Brief management (35 seconds).** Return as Nadia and open Management Briefing to show the executive narrative, evidence state, priorities and print view.
6. **Show adoption value (35 seconds).** Open Learn Bursa and ask: `Explain ADV in plain language.` Point to the raw-source evidence.
7. **Close (30 seconds).** “BursaIQ turns a question into monitored intelligence, a traceable decision and a management-ready briefing—without losing its evidence.”

The script leaves roughly 45 seconds for transitions and judge reaction. All three team members can own a segment: problem/vision, GCMC intelligence, and responsible workflow/scale.

## Demo identities

| Identity | Department | Demonstrated access |
|---|---|---|
| Nadia Karim | GCMC | BursaIQ Assistant, Learn Bursa, Today’s Brief, Watchlist, Decision Memory, Management Briefing |
| Arif Rahman | Securities Market | BursaIQ Assistant, Learn Bursa, Ask Reg, market review queue, Source Health, Decision Memory, Management Briefing |
| Farah Lee | HR | BursaIQ Assistant, Learn Bursa |
| Mei Tan | Finance | BursaIQ Assistant, Learn Bursa, Today’s Brief, Watchlist, Decision Memory, Management Briefing |

Verification cases are filtered and update-protected by reviewer assignment in both the UI and API. These remain simulated identities rather than production authentication; a production pilot would bind the same policies to Microsoft Entra ID and server-side group claims.

## Replacing the synthetic files later

1. Keep the same workbook names and worksheet/column names shown below.
2. Replace only with sanitized files explicitly approved for the competition environment.
3. Update dates/owner metadata in `Input/manifest.json`.
4. Restart the server or call `POST /api/refresh`.
5. Run `./myenv/bin/python scripts/demo_check.py` before presenting.

### GCMC workbook contract

`Input/GCMC/GCMC_Market_Pulse.xlsx` contains:

| Worksheet | Required columns |
|---|---|
| Headline | Metric, Value, Unit, As of, Classification |
| Monthly | month, index, valueBn, volumeBn |
| Sectors | name, mtdPct, contributionPoints, valueBn |
| Counters | name, ticker, contributionPoints, pricePct |
| Participation | group, netFlowMn, sharePct |
| Regional | market, mtdPct, ytdPct, currency |

### Ask Reg source contract

`Input/Regulatory/Market_Regulation_Guide_Demo.json` contains controlled synthetic topics with an `id`, `title`, `summary` and `actions`. It is demonstration guidance rather than legal advice or an official interpretation of Bursa Malaysia rules.

## Microsoft Copilot Studio setup

This prototype uses Copilot Studio's Mobile app channel and the Bot Framework Direct Line API, so visitors do not need a Microsoft account.

1. In Copilot Studio, set the agent's authentication to **No authentication**, then publish the agent again.
2. Open **Channels → Mobile app** and copy the **Token Endpoint**.
3. Copy `.env.example` to `.env` and set `COPILOTSTUDIOAGENT__TOKENENDPOINT` to that complete HTTPS URL.
4. Start BursaIQ. The backend exchanges the endpoint for short-lived Direct Line tokens and keeps them in memory.

The token endpoint belongs only in the server-side `.env`; never put it in browser JavaScript or commit it. No-auth agents are appropriate for this synthetic prototype, but anyone who can reach the published channel may use the agent. Re-enable authentication before handling sensitive or production data.

## Project layout

```text
index.html                 Application shell
static/css/app.css         Visual system and responsive layout
static/js/demo-data.js     Browser fallback data
static/js/engine.js        Offline answer composition
static/js/app.js           Workspace state and interactions
bursaiq/data_loader.py     Excel/PDF/JSON ingestion and local retrieval
bursaiq/metrics.py         Governed GCMC calculation tools
bursaiq/store.py           SQLite verification/audit queue
bursaiq/reporting.py       PDF generation and validation
bursaiq/copilot_studio.py  Anonymous Direct Line and Copilot Studio gateway
Input/                     Controlled synthetic source pack
output/pdf/                Generated briefings
runtime/                   Local demo database
```

## Honest Stage 02 boundaries

- Business-impact numbers from the pitch should be labelled **illustrative estimates** until a measured pilot validates them. Keep them in the presentation as the hypothesis and label them; do not present them as measured product results.
- BursaIQ's demo identities, role groups, source approvals and review ownership are simulated or local. The prototype agent is intentionally published without user authentication.
- Microsoft Lists, Power Automate and notification email are presented as the proposed pilot architecture; the competition demo does not call a live Microsoft 365 tenant.
- Current regional data is a controlled local comparison, not live market data.
- English should remain the authoritative demo language. Bahasa Malaysia is a worthwhile stretch only after the five-minute English journey is stable; Chinese should be deferred.
