# BursaIQ

BursaIQ is a local, end-to-end AI workforce prototype for governed analysis, internal knowledge retrieval, reusable agents, configurable mission teams, workflow automation, human verification, and intelligence reuse.

The current application is a Flask service with a responsive JavaScript frontend and SQLite persistence. It supports a local Ollama model and Microsoft Copilot Studio as interchangeable language-model providers. Deterministic Python executors remain responsible for registered analytical missions, validation, evidence, and report generation.

> All included data, identities, operational states, and generated examples are synthetic demonstration material. They are not official Bursa Malaysia data or guidance and must not be used for market decisions.

## Current platform

The left navigation is organised into three areas.

### Intelligence & Execution

- **Home** — submit a natural-language request. A live model routes the request to conversational Q&A or an available registered mission capability.
- **AI Assistant** — ask general questions or run supported interactive analytics directly in the conversation. Structured analytical responses can render metrics, evidence, and interactive charts without first creating a mission.
- **Ask Bursa** — role-filtered retrieval-augmented generation over indexed internal documents, with citations kept under **View Source Scope**.
- **My Workforce** — create and run governed missions, inspect worker stages, configure mission teams, and open the Agent Library and Mission Capability Registry.
- **Collaborative Rooms** — persist shared rooms, tasks, activity, files, members, AI teammates, and decisions. Pending room decisions also appear in Action.
- **Automation Studio** — create, reopen, edit, duplicate, delete, validate, test, and run persisted visual workflows.
- **Intelligence Exchange** — publish approved mission results as reusable, versioned intelligence assets and create a new traceable mission from an asset.

### Governance & Follow-through

- **Action** — shows the backend-derived attention queue, decision memories, and reviewable email schedules. The sidebar badge is hidden at zero and updates from persisted pending work.
- **Verification Centre** — supports `Submit → Review → Approve / Request Changes → Revise → Resubmit`, retaining versions, comments, evidence, and audit history. Workflow approvals use the same review queue and resume the original run after approval.

### Administration & Platform

- **Knowledge Administration** — upload documents, edit metadata and permissions, ingest or re-index sources, inspect failures, remove content, and review model-generated suggested questions.
- **Connectors** — records governed connector requests and accurately shows that external access remains unavailable until an administrator configures it.
- **Settings** — manages local presentation preferences and shows live model-provider availability.

## Main capabilities

### Live model providers

BursaIQ exposes two provider choices:

- **Ollama** for local open-source generation, semantic routing, document embeddings, and suggested-question generation.
- **Microsoft Copilot Studio** through the Mobile app / Direct Line token endpoint.

Provider secrets stay on the Flask server. The frontend receives availability and model metadata, not credentials. Language-model failures are shown as unavailable states; BursaIQ does not silently substitute a fake successful response.

### Agent Registry and mission teams

The Agent Library stores versioned agents in SQLite. Users can create, edit, duplicate, test, disable, and archive agents with:

- Provider and model settings
- Instructions and generation parameters
- Knowledge collections, connectors, tools, and capabilities
- Input/output schemas and approval policy
- Department, ownership, and role permissions
- Execution history

Mission teams reference real registry agents. Users can assign agents to stages, reorder stages, configure dependencies, validate capability coverage, and save reusable team templates. A mission freezes the selected capability, team, and agent versions when it is created.

### Mission Capability Registry

A capability record declares required inputs, agent capabilities, schemas, approval policy, and a symbolic executor. Registration alone does not make arbitrary Python executable: the backend dispatches only executor IDs present in the explicit `MISSION_EXECUTORS` allowlist.


Every executor returns the same capability-neutral result sections: summary metrics, tables, charts, findings, evidence, quality checks, interpretation boundaries, and downloadable outputs. My Workforce, AI Assistant, and Verification Centre render these sections dynamically.


### Workflow Builder

The visual builder supports:

```text
Trigger → Gather Data → AI Agent → Condition → Human Approval
        → Generate Report → Publish / Send
```

Workflow definitions, node configuration, connections, validation, runs, inputs, outputs, errors, retries, and approval transitions are persisted in SQLite. AI Agent nodes select from the Agent Registry and can be constrained by a registered mission capability. Generate Report uses the real PDF service.

Publish / Send runs only an explicitly supported integration, currently publication of an approved mission to Intelligence Exchange. Unconfigured external send integrations are blocked and recorded as unavailable rather than simulated as successful.

### Ask Bursa RAG

Ask Bursa indexes controlled files under `knowledge/` and filters documents by role before retrieval. Supported formats are:

```text
.pdf  .docx  .xlsx  .pptx  .csv  .txt  .md  .html  .htm
```

During ingestion BursaIQ extracts text and source locations, creates Ollama embeddings, stores searchable chunks in SQLite, and generates grounded suggested questions. Suggestions are regenerated when a document changes and removed with their source document.

Supported department folders are:

```text
knowledge/
├── corporate_policies/
├── group_technology/
├── human_resources/
├── market_operations/
└── regulations/
```

Scanned image-only PDFs need OCR before upload; the current ingestion pipeline does not perform OCR.

### Persistence and governance

`runtime/bursaiq_demo.sqlite3` stores missions, versions, worker events, verification cases, audit history, workflows and runs, agents, mission teams, capability records, rooms and other platform items, settings, document chunks, and suggested questions.

Generated PDF reports are written to `output/pdf/`. Local Analysis uploads remain in memory and are cleared when the process restarts or the session is deleted.

The demo uses simulated identities and role checks. A production deployment would replace them with authenticated identities and enterprise authorization claims.

## Requirements

- Python 3.11 or newer
- Ollama for local generation and document embeddings, or a published Copilot Studio agent
- Node.js only for the frontend test suite

