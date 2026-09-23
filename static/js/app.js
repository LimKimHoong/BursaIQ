(function () {
  "use strict";

  const demo = window.BURSAIQ_DEMO;
  const engine = window.BursaIQEngine;

  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z"/></svg>`,
    market: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3M2 19h20"/></svg>`,
    learn: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></svg>`,
    reg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7zm10 0-4 7h8l-4-7zM8 21h8"/></svg>`,
    hr: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7-3h6m-3-3v6"/></svg>`,
    check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm-3-10 2 2 4-4"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16M7 15l4-5 3 2 5-7"/></svg>`,
    download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>`,
    file: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
    pulse: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2.5-6 5 12 2.5-6h4"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>`,
    web: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>`,
    table: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>`,
    list: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 1 1 2-2m2 1h5m-10 6 1 1 2-2m2 1h5"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>`,
    person: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5m10.1 0A7 7 0 0 0 6.4 7.7L4 12m16 0-2.4 4.3A7 7 0 0 1 4.9 12"/></svg>`
  };

  const defaultPreferences = {
    responseStyle: "balanced",
    autoOpenInsights: true,
    chartMotion: true,
    defaultWorkspace: "home",
    useLocalModel: true,
    plugins: { webSearch: false, pdfTools: true, spreadsheetTools: true }
  };

  function loadPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem("bursaiq_preferences") || "{}");
      const preferences = { ...defaultPreferences, ...saved, plugins: { ...defaultPreferences.plugins, ...(saved.plugins || {}) } };
      if (!["home", "learn"].includes(preferences.defaultWorkspace)) preferences.defaultWorkspace = "home";
      return preferences;
    } catch (_error) {
      return { ...defaultPreferences, plugins: { ...defaultPreferences.plugins } };
    }
  }

  function loadAccessRequests() {
    try {
      const saved = JSON.parse(localStorage.getItem("bursaiq_access_requests") || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch (_error) {
      return {};
    }
  }

  const learningPaths = {
    foundations: {
      title: "Capital market foundations",
      description: "Build a working vocabulary for market size, activity and participation.",
      source: "Bursa Market Primer",
      questions: ["What is market capitalisation?", "Explain ADV in plain language", "What is trading velocity?"]
    },
    products: {
      title: "Products and markets",
      description: "Explore the major product groups available through Bursa Malaysia.",
      source: "Bursa Products Overview",
      questions: ["What products are available in Bursa?", "What is a REIT?", "Explain the derivatives market"]
    },
    responsible: {
      title: "Working responsibly",
      description: "Learn how to handle internal information and when to escalate.",
      source: "New Joiner Conduct Guide",
      questions: ["How should new joiners handle confidential information?", "When should I escalate a data concern?", "Summarise the responsible data handling guidance"]
    }
  };

  const workspaceConfig = {
    market: {
      title: "Market Intelligence",
      description: "Market performance, participation and the forces moving the market.",
      placeholder: "Ask about market performance, ADV or regional peers…",
      access: "All colleagues",
      emptyTitle: "Ask a market question",
      emptyText: "Responses use the prepared dataset and governed calculations.",
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
    reg: {
      title: "Ask Reg",
      description: "Controlled regulatory guidance with clear escalation and authority boundaries.",
      placeholder: "Ask about disclosure, listing obligations or escalation…",
      access: "Approved users",
      emptyTitle: "Ask a regulation question",
      emptyText: "Responses use a restricted synthetic guide and always point back to the accountable regulatory owner.",
      suggestions: ["What is continuous disclosure?", "What should happen after an unusual market activity query?", "How should suspected market misconduct be escalated?"]
    },
    hr: {
      title: "Ask HR",
      description: "Controlled hiring guidance and permitted fictional application statuses.",
      placeholder: "Ask about the hiring procedure or a demo application…",
      access: "Approved users",
      emptyTitle: "Ask an HR question",
      emptyText: "Responses use approved HR demo sources. Applicant records remain restricted and fictional.",
      suggestions: ["What is the hiring procedure?", "Show Alya Rahman's application status", "What happens after panel assessment?"]
    }
  };

  const state = {
    workspace: "home",
    answerWorkspace: "market",
    role: "gcmc",
    currentAnswer: null,
    currentQuestion: "",
    insightTab: "plot",
    reports: JSON.parse(localStorage.getItem("bursaiq_reports") || "[]"),
    verification: [],
    backend: false,
    pending: false,
    requestId: 0,
    model: { enabled: false, provider: "disabled", model: "deterministic-demo-engine" },
    preferences: loadPreferences(),
    accessRequests: loadAccessRequests(),
    accessRequestPanel: ""
  };

  const dom = {};

  function bindDom() {
    ["chat-thread", "suggestion-row", "chat-form", "question-input", "evidence-content", "evidence-badge", "workspace-grid", "workspace-heading", "workspace-title", "workspace-description", "breadcrumb-label", "asof-chip", "access-chip", "role-select", "identity-name", "identity-role", "avatar", "report-dialog", "report-title", "open-report-button", "report-count", "verification-count", "verification-dialog", "verification-dialog-title", "verification-detail-content", "verification-flow-dialog", "verification-flow-dialog-title", "verification-flow-content", "access-request-dialog", "access-request-form", "access-request-panel-name", "access-request-reason", "access-request-reason-count", "access-request-error", "submit-access-request", "ask-reg-nav", "ask-hr-nav", "verification-nav", "settings-nav", "new-thread-button", "menu-button", "mobile-scrim"].forEach((id) => {
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
    if (location.protocol === "file:") {
      state.verification = reviewerCases(demo.verification);
      return;
    }
    try {
      const response = await fetch(`/api/bootstrap?role=${encodeURIComponent(state.role)}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Bootstrap unavailable");
      const payload = await response.json();
      deepMergeDemo(payload);
      if (Array.isArray(payload.verification)) state.verification = payload.verification;
      if (payload.model) state.model = payload.model;
      state.backend = true;
    } catch (_error) {
      state.backend = false;
      state.verification = reviewerCases(demo.verification);
    }
  }

  function isReviewer() {
    return Boolean(demo.identities[state.role].reviewerFor?.length);
  }

  function reviewerCases(cases = state.verification) {
    const assignments = new Set(demo.identities[state.role].reviewerFor || []);
    return cases.filter((item) => assignments.has(item.reviewer));
  }

  async function refreshVerificationAccess() {
    if (!state.backend) {
      state.verification = reviewerCases(demo.verification);
      return;
    }
    if (!isReviewer()) {
      state.verification = [];
      return;
    }
    try {
      const response = await fetch(`/api/verification?role=${encodeURIComponent(state.role)}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Review queue unavailable");
      const payload = await response.json();
      state.verification = Array.isArray(payload.cases) ? payload.cases : [];
    } catch (_error) {
      state.verification = [];
      toast("Review queue unavailable", "The assigned cases could not be loaded. Try again after checking the local server.");
    }
  }

  function selectNavigation(workspace) {
    document.querySelectorAll("[data-workspace]").forEach((item) => item.classList.toggle("is-active", item.dataset.workspace === workspace));
  }

  function savePreferences() {
    localStorage.setItem("bursaiq_preferences", JSON.stringify(state.preferences));
    applyPreferences();
  }

  function applyPreferences() {
    document.body.classList.toggle("reduce-chart-motion", !state.preferences.chartMotion);
    updateSystemIndicator();
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
    const pluginCount = Object.values(state.preferences.plugins).filter(Boolean).length;
    const pluginLabel = pluginCount ? ` · ${pluginCount} plugin${pluginCount === 1 ? "" : "s"} enabled` : "";
    return `<div class="prompt-area${isHome ? " home-prompt" : ""}">
      <div class="suggestion-row" id="suggestion-row"></div>
      <form class="composer" id="chat-form">
        <label class="sr-only" for="question-input">Ask BursaIQ</label>
        <textarea id="question-input" rows="1" maxlength="1000" placeholder="${escapeHtml(placeholder)}"></textarea>
        <div class="composer-footer">
          <div class="composer-meta"><span class="grounding-dot"></span>${isHome ? "Routes within your permitted workspaces" : "Uses approved demo sources"}${pluginLabel}</div>
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
      : workspace === "market"
        ? `<div class="workspace-empty workspace-entry"><div class="entry-icon">${icons.market}</div><h2>${config.emptyTitle}</h2><p>${config.emptyText}</p><button class="feature-entry" type="button" data-open-pulse><span>${icons.pulse}</span><span><strong>Open Market Pulse</strong><small>A ready-to-present view of July performance, activity and drivers</small></span>${icons.arrow}</button></div>`
        : workspace === "learn"
          ? `<div class="workspace-empty pathway-entry"><div class="entry-icon">${icons.learn}</div><h2>${config.emptyTitle}</h2><p>${config.emptyText}</p><button class="feature-entry" type="button" data-open-pathways><span>${icons.learn}</span><span><strong>Browse learning pathways</strong><small>Follow a guided route through approved onboarding material</small></span>${icons.arrow}</button></div>`
          : `<div class="workspace-empty"><div>${icons[workspace]}</div><h2>${config.emptyTitle}</h2><p>${config.emptyText}</p></div>`;
    return `<div class="conversation-panel${isHome ? " home-conversation" : ""}">
      ${isHome ? "" : `<div class="conversation-toolbar"><div class="conversation-title"><span class="pulse-dot"></span><strong>${config.title}</strong></div><span id="access-chip">${config.access}</span></div>`}
      <div class="chat-thread" id="chat-thread" aria-live="polite">${empty}</div>
      ${composerMarkup(isHome ? "Ask BursaIQ…" : config.placeholder, isHome)}
    </div>`;
  }

  function marketPulseMarkup() {
    const headline = demo.market.headline;
    const topSector = [...demo.market.sectors].sort((a, b) => b.contributionPoints - a.contributionPoints)[0];
    const institutional = demo.market.participation.find((item) => item.group === "Local institutions");
    const foreign = demo.market.participation.find((item) => item.group === "Foreign investors");
    return `<div class="feature-view market-pulse-view">
      <div class="feature-view-head"><div><h2>Market Pulse</h2><p>A concise starting point built from the prepared GCMC dataset.</p></div><span class="asof-inline">${escapeHtml(demo.meta.asOf)}</span></div>
      <div class="pulse-lead"><div><span>FBM KLCI</span><strong>${headline.fbmKLCI.toLocaleString("en-MY", { minimumFractionDigits: 1 })}</strong><small>+${headline.klciMtdPct.toFixed(1)}% month to date</small></div><p>July ended with stronger market activity and positive index momentum. Technology made the largest sector contribution while local institutions and foreign investors recorded net buying in the prepared dataset.</p></div>
      <dl class="pulse-strip">
        <div><dt>30-day ADV</dt><dd>RM${headline.adv30dBn.toFixed(2)}bn</dd><small>+${(((headline.adv30dBn / headline.advPrior30dBn) - 1) * 100).toFixed(1)}% vs prior 30D</small></div>
        <div><dt>Top sector driver</dt><dd>${escapeHtml(topSector.name)}</dd><small>+${topSector.contributionPoints.toFixed(1)} index points</small></div>
        <div><dt>Net buying</dt><dd>RM${(institutional.netFlowMn + foreign.netFlowMn).toLocaleString("en-MY")}m</dd><small>Institutions + foreign</small></div>
      </dl>
      <div class="pulse-actions"><button class="button primary" type="button" data-question="How did the market perform in July?">Ask for full market briefing</button><button class="button ghost" type="button" data-question="Compare Malaysia with regional peers">Compare regional peers</button></div>
      <p class="feature-footnote">Synthetic competition data · governed calculations remain available in the analysis panel.</p>
    </div>`;
  }

  function learningPathwaysMarkup() {
    return `<div class="feature-view learning-view"><div class="feature-view-head"><div><h2>Learn Bursa pathways</h2><p>Choose a starting point. Each pathway turns approved material into a guided conversation.</p></div></div><div class="pathway-list">${Object.entries(learningPaths).map(([id, path]) => `<button class="pathway-row" type="button" data-learning-path="${id}"><span class="pathway-number">${Object.keys(learningPaths).indexOf(id) + 1}</span><span><strong>${escapeHtml(path.title)}</strong><small>${escapeHtml(path.description)}</small><em>${path.questions.length} topics · ${escapeHtml(path.source)}</em></span>${icons.arrow}</button>`).join("")}</div><p class="feature-footnote">The pathway suggests questions; every answer is still grounded in the retrieved local source.</p></div>`;
  }

  function learningPathMarkup(id) {
    const path = learningPaths[id];
    if (!path) return learningPathwaysMarkup();
    return `<div class="feature-view learning-path-detail"><button class="text-back" type="button" data-back-pathways>${icons.arrow}<span>All pathways</span></button><div class="path-detail-head"><div>${icons.learn}</div><h2>${escapeHtml(path.title)}</h2><p>${escapeHtml(path.description)}</p><span>${escapeHtml(path.source)}</span></div><ol class="path-steps">${path.questions.map((question, index) => `<li><span>${index + 1}</span><button type="button" data-question="${escapeHtml(question)}"><strong>${escapeHtml(question)}</strong><small>Ask BursaIQ using the approved learning source</small></button></li>`).join("")}</ol><button class="button primary" type="button" data-question="${escapeHtml(path.questions[0])}">Start pathway</button></div>`;
  }

  function evidenceMarkup() {
    return `<aside class="evidence-panel insight-panel" id="evidence-panel" aria-label="Full answer analysis">
      <div class="insight-header"><div><span>Full answer</span><strong>Analysis panel</strong></div><button class="icon-button" type="button" data-close-insight aria-label="Close analysis panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="evidence-tabs" role="tablist" aria-label="Analysis views">
        <button class="evidence-tab is-active" data-tab="plot" role="tab" type="button">Plot</button>
        <button class="evidence-tab" data-tab="analysis" role="tab" type="button">Analysis</button>
        <button class="evidence-tab" data-tab="sources" role="tab" type="button">Sources <span id="evidence-badge">0</span></button>
      </div>
      <div class="evidence-content" id="evidence-content"></div>
    </aside>`;
  }

  function renderHome() {
    state.requestId += 1;
    state.pending = false;
    state.workspace = "home";
    state.currentAnswer = null;
    state.currentQuestion = "";
    state.insightTab = "plot";
    dom.workspace_heading.hidden = true;
    dom.breadcrumb_label.textContent = "BursaIQ Assistant";
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
    state.requestId += 1;
    state.pending = false;
    state.workspace = workspace;
    state.answerWorkspace = workspace;
    state.currentAnswer = null;
    state.currentQuestion = "";
    state.insightTab = "plot";
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
    if (/(explain|define|meaning|what is|what does|new joiner|learn|glossary)/.test(value)) return "learn";
    if (/(market|fbm|klci|adv|daily value|sector|market driver|regional|international|investor|fund flow|market cap|market value|velocity)/.test(value)) return "market";
    return "learn";
  }

  function firstParagraph(html) {
    const match = String(html).match(/<p>([\s\S]*?)<\/p>/i);
    return match ? `<p>${match[1]}</p>` : html;
  }

  function plainText(html) {
    const element = document.createElement("div");
    element.innerHTML = String(html || "");
    return element.textContent.trim();
  }

  function narrativeMarkup(value) {
    const paragraphs = String(value || "")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/^#{1,6}\s*/gm, "").trim())
      .filter(Boolean);
    return `<div class="model-narrative">${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`).join("")}</div>`;
  }

  function answerProvenance(result) {
    if (result.narrativeMode === "ollama") return `<span class="model-chip ollama">Ollama · ${escapeHtml(result.model?.model || state.model.model)}</span>`;
    if (result.narrativeMode === "governed-retrieval") return `<span class="model-chip grounded">Grounded catalogue</span>`;
    if (state.model.enabled && !state.preferences.useLocalModel) return `<span class="model-chip">Deterministic mode</span>`;
    if (state.model.enabled) return `<span class="model-chip fallback">Safe fallback</span>`;
    return `<span class="model-chip">Deterministic demo</span>`;
  }

  function updateSystemIndicator(mode) {
    const label = document.querySelector(".system-state strong");
    const container = document.querySelector(".system-state");
    if (!label || !container) return;
    if (!state.backend) {
      label.textContent = "Offline preview";
      container.title = "Backend unavailable; browser fallback is active";
    } else if (state.model.enabled && !state.preferences.useLocalModel) {
      label.textContent = "Deterministic mode";
      container.title = "Local Ollama wording is paused in Settings";
    } else if (mode === "ollama") {
      label.textContent = `Ollama · ${state.model.model}`;
      container.title = "Local Ollama wording is active; calculations and access controls remain deterministic";
    } else if (mode === "governed-retrieval") {
      label.textContent = "Grounded catalogue";
      container.title = "The answer is taken from the approved product catalogue with deterministic grouping";
    } else if (state.model.enabled) {
      label.textContent = "Ollama enabled · fallback ready";
      container.title = "Ollama is configured; deterministic fallback remains available";
    } else {
      label.textContent = "Deterministic demo";
      container.title = "Ollama is optional and currently disabled";
    }
  }

  function accessDeniedMarkup(workspace) {
    const config = workspaceConfig[workspace] || workspaceConfig.learn;
    return `<article class="answer-card denied-answer"><div class="answer-meta"><span class="answer-logo">IQ</span>Access decision</div><div class="answer-body"><h3>I can’t open that workspace for this identity</h3><p>${escapeHtml(demo.identities[state.role].name)} does not have ${escapeHtml(config.title)} access. No restricted source or record was retrieved.</p></div></article>`;
  }

  async function requestBackendAnswer(question, requestedWorkspace, role) {
    if (!state.backend) return null;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          workspace: requestedWorkspace,
          role,
          useModel: state.preferences.useLocalModel,
          responseStyle: state.preferences.responseStyle,
          plugins: Object.entries(state.preferences.plugins).filter(([, enabled]) => enabled).map(([id]) => id)
        }),
        signal: controller.signal
      });
      const payload = await response.json();
      if (response.status === 403) return { denied: true, workspace: payload.workspace || routeQuestion(question) };
      if (!response.ok) throw new Error(payload.error || "Chat service failed");
      return payload;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function resolveAnswer(question, selectedWorkspace, role) {
    const localWorkspace = selectedWorkspace === "home" ? routeQuestion(question) : selectedWorkspace;
    if (!state.backend) {
      return hasAccess(localWorkspace) ? { workspace: localWorkspace, result: engine.respond(localWorkspace, question) } : { denied: true, workspace: localWorkspace };
    }
    try {
      const payload = await requestBackendAnswer(question, selectedWorkspace === "home" ? "assistant" : selectedWorkspace, role);
      if (payload?.denied) return payload;
      const workspace = workspaceConfig[payload.workspace] ? payload.workspace : localWorkspace;
      if (!hasAccess(workspace)) return { denied: true, workspace };
      const result = engine.respond(workspace, question);
      result.narrativeMode = payload.narrativeMode;
      result.model = payload.model;
      result.routedBy = payload.routedBy;
      result.modelNarrative = payload.narrativeMode === "ollama" ? String(payload.answer || "").trim() : "";
      result.groundedNarrative = payload.narrativeMode === "governed-retrieval" ? String(payload.answer || "").trim() : "";
      result.calculationMode = payload.result?.calculationMode || (workspace === "market" ? "deterministic" : "retrieval");
      return { workspace, result };
    } catch (_error) {
      if (!hasAccess(localWorkspace)) return { denied: true, workspace: localWorkspace };
      const result = engine.respond(localWorkspace, question);
      result.narrativeMode = "fallback";
      return { workspace: localWorkspace, result };
    }
  }

  async function ask(question) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || !dom.chat_thread || state.pending) return;
    const selectedWorkspace = state.workspace;
    const localWorkspace = selectedWorkspace === "home" ? routeQuestion(cleanQuestion) : selectedWorkspace;
    const requestRole = state.role;
    const requestThread = dom.chat_thread;
    const requestId = ++state.requestId;
    state.answerWorkspace = localWorkspace;
    state.currentQuestion = cleanQuestion;
    state.pending = true;
    document.querySelector(".home-empty, .workspace-empty, .feature-view")?.remove();
    document.querySelector(".conversation-panel")?.classList.add("has-messages");
    dom.chat_thread.insertAdjacentHTML("beforeend", `<div class="question-card">${escapeHtml(cleanQuestion)}</div>`);
    dom.question_input.value = "";
    resizeInput();

    if (selectedWorkspace !== "home" && !hasAccess(localWorkspace)) {
      state.pending = false;
      dom.chat_thread.insertAdjacentHTML("beforeend", accessDeniedMarkup(localWorkspace));
      dom.chat_thread.scrollTop = dom.chat_thread.scrollHeight;
      return;
    }

    const productQuestion = /\b(product|products|instrument|instruments|asset class|option|options)\b/i.test(cleanQuestion);
    const activity = productQuestion
      ? "Checking the approved product catalogue…"
      : state.model.enabled && state.preferences.useLocalModel ? "Routing and wording with local Ollama…" : "Checking the approved sources…";
    dom.chat_thread.insertAdjacentHTML("beforeend", `<div class="typing-indicator" id="typing"><div class="typing-dots"><i></i><i></i><i></i></div>${activity}</div>`);
    dom.chat_thread.scrollTop = dom.chat_thread.scrollHeight;
    const [resolution] = await Promise.all([resolveAnswer(cleanQuestion, selectedWorkspace, requestRole), new Promise((resolve) => window.setTimeout(resolve, 360))]);
    if (requestId !== state.requestId || state.role !== requestRole || !requestThread.isConnected || dom.chat_thread !== requestThread) return;
    state.pending = false;
    document.getElementById("typing")?.remove();
    if (resolution.denied) {
      dom.chat_thread.insertAdjacentHTML("beforeend", accessDeniedMarkup(resolution.workspace));
      dom.chat_thread.scrollTop = dom.chat_thread.scrollHeight;
      return;
    }

    const targetWorkspace = resolution.workspace;
    state.answerWorkspace = targetWorkspace;
    state.currentAnswer = resolution.result;
    const result = state.currentAnswer;
    updateSystemIndicator(result.narrativeMode);
    const defaultInsightTab = targetWorkspace === "market" ? "plot" : "analysis";
    const narrative = (result.modelNarrative || result.groundedNarrative) ? narrativeMarkup(result.modelNarrative || result.groundedNarrative) : firstParagraph(result.html);
    const answerLabel = selectedWorkspace === "home" ? "BursaIQ Assistant" : `BursaIQ · ${workspaceConfig[targetWorkspace].title}`;
    dom.chat_thread.insertAdjacentHTML("beforeend", `<article class="answer-card"><div class="answer-meta"><span class="answer-logo">IQ</span>${answerLabel}${answerProvenance(result)}</div><div class="answer-body"><div class="answer-title-row"><h3>${result.title}</h3><button class="more-button" type="button" data-answer-action="insight" data-insight-tab="${defaultInsightTab}" aria-label="Open full analysis" title="Open full analysis"><i></i><i></i><i></i></button></div>${narrative}<button class="analysis-link" type="button" data-answer-action="insight" data-insight-tab="${defaultInsightTab}">${targetWorkspace === "market" ? `${icons.chart}Explore chart and governed analysis` : `${icons.file}Read full answer and sources`}</button><div class="answer-actions"><button class="action-button" type="button" data-answer-action="verify" aria-label="Submit this answer for verification">${icons.shield}Verify</button><button class="action-button" type="button" data-answer-action="report">${icons.download}Create PDF</button></div><div class="answer-note">Synthetic output · ${demo.meta.asOf}</div></div></article>`);
    renderSuggestions(result.followups.slice(0, 3));
    if (state.preferences.autoOpenInsights && targetWorkspace === "market") showEvidence("plot", false);
    else if (state.preferences.autoOpenInsights && document.getElementById("evidence-panel")) showEvidence("analysis", false);
    dom.chat_thread.scrollTop = dom.chat_thread.scrollHeight;
  }

  function showEvidence(tabName, shouldScroll = true) {
    if (!state.currentAnswer) return;
    if (!document.getElementById("evidence-panel")) {
      dom.workspace_grid.insertAdjacentHTML("beforeend", evidenceMarkup());
      dom.workspace_grid.classList.add("has-evidence");
      bindDom();
    }
    state.insightTab = tabName || (state.answerWorkspace === "market" ? "plot" : "analysis");
    renderEvidence();
    if (shouldScroll && window.innerWidth <= 900) document.getElementById("evidence-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeEvidence() {
    document.getElementById("evidence-panel")?.remove();
    dom.workspace_grid.classList.remove("has-evidence");
    bindDom();
  }

  function chartSpec() {
    const question = state.currentQuestion.toLowerCase();
    if (state.answerWorkspace !== "market") return null;
    if (/(adv|daily value|trading activity)/.test(question)) {
      return { kind: "line", title: "Average Daily Value trend", description: "Monthly traded value shows July activity accelerating above the preceding period.", unit: "RM bn", labels: demo.market.monthly.map((item) => item.month), values: demo.market.monthly.map((item) => item.valueBn), valueDigits: 2 };
    }
    if (/(sector|driver|stock|counter|attribution)/.test(question)) {
      return { kind: "bar", title: "Sector contribution", description: "Technology and Financial Services supplied most of the positive index contribution.", unit: "pts", labels: demo.market.sectors.map((item) => item.name), values: demo.market.sectors.map((item) => item.contributionPoints), valueDigits: 1 };
    }
    if (/(regional|international|peer|singapore|thailand|indonesia|s&p)/.test(question)) {
      return { kind: "bar", title: "Regional market return", description: "Malaysia placed near the top of the prepared local-currency comparison.", unit: "% MTD", labels: demo.market.regional.map((item) => item.market.split(" · ")[0]), values: demo.market.regional.map((item) => item.mtdPct), valueDigits: 1 };
    }
    if (/(velocity|market cap|market value|capitalisation)/.test(question)) {
      return { kind: "bar", title: "Annualised trading velocity", description: "The latest measure is four percentage points above the previous period.", unit: "%", labels: ["Prior period", "Latest 30D"], values: [demo.market.headline.velocityPriorPct, demo.market.headline.velocityPct], valueDigits: 1 };
    }
    if (/(investor|flow|participation|foreign)/.test(question)) {
      return { kind: "bar", title: "Share of traded value", description: "Participation was broad, with local institutions remaining the largest group.", unit: "%", labels: demo.market.participation.map((item) => item.group), values: demo.market.participation.map((item) => item.sharePct), valueDigits: 1 };
    }
    return { kind: "line", title: "FBM KLCI monthly close", description: "July closed at the highest point in the prepared seven-month series.", unit: "index", labels: demo.market.monthly.map((item) => item.month), values: demo.market.monthly.map((item) => item.index), valueDigits: 1 };
  }

  function lineChart(spec) {
    const width = 360;
    const height = 225;
    const left = 44;
    const right = 16;
    const top = 23;
    const bottom = 34;
    const minimum = Math.min(...spec.values);
    const maximum = Math.max(...spec.values);
    const padding = Math.max((maximum - minimum) * 0.18, maximum * 0.015);
    const low = minimum - padding;
    const high = maximum + padding;
    const xAt = (index) => left + (index * (width - left - right)) / Math.max(spec.values.length - 1, 1);
    const yAt = (value) => top + ((high - value) * (height - top - bottom)) / Math.max(high - low, 1);
    const points = spec.values.map((value, index) => `${xAt(index).toFixed(1)},${yAt(value).toFixed(1)}`).join(" ");
    const area = `${left},${height - bottom} ${points} ${width - right},${height - bottom}`;
    const grid = [0, 1, 2, 3].map((step) => {
      const y = top + (step * (height - top - bottom)) / 3;
      const value = high - (step * (high - low)) / 3;
      return `<line class="plot-grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="plot-axis-value" x="${left - 7}" y="${y + 3}" text-anchor="end">${value.toFixed(spec.valueDigits)}</text>`;
    }).join("");
    const labels = spec.labels.map((label, index) => `<text class="plot-axis-label" x="${xAt(index)}" y="${height - 10}" text-anchor="middle">${escapeHtml(label)}</text>`).join("");
    const dots = spec.values.map((value, index) => `<circle class="plot-point" style="--point:${index}" cx="${xAt(index)}" cy="${yAt(value)}" r="3.5"><title>${escapeHtml(spec.labels[index])}: ${value.toFixed(spec.valueDigits)} ${escapeHtml(spec.unit)}</title></circle>`).join("");
    return `<svg class="plot-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(spec.title)}"><polygon class="plot-area" points="${area}"/>${grid}<polyline class="plot-line" points="${points}"/>${dots}${labels}</svg>`;
  }

  function barChart(spec) {
    const width = 360;
    const rowHeight = 38;
    const height = spec.values.length * rowHeight + 28;
    const zero = 164;
    const positiveSpace = 150;
    const negativeSpace = 48;
    const positiveMax = Math.max(...spec.values, 0.1);
    const negativeMax = Math.max(...spec.values.map((value) => Math.abs(Math.min(value, 0))), 0.1);
    const rows = spec.values.map((value, index) => {
      const y = index * rowHeight + 16;
      const barWidth = value >= 0 ? (value / positiveMax) * positiveSpace : (Math.abs(value) / negativeMax) * negativeSpace;
      const x = value >= 0 ? zero : zero - barWidth;
      const valueX = value >= 0 ? Math.min(x + barWidth + 7, width - 6) : x - 7;
      const anchor = value >= 0 ? (valueX >= width - 6 ? "end" : "start") : "end";
      const signed = value > 0 && (spec.unit.includes("MTD") || spec.unit === "pts") ? "+" : "";
      return `<text class="plot-bar-label" x="2" y="${y + 13}">${escapeHtml(spec.labels[index])}</text><rect class="plot-bar ${value < 0 ? "is-negative" : ""}" style="--bar:${index}" x="${x}" y="${y}" width="${Math.max(barWidth, 2)}" height="17" rx="3"><title>${escapeHtml(spec.labels[index])}: ${signed}${value.toFixed(spec.valueDigits)} ${escapeHtml(spec.unit)}</title></rect><text class="plot-bar-value" x="${valueX}" y="${y + 12}" text-anchor="${anchor}">${signed}${value.toFixed(spec.valueDigits)}</text>`;
    }).join("");
    return `<svg class="plot-svg bar-plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(spec.title)}"><line class="plot-zero" x1="${zero}" y1="7" x2="${zero}" y2="${height - 7}"/>${rows}</svg>`;
  }

  function plotMarkup(spec) {
    if (!spec) return `<div class="no-plot">${icons.file}<h2>This answer is document-led</h2><p>Open Analysis for the full explanation, or Sources for the exact approved material used.</p><button class="button secondary" type="button" data-tab-jump="analysis">Read full answer</button></div>`;
    const latest = spec.values.at(-1);
    return `<div class="plot-heading"><div><h2>${escapeHtml(spec.title)}</h2><p>${escapeHtml(spec.description)}</p></div><span>${escapeHtml(spec.unit)}</span></div><div class="plot-frame">${spec.kind === "line" ? lineChart(spec) : barChart(spec)}</div><div class="plot-readout"><span>Latest observation</span><strong>${latest.toFixed(spec.valueDigits)} ${escapeHtml(spec.unit)}</strong></div><div class="plot-explanation"><strong>How to read this</strong><p>${escapeHtml(spec.description)} Open Analysis for the complete narrative and calculation method.</p></div><div class="warning-block">Animated from the prepared synthetic dataset · ${escapeHtml(demo.meta.asOf)}</div>`;
  }

  function renderEvidence() {
    if (!dom.evidence_content || !state.currentAnswer) return;
    const result = state.currentAnswer;
    document.querySelectorAll(".evidence-tab").forEach((tab) => {
      const selected = tab.dataset.tab === state.insightTab;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    dom.evidence_badge.textContent = result.sources.length;
    if (state.insightTab === "analysis") {
      const modelAnalysis = result.modelNarrative ? `<section class="model-analysis"><div><span class="model-chip ollama">Ollama narrative</span><small>Wording only</small></div>${narrativeMarkup(result.modelNarrative)}</section>` : "";
      dom.evidence_content.innerHTML = `${modelAnalysis}<article class="full-analysis"><h2>${result.title}</h2>${result.html}</article><h2 class="section-title">How this was produced</h2>${result.method.map((item) => `<div class="method-step"><span>${item[0]}</span><div><strong>${item[1]}</strong><p>${item[2]}</p></div></div>`).join("")}<div class="formula-box">${result.formula}</div><ul class="context-list">${Object.entries(result.context).map(([key, value]) => `<li><span>${key}</span><strong>${value}</strong></li>`).join("")}</ul>`;
    } else if (state.insightTab === "sources") {
      dom.evidence_content.innerHTML = `<h2>${result.sources.length} source reference${result.sources.length === 1 ? "" : "s"}</h2><p class="panel-intro">Open a source or inspect the exact location used.</p>${sourceCards(result.sources)}<div class="confidence-row"><span>Evidence coverage</span><strong>${result.confidence}%</strong></div><div class="confidence-track"><span style="width:${result.confidence}%"></span></div>`;
    } else {
      dom.evidence_content.innerHTML = plotMarkup(chartSpec());
    }
  }

  function sourceCards(sources) {
    return sources.map((doc, index) => `<article class="evidence-card"><div class="evidence-card-head"><span class="file-icon ${doc.format.toLowerCase()}">${doc.format}</span><div><strong>${doc.title}</strong><small>${doc.owner}</small></div><span class="source-index">${index + 1}</span></div>${doc.detail || doc.excerpt ? `<p class="source-detail">${doc.detail || doc.excerpt}</p>` : ""}${state.backend ? `<a class="action-button" href="/api/sources/${encodeURIComponent(doc.id)}?role=${encodeURIComponent(state.role)}" target="_blank" rel="noopener">${icons.file}Open source</a>` : ""}</article>`).join("");
  }

  function renderPage(page) {
    if (page === "verification" && !isReviewer()) {
      renderHome();
      toast("Reviewer access required", "Verification cases are visible only to their assigned reviewer accounts.");
      return;
    }
    state.requestId += 1;
    state.pending = false;
    state.workspace = page;
    state.currentAnswer = null;
    const labels = { reports: "Briefings", verification: "Verification Centre", sources: "Data Sources", settings: "Settings" };
    const descriptions = {
      reports: "Downloadable outputs created from BursaIQ conversations.",
      verification: "Human review for answers that may inform decisions.",
      sources: "Local files available to this demo identity.",
      settings: "Choose how BursaIQ responds and behaves on this device."
    };
    setHeading({ title: labels[page], description: descriptions[page] });
    dom.asof_chip.style.display = page === "sources" ? "flex" : "none";
    selectNavigation(page);
    dom.workspace_grid.className = "workspace-grid";
    const content = page === "reports" ? reportsPage() : page === "verification" ? verificationPage() : page === "sources" ? sourcesPage() : settingsPage();
    dom.workspace_grid.innerHTML = `<section class="page-panel">${content}</section>`;
    closeNavigation();
  }

  function settingSwitch(key, title, description, checked, disabled = false) {
    return `<label class="setting-row${disabled ? " is-disabled" : ""}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span><span class="switch-control"><input type="checkbox" data-setting="${key}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}><i></i></span></label>`;
  }

  function pluginRow(id, title, description, icon) {
    const enabled = Boolean(state.preferences.plugins[id]);
    return `<div class="plugin-row"><span class="plugin-icon">${icon}</span><span class="plugin-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span><span class="plugin-status ${enabled ? "is-enabled" : ""}">${enabled ? "Enabled" : "Not enabled"}</span><button class="button ${enabled ? "ghost" : "secondary"}" type="button" data-plugin="${id}" aria-pressed="${enabled}">${enabled ? "Disable" : "Enable"}</button></div>`;
  }

  const requestablePanels = {
    reg: {
      title: "Ask Reg",
      description: "Regulatory guidance grounded in a controlled synthetic source, with escalation to the accountable owner.",
      icon: icons.reg
    },
    hr: {
      title: "Ask HR",
      description: "Hiring guidance and fictional application statuses from restricted HR demo sources.",
      icon: icons.hr
    }
  };

  function panelAccessRow(panel) {
    const config = requestablePanels[panel];
    const granted = hasAccess(panel);
    const requested = Boolean(state.accessRequests[state.role]?.[panel]);
    const status = granted ? "Access granted" : requested ? "Pending approval" : "Not available";
    const statusClass = granted ? "is-granted" : requested ? "is-pending" : "";
    const buttonLabel = granted ? "Granted" : requested ? "Requested" : "Request access";
    return `<div class="panel-access-row"><span class="panel-access-icon">${config.icon}</span><span class="panel-access-copy"><strong>${config.title}</strong><small>${config.description}</small></span><span class="panel-access-status ${statusClass}">${status}</span><button class="button ${granted || requested ? "ghost" : "secondary"}" type="button" data-request-panel="${panel}" ${granted || requested ? "disabled" : ""}>${buttonLabel}</button></div>`;
  }

  function openAccessRequestDialog(panel) {
    const config = requestablePanels[panel];
    if (!config || hasAccess(panel) || state.accessRequests[state.role]?.[panel]) return;
    state.accessRequestPanel = panel;
    dom.access_request_panel_name.textContent = config.title;
    dom.access_request_reason.value = "";
    dom.access_request_reason_count.textContent = "0 / 400";
    dom.access_request_reason.removeAttribute("aria-invalid");
    dom.access_request_error.hidden = true;
    dom.submit_access_request.disabled = true;
    dom.access_request_dialog.showModal();
    window.setTimeout(() => dom.access_request_reason.focus(), 0);
  }

  function validateAccessRequestReason(showError = false) {
    const reason = dom.access_request_reason.value.trim();
    const valid = reason.length >= 10;
    dom.access_request_reason_count.textContent = `${dom.access_request_reason.value.length} / 400`;
    dom.submit_access_request.disabled = !valid;
    if (showError || dom.access_request_reason.hasAttribute("aria-invalid")) {
      dom.access_request_reason.setAttribute("aria-invalid", String(!valid));
      dom.access_request_error.hidden = valid;
    }
    return valid;
  }

  function closeAccessRequestDialog() {
    if (dom.access_request_dialog.open) dom.access_request_dialog.close();
    state.accessRequestPanel = "";
  }

  function submitAccessRequest(event) {
    event.preventDefault();
    const panel = state.accessRequestPanel;
    if (!requestablePanels[panel] || hasAccess(panel) || state.accessRequests[state.role]?.[panel]) {
      closeAccessRequestDialog();
      return;
    }
    if (!validateAccessRequestReason(true)) {
      dom.access_request_reason.focus();
      return;
    }
    const reason = dom.access_request_reason.value.trim();
    state.accessRequests = {
      ...state.accessRequests,
      [state.role]: {
        ...(state.accessRequests[state.role] || {}),
        [panel]: { status: "Pending approval", requestedAt: new Date().toISOString(), reason }
      }
    };
    localStorage.setItem("bursaiq_access_requests", JSON.stringify(state.accessRequests));
    closeAccessRequestDialog();
    renderPage("settings");
    toast("Access request submitted", `${requestablePanels[panel].title} access was requested for ${demo.identities[state.role].name}.`);
  }

  function settingsPage() {
    const preferences = state.preferences;
    const modelAvailable = state.model.enabled;
    return `<div class="page-hero settings-hero"><div><h2>Your BursaIQ experience</h2><p>Preferences are stored locally in this browser and can be reset at any time.</p></div><button class="button ghost" type="button" data-reset-preferences>Restore defaults</button></div>
      <div class="settings-layout">
        <section class="settings-section"><h3>Answers</h3><p>Control the level of detail and whether the optional local model helps word answers.</p>
          <label class="setting-row setting-select"><span><strong>Response detail</strong><small>Market figures and sources do not change.</small></span><select data-setting="responseStyle" aria-label="Response detail"><option value="concise" ${preferences.responseStyle === "concise" ? "selected" : ""}>Concise</option><option value="balanced" ${preferences.responseStyle === "balanced" ? "selected" : ""}>Balanced</option><option value="detailed" ${preferences.responseStyle === "detailed" ? "selected" : ""}>Detailed</option></select></label>
          ${settingSwitch("useLocalModel", "Use local Ollama wording", modelAvailable ? `Available model: ${state.model.model}` : "Start BursaIQ with Ollama to enable this option.", preferences.useLocalModel && modelAvailable, !modelAvailable)}
        </section>
        <section class="settings-section plugins-section"><h3>Plugins</h3><p>Add optional tools BursaIQ may use alongside its governed data and model.</p><div class="plugin-list">
          ${pluginRow("webSearch", "Web Search", "Discover current public information when an approved connection is available.", icons.web)}
          ${pluginRow("pdfTools", "PDF Tools", "Read, retrieve and summarise approved local PDF documents.", icons.file)}
          ${pluginRow("spreadsheetTools", "Spreadsheet Tools", "Inspect approved Excel tables used by market calculations.", icons.table)}
          <p class="plugin-boundary">Stage 02 demo controls. Enabling Web Search does not send data externally until an approved endpoint and credentials are configured.</p>
        </div></section>
        <section class="settings-section panel-access-section"><h3>Panel access</h3><p>Request a restricted workspace when it is relevant to your role. Requests require the panel owner’s approval.</p><div class="panel-access-list">${Object.keys(requestablePanels).map(panelAccessRow).join("")}<p class="panel-access-note">Stage 02 simulation: requests are stored on this device and do not change access automatically.</p></div></section>
        <section class="settings-section"><h3>Workspace behaviour</h3><p>Choose what opens first and how supporting analysis appears.</p>
          <label class="setting-row setting-select"><span><strong>Default workspace</strong><small>Used the next time BursaIQ opens.</small></span><select data-setting="defaultWorkspace" aria-label="Default workspace"><option value="home" ${preferences.defaultWorkspace === "home" ? "selected" : ""}>BursaIQ Assistant</option><option value="learn" ${preferences.defaultWorkspace === "learn" ? "selected" : ""}>Learn Bursa</option></select></label>
          ${settingSwitch("autoOpenInsights", "Open analysis automatically", "Show the right-side plot or evidence panel after an answer.", preferences.autoOpenInsights)}
          ${settingSwitch("chartMotion", "Animate market charts", "Draw chart lines and bars when the analysis panel opens.", preferences.chartMotion)}
        </section>
        <section class="settings-section settings-note"><h3>Demo boundaries</h3><p>Identity permissions, source access and governed calculations cannot be changed here. These controls only affect presentation and the optional narrative layer.</p><div><span>${icons.shield}</span><strong>Access rules remain enforced</strong></div></section>
      </div>`;
  }

  function reportsPage() {
    if (!state.reports.length) {
      return `<div class="empty-state"><div>${icons.file}<h2>No briefings yet</h2><p>Create a PDF from any grounded answer.</p><button class="button secondary" type="button" data-go="home">Start a conversation</button></div></div>`;
    }
    return `<div class="page-hero"><div><h2>Generated briefings</h2><p>PDFs include the answer, method, sources and verification state.</p></div></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Briefing</th><th>Created</th><th>Status</th><th></th></tr></thead><tbody>${state.reports.map((report) => `<tr><td><strong>${escapeHtml(report.title)}</strong><br><small>${escapeHtml(report.question)}</small></td><td>${report.created}</td><td><span class="status-pill">${report.status}</span></td><td>${report.url ? `<a class="button ghost" href="${report.url}" download>Download</a>` : "Service required"}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function verificationFlowMarkup(item = null) {
    const reviewer = item?.reviewer || "Assigned Data Owner";
    const submittedClass = item ? " is-submitted" : "";
    const receipt = item ? `<div class="workflow-receipt"><span>${icons.check}</span><div><strong>${escapeHtml(item.id)}</strong><small>Review package assigned to ${escapeHtml(reviewer)} · Pending review</small></div></div>` : "";
    return `<section class="verification-flow${submittedClass}" aria-label="Verification process flow">
      <div class="verification-flow-head"><div><span class="flow-eyebrow">Human-in-the-loop control</span><h3>From answer to approved output</h3><p>One governed review path connects the requester, Microsoft 365 and the responsible Data Owner.</p></div><span class="architecture-chip">Target Microsoft 365 workflow</span></div>
      ${receipt}
      <ol class="workflow-track">
        <li class="${item ? "is-complete" : ""}"><span class="workflow-node">${icons.check}</span><div><em>01</em><strong>User clicks Verify</strong><small>BursaIQ packages the question, answer, calculations and cited evidence.</small></div></li>
        <li class="${item ? "is-current" : ""}"><span class="workflow-node">${icons.list}</span><div><em>02</em><strong>List item created</strong><small>A review record is created in Microsoft Lists with its owner and status.</small></div></li>
        <li><span class="workflow-node">${icons.mail}</span><div><em>03</em><strong>Power Automate notifies</strong><small>The flow emails the assigned Data Owner with a link to the review package.</small></div></li>
        <li><span class="workflow-node">${icons.person}</span><div><em>04</em><strong>Data Owner reviews</strong><small>The verifier checks the narrative, governed calculation and supporting sources.</small></div></li>
        <li><span class="workflow-node">${icons.shield}</span><div><em>05</em><strong>Decision recorded</strong><small>The Data Owner approves the item or returns it with actionable feedback.</small></div></li>
      </ol>
      <div class="workflow-decision">
        <div class="decision-label"><span>${icons.shield}</span><div><strong>Data Owner decision</strong><small>Microsoft Lists remains the system of record.</small></div></div>
        <div class="decision-branches">
          <div class="decision-branch is-approved"><span>${icons.check}</span><div><strong>Approved</strong><p>Update the List item and audit trail → Power Automate emails the requester → the verified PDF or briefing is ready to publish.</p></div></div>
          <div class="decision-branch is-returned"><span>${icons.refresh}</span><div><strong>Changes requested</strong><p>Record feedback in the List → Power Automate emails the requester → revise the answer and submit it through Verify again.</p></div></div>
        </div>
      </div>
      <p class="workflow-boundary"><strong>Stage 02 boundary:</strong> the current prototype creates the review item in local SQLite and shows an in-app confirmation. Microsoft Lists, Power Automate and email are the proposed pilot integration.</p>
    </section>`;
  }

  function showVerificationFlow(item) {
    if (!dom.verification_flow_dialog || !dom.verification_flow_content) return;
    dom.verification_flow_dialog_title.textContent = "Verification request submitted";
    dom.verification_flow_content.innerHTML = verificationFlowMarkup(item);
    dom.verification_flow_dialog.showModal();
  }

  function verificationPage() {
    const cases = reviewerCases();
    const flow = verificationFlowMarkup();
    if (!cases.length) {
      return `<div class="page-hero"><div><h2>Your review queue</h2><p>Only cases assigned to ${escapeHtml(demo.identities[state.role].name)} are shown.</p></div><span class="status-pill approved">0 assigned</span></div>${flow}<div class="empty-state reviewer-empty"><div>${icons.shield}<h2>You’re all caught up</h2><p>No pending or completed cases are assigned to this reviewer account.</p></div></div>`;
    }
    return `<div class="page-hero"><div><h2>Your review queue</h2><p>Only cases assigned to ${escapeHtml(demo.identities[state.role].name)} are shown.</p></div><span class="status-pill">${cases.filter((item) => item.status === "Pending review").length} pending</span></div>${flow}<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Case</th><th>Requested by</th><th>Reviewer assignment</th><th>Status</th><th>Action</th></tr></thead><tbody>${cases.map((item) => `<tr><td><strong>${escapeHtml(item.title)}</strong><br><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(item.requestedBy)}</td><td>${escapeHtml(item.reviewer)}</td><td><span class="status-pill ${item.status === "Approved" ? "approved" : item.status === "Changes requested" ? "denied" : ""}">${escapeHtml(item.status)}</span></td><td><button class="button ${item.status === "Pending review" ? "secondary" : "ghost"}" type="button" data-verification-details="${escapeHtml(item.id)}">${item.status === "Pending review" ? "Review details" : "View decision"}</button></td></tr>`).join("")}</tbody></table></div><div class="warning-block">Reviewer-scoped local demonstration. The server rejects access to cases outside this account’s assigned queue.</div>`;
  }

  function sourcesPage() {
    const permittedWorkspaces = demo.identities[state.role].access;
    const canSee = (doc) => permittedWorkspaces.includes(doc.workspace);
    const available = demo.documents.filter(canSee);
    return `<div class="page-hero"><div><h2>Available sources</h2><p>Only files this demo identity can retrieve are shown.</p></div><span class="status-pill approved">${available.length} available</span></div><div class="library-grid">${available.map((doc) => `<article class="library-card"><span class="file-icon ${doc.format.toLowerCase()}">${doc.format}</span><h3>${escapeHtml(doc.title)}</h3><p>${escapeHtml(doc.excerpt)}</p>${state.backend ? `<a class="action-button" href="/api/sources/${encodeURIComponent(doc.id)}?role=${encodeURIComponent(state.role)}" target="_blank" rel="noopener">${icons.file}Open source</a>` : ""}<div class="library-meta"><span>${escapeHtml(doc.owner)}</span><span>${escapeHtml(doc.updated)}</span></div></article>`).join("")}</div><div class="warning-block">${escapeHtml(demo.meta.disclaimer)}</div>`;
  }

  function updateNavigationVisibility() {
    const regAllowed = hasAccess("reg");
    dom.ask_reg_nav.hidden = !regAllowed;
    dom.ask_reg_nav.setAttribute("aria-hidden", String(!regAllowed));
    const hrAllowed = hasAccess("hr");
    dom.ask_hr_nav.hidden = !hrAllowed;
    dom.ask_hr_nav.setAttribute("aria-hidden", String(!hrAllowed));
    const reviewerAllowed = isReviewer();
    dom.verification_nav.hidden = !reviewerAllowed;
    dom.verification_nav.setAttribute("aria-hidden", String(!reviewerAllowed));
  }

  async function updateIdentity() {
    state.role = dom.role_select.value;
    const identity = demo.identities[state.role];
    dom.avatar.textContent = identity.initials;
    dom.identity_name.textContent = identity.name;
    dom.identity_role.textContent = identity.role;
    updateNavigationVisibility();
    await refreshVerificationAccess();
    updateCounts();
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
      const response = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, question: state.currentQuestion, answer: state.currentAnswer, details: verificationDetailsPayload(), requestedBy: demo.identities[state.role].name, role: state.role, workspace: workspaceConfig[state.answerWorkspace].title, verification: record.status }) });
      if (!response.ok) throw new Error("Report service failed");
      const payload = await response.json();
      record.url = payload.downloadUrl;
      if (payload.verification && reviewerCases([payload.verification]).length) state.verification.unshift(payload.verification);
    } catch (_error) {
      toast("PDF service unavailable", "Check the local server and try again.");
      return;
    }
    state.reports.unshift(record);
    localStorage.setItem("bursaiq_reports", JSON.stringify(state.reports));
    updateCounts();
    dom.report_dialog.close();
    toast("Briefing created", mode === "review" ? "PDF created and sent for review." : "Draft PDF is ready.");
    window.setTimeout(() => { window.location.href = record.url; }, 300);
  }

  function setVerificationButtonState(button, mode) {
    if (!button) return;
    button.classList.toggle("is-submitting", mode === "submitting");
    button.classList.toggle("is-submitted", mode === "submitted");
    button.dataset.verificationState = mode;
    if (mode === "submitting") {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-label", "Submitting this answer for verification");
      button.innerHTML = `${icons.shield}Submitting…`;
    } else if (mode === "submitted") {
      button.disabled = true;
      button.removeAttribute("aria-busy");
      button.setAttribute("aria-label", "This answer has been submitted for verification");
      button.innerHTML = `${icons.check}Submitted`;
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.setAttribute("aria-label", "Submit this answer for verification");
      button.innerHTML = `${icons.shield}Verify`;
    }
  }

  async function submitVerification(button) {
    if (!state.currentAnswer || !button || button.dataset.verificationState === "submitting" || button.dataset.verificationState === "submitted") return;
    setVerificationButtonState(button, "submitting");
    const existing = state.verification.find((item) => item.title === state.currentAnswer.title && item.status === "Pending review");
    if (existing) {
      setVerificationButtonState(button, "submitted");
      toast("Already in review", `${existing.id} is waiting for ${existing.reviewer}.`);
      return;
    }
    const details = verificationDetailsPayload();
    let item = { id: `VER-${Date.now().toString().slice(-8)}`, title: state.currentAnswer.title, workspace: workspaceConfig[state.answerWorkspace].title, requestedBy: demo.identities[state.role].name, reviewer: state.answerWorkspace === "hr" ? "HR Policy Owner" : "Market Intelligence Lead", status: "Pending review", created: new Date().toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }), scope: "Answer narrative, calculations and source citations", details };
    if (state.backend) {
      try {
        const response = await fetch("/api/verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: item.title, workspace: item.workspace, requestedBy: item.requestedBy, role: state.role, details }) });
        if (!response.ok) throw new Error("Review service failed");
        item = await response.json();
      } catch (_error) {
        setVerificationButtonState(button, "idle");
        toast("Review service unavailable", "Check the local server and try again.");
        return;
      }
    }
    if (reviewerCases([item]).length) state.verification.unshift(item);
    setVerificationButtonState(button, "submitted");
    updateCounts();
    toast("Sent for verification", `${item.id} was assigned to ${item.reviewer}.`);
    showVerificationFlow(item);
  }

  function verificationDetailsPayload() {
    if (!state.currentAnswer) return {};
    return {
      question: state.currentQuestion,
      answerTitle: state.currentAnswer.title,
      answerText: state.currentAnswer.modelNarrative || plainText(state.currentAnswer.html),
      formula: state.currentAnswer.formula,
      context: state.currentAnswer.context,
      sources: state.currentAnswer.sources.map((source) => ({ title: source.title, filename: source.filename, owner: source.owner, detail: source.detail || source.excerpt || "" }))
    };
  }

  function verificationSourceList(sources) {
    if (!Array.isArray(sources) || !sources.length) return `<p class="review-empty">No source snapshot was stored for this seeded demo case.</p>`;
    return `<ul class="review-source-list">${sources.map((source) => `<li><strong>${escapeHtml(source.title || source.filename || "Source")}</strong><span>${escapeHtml(source.detail || source.owner || "Included in review package")}</span></li>`).join("")}</ul>`;
  }

  function showVerificationDetails(id) {
    const item = reviewerCases().find((entry) => entry.id === id);
    if (!item || !dom.verification_dialog) return;
    const details = item.details || {};
    const context = details.context && typeof details.context === "object" ? Object.entries(details.context) : [];
    dom.verification_dialog_title.textContent = item.status === "Pending review" ? "Review verification case" : "Verification decision";
    dom.verification_detail_content.innerHTML = `<div class="review-case-head"><div><span>${escapeHtml(item.id)}</span><h3>${escapeHtml(item.title)}</h3></div><span class="status-pill ${item.status === "Approved" ? "approved" : item.status === "Changes requested" ? "denied" : ""}">${escapeHtml(item.status)}</span></div><dl class="review-meta"><div><dt>Workspace</dt><dd>${escapeHtml(item.workspace)}</dd></div><div><dt>Requested by</dt><dd>${escapeHtml(item.requestedBy)}</dd></div><div><dt>Assigned reviewer</dt><dd>${escapeHtml(item.reviewer)}</dd></div><div><dt>Submitted</dt><dd>${escapeHtml(item.created || item.createdAt || "Demo queue")}</dd></div></dl><section class="review-section"><h4>Question and answer</h4><p class="review-question">${escapeHtml(details.question || "How did the market perform in July?")}</p><h5>${escapeHtml(details.answerTitle || item.title)}</h5><p>${escapeHtml(details.answerText || "This seeded demonstration case packages the answer narrative, deterministic calculations and cited source locations for reviewer inspection.")}</p></section><section class="review-section"><h4>Calculation</h4><div class="formula-box">${escapeHtml(details.formula || item.scope)}</div>${context.length ? `<ul class="context-list">${context.map(([key, value]) => `<li><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></li>`).join("")}</ul>` : ""}</section><section class="review-section"><h4>Evidence package</h4>${verificationSourceList(details.sources)}</section><div class="review-checklist"><span>${icons.check} Narrative inspected</span><span>${icons.check} Calculation inspected</span><span>${icons.check} Sources inspected</span></div>${item.status === "Pending review" ? `<div class="dialog-actions"><button class="button danger" type="button" data-verify="${escapeHtml(item.id)}" data-status="Changes requested">Request changes</button><button class="button primary" type="button" data-verify="${escapeHtml(item.id)}" data-status="Approved">Approve case</button></div>` : `<div class="warning-block">Decision recorded in the local audit store.</div>`}`;
    dom.verification_dialog.showModal();
  }

  async function reviewItem(id, status) {
    const item = reviewerCases().find((entry) => entry.id === id);
    if (!item) return;
    if (state.backend) {
      try {
        const response = await fetch(`/api/verification/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, role: state.role }) });
        if (!response.ok) throw new Error("Review update failed");
        Object.assign(item, await response.json());
      } catch (_error) {
        toast("Review update unavailable", "The audit store could not be updated.");
        return;
      }
    } else {
      item.status = status;
    }
    updateCounts();
    if (dom.verification_dialog?.open) dom.verification_dialog.close();
    renderPage("verification");
    toast("Review updated", `${id} is now ${status.toLowerCase()}.`);
  }

  function updateCounts() {
    dom.report_count.textContent = state.reports.length;
    dom.verification_count.textContent = reviewerCases().filter((item) => item.status === "Pending review").length;
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
    if (event.target.closest("[data-open-pulse]")) {
      dom.chat_thread.innerHTML = marketPulseMarkup();
      dom.chat_thread.scrollTop = 0;
      return;
    }
    if (event.target.closest("[data-open-pathways], [data-back-pathways]")) {
      dom.chat_thread.innerHTML = learningPathwaysMarkup();
      dom.chat_thread.scrollTop = 0;
      return;
    }
    const pathway = event.target.closest("[data-learning-path]");
    if (pathway) {
      dom.chat_thread.innerHTML = learningPathMarkup(pathway.dataset.learningPath);
      dom.chat_thread.scrollTop = 0;
      return;
    }
    if (event.target.closest("[data-reset-preferences]")) {
      state.preferences = { ...defaultPreferences, plugins: { ...defaultPreferences.plugins } };
      savePreferences();
      renderPage("settings");
      toast("Defaults restored", "Your local BursaIQ preferences were reset.");
      return;
    }
    const panelRequest = event.target.closest("[data-request-panel]");
    if (panelRequest) {
      const panel = panelRequest.dataset.requestPanel;
      openAccessRequestDialog(panel);
      return;
    }
    const plugin = event.target.closest("[data-plugin]");
    if (plugin) {
      const id = plugin.dataset.plugin;
      const pluginName = plugin.closest(".plugin-row")?.querySelector("strong")?.textContent || "Tool";
      state.preferences.plugins[id] = !state.preferences.plugins[id];
      savePreferences();
      renderPage("settings");
      toast(state.preferences.plugins[id] ? "Plugin enabled" : "Plugin disabled", `${pluginName} was updated for this device.`);
      return;
    }
    const question = event.target.closest("[data-question]");
    if (question) return ask(question.dataset.question);
    const tab = event.target.closest(".evidence-tab");
    if (tab) {
      state.insightTab = tab.dataset.tab;
      renderEvidence();
      return;
    }
    const tabJump = event.target.closest("[data-tab-jump]");
    if (tabJump) {
      state.insightTab = tabJump.dataset.tabJump;
      renderEvidence();
      return;
    }
    if (event.target.closest("[data-close-insight]")) return closeEvidence();
    const action = event.target.closest("[data-answer-action]")?.dataset.answerAction;
    if (action === "insight") showEvidence(event.target.closest("[data-answer-action]")?.dataset.insightTab);
    if (action === "verify") submitVerification(event.target.closest('[data-answer-action="verify"]'));
    if (action === "report") openReportDialog();
    const verificationDetails = event.target.closest("[data-verification-details]");
    if (verificationDetails) showVerificationDetails(verificationDetails.dataset.verificationDetails);
    const go = event.target.closest("[data-go]");
    if (go) switchWorkspace(go.dataset.go);
  }

  function updateSetting(event) {
    const control = event.target.closest("[data-setting]");
    if (!control) return;
    const key = control.dataset.setting;
    state.preferences[key] = control.type === "checkbox" ? control.checked : control.value;
    savePreferences();
    toast("Setting saved", "This preference will be used on this device.");
  }

  function bindEvents() {
    document.querySelectorAll("[data-workspace]").forEach((item) => item.addEventListener("click", () => switchWorkspace(item.dataset.workspace)));
    dom.role_select.addEventListener("change", updateIdentity);
    dom.open_report_button.addEventListener("click", openReportDialog);
    dom.new_thread_button.addEventListener("click", () => switchWorkspace(workspaceConfig[state.workspace] ? state.workspace : "home"));
    dom.menu_button.addEventListener("click", () => { const open = document.body.classList.toggle("nav-open"); dom.menu_button.setAttribute("aria-expanded", String(open)); });
    dom.mobile_scrim.addEventListener("click", closeNavigation);
    dom.workspace_grid.addEventListener("click", handleWorkspaceClick);
    dom.workspace_grid.addEventListener("submit", (event) => { if (event.target.id === "chat-form") { event.preventDefault(); ask(document.getElementById("question-input").value); } });
    dom.workspace_grid.addEventListener("input", (event) => { if (event.target.id === "question-input") resizeInput(); });
    dom.workspace_grid.addEventListener("change", updateSetting);
    dom.workspace_grid.addEventListener("keydown", (event) => { if (event.target.id === "question-input" && event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.target.form.requestSubmit(); } });
    document.getElementById("report-form").addEventListener("submit", createReport);
    dom.access_request_form.addEventListener("submit", submitAccessRequest);
    dom.access_request_reason.addEventListener("input", () => validateAccessRequestReason(false));
    dom.access_request_reason.addEventListener("blur", () => {
      if (dom.access_request_reason.value.length) validateAccessRequestReason(true);
    });
    dom.access_request_dialog.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-access-request]")) closeAccessRequestDialog();
    });
    dom.access_request_dialog.addEventListener("close", () => { state.accessRequestPanel = ""; });
    dom.report_dialog.addEventListener("click", (event) => { if (event.target.closest("[data-close-dialog]")) dom.report_dialog.close(); });
    dom.verification_dialog.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-verification]")) dom.verification_dialog.close();
      const verify = event.target.closest("[data-verify]");
      if (verify) reviewItem(verify.dataset.verify, verify.dataset.status);
    });
    dom.verification_flow_dialog.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-verification-flow]")) dom.verification_flow_dialog.close();
    });
  }

  async function init() {
    bindDom();
    await connectBackend();
    bindEvents();
    applyPreferences();
    updateNavigationVisibility();
    updateCounts();
    const initialWorkspace = state.preferences.defaultWorkspace;
    if (workspaceConfig[initialWorkspace] && hasAccess(initialWorkspace)) renderWorkspace(initialWorkspace);
    else renderHome();
    updateSystemIndicator();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
