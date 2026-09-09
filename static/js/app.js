(function () {
  "use strict";

  const demo = window.BURSAIQ_DEMO;
  const engine = window.BursaIQEngine;

  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z"/></svg>`,
    market: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3M2 19h20"/></svg>`,
    learn: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></svg>`,
    hr: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7-3h6m-3-3v6"/></svg>`,
    check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm-3-10 2 2 4-4"/></svg>`,
    download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>`,
    file: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`
  };

  const workspaceConfig = {
    market: {
      title: "Market Intelligence",
      description: "Market performance, participation and the forces moving the market.",
      placeholder: "Ask about market performance, ADV or regional peers…",
      access: "GCMC access",
      emptyTitle: "Ask a market question",
      emptyText: "Responses use the prepared GCMC dataset and governed calculations.",
      suggestions: ["How did the market perform in July?", "How did 30-day ADV change?", "Which sectors drove the market?"]
    },
    learn: {
      title: "Learn Bursa",
      description: "Plain-language answers grounded in approved learning material.",
      placeholder: "Ask about a Bursa term or concept…",
      access: "All colleagues",
      emptyTitle: "What would you like to understand?",
      emptyText: "Ask for a summary, definition or beginner-friendly explanation.",
      suggestions: ["Explain ADV in plain language", "What is trading velocity?", "What does index attribution mean?"]
    },
    hr: {
      title: "People Services",
      description: "Hiring guidance and permitted fictional application statuses.",
      placeholder: "Ask about the hiring procedure or a demo application…",
      access: "HR restricted",
      emptyTitle: "Ask People Services",
      emptyText: "Procedure guidance is separated from restricted fictional records.",
      suggestions: ["What is the hiring procedure?", "Show Alya Rahman's application status", "What happens after panel assessment?"]
    }
  };

  const state = {
    workspace: "home",
    answerWorkspace: "market",
    role: "gcmc",
    currentAnswer: null,
    currentQuestion: "",
    evidenceTab: "evidence",
    reports: JSON.parse(localStorage.getItem("bursaiq_reports") || "[]"),
    verification: JSON.parse(localStorage.getItem("bursaiq_verification") || "null") || demo.verification,
    backend: false
  };

  const dom = {};

  function bindDom() {
    ["chat-thread", "suggestion-row", "chat-form", "question-input", "evidence-content", "evidence-badge", "workspace-grid", "workspace-heading", "workspace-title", "workspace-description", "breadcrumb-label", "asof-chip", "access-chip", "role-select", "identity-name", "identity-role", "avatar", "report-dialog", "report-title", "open-report-button", "report-count", "verification-count", "new-thread-button", "menu-button", "mobile-scrim"].forEach((id) => {
      dom[id.replaceAll("-", "_")] = document.getElementById(id);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function deepMergeDemo(payload) {
    if (!payload) return;
    if (payload.meta) Object.assign(demo.meta, payload.meta);
    if (payload.market) {
      Object.assign(demo.market.headline, payload.market.headline || {});
      ["monthly", "sectors", "counters", "participation", "regional"].forEach((key) => {
        if (Array.isArray(payload.market[key]) && payload.market[key].length) demo.market[key] = payload.market[key];
      });
    }
    if (payload.hr) Object.assign(demo.hr, payload.hr);
    if (Array.isArray(payload.documents) && payload.documents.length) demo.documents.splice(0, demo.documents.length, ...payload.documents);
  }

  async function connectBackend() {
    if (location.protocol === "file:") return;
    try {
      const response = await fetch("/api/bootstrap", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Bootstrap unavailable");
      const payload = await response.json();
      deepMergeDemo(payload);
      if (Array.isArray(payload.verification)) state.verification = payload.verification;
      state.backend = true;
    } catch (_error) {
      state.backend = false;
    }
  }

  function selectNavigation(workspace) {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.workspace === workspace));
  }

  function setHeading(config) {
    dom.workspace_heading.hidden = false;
    dom.workspace_title.textContent = config.title;
    dom.workspace_description.textContent = config.description;
    dom.breadcrumb_label.textContent = config.title;
    dom.asof_chip.style.display = config === workspaceConfig.market ? "flex" : "none";
    dom.open_report_button.style.display = "none";
  }

  function composerMarkup(placeholder, isHome = false) {
    return `<div class="prompt-area${isHome ? " home-prompt" : ""}">
      <div class="suggestion-row" id="suggestion-row"></div>
      <form class="composer" id="chat-form">
        <label class="sr-only" for="question-input">Ask BursaIQ</label>
        <textarea id="question-input" rows="1" maxlength="1000" placeholder="${escapeHtml(placeholder)}"></textarea>
        <div class="composer-footer">
          <div class="composer-meta"><span class="grounding-dot"></span>${isHome ? "Routes within your permitted workspaces" : "Uses approved demo sources"}</div>
          <button class="send-button" type="submit" aria-label="Send question"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-5 14-2-5zM5 12l7 2"/></svg></button>
        </div>
      </form>
      <p class="demo-disclaimer">Synthetic competition data</p>
    </div>`;
  }

  function conversationMarkup(workspace, isHome = false) {
    const config = workspaceConfig[workspace];
    const empty = isHome
      ? `<div class="home-empty"><div class="home-brand" aria-hidden="true"><span></span><span></span><span></span></div><h1>How can I help?</h1><p>Ask a question, or open a workspace from the navigation.</p></div>`
      : `<div class="workspace-empty"><div>${icons[workspace]}</div><h2>${config.emptyTitle}</h2><p>${config.emptyText}</p></div>`;
    return `<div class="conversation-panel${isHome ? " home-conversation" : ""}">
      ${isHome ? "" : `<div class="conversation-toolbar"><div class="conversation-title"><span class="pulse-dot"></span><strong>${config.title}</strong></div><span id="access-chip">${config.access}</span></div>`}
      <div class="chat-thread" id="chat-thread" aria-live="polite">${empty}</div>
      ${composerMarkup(isHome ? "Ask BursaIQ…" : config.placeholder, isHome)}
    </div>`;
  }

  function evidenceMarkup() {
    return `<aside class="evidence-panel" id="evidence-panel" aria-label="Answer evidence">
      <div class="evidence-tabs" role="tablist" aria-label="Evidence views">
        <button class="evidence-tab is-active" data-tab="evidence" role="tab" type="button">Evidence <span id="evidence-badge">0</span></button>
        <button class="evidence-tab" data-tab="method" role="tab" type="button">Method</button>
        <button class="evidence-tab" data-tab="context" role="tab" type="button">Context</button>
      </div>
      <div class="evidence-content" id="evidence-content"></div>
    </aside>`;
  }

  function renderHome() {
    state.workspace = "home";
    state.currentAnswer = null;
    state.currentQuestion = "";
    state.evidenceTab = "evidence";
    dom.workspace_heading.hidden = true;
    dom.breadcrumb_label.textContent = "Ask BursaIQ";
    dom.workspace_grid.className = "workspace-grid home-layout";
    dom.workspace_grid.innerHTML = conversationMarkup("market", true);
    selectNavigation("home");
    bindDom();
    closeNavigation();
  }

  function hasAccess(workspace) {
    return demo.identities[state.role].access.includes(workspace);
  }

  function renderWorkspace(workspace) {
    const config = workspaceConfig[workspace];
    state.workspace = workspace;
    state.answerWorkspace = workspace;
    state.currentAnswer = null;
    state.currentQuestion = "";
    state.evidenceTab = "evidence";
    setHeading(config);
    selectNavigation(workspace);
    dom.workspace_grid.className = "workspace-grid";
    if (!hasAccess(workspace)) {
      dom.workspace_grid.innerHTML = `<section class="page-panel access-page"><div class="access-denied">${icons.lock}<h2>Workspace unavailable</h2><p>${demo.identities[state.role].name} does not have ${config.title} access. No source names or record contents were disclosed.</p></div></section>`;
    } else {
      dom.workspace_grid.innerHTML = conversationMarkup(workspace);
      bindDom();
      renderSuggestions(config.suggestions);
    }
    closeNavigation();
  }

  function switchWorkspace(workspace) {
    if (workspace === "home") renderHome();
    else if (workspaceConfig[workspace]) renderWorkspace(workspace);
    else renderPage(workspace);
  }

  function renderSuggestions(items) {
    if (!dom.suggestion_row) return;
    dom.suggestion_row.innerHTML = items.map((item) => `<button class="suggestion-chip" type="button" data-question="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("");
  }

  function routeQuestion(question) {
    const value = question.toLowerCase();
    if (/(hiring|recruit|applicant|application status|candidate|interview)/.test(value)) return "hr";
    if (/(market performance|fbm|klci|adv change|daily value|sector|market driver|regional|international|investor|fund flow|market cap|market value|velocity)/.test(value)) return "market";
    if (/(explain|define|meaning|what is|what does|new joiner|learn|glossary)/.test(value)) return "learn";
    return "market";
  }

  function ask(question) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || !dom.chat_thread) return;
    const targetWorkspace = state.workspace === "home" ? routeQuestion(cleanQuestion) : state.workspace;
    state.answerWorkspace = targetWorkspace;
    state.currentQuestion = cleanQuestion;
    document.querySelector(".home-empty, .workspace-empty")?.remove();
    document.querySelector(".conversation-panel")?.classList.add("has-messages");
    dom.chat_thread.insertAdjacentHTML("beforeend", `<div class="question-card">${escapeHtml(cleanQuestion)}</div>`);
    dom.question_input.value = "";
    resizeInput();

    if (!hasAccess(targetWorkspace)) {
      dom.chat_thread.insertAdjacentHTML("beforeend", `<article class="answer-card denied-answer"><div class="answer-meta"><span class="answer-logo">IQ</span>Access decision</div><div class="answer-body"><h3>I can’t open that workspace for this identity</h3><p>${demo.identities[state.role].name} does not have ${workspaceConfig[targetWorkspace].title} access. No restricted source or record was retrieved.</p></div></article>`);
      dom.chat_thread.scrollTop = dom.chat_thread.scrollHeight;
      return;
    }

    dom.chat_thread.insertAdjacentHTML("beforeend", `<div class="typing-indicator" id="typing"><div class="typing-dots"><i></i><i></i><i></i></div>Checking the approved sources…</div>`);
    dom.chat_thread.scrollTop = dom.chat_thread.scrollHeight;
    window.setTimeout(() => {
      document.getElementById("typing")?.remove();
      state.currentAnswer = engine.respond(targetWorkspace, cleanQuestion);
      const result = state.currentAnswer;
      dom.chat_thread.insertAdjacentHTML("beforeend", `<article class="answer-card"><div class="answer-meta"><span class="answer-logo">IQ</span>BursaIQ · ${workspaceConfig[targetWorkspace].title}</div><div class="answer-body"><h3>${result.title}</h3>${result.html}<div class="answer-actions"><button class="action-button" type="button" data-answer-action="evidence">${icons.check}View evidence</button><button class="action-button" type="button" data-answer-action="verify">${icons.shield}Verify</button><button class="action-button" type="button" data-answer-action="report">${icons.download}Create PDF</button></div><div class="answer-note">Synthetic output · ${demo.meta.asOf}</div></div></article>`);
      renderSuggestions(result.followups.slice(0, 3));
      if (document.getElementById("evidence-panel")) renderEvidence();
      dom.chat_thread.scrollTop = dom.chat_thread.scrollHeight;
    }, 360);
  }

  function showEvidence() {
    if (!state.currentAnswer) return;
    if (!document.getElementById("evidence-panel")) {
      dom.workspace_grid.insertAdjacentHTML("beforeend", evidenceMarkup());
      dom.workspace_grid.classList.add("has-evidence");
      bindDom();
    }
    state.evidenceTab = "evidence";
    renderEvidence();
    if (window.innerWidth <= 900) document.getElementById("evidence-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderEvidence() {
    if (!dom.evidence_content || !state.currentAnswer) return;
    const result = state.currentAnswer;
    document.querySelectorAll(".evidence-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === state.evidenceTab));
    dom.evidence_badge.textContent = result.sources.length;
    if (state.evidenceTab === "method") {
      dom.evidence_content.innerHTML = `<h2>How this was produced</h2><p class="panel-intro">Figures are calculated outside the language model.</p>${result.method.map((item) => `<div class="method-step"><span>${item[0]}</span><div><strong>${item[1]}</strong><p>${item[2]}</p></div></div>`).join("")}<div class="formula-box">${result.formula}</div>`;
    } else if (state.evidenceTab === "context") {
      dom.evidence_content.innerHTML = `<h2>Scope and assumptions</h2><ul class="context-list">${Object.entries(result.context).map(([key, value]) => `<li><span>${key}</span><strong>${value}</strong></li>`).join("")}</ul><div class="warning-block">Illustrative competition output, not an official market statement.</div>`;
    } else {
      dom.evidence_content.innerHTML = `<h2>${result.sources.length} source reference${result.sources.length === 1 ? "" : "s"}</h2><p class="panel-intro">Open a source or inspect the exact location used.</p>${sourceCards(result.sources)}<div class="confidence-row"><span>Evidence coverage</span><strong>${result.confidence}%</strong></div><div class="confidence-track"><span style="width:${result.confidence}%"></span></div>`;
    }
  }

  function sourceCards(sources) {
    return sources.map((doc, index) => `<article class="evidence-card"><div class="evidence-card-head"><span class="file-icon ${doc.format.toLowerCase()}">${doc.format}</span><div><strong>${doc.title}</strong><small>${doc.owner}</small></div><span class="source-index">${index + 1}</span></div>${doc.detail || doc.excerpt ? `<p class="source-detail">${doc.detail || doc.excerpt}</p>` : ""}${state.backend ? `<a class="action-button" href="/api/sources/${encodeURIComponent(doc.id)}?role=${encodeURIComponent(state.role)}" target="_blank" rel="noopener">${icons.file}Open source</a>` : ""}</article>`).join("");
  }

  function renderPage(page) {
    state.workspace = page;
    state.currentAnswer = null;
    const labels = { reports: "Briefings", verification: "Verification Centre", sources: "Data Sources" };
    const descriptions = {
      reports: "Downloadable outputs created from BursaIQ conversations.",
      verification: "Human review for answers that may inform decisions.",
      sources: "Local files available to this demo identity."
    };
    setHeading({ title: labels[page], description: descriptions[page] });
    dom.asof_chip.style.display = page === "sources" ? "flex" : "none";
    selectNavigation(page);
    dom.workspace_grid.className = "workspace-grid";
    dom.workspace_grid.innerHTML = `<section class="page-panel">${page === "reports" ? reportsPage() : page === "verification" ? verificationPage() : sourcesPage()}</section>`;
    closeNavigation();
  }

  function reportsPage() {
    if (!state.reports.length) {
      return `<div class="empty-state"><div>${icons.file}<h2>No briefings yet</h2><p>Create a PDF from any grounded answer.</p><button class="button secondary" type="button" data-go="home">Start a conversation</button></div></div>`;
    }
    return `<div class="page-hero"><div><h2>Generated briefings</h2><p>PDFs include the answer, method, sources and verification state.</p></div></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Briefing</th><th>Created</th><th>Status</th><th></th></tr></thead><tbody>${state.reports.map((report) => `<tr><td><strong>${escapeHtml(report.title)}</strong><br><small>${escapeHtml(report.question)}</small></td><td>${report.created}</td><td><span class="status-pill">${report.status}</span></td><td>${report.url ? `<a class="button ghost" href="${report.url}" download>Download</a>` : "Service required"}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function verificationPage() {
    return `<div class="page-hero"><div><h2>Review queue</h2><p>Review the answer, calculation and evidence before publication.</p></div><span class="status-pill">${state.verification.filter((item) => item.status === "Pending review").length} pending</span></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Case</th><th>Requested by</th><th>Reviewer</th><th>Status</th><th>Action</th></tr></thead><tbody>${state.verification.map((item) => `<tr><td><strong>${item.title}</strong><br><small>${item.id}</small></td><td>${item.requestedBy}</td><td>${item.reviewer}</td><td><span class="status-pill ${item.status === "Approved" ? "approved" : item.status === "Changes requested" ? "denied" : ""}">${item.status}</span></td><td>${item.status === "Pending review" ? `<button class="button primary" type="button" data-verify="${item.id}" data-status="Approved">Approve</button> <button class="button ghost" type="button" data-verify="${item.id}" data-status="Changes requested">Request changes</button>` : "Completed"}</td></tr>`).join("")}</tbody></table></div><div class="warning-block">Local demonstration workflow. Production approval would use governed identities and storage.</div>`;
  }

  function sourcesPage() {
    const canSee = (doc) => doc.workspace !== "hr" || state.role === "hr";
    return `<div class="page-hero"><div><h2>Available sources</h2><p>Excel and PDF files loaded from the controlled Input folder.</p></div><span class="status-pill approved">${demo.documents.filter(canSee).length} available</span></div><div class="library-grid">${demo.documents.map((doc) => canSee(doc) ? `<article class="library-card"><span class="file-icon ${doc.format.toLowerCase()}">${doc.format}</span><h3>${doc.title}</h3><p>${doc.excerpt}</p>${state.backend ? `<a class="action-button" href="/api/sources/${encodeURIComponent(doc.id)}?role=${encodeURIComponent(state.role)}" target="_blank" rel="noopener">${icons.file}Open source</a>` : ""}<div class="library-meta"><span>${doc.owner}</span><span>${doc.updated}</span></div></article>` : `<article class="library-card"><span class="file-icon">—</span><h3>Restricted source</h3><p>Source details are hidden for this identity.</p><div class="library-meta"><span>Access denied</span><span>Logged</span></div></article>`).join("")}</div><div class="warning-block">${demo.meta.disclaimer}</div>`;
  }

  function updateIdentity() {
    state.role = dom.role_select.value;
    const identity = demo.identities[state.role];
    dom.avatar.textContent = identity.initials;
    dom.identity_name.textContent = identity.name;
    dom.identity_role.textContent = identity.role;
    renderHome();
    toast("Identity switched", `${identity.name} now has ${identity.role.split(" · ")[0]} demo permissions.`);
  }

  function openReportDialog() {
    if (!state.currentAnswer) {
      toast("Ask a question first", "A briefing needs a grounded answer.");
      return;
    }
    dom.report_title.value = state.currentAnswer.title;
    dom.report_dialog.showModal();
  }

  async function createReport(event) {
    event.preventDefault();
    const title = dom.report_title.value.trim() || "BursaIQ Briefing";
    const mode = dom.report_dialog.querySelector('input[name="report-state"]:checked')?.value || "draft";
    const record = { title, question: state.currentQuestion, created: new Date().toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }), status: mode === "review" ? "Pending review" : "Draft — not verified", url: "" };
    if (!state.backend) {
      toast("PDF service unavailable", "Run server.py to generate the briefing.");
      return;
    }
    try {
      const response = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, question: state.currentQuestion, answer: state.currentAnswer, requestedBy: demo.identities[state.role].name, workspace: workspaceConfig[state.answerWorkspace].title, verification: record.status }) });
      if (!response.ok) throw new Error("Report service failed");
      const payload = await response.json();
      record.url = payload.downloadUrl;
      if (payload.verification) state.verification.unshift(payload.verification);
    } catch (_error) {
      toast("PDF service unavailable", "Check the local server and try again.");
      return;
    }
    state.reports.unshift(record);
    localStorage.setItem("bursaiq_reports", JSON.stringify(state.reports));
    localStorage.setItem("bursaiq_verification", JSON.stringify(state.verification));
    updateCounts();
    dom.report_dialog.close();
    toast("Briefing created", mode === "review" ? "PDF created and sent for review." : "Draft PDF is ready.");
    window.setTimeout(() => { window.location.href = record.url; }, 300);
  }

  async function submitVerification() {
    if (!state.currentAnswer) return;
    const existing = state.verification.find((item) => item.title === state.currentAnswer.title && item.status === "Pending review");
    if (existing) {
      toast("Already in review", `${existing.id} is waiting for ${existing.reviewer}.`);
      return;
    }
    let item = { id: `VER-${Date.now().toString().slice(-8)}`, title: state.currentAnswer.title, workspace: workspaceConfig[state.answerWorkspace].title, requestedBy: demo.identities[state.role].name, reviewer: state.answerWorkspace === "hr" ? "HR Policy Owner" : "Market Intelligence Lead", status: "Pending review", created: new Date().toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }), scope: "Answer narrative, calculations and source citations" };
    if (state.backend) {
      try {
        const response = await fetch("/api/verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: item.title, workspace: item.workspace, requestedBy: item.requestedBy }) });
        if (!response.ok) throw new Error("Review service failed");
        item = await response.json();
      } catch (_error) {
        toast("Review service unavailable", "Check the local server and try again.");
        return;
      }
    }
    state.verification.unshift(item);
    localStorage.setItem("bursaiq_verification", JSON.stringify(state.verification));
    updateCounts();
    toast("Sent for verification", `${item.id} was added to the review queue.`);
  }

  async function reviewItem(id, status) {
    const item = state.verification.find((entry) => entry.id === id);
    if (!item) return;
    if (state.backend) {
      try {
        const response = await fetch(`/api/verification/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, actor: demo.identities[state.role].name }) });
        if (!response.ok) throw new Error("Review update failed");
        Object.assign(item, await response.json());
      } catch (_error) {
        toast("Review update unavailable", "The audit store could not be updated.");
        return;
      }
    } else {
      item.status = status;
    }
    localStorage.setItem("bursaiq_verification", JSON.stringify(state.verification));
    updateCounts();
    renderPage("verification");
    toast("Review updated", `${id} is now ${status.toLowerCase()}.`);
  }

  function updateCounts() {
    dom.report_count.textContent = state.reports.length;
    dom.verification_count.textContent = state.verification.filter((item) => item.status === "Pending review").length;
  }

  function toast(title, message) {
    const container = document.getElementById("toast-region");
    if (!container) return;
    const item = document.createElement("div");
    item.className = "toast";
    item.innerHTML = `${icons.check}<div><strong>${escapeHtml(title)}</strong>${escapeHtml(message)}</div>`;
    container.appendChild(item);
    window.setTimeout(() => item.remove(), 4000);
  }

  function resizeInput() {
    if (!dom.question_input) return;
    dom.question_input.style.height = "auto";
    dom.question_input.style.height = `${Math.min(dom.question_input.scrollHeight, 130)}px`;
  }

  function closeNavigation() {
    document.body.classList.remove("nav-open");
    dom.menu_button?.setAttribute("aria-expanded", "false");
  }

  function handleWorkspaceClick(event) {
    const question = event.target.closest("[data-question]");
    if (question) return ask(question.dataset.question);
    const tab = event.target.closest(".evidence-tab");
    if (tab) {
      state.evidenceTab = tab.dataset.tab;
      renderEvidence();
      return;
    }
    const action = event.target.closest("[data-answer-action]")?.dataset.answerAction;
    if (action === "evidence") showEvidence();
    if (action === "verify") submitVerification();
    if (action === "report") openReportDialog();
    const verify = event.target.closest("[data-verify]");
    if (verify) reviewItem(verify.dataset.verify, verify.dataset.status);
    const go = event.target.closest("[data-go]");
    if (go) switchWorkspace(go.dataset.go);
  }

  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", () => switchWorkspace(item.dataset.workspace)));
    dom.role_select.addEventListener("change", updateIdentity);
    dom.open_report_button.addEventListener("click", openReportDialog);
    dom.new_thread_button.addEventListener("click", () => switchWorkspace(workspaceConfig[state.workspace] ? state.workspace : "home"));
    dom.menu_button.addEventListener("click", () => { const open = document.body.classList.toggle("nav-open"); dom.menu_button.setAttribute("aria-expanded", String(open)); });
    dom.mobile_scrim.addEventListener("click", closeNavigation);
    dom.workspace_grid.addEventListener("click", handleWorkspaceClick);
    dom.workspace_grid.addEventListener("submit", (event) => { if (event.target.id === "chat-form") { event.preventDefault(); ask(document.getElementById("question-input").value); } });
    dom.workspace_grid.addEventListener("input", (event) => { if (event.target.id === "question-input") resizeInput(); });
    dom.workspace_grid.addEventListener("keydown", (event) => { if (event.target.id === "question-input" && event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.target.form.requestSubmit(); } });
    document.getElementById("report-form").addEventListener("submit", createReport);
    dom.report_dialog.addEventListener("click", (event) => { if (event.target.closest("[data-close-dialog]")) dom.report_dialog.close(); });
  }

  async function init() {
    bindDom();
    await connectBackend();
    bindEvents();
    updateCounts();
    renderHome();
    if (!state.backend) document.querySelector(".system-state strong").textContent = "Offline preview";
  }

  document.addEventListener("DOMContentLoaded", init);
})();
