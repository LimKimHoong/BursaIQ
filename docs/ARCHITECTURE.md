# BursaIQ Stage 02 Architecture

```text
Controlled local files
  Excel market / HR tables ─┐
  PDF learning / policy docs ├─> validated ingestion + local text index
                             │                 │
Demo identity ─> workspace policy ────────────┤
                                               v
Question ─> intent routing ─> governed metric tool or document retrieval
                                               │
                           optional small model for wording only
                                               │
                                               v
                            answer + formula + evidence + qualifiers
                                      │                    │
                                      v                    v
                              SQLite review queue     verified PDF report
```

## Why this shape fits the final

- It works without internet and avoids loading a multi-gigabyte model on the 8 GB demo laptop.
- It demonstrates technical feasibility with real parsing, retrieval, calculations, persistence and PDF output.
- It shows responsible AI visibly: synthetic labels, least-access workspaces, no-data disclosure on denial, provenance and human verification.
- It gives the language-model layer a narrow, replaceable role. The same services can later sit behind Azure OpenAI, Azure AI Search, Entra ID and approved internal storage.

## Production evolution, if the idea advances

| Stage 02 component | Pilot replacement |
|---|---|
| Demo identity selector | Microsoft Entra ID SSO and group claims |
| Local Input folder | Approved SharePoint/Data Lake zones and ingestion jobs |
| In-memory text search | Azure AI Search with document-level permissions |
| Flask development server | Containerised API behind approved gateway |
| Local SQLite queue | Central workflow store with Teams notification/approval |
| Optional local Ollama model | Approved Azure OpenAI deployment or approved local inference |
| Local PDF folder | Governed document repository with retention policy |

No production infrastructure is required or claimed for the competition demo.