Install Python dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Create local configuration:

```bash
cp .env.example .env
```

The available settings are:

```dotenv
COPILOTSTUDIOAGENT__TOKENENDPOINT=""
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:3b"
OLLAMA_EMBED_MODEL="nomic-embed-text"
OLLAMA_REQUEST_TIMEOUT="120"
OLLAMA_KEEP_ALIVE="30m"
OLLAMA_MAX_TOKENS="1200"
BURSAIQ_HOST="127.0.0.1"
BURSAIQ_PORT="5000"
```

Do not commit `.env` or a Copilot Studio token endpoint.

## Run locally with Ollama

Install and start the models:

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
ollama serve
```

If `ollama serve` reports `bind: address already in use`, an Ollama server is already listening. Confirm it with:

```bash
curl http://127.0.0.1:11434/api/tags
```

Prepare the committed synthetic source pack and validate the ADV CSV inputs:

```bash
source .venv/bin/activate
python scripts/seed_demo_data.py
```

Start BursaIQ:

```bash
python server.py
```

Open <http://127.0.0.1:5000>.

Check provider availability while the server is running:

```bash
curl http://127.0.0.1:5000/api/model-providers
```

Only one process can listen on port 5000. Set `BURSAIQ_PORT` in `.env` if another application uses it.

## Configure Copilot Studio

1. Publish the Copilot Studio agent.
2. For this synthetic local demonstration, configure the Mobile app channel using the authentication mode appropriate to the environment.
3. Copy the Mobile app **Token Endpoint**.
4. Set `COPILOTSTUDIOAGENT__TOKENENDPOINT` in `.env` to the complete HTTPS endpoint.
5. Restart `server.py` and check `/api/model-providers`.

The backend exchanges the configured endpoint for short-lived Direct Line credentials and keeps the conversation state server-side.

## Add Ask Bursa documents

The recommended method is the **Knowledge Administration** page:

1. Open Knowledge Administration.
2. Select one or more supported files.
3. Choose the department, owner, classification, allowed roles, version, and lifecycle dates.
4. Upload and index the files.
5. Review ingestion status and generated suggested questions.
6. Re-index after changing metadata or content; remove retired sources from the same page.

For command-line ingestion, copy documents into the appropriate `knowledge/` department folder and run:

```bash
python scripts/ingest_knowledge.py
```

An optional sidecar named `<filename>.metadata.json` can provide governance metadata:

```json
{
  "classification": "Internal",
  "allowed_roles": ["employee", "hr"],
  "document_owner": "Human Resources",
  "effective_date": "2026-01-01",
  "expiry_date": "2026-12-31",
  "version": "1.0"
}
```

Available demonstration roles include `employee`, `gcmc`, `hr`, `securities`, and `finance`. Files beginning with `.` or `_` are ignored.

## Typical end-to-end mission flow

1. Enter a request on Home or choose **Create → New AI Mission**.
2. The selected live model maps the request to an available registered capability.
3. The backend validates the capability, required files, mission team, agents, and dependencies.
4. My Workforce runs the deterministic executor and persists worker events and structured results.
5. Submit the result to Verification Centre.
6. A reviewer approves it or requests changes.
7. A requested change creates a linked new mission version and preserves the original result and comments.
8. After approval, the owner publishes the result to Intelligence Exchange.
9. Reusing the asset creates a new mission with retained provenance.

## Tests

Run the backend suite with the standard library test runner:

```bash
source .venv/bin/activate
python -m unittest discover -s tests -p 'test_*.py'
```

Run the active frontend integration checks:

```bash
node --test tests/test_workforce_platform.cjs
```

Run the optional pre-show source/API/PDF check after generating the uppercase `Input/` source pack:

```bash
python scripts/demo_check.py
```

At the time of this README rewrite, the repository passes 71 backend tests and 24 frontend tests.

## Repository layout

```text
index.html                       Current application shell
server.py                        Flask API and integration boundary
static/css/workforce.css         Current responsive interface styles
static/js/workforce.js           Current frontend state and interactions
bursaiq/agents.py                Agent Registry and execution history
bursaiq/capabilities.py          Mission Capability Registry
bursaiq/mission_teams.py         Reusable mission-team persistence
bursaiq/mission_engine.py        Mission state, ADV executor, and worker ledger
bursaiq/liquidity_analysis.py    Security liquidity and turnover executor
bursaiq/workflows.py             Workflow definitions, validation, and runs
bursaiq/knowledge_rag.py         Document extraction, indexing, retrieval, citations
bursaiq/model_providers.py       Ollama provider
bursaiq/copilot_studio.py        Copilot Studio / Direct Line provider
bursaiq/platform_store.py        Rooms, actions, connectors, and settings
bursaiq/store.py                 Verification and audit persistence
bursaiq/reporting.py             PDF generation and validation
input/                           Mission CSV inputs
Input/                           Generated synthetic supporting source pack
knowledge/                       Ask Bursa governed documents
runtime/                         Local SQLite state
output/pdf/                      Generated reports
scripts/                         Seeding, ingestion, and demo checks
tests/                           Backend and active frontend tests
```

## Demonstration boundaries

- The Flask development server is for local demonstration, not production deployment.
- Included identities and permissions are simulated.
- SQLite is a local demonstration store.
- External connectors and email delivery are not configured.
- The application does not claim successful external execution when credentials or integrations are unavailable.
- Ollama keeps generation and embeddings local to the configured machine; Copilot Studio sends permitted prompts to the configured Microsoft service.
- Mission calculations are deterministic Python operations and execute only registered, allowlisted capability code.
- All committed datasets and generated source packs are synthetic.
