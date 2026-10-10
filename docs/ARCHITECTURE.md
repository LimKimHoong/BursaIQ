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
