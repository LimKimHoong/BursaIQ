# BursaIQ — Stage 02 Demo

BursaIQ is an offline-first decision-intelligence prototype for the Bursa Prompt-a-thon final. It combines governed metric calculations, local Excel/PDF retrieval, visible evidence, simulated departmental access, human verification, and downloadable PDF briefings.

Every included figure, applicant and document is synthetic. Nothing in this repository is official Bursa Malaysia information.

## What is implemented

- **Quiet conversational home:** the first screen contains only the BursaIQ conversation. Workspaces, evidence and workflow details are disclosed only when requested.
- **Market Intelligence:** a ready-to-present Market Pulse plus governed market performance, 30-day ADV, market capitalisation, trading velocity, sector/constituent drivers, investor participation and selected international comparisons.
- **Evidence beside the answer:** source, owner, location, calculation and interpretation boundary remain visible.
- **Learn Bursa:** guided learning pathways and plain-language explanations grounded in the local market primer, product overview and new-joiner conduct guide.
- **Local preferences:** Settings controls response detail, Ollama wording, automatic analysis, chart motion and the default workspace without changing access policy.
- **Optional plugins:** Settings provides locally persisted controls for Web Search, PDF Tools and Spreadsheet Tools, with external connections clearly marked as unconfigured demo capabilities.
- **People Services:** hiring procedure plus fictional application-status retrieval, available only to the HR demo identity.
- **Real local ingestion:** structured data is loaded from Excel and document text is extracted from PDF files under `Input/`.
- **Human verification:** a local SQLite review queue records submission, approval or changes requested, with an audit history.
- **Real PDF export:** ReportLab generates a two-page executive briefing; pypdf verifies that it opens and contains the title, evidence register and synthetic-data label.
- **Reliable model strategy:** the showcase works without a large model. An optional local Ollama adapter can provide narrative variation without owning facts or calculations.

## Run the demo

```bash
cd /Users/kimhoong0324/Desktop/BursaIQ-main
./myenv/bin/pip install -r requirements.txt
./myenv/bin/python scripts/seed_demo_data.py
./myenv/bin/python server.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000). Keep the terminal running during the showcase.

The app is intentionally local and does not require internet access. If the service is not running, the HTML still opens as a visual preview, but ingestion, persisted verification and PDF generation will be unavailable.

## Suggested five-minute showcase

1. **Frame the problem (35 seconds).** “Colleagues spend time gathering figures, interpreting them, checking sources and turning the result into a reusable briefing.”
2. **Ask the hero question (70 seconds).** From the clean Ask BursaIQ home, ask: `How did the market perform in July?` Show the management read, then open Evidence and Method. Emphasise that the calculation—not the language model—owns the number.
3. **Follow the story (40 seconds).** Ask: `Which sectors drove the market?` or `How did 30-day ADV change?`
4. **Close the workflow (45 seconds).** Create a PDF, select “Submit with review request,” download it, then show the item in Verification Centre.
5. **Show personalisation and responsibility (45 seconds).** Open People Services as Nadia to demonstrate denial. Switch the demo identity to Farah Lee and retrieve Alya Rahman’s fictional status.
6. **Show adoption value (35 seconds).** Open Learn Bursa and ask: `Explain ADV in plain language.` Point to the raw-source evidence.
7. **Close (30 seconds).** “BursaIQ turns a question into a traceable, reviewable decision artifact—across workspaces, without moving sensitive data into the prototype.”

The script leaves roughly 45 seconds for transitions and judge reaction. All three team members can own a segment: problem/vision, GCMC intelligence, and responsible workflow/scale.

## Demo identities

| Identity | Department | Demonstrated access |
|---|---|---|
| Nadia Karim | GCMC | Market Intelligence, Learn Bursa |
| Arif Rahman | Securities Market | Market Intelligence, Learn Bursa, Market Intelligence review queue |
| Farah Lee | HR | Market Intelligence, People Services, Learn Bursa, HR Policy review queue |
| Mei Tan | Finance | Market Intelligence, Learn Bursa |

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

### HR workbook contract

`Input/HR/HR_Applications_Demo.xlsx` uses one `Applications` worksheet with `applicant`, `ref`, `position`, `stage`, `nextAction`, `owner`, and `classification`. Keep every record fictional for the competition.

## Retrieval rather than training

For the next sanitized-data step, do **not** train a model on the Excel/PDF pack. Training is slower, makes updates difficult, can memorise sensitive text, and does not guarantee correct figures. BursaIQ uses retrieval-augmented generation instead:

1. ingest an approved file;
2. parse tables and document text;
3. retrieve only relevant content within the user’s workspace;
4. calculate metrics in deterministic functions;
5. let an optional model explain the retrieved evidence;
6. attach sources and route higher-stakes outputs to human review.

This lets a corrected file take effect immediately and makes data provenance demonstrable to judges.

## Optional local model

The default is the deterministic demo engine, which is the safest configuration for an 8 GB MacBook Air. If desired, install Ollama separately, pull a small quantised model, then start BursaIQ with:

```bash
BURSAIQ_MODEL_PROVIDER=ollama BURSAIQ_OLLAMA_MODEL=qwen2.5:1.5b ./myenv/bin/python server.py
```

When enabled, the visible conversation uses Ollama in four bounded ways:

- **BursaIQ Assistant:** Ollama proposes a workspace label and writes the response. Deterministic guardrails reserve People Services for explicit HR intent, while server-side role checks still decide whether retrieval is allowed.
- **Market Intelligence:** deterministic metric tools calculate the result, then Ollama explains the supplied facts without owning the numbers.
- **Learn Bursa:** local retrieval supplies relevant approved PDF/Excel excerpts before Ollama writes explanatory answers. Product catalogues use a deterministic four-group summary so a small model cannot omit or rearrange categories.
- **People Services:** access-controlled local retrieval supplies the permitted procedure or fictional status before Ollama rewrites it clearly.

Answers display an `Ollama · model-name` badge when model wording succeeds. If Ollama is disabled or unreachable, the interface automatically uses the deterministic/retrieval fallback. Local retrieval, metrics, access decisions and verification remain authoritative.

## Project layout

```text
index.html                 Application shell
static/css/app.css         Visual system and responsive layout
static/js/demo-data.js     Browser fallback data
static/js/engine.js        Offline answer composition
static/js/app.js           Workspace state and interactions
bursaiq/data_loader.py     Excel/PDF ingestion and local retrieval
bursaiq/metrics.py         Governed GCMC calculation tools
bursaiq/store.py           SQLite verification/audit queue
bursaiq/reporting.py       PDF generation and validation
bursaiq/model_provider.py  Optional lazy Ollama adapter
Input/                     Controlled synthetic source pack
output/pdf/                Generated briefings
runtime/                   Local demo database
```

## Honest Stage 02 boundaries

- Business-impact numbers from the pitch should be labelled **illustrative estimates** until a measured pilot validates them. Keep them in the presentation as the hypothesis and label them; do not present them as measured product results.
- Authentication, role groups, source approvals and review ownership are simulated or local in this build.
- Current regional data is a controlled local comparison, not live market data.
- English should remain the authoritative demo language. Bahasa Malaysia is a worthwhile stretch only after the five-minute English journey is stable; Chinese should be deferred.
