# BursaIQ Copilot Studio Architecture

```text
Browser ── question / research brief ──> Flask API
                                             │
Demo identity ──> deterministic workspace policy
                                             │ allowed
                                             v
                                  Copilot Studio gateway
                                  ├─ short-lived Direct Line token
                                  └─ server-side conversation state
                                             │
                                             v
                                  Published Copilot Studio agent
                                             │
                                             v
Browser <── answer + suggestions + conversation ID
   │
   ├─ controlled local evidence/calculation views
   ├─ role-filtered Research dossiers
   ├─ in-memory Local Analysis workspace
   ├─ SQLite review queue
   └─ verified PDF report
```

## Why this shape fits the final

- It keeps tokens and tenant configuration out of browser JavaScript.
- It avoids any local inference runtime or downloadable weights on the demo laptop.
- It demonstrates technical feasibility with a real hosted agent, parsing, calculations, persistence and PDF output.
- It shows responsible AI visibly: synthetic labels, least-access workspaces, no-data disclosure on denial, provenance and human verification.
- It keeps BursaIQ's authorization checks ahead of the hosted agent call, so the agent does not decide application access.
- It keeps uploaded Local Analysis files in memory and performs deterministic extractive retrieval locally; only selected passages are sent to Copilot Studio after an explicit user opt-in.

## Production evolution, if the idea advances

| Stage 02 component | Pilot replacement |
|---|---|
| Demo identity selector | Microsoft Entra ID SSO and group claims (reuse the delegated identity) |
| Local Input folder | Approved SharePoint/Data Lake zones and ingestion jobs |
| In-memory text search | Azure AI Search with document-level permissions |
| In-memory Local Analysis sessions | Approved isolated document-analysis service with malware scanning, retention controls and tenant boundaries |
| Flask development server | Containerised API behind approved gateway |
| Local SQLite queue | Central workflow store with Teams notification/approval |
| Local Flask Copilot gateway | Containerised API using an approved Copilot Studio authentication pattern |
| Local PDF folder | Governed document repository with retention policy |

No production infrastructure is required or claimed for the competition demo.

## Mission capability boundary

Mission types are records in the SQLite-backed `MissionCapabilityRegistry`. Each record declares its required inputs, required agent capabilities, input and output schema identifiers, approval policy, and a symbolic executor ID. The live intent router receives only capabilities whose status is active, whose required local inputs exist, and whose executor ID is installed by Python.

Registering a capability record does not install executable code. A developer must implement the executor and add it to the server's explicit `MISSION_EXECUTORS` allowlist. Mission creation validates the chosen registry record and team, then freezes both versioned contracts with the mission. Execution dispatches only through that allowlist and rejects missing, disabled, input-incomplete, invented, or changed executor contracts.

Every capability also declares a versioned result schema. Executors must return the shared result sections for summary metrics, tables, charts, findings, evidence references, quality checks, interpretation boundaries, and downloadable outputs. Python validates this envelope before a mission becomes reviewable. My Workforce and Verification Centre use the same schema-driven renderer, so adding an executable capability does not require mission-specific frontend fields.

Workflow nodes reference Agent Registry and Capability Registry IDs. A run freezes its workflow definition and persists each node's resolved inputs, outputs, error, retry count, and approval transition. Human approval updates and resumes the same run from the next node; repeated decisions are rejected. Generate Report uses the configured PDF service. Publish / Send executes only an explicitly supported integration and records a blocked result when no approved integration exists.
