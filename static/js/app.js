(function () {
  "use strict";

  const demo = window.BURSAIQ_DEMO;
  const engine = window.BursaIQEngine;

  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z"/></svg>`,
    market: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3M2 19h20"/></svg>`,
    learn: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></svg>`,
    reg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7zm10 0-4 7h8l-4-7zM8 21h8"/></svg>`,
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

  const preferencesVersion = 2;

  const defaultPreferences = {
    version: preferencesVersion,
    autoOpenInsights: true,
    chartMotion: true,
    defaultWorkspace: "home",
    plugins: { webSearch: false, pdfTools: true, spreadsheetTools: true }
  };

  function loadPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem("bursaiq_preferences") || "{}");
      const needsMigration = saved.version !== preferencesVersion;
      const migrated = needsMigration ? { ...saved, version: preferencesVersion, defaultWorkspace: "home" } : saved;
      const preferences = { ...defaultPreferences, ...migrated, plugins: { ...defaultPreferences.plugins, ...(migrated.plugins || {}) } };
      const hasInvalidWorkspace = !["today-brief", "home", "learn"].includes(preferences.defaultWorkspace);
      if (hasInvalidWorkspace) preferences.defaultWorkspace = "home";
      if (needsMigration || hasInvalidWorkspace) localStorage.setItem("bursaiq_preferences", JSON.stringify(preferences));
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

  function loadLocalMap(key) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
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
    }
  };

  const predefinedDemoQuestions = new Set([
    "how did the market perform in july?",
    "how did 30-day adv change?",
    "which sectors drove the market?",
    "compare malaysia with regional peers",
    "show investor participation",
    "explain adv in plain language",
    "what is trading velocity?",
    "what is continuous disclosure?",
    "what should happen after an unusual market activity query?"
  ]);

  const state = {
    workspace: "home",
    answerWorkspace: "market",
    role: "gcmc",
    currentAnswer: null,
    currentQuestion: "",
    insightTab: "plot",
    verification: [],
    backend: false,
    pending: false,
    requestId: 0,
    agent: { provider: "microsoft-copilot-studio-direct-line", configured: false, available: false, authentication: "none" },
    conversationId: "",
    preferences: loadPreferences(),
    accessRequests: loadAccessRequests(),
    watchlists: loadLocalMap("bursaiq_watchlists"),
    decisionMemories: loadLocalMap("bursaiq_decision_memories"),
    accessRequestPanel: "",
    managementBrief: {
      instruction: "",
      headline: "",
      narrative: "",
      priorities: null,
      mode: "prepared",
      generated: demo.intelligence.generated
    },
    managementRefreshing: false,
    managementRefreshCount: 0
  };

  const dom = {};

  function bindDom() {
    ["chat-thread", "suggestion-row", "chat-form", "question-input", "evidence-content", "evidence-badge", "workspace-grid", "workspace-heading", "workspace-title", "workspace-description", "breadcrumb-label", "asof-chip", "access-chip", "role-select", "identity-name", "identity-role", "avatar", "report-dialog", "report-title", "open-report-button", "verification-count", "watchlist-count", "verification-dialog", "verification-dialog-title", "verification-detail-content", "verification-flow-dialog", "verification-flow-dialog-title", "verification-flow-content", "access-request-dialog", "access-request-form", "access-request-panel-name", "access-request-reason", "access-request-reason-count", "access-request-error", "submit-access-request", "ask-reg-nav", "today-brief-nav", "watchlist-nav", "management-brief-nav", "workflow-nav-label", "verification-nav", "data-sources-nav", "decision-memory-nav", "settings-nav", "new-thread-button", "menu-button", "mobile-scrim"].forEach((id) => {
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
      if (payload.agent) state.agent = payload.agent;
      state.backend = true;
    } catch (_error) {
      state.backend = false;
      state.verification = reviewerCases(demo.verification);
    }
  }

  function isReviewer() {
    return Boolean(demo.identities[state.role].reviewerFor?.length);
  }

  function hasManagementAccess() {
    return ["gcmc", "securities", "finance"].includes(state.role);
  }

  function roleWatchlist() {
    return state.watchlists[state.role] || ["adv-momentum", "sector-concentration"];
  }

  function roleDecisionMemory() {
    const localItems = state.decisionMemories[state.role] || [];
    const seeded = demo.intelligence?.decisions || [];
    if (isReviewer()) return [...localItems, ...seeded];
    return [...localItems, ...seeded.filter((item) => item.owner === demo.identities[state.role].name || item.workspace === "Learn Bursa")];
  }

  function persistRoleCollection(key, stateKey, items) {
    state[stateKey] = { ...state[stateKey], [state.role]: items };
    localStorage.setItem(key, JSON.stringify(state[stateKey]));
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
    dom.breadcrumb_label.textContent = "BursaIQ";
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
      ? `<div class="home-empty"><div class="home-brand" aria-hidden="true">IQ</div><h1>Ask BursaIQ</h1><p>Market intelligence and Bursa knowledge, grounded in approved sources.</p></div>`
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
      <button class="insight-rail" type="button" data-open-insight aria-label="Open answer canvas"><span>‹</span><strong>Answer canvas</strong></button>
      <div class="insight-expanded">
        <div class="insight-header"><div><span>Decision canvas</span><strong>Evidence &amp; analysis</strong></div><button class="canvas-toggle" type="button" data-close-insight aria-label="Collapse analysis panel">›</button></div>
        <div class="evidence-tabs" role="tablist" aria-label="Analysis views">
          <button class="evidence-tab is-active" id="evidence-tab-plot" data-tab="plot" role="tab" aria-controls="evidence-content" aria-selected="true" tabindex="0" type="button">Plot</button>
          <button class="evidence-tab" id="evidence-tab-analysis" data-tab="analysis" role="tab" aria-controls="evidence-content" aria-selected="false" tabindex="-1" type="button">Analysis</button>
          <button class="evidence-tab" id="evidence-tab-sources" data-tab="sources" role="tab" aria-controls="evidence-content" aria-selected="false" tabindex="-1" type="button">Sources <span id="evidence-badge">0</span></button>
          <button class="evidence-tab" id="evidence-tab-actions" data-tab="actions" role="tab" aria-controls="evidence-content" aria-selected="false" tabindex="-1" type="button">Actions</button>
        </div>
        <div class="evidence-content" id="evidence-content" role="tabpanel" aria-labelledby="evidence-tab-plot" tabindex="0"></div>
      </div>
    </aside>`;
  }

  function renderHome() {
    state.requestId += 1;
    state.pending = false;
    state.workspace = "home";
    state.currentAnswer = null;
    state.currentQuestion = "";
    state.conversationId = "";
    state.insightTab = "plot";
    dom.workspace_heading.hidden = true;
    dom.breadcrumb_label.textContent = "BursaIQ";
    dom.workspace_grid.className = "workspace-grid home-layout";
    dom.workspace_grid.innerHTML = conversationMarkup("market", true);
    selectNavigation("home");
    bindDom();
    renderSuggestions(workspaceConfig.market.suggestions);
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
    state.conversationId = "";
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
    if (/(hiring|recruit|applicant|application status|candidate|interview|payroll|leave policy|headcount|workforce)/.test(value)) return "blocked";
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
    return `<div class="agent-narrative">${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`).join("")}</div>`;
  }

  function answerProvenance(result) {
    if (result.narrativeMode === "copilot-studio") return `<span class="provenance-chip copilot">Microsoft Copilot Studio</span>`;
    if (result.narrativeMode === "fallback") return `<span class="provenance-chip fallback">Predefined demo answer</span>`;
    return `<span class="provenance-chip">BursaIQ local preview</span>`;
  }

  function updateSystemIndicator(mode) {
    const label = document.querySelector(".system-state strong");
    const container = document.querySelector(".system-state");
    if (!label || !container) return;
    if (mode === "fallback") {
      label.textContent = "Demo fallback active";
      container.title = "A predefined local answer is being used because Copilot Studio is unavailable";
    } else if (!state.backend) {
      label.textContent = "Offline preview";
      container.title = "Backend unavailable; browser fallback is active";
    } else if (state.agent.available || mode === "copilot-studio") {
      label.textContent = "Copilot Studio ready";
      container.title = "The published prototype agent is available through Direct Line";
    } else {
      label.textContent = "Agent endpoint required";
      container.title = "Add the Copilot Studio Mobile app token endpoint to .env";
    }
  }

  function agentUnavailableMarkup(message) {
    return `<article class="answer-card denied-answer"><div class="answer-meta"><span class="answer-logo">IQ</span>Copilot Studio connection</div><div class="answer-body"><h3>The BursaIQ agent is not connected</h3><p>${escapeHtml(message || "Add the Copilot Studio Mobile app token endpoint, then restart BursaIQ.")}</p><button class="button ghost" type="button" data-go="settings">Open integration settings</button></div></article>`;
  }

  function accessDeniedMarkup(workspace) {
    if (workspace === "blocked") {
      return `<article class="answer-card denied-answer"><div class="answer-meta"><span class="answer-logo">IQ</span>Privacy boundary</div><div class="answer-body"><h3>People-related requests are outside this prototype</h3><p>BursaIQ does not store or retrieve employee, candidate or application information. Please use the approved HR channel for this request.</p></div></article>`;
    }
    const config = workspaceConfig[workspace] || workspaceConfig.learn;
    return `<article class="answer-card denied-answer"><div class="answer-meta"><span class="answer-logo">IQ</span>Access decision</div><div class="answer-body"><h3>I can’t open that workspace for this identity</h3><p>${escapeHtml(demo.identities[state.role].name)} does not have ${escapeHtml(config.title)} access. No restricted source or record was retrieved.</p></div></article>`;
  }

  async function requestBackendAnswer(question, requestedWorkspace, role, conversationId = state.conversationId) {
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
          conversationId,
          plugins: Object.entries(state.preferences.plugins).filter(([, enabled]) => enabled).map(([id]) => id)
        }),
        signal: controller.signal
      });
      const payload = await response.json();
      if (response.status === 403) return { denied: true, workspace: payload.workspace || routeQuestion(question) };
      if (!response.ok) return { agentError: true, message: payload.error || "The Copilot Studio agent is unavailable.", agent: payload.agent };
      return payload;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function resolveAnswer(question, selectedWorkspace, role) {
    const localWorkspace = selectedWorkspace === "home" ? routeQuestion(question) : selectedWorkspace;
    if (!state.backend) {
      if (!hasAccess(localWorkspace)) return { denied: true, workspace: localWorkspace };
      if (!predefinedDemoQuestions.has(question.toLowerCase().trim())) {
        return { agentError: true, message: "BursaIQ is offline. Use one of the predefined demo questions or restore the local server connection." };
      }
      const result = engine.respond(localWorkspace, question);
      result.narrativeMode = "fallback";
      return { workspace: localWorkspace, result };
    }
    try {
      const payload = await requestBackendAnswer(question, selectedWorkspace === "home" ? "assistant" : selectedWorkspace, role);
      if (payload?.denied) return payload;
      if (payload?.agentError) {
        if (payload.agent) state.agent = payload.agent;
        if (predefinedDemoQuestions.has(question.toLowerCase().trim()) && hasAccess(localWorkspace)) {
          const result = engine.respond(localWorkspace, question);
          result.narrativeMode = "fallback";
          result.fallbackReason = payload.message;
          return { workspace: localWorkspace, result };
        }
        return payload;
      }
      const workspace = workspaceConfig[payload.workspace] ? payload.workspace : localWorkspace;
      if (!hasAccess(workspace)) return { denied: true, workspace };
      const result = engine.respond(workspace, question);
      result.narrativeMode = payload.narrativeMode;
      result.agent = payload.agent;
      result.routedBy = payload.routedBy;
      result.agentNarrative = String(payload.answer || "").trim();
      if (Array.isArray(payload.suggestedActions) && payload.suggestedActions.length) result.followups = payload.suggestedActions;
      state.conversationId = String(payload.conversationId || state.conversationId);
      if (payload.agent) state.agent = payload.agent;
      return { workspace, result };
    } catch (_error) {
      if (predefinedDemoQuestions.has(question.toLowerCase().trim()) && hasAccess(localWorkspace)) {
        const result = engine.respond(localWorkspace, question);
        result.narrativeMode = "fallback";
        result.fallbackReason = "Copilot Studio could not be reached.";
        return { workspace: localWorkspace, result };
      }
      return { agentError: true, message: "BursaIQ could not reach the Copilot Studio service. Use one of the predefined demo questions or check the connection." };
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

    const activity = "Asking your Microsoft Copilot Studio agent…";
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
    if (resolution.agentError) {
      dom.chat_thread.insertAdjacentHTML("beforeend", agentUnavailableMarkup(resolution.message));
      updateSystemIndicator();
      dom.chat_thread.scrollTop = dom.chat_thread.scrollHeight;
      return;
    }

    const targetWorkspace = resolution.workspace;
    state.answerWorkspace = targetWorkspace;
    state.currentAnswer = resolution.result;
    const result = state.currentAnswer;
    updateSystemIndicator(result.narrativeMode);
    const defaultInsightTab = targetWorkspace === "market" ? "plot" : "analysis";
    const narrative = result.agentNarrative ? narrativeMarkup(result.agentNarrative) : firstParagraph(result.html);
    const answerLabel = selectedWorkspace === "home" ? "BursaIQ Assistant" : `BursaIQ · ${workspaceConfig[targetWorkspace].title}`;
    const answerNote = result.narrativeMode === "fallback" ? `Predefined local demo response · Synthetic output · ${demo.meta.asOf}` : `Synthetic output · ${demo.meta.asOf}`;
    dom.chat_thread.insertAdjacentHTML("beforeend", `<article class="answer-card"><div class="answer-meta"><span class="answer-logo">IQ</span>${answerLabel}${answerProvenance(result)}</div><div class="answer-body"><div class="answer-title-row"><h3>${result.title}</h3><button class="more-button" type="button" data-answer-action="insight" data-insight-tab="${defaultInsightTab}" aria-label="Open full analysis" title="Open full analysis"><i></i><i></i><i></i></button></div>${narrative}<button class="analysis-link" type="button" data-answer-action="insight" data-insight-tab="${defaultInsightTab}">${targetWorkspace === "market" ? `${icons.chart}Explore chart and governed analysis` : `${icons.file}Read full answer and sources`}</button><div class="answer-actions"><button class="action-button" type="button" data-answer-action="verify" aria-label="Submit this answer for verification">${icons.shield}Verify</button><button class="action-button" type="button" data-answer-action="report">${icons.download}Create PDF</button></div><div class="answer-note">${answerNote}</div></div></article>`);
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
    document.getElementById("evidence-panel")?.classList.remove("is-collapsed");
    state.insightTab = tabName || (state.answerWorkspace === "market" ? "plot" : "analysis");
    dom.workspace_grid.classList.remove("evidence-collapsed");
    renderEvidence();
    if (shouldScroll && window.innerWidth <= 900) document.getElementById("evidence-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeEvidence() {
    const panel = document.getElementById("evidence-panel");
    if (!panel) return;
    panel.classList.add("is-collapsed");
    dom.workspace_grid.classList.add("evidence-collapsed");
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
    const left = 54;
    const right = 16;
    const top = 23;
    const bottom = 38;
    const minimum = Math.min(...spec.values);
    const maximum = Math.max(...spec.values);
    const padding = Math.max((maximum - minimum) * 0.18, maximum * 0.015);
    const low = minimum - padding;
    const high = maximum + padding;
    const xAt = (index) => left + (index * (width - left - right)) / Math.max(spec.values.length - 1, 1);
    const yAt = (value) => top + ((high - value) * (height - top - bottom)) / Math.max(high - low, 1);
    const points = spec.values.map((value, index) => `${xAt(index).toFixed(1)},${yAt(value).toFixed(1)}`).join(" ");
    const area = `${left},${height - bottom} ${points} ${width - right},${height - bottom}`;
    const tickCount = 3;
    const grid = Array.from({ length: tickCount }, (_, step) => {
      const y = top + (step * (height - top - bottom)) / (tickCount - 1);
      const value = high - (step * (high - low)) / (tickCount - 1);
      const label = value.toLocaleString("en-MY", { minimumFractionDigits: spec.valueDigits, maximumFractionDigits: spec.valueDigits });
      return `<line class="plot-grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="plot-axis-value" x="${left - 8}" y="${y + 3}" text-anchor="end">${label}</text>`;
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
    const latestLabel = latest.toLocaleString("en-MY", { minimumFractionDigits: spec.valueDigits, maximumFractionDigits: spec.valueDigits });
    return `<div class="plot-heading"><div><h2>${escapeHtml(spec.title)}</h2><p>${escapeHtml(spec.description)}</p></div><span>${escapeHtml(spec.unit)}</span></div><div class="plot-frame">${spec.kind === "line" ? lineChart(spec) : barChart(spec)}</div><div class="plot-readout"><span>Latest observation</span><strong>${latestLabel} ${escapeHtml(spec.unit)}</strong></div><div class="plot-explanation"><strong>How to read this</strong><p>${escapeHtml(spec.description)} Open Analysis for the complete narrative and calculation method.</p></div><div class="warning-block">Animated from the prepared synthetic dataset · ${escapeHtml(demo.meta.asOf)}</div>`;
  }

  function signalForCurrentAnswer() {
    const question = state.currentQuestion.toLowerCase();
    const signals = demo.intelligence?.signals || [];
    if (/(sector|driver|stock|counter|attribution)/.test(question)) return signals.find((item) => item.id === "sector-concentration");
    if (/(investor|flow|participation|foreign)/.test(question)) return signals.find((item) => item.id === "participation-breadth");
    return signals.find((item) => item.id === "adv-momentum") || signals[0];
  }

  function actionsMarkup() {
    const signal = signalForCurrentAnswer();
    const watched = signal && roleWatchlist().includes(signal.id);
    const memorySaved = roleDecisionMemory().some((item) => item.question === state.currentQuestion && item.owner === demo.identities[state.role].name);
    return `<div class="actions-view"><h2>Move insight into action</h2><p class="panel-intro">Keep the evidence attached as this answer moves into monitoring, decision-making or review.</p>
      <div class="action-ledger">
        <button type="button" data-insight-action="watch" data-signal-id="${escapeHtml(signal?.id || "adv-momentum")}"><span>${icons.pulse}</span><span><strong>${watched ? "Remove from watchlist" : "Add to watchlist"}</strong><small>${watched ? "Stop monitoring this signal for the active identity." : "Monitor this signal and surface related alerts."}</small></span><em>${watched ? "Watching" : "Monitor"}</em></button>
        <button type="button" data-insight-action="memory"><span>${icons.list}</span><span><strong>${memorySaved ? "Saved to Decision Memory" : "Save to Decision Memory"}</strong><small>Record the question, answer rationale, owner and evidence trail.</small></span><em>${memorySaved ? "Saved" : "Record"}</em></button>
        <button type="button" data-insight-action="verify"><span>${icons.shield}</span><span><strong>Submit for verification</strong><small>Send the governed answer package to its assigned Data Owner.</small></span><em>Review</em></button>
        ${hasManagementAccess() ? `<button type="button" data-insight-action="brief"><span>${icons.chart}</span><span><strong>Add to management briefing</strong><small>Carry this insight into the executive narrative and priority view.</small></span><em>Brief</em></button>` : ""}
      </div>
      <div class="action-boundary"><strong>Prototype workflow</strong><p>Watchlist and Decision Memory changes are stored on this device. Verification uses the local audit queue; no external notification is sent.</p></div>
    </div>`;
  }

  function renderEvidence() {
    if (!dom.evidence_content || !state.currentAnswer) return;
    const result = state.currentAnswer;
    document.querySelectorAll(".evidence-tab").forEach((tab) => {
      const selected = tab.dataset.tab === state.insightTab;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    dom.evidence_content.setAttribute("aria-labelledby", `evidence-tab-${state.insightTab}`);
    dom.evidence_badge.textContent = result.sources.length;
    if (state.insightTab === "analysis") {
      const agentAnalysis = result.agentNarrative ? `<section class="agent-analysis"><div><span class="provenance-chip copilot">Copilot Studio answer</span><small>Hosted agent response</small></div>${narrativeMarkup(result.agentNarrative)}</section>` : "";
      dom.evidence_content.innerHTML = `${agentAnalysis}<article class="full-analysis"><h2>${result.title}</h2>${result.html}</article><h2 class="section-title">How this was produced</h2>${result.method.map((item) => `<div class="method-step"><span>${item[0]}</span><div><strong>${item[1]}</strong><p>${item[2]}</p></div></div>`).join("")}<div class="formula-box">${result.formula}</div><ul class="context-list">${Object.entries(result.context).map(([key, value]) => `<li><span>${key}</span><strong>${value}</strong></li>`).join("")}</ul>`;
    } else if (state.insightTab === "sources") {
      dom.evidence_content.innerHTML = `<h2>${result.sources.length} source reference${result.sources.length === 1 ? "" : "s"}</h2><p class="panel-intro">Open a source or inspect the exact location used.</p>${sourceCards(result.sources)}<div class="confidence-row"><span>Evidence coverage</span><strong>${result.confidence}%</strong></div><div class="confidence-track"><span style="width:${result.confidence}%"></span></div>`;
    } else if (state.insightTab === "actions") {
      dom.evidence_content.innerHTML = actionsMarkup();
    } else {
      dom.evidence_content.innerHTML = plotMarkup(chartSpec());
    }
  }

  function sourceCards(sources) {
    return sources.map((doc, index) => `<article class="evidence-card"><div class="evidence-card-head"><span class="file-icon ${doc.format.toLowerCase()}">${doc.format}</span><div><strong>${doc.title}</strong><small>${doc.owner}</small></div><span class="source-index">${index + 1}</span></div>${doc.detail || doc.excerpt ? `<p class="source-detail">${doc.detail || doc.excerpt}</p>` : ""}${state.backend ? `<a class="action-button" href="/api/sources/${encodeURIComponent(doc.id)}?role=${encodeURIComponent(state.role)}" target="_blank" rel="noopener">${icons.file}Open source</a>` : ""}</article>`).join("");
  }

  function signalById(id) {
    return (demo.intelligence?.signals || []).find((item) => item.id === id);
  }

  function todayBriefPage() {
    const signals = demo.intelligence?.signals || [];
    const openAlerts = (demo.intelligence?.alerts || []).filter((item) => item.status !== "Watching").length;
    const pendingDecisions = roleDecisionMemory().filter((item) => item.status !== "Recorded").length;
    return `<div class="page-toolbar"><span class="brief-time">Prepared ${escapeHtml(demo.intelligence.generated)}</span></div>
      <div class="attention-strip" aria-label="Attention queue"><div><span>Needs attention</span><strong>${openAlerts}</strong><small>active alert rules</small></div><div><span>Watching</span><strong>${roleWatchlist().length}</strong><small>signals in your watchlist</small></div><div><span>Decisions</span><strong>${pendingDecisions}</strong><small>awaiting closure</small></div><button type="button" data-go="watchlist"><strong>Open attention queue</strong><small>Review alerts and monitored signals</small>${icons.arrow}</button></div>
      <div class="brief-layout"><section class="brief-ledger"><div class="section-heading"><div><h3>Signals that changed</h3><p>Prioritised from the prepared synthetic market cut.</p></div><span>${signals.length} signals</span></div>
        ${signals.map((signal) => `<article class="signal-row is-${escapeHtml(signal.severity)}"><div class="signal-marker"><span></span>${escapeHtml(signal.topic)}</div><div class="signal-copy"><h4>${escapeHtml(signal.title)}</h4><p>${escapeHtml(signal.summary)}</p><div><button type="button" data-brief-question="${escapeHtml(signal.question)}">Ask BursaIQ</button><button type="button" data-watch-toggle="${escapeHtml(signal.id)}">${roleWatchlist().includes(signal.id) ? "Watching" : "Watch signal"}</button></div></div><div class="signal-value"><strong>${escapeHtml(signal.metric)}</strong><small>${escapeHtml(signal.change)}</small></div></article>`).join("")}
      </section><aside class="brief-side"><div class="section-heading"><div><h3>What to do next</h3><p>Suggested workflow, not an automated decision.</p></div></div><ol class="next-action-list"><li><span>${icons.pulse}</span><div><strong>Check the next market cut</strong><small>Confirm whether the ADV uplift is sustained.</small></div></li><li><span>${icons.shield}</span><div><strong>Close the July review</strong><small>One briefing remains pending with the Data Owner.</small></div></li><li><span>${icons.file}</span><div><strong>Refresh ageing content</strong><small>The conduct guide is outside its freshness target.</small></div></li></ol><button class="button secondary" type="button" data-go="management-brief" ${hasManagementAccess() ? "" : "disabled"}>Open management view</button></aside></div>
      <p class="feature-footnote">Synthetic competition intelligence · signals are illustrative and do not constitute investment advice.</p>`;
  }

  function watchlistPage() {
    const watchedIds = roleWatchlist();
    const watched = watchedIds.map(signalById).filter(Boolean);
    const alerts = demo.intelligence?.alerts || [];
    return `<div class="page-toolbar"><span class="status-pill ${alerts.length ? "" : "approved"}">${alerts.length} alerts</span></div>
      <div class="watch-layout"><section><div class="section-heading"><div><h3>Your monitored signals</h3><p>Stored locally for ${escapeHtml(demo.identities[state.role].name)}.</p></div><span>${watched.length} watching</span></div><div class="watch-ledger">${watched.length ? watched.map((signal) => `<div class="watch-row"><span class="watch-pulse is-${escapeHtml(signal.severity)}"></span><div><strong>${escapeHtml(signal.title)}</strong><small>${escapeHtml(signal.metric)} · ${escapeHtml(signal.change)}</small></div><button type="button" data-brief-question="${escapeHtml(signal.question)}">Investigate</button><button type="button" data-watch-toggle="${escapeHtml(signal.id)}" aria-label="Remove ${escapeHtml(signal.title)} from watchlist">Remove</button></div>`).join("") : `<div class="ledger-empty"><h3>No signals watched</h3><p>Add a signal from Today’s Brief or the Decision Canvas.</p><button class="button secondary" type="button" data-go="today-brief">Browse today’s signals</button></div>`}</div></section>
      <section><div class="section-heading"><div><h3>Alert activity</h3><p>Rules show why each item entered the queue.</p></div></div><div class="alert-ledger">${alerts.map((alert) => { const signal = signalById(alert.signalId); return `<article class="alert-row"><div><span class="status-pill ${alert.status === "Watching" ? "approved" : alert.status === "Review" ? "denied" : ""}">${escapeHtml(alert.status)}</span><time>${escapeHtml(alert.time)}</time></div><div><strong>${escapeHtml(signal?.title || "Source freshness threshold")}</strong><p>${escapeHtml(alert.rule)}</p><small>Owner · ${escapeHtml(alert.owner)}</small></div></article>`; }).join("")}</div></section></div>
      <div class="warning-block">Prototype alerts are generated from the local synthetic dataset. No live market notification or external message is sent.</div>`;
  }

  function managementRefreshTimestamp() {
    return `${new Intl.DateTimeFormat("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kuala_Lumpur"
    }).format(new Date()).replace(",", " ·")} MYT`;
  }

  function fallbackManagementBrief(instruction) {
    const focus = instruction.toLowerCase();
    const prepared = demo.intelligence.management;
    let headline = prepared.headline;
    let narrative = prepared.narrative;
    let priorities = prepared.priorities.map((item) => ({ ...item }));

    if (/(risk|governance|verification|source|control)/.test(focus)) {
      headline = "Positive market momentum still requires disciplined publication and source oversight.";
      narrative = "July’s activity and index gains remain constructive, but the management decision is not only about performance. The immediate control priorities are to complete briefing verification, confirm that the ADV uplift persists in the next market cut, and refresh the ageing learning source before wider reuse.";
      priorities = [prepared.priorities[1], prepared.priorities[2], prepared.priorities[0]].map((item) => ({ ...item }));
    } else if (/(investor|participation|flow|foreign|institution)/.test(focus)) {
      headline = "Broader institutional and foreign participation supported July’s market advance.";
      narrative = "Local institutions and foreign investors recorded RM704m of combined net buying in the prepared dataset, offset by local retail selling. Management should monitor whether this participation breadth continues alongside the higher 30-day ADV and keep the evidence attached to the July briefing.";
      priorities = [
        { title: "Monitor participation breadth", owner: "Market Intelligence", due: "Next market cut", status: "In progress" },
        { ...prepared.priorities[0] },
        { ...prepared.priorities[1] }
      ];
    } else if (/(sector|technology|concentration|driver)/.test(focus)) {
      headline = "Technology led the advance, making concentration the key follow-up question.";
      narrative = "Technology contributed 9.6 index points and was the largest positive sector driver in the prepared July dataset. Management should distinguish broad market strength from sector concentration, validate the activity uplift at the next cut, and retain the governed verification path before publication.";
      priorities = [
        { title: "Test technology concentration", owner: "Market Intelligence", due: "Next attribution cut", status: "In progress" },
        { ...prepared.priorities[0] },
        { ...prepared.priorities[1] }
      ];
    } else {
      const variants = [
        {
          headline: "Market momentum improved, with sustained activity now the central management test.",
          narrative: "The FBM KLCI ended July 2.4% higher month to date while 30-day ADV reached RM3.42bn. The refreshed view keeps management attention on whether the activity uplift persists, whether participation remains broad, and whether the July narrative completes verification before publication."
        },
        {
          headline: "July’s stronger activity supports the outlook, but evidence readiness remains decisive.",
          narrative: "Index performance, trading activity and institutional participation were constructive in the prepared market cut. The next management step is to validate the signal at the next cut, complete the outstanding review, and resolve the ageing source before the briefing is reused."
        }
      ];
      const variant = variants[state.managementRefreshCount % variants.length];
      headline = variant.headline;
      narrative = variant.narrative;
    }

    return { instruction, headline, narrative, priorities, mode: "fallback", generated: managementRefreshTimestamp() };
  }

  function managementBriefFromAgent(answer, instruction) {
    const prepared = demo.intelligence.management;
    const raw = String(answer || "").trim();
    const lines = raw.split(/\n+/).map((line) => line.replace(/^#{1,6}\s*/, "").trim()).filter(Boolean);
    const labelledHeadline = lines[0]?.match(/^(?:headline|title)\s*:\s*(.+)$/i);
    let headline = prepared.headline;
    let narrative = raw;

    if (labelledHeadline) {
      headline = labelledHeadline[1].slice(0, 180);
      narrative = lines.slice(1).join("\n\n") || raw;
    } else if (lines.length > 1 && lines[0].length <= 140 && !lines[0].startsWith("-")) {
      headline = lines[0].replace(/^\*\*(.+)\*\*$/, "$1");
      narrative = lines.slice(1).join("\n\n");
    }

    return {
      instruction,
      headline,
      narrative,
      priorities: prepared.priorities.map((item) => ({ ...item })),
      mode: "copilot-studio",
      generated: managementRefreshTimestamp()
    };
  }

  async function refreshManagementBrief(form) {
    if (state.managementRefreshing) return;
    const input = form.querySelector("[data-management-instruction]");
    const button = form.querySelector("[data-management-refresh]");
    const status = form.querySelector("[data-management-status]");
    const instruction = String(input?.value || "").trim().slice(0, 500);
    const defaultInstruction = "Create a concise senior-management briefing. Prioritise material market movements, decisions required, accountable owners, and any evidence or verification risks.";
    const prompt = `Regenerate the BursaIQ management briefing using only governed market information available to the agent. Begin with a short headline on its own line, followed by a concise decision-ready narrative. Do not provide investment advice. Instruction: ${instruction || defaultInstruction}`;

    state.managementRefreshing = true;
    state.managementRefreshCount += 1;
    if (button) {
      button.disabled = true;
      button.classList.add("is-loading");
      button.setAttribute("aria-busy", "true");
      button.innerHTML = `${icons.refresh}<span>Refreshing…</span>`;
    }
    if (input) input.disabled = true;
    if (status) status.textContent = "Regenerating the management briefing…";

    let nextBrief = null;
    let usedFallback = false;
    try {
      const payload = state.backend ? await requestBackendAnswer(prompt, "market", state.role, "") : null;
      if (payload && !payload.agentError && !payload.denied && String(payload.answer || "").trim()) {
        nextBrief = managementBriefFromAgent(payload.answer, instruction);
        if (payload.agent) state.agent = payload.agent;
      } else {
        usedFallback = true;
        nextBrief = fallbackManagementBrief(instruction);
      }
    } catch (_error) {
      usedFallback = true;
      nextBrief = fallbackManagementBrief(instruction);
    } finally {
      state.managementRefreshing = false;
    }

    state.managementBrief = nextBrief;
    renderPage("management-brief");
    updateSystemIndicator(nextBrief.mode);
    window.requestAnimationFrame(() => document.querySelector("[data-management-refresh]")?.focus());
    toast("Management briefing refreshed", usedFallback ? "A data-grounded prototype version was generated because Copilot Studio was unavailable." : "A new management narrative was generated by Microsoft Copilot Studio.");
  }

  function managementBriefPage() {
    const prepared = demo.intelligence?.management;
    const generated = state.managementBrief;
    const management = {
      headline: generated.headline || prepared.headline,
      narrative: generated.narrative || prepared.narrative,
      priorities: generated.priorities || prepared.priorities
    };
    const sourceLabel = generated.mode === "copilot-studio" ? "Microsoft Copilot Studio" : generated.mode === "fallback" ? "Prepared demo fallback" : "Prepared baseline";
    const headline = demo.market.headline;
    return `<form class="management-generator" data-management-form>
        <div class="page-toolbar management-toolbar"><span class="management-generation-status" role="status" aria-live="polite" data-management-status>${escapeHtml(sourceLabel)} · ${escapeHtml(generated.generated)}</span><div class="management-toolbar-actions"><button class="button secondary" type="button" data-management-print>${icons.download}<span>Print briefing</span></button><button class="button secondary" type="submit" data-management-refresh>${icons.refresh}<span>Refresh</span></button></div></div>
        <label class="management-instruction-field" for="management-instruction"><span>Question or instruction</span><textarea id="management-instruction" rows="2" maxlength="500" data-management-instruction aria-describedby="management-instruction-hint" placeholder="For example: Focus on liquidity risks and decisions required this week.">${escapeHtml(generated.instruction)}</textarea><small id="management-instruction-hint">Optional · leave blank for a standard executive refresh · <span data-management-count>${generated.instruction.length}</span>/500</small></label>
      </form>
      <article class="management-narrative"><h3>${escapeHtml(management.headline)}</h3>${narrativeMarkup(management.narrative)}<div class="management-proof"><span>Evidence coverage <strong>96%</strong></span><span>Verification <strong>1 pending</strong></span><span>Source health <strong>2 of 5 healthy</strong></span></div></article>
      <dl class="management-metrics"><div><dt>FBM KLCI</dt><dd>${headline.fbmKLCI.toLocaleString("en-MY", { minimumFractionDigits: 1 })}</dd><small>+${headline.klciMtdPct.toFixed(1)}% MTD</small></div><div><dt>30-day ADV</dt><dd>RM${headline.adv30dBn.toFixed(2)}bn</dd><small>+${(((headline.adv30dBn / headline.advPrior30dBn) - 1) * 100).toFixed(1)}% vs prior</small></div><div><dt>Market capitalisation</dt><dd>RM${headline.marketCapBn.toLocaleString("en-MY")}bn</dd><small>+${headline.marketCapMtdPct.toFixed(1)}% MTD</small></div></dl>
      <section class="priority-section"><div class="section-heading"><div><h3>Management priorities</h3><p>Every item carries an owner and decision horizon.</p></div><span>${management.priorities.length} priorities</span></div><div class="priority-ledger">${management.priorities.map((item) => `<div class="priority-row"><span class="priority-status"></span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)}</small></div><time>${escapeHtml(item.due)}</time><span class="status-pill ${item.status === "In progress" ? "approved" : item.status === "Pending review" ? "denied" : ""}">${escapeHtml(item.status)}</span></div>`).join("")}</div></section>
      <div class="management-footer"><span>${icons.shield}</span><p><strong>Management boundary</strong>This view summarises synthetic prototype data. Source citations and governed methods remain in the Decision Canvas.</p><button class="button ghost" type="button" data-brief-question="How did the market perform in July?">Open supporting analysis</button></div>`;
  }

  function decisionMemoryPage() {
    const decisions = roleDecisionMemory();
    return `<div class="page-toolbar"><span class="status-pill approved">${decisions.length} records</span></div>
      <div class="memory-ledger">${decisions.map((item) => `<article class="memory-row"><div class="memory-date"><time>${escapeHtml(item.created)}</time><span></span></div><div class="memory-copy"><div><span>${escapeHtml(item.id)}</span><span class="status-pill ${item.status === "Recorded" ? "approved" : "denied"}">${escapeHtml(item.status)}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.rationale)}</p><dl><div><dt>Owner</dt><dd>${escapeHtml(item.owner)}</dd></div><div><dt>Workspace</dt><dd>${escapeHtml(item.workspace)}</dd></div><div><dt>Originating question</dt><dd>${escapeHtml(item.question)}</dd></div></dl><button type="button" data-brief-question="${escapeHtml(item.question)}">Reopen evidence trail ${icons.arrow}</button></div></article>`).join("")}</div><div class="warning-block">Local prototype record. Production Decision Memory would require an approved retention policy, access control and enterprise system of record.</div>`;
  }

  function renderPage(page) {
    if (["verification", "data-sources"].includes(page) && !isReviewer()) {
      renderHome();
      toast("Reviewer access required", "Verification cases and source oversight are visible only to reviewer accounts.");
      return;
    }
    state.requestId += 1;
    state.pending = false;
    state.workspace = page;
    state.currentAnswer = null;
    if (["management-brief", "decision-memory"].includes(page) && !hasManagementAccess()) {
      renderHome();
      toast("Management access required", "This view is available to the GCMC, Market Reviewer and Finance demo identities.");
      return;
    }
    const labels = { "today-brief": "Today’s Brief", watchlist: "Watchlist & Alerts", "management-brief": "Management Briefing", "decision-memory": "Decision Memory", verification: "Verification Centre", "data-sources": "Source Health", settings: "Settings" };
    const descriptions = {
      "today-brief": "The signals, decisions and source issues that need attention now.",
      watchlist: "Monitored signals and transparent alert rules.",
      "management-brief": "A concise decision-ready view for leadership conversations.",
      "decision-memory": "The evidence and rationale behind prior decisions.",
      verification: "Human review for answers that may inform decisions.",
      "data-sources": "Freshness, quality, usage and ownership of governed demo sources.",
      settings: "Choose how BursaIQ responds and behaves on this device."
    };
    setHeading({ title: labels[page], description: descriptions[page] });
    dom.asof_chip.style.display = "none";
    selectNavigation(page);
    dom.workspace_grid.className = "workspace-grid";
    const pageRenderers = { "today-brief": todayBriefPage, watchlist: watchlistPage, "management-brief": managementBriefPage, "decision-memory": decisionMemoryPage, verification: verificationPage, "data-sources": dataSourcesPage, settings: settingsPage };
    const content = (pageRenderers[page] || settingsPage)();
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
    const connectionLabel = state.agent.available ? "Prototype agent ready" : "Token endpoint required";
    const connectionDetail = state.agent.error || (state.agent.available ? "Published agent uses anonymous Direct Line access." : "Add COPILOTSTUDIOAGENT__TOKENENDPOINT to .env.");
    return `<div class="page-hero settings-hero"><div><h2>Your BursaIQ experience</h2><p>Preferences are stored locally in this browser and can be reset at any time.</p></div><button class="button ghost" type="button" data-reset-preferences>Restore defaults</button></div>
      <div class="settings-layout">
        <section class="settings-section"><h3>Microsoft Copilot Studio</h3><p>Your hosted agent powers BursaIQ conversations. Tokens stay in the local Python service and are never sent to browser code.</p>
          <div class="setting-row"><span><strong>${connectionLabel}</strong><small>${escapeHtml(connectionDetail)}</small></span></div>
        </section>
        <section class="settings-section plugins-section"><h3>Plugins</h3><p>Add optional tools BursaIQ may use alongside its governed data and hosted agent.</p><div class="plugin-list">
          ${pluginRow("webSearch", "Web Search", "Discover current public information when an approved connection is available.", icons.web)}
          ${pluginRow("pdfTools", "PDF Tools", "Read, retrieve and summarise approved local PDF documents.", icons.file)}
          ${pluginRow("spreadsheetTools", "Spreadsheet Tools", "Inspect approved Excel tables used by market calculations.", icons.table)}
          <p class="plugin-boundary">Stage 02 demo controls. Enabling Web Search does not send data externally until an approved endpoint and credentials are configured.</p>
        </div></section>
        <section class="settings-section panel-access-section"><h3>Panel access</h3><p>Request a restricted workspace when it is relevant to your role. Requests require the panel owner’s approval.</p><div class="panel-access-list">${Object.keys(requestablePanels).map(panelAccessRow).join("")}<p class="panel-access-note">Stage 02 simulation: requests are stored on this device and do not change access automatically.</p></div></section>
        <section class="settings-section"><h3>Workspace behaviour</h3><p>Choose what opens first and how supporting analysis appears.</p>
          <label class="setting-row setting-select"><span><strong>Default workspace</strong><small>Used the next time BursaIQ opens.</small></span><select data-setting="defaultWorkspace" aria-label="Default workspace"><option value="home" ${preferences.defaultWorkspace === "home" ? "selected" : ""}>BursaIQ Assistant</option><option value="today-brief" ${preferences.defaultWorkspace === "today-brief" ? "selected" : ""}>Today’s Brief</option><option value="learn" ${preferences.defaultWorkspace === "learn" ? "selected" : ""}>Learn Bursa</option></select></label>
          ${settingSwitch("autoOpenInsights", "Open analysis automatically", "Show the right-side plot or evidence panel after an answer.", preferences.autoOpenInsights)}
          ${settingSwitch("chartMotion", "Animate market charts", "Draw chart lines and bars when the analysis panel opens.", preferences.chartMotion)}
        </section>
        <section class="settings-section settings-note"><h3>Demo boundaries</h3><p>Identity permissions, source access and governed calculations cannot be changed here. Copilot Studio does not bypass BursaIQ’s server-side workspace policy.</p><div><span>${icons.shield}</span><strong>Access rules remain enforced</strong></div></section>
      </div>`;
  }

  function verificationFlowMarkup(item = null) {
    const reviewer = item?.reviewer || "Assigned Data Owner";
    const submittedClass = item ? " is-submitted" : "";
    const receipt = item ? `<div class="workflow-receipt"><span>${icons.check}</span><div><strong>${escapeHtml(item.id)}</strong><small>Review package assigned to ${escapeHtml(reviewer)} · Pending review</small></div></div>` : "";
    return `<section class="verification-flow${submittedClass}" aria-label="Verification process flow">
      <div class="verification-flow-head"><div><h3>From answer to approved output</h3><p>One governed review path connects the requester, Microsoft 365 and the responsible Data Owner.</p></div><span class="architecture-chip">Target Microsoft 365 workflow</span></div>
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
    if (!cases.length) {
      return `<div class="page-hero"><div><h2>Cases to verify</h2><p>Only cases assigned to ${escapeHtml(demo.identities[state.role].name)} are shown.</p></div><span class="status-pill approved">0 assigned</span></div><div class="empty-state reviewer-empty"><div>${icons.shield}<h2>You’re all caught up</h2><p>No pending or completed cases are assigned to this reviewer account.</p></div></div>`;
    }
    return `<div class="page-hero"><div><h2>Cases to verify</h2><p>Only cases assigned to ${escapeHtml(demo.identities[state.role].name)} are shown.</p></div><span class="status-pill">${cases.filter((item) => item.status === "Pending review").length} pending</span></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Case</th><th>Requested by</th><th>Reviewer assignment</th><th>Status</th><th>Action</th></tr></thead><tbody>${cases.map((item) => `<tr><td><strong>${escapeHtml(item.title)}</strong><br><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(item.requestedBy)}</td><td>${escapeHtml(item.reviewer)}</td><td><span class="status-pill ${item.status === "Approved" ? "approved" : item.status === "Changes requested" ? "denied" : ""}">${escapeHtml(item.status)}</span></td><td><button class="button ${item.status === "Pending review" ? "secondary" : "ghost"}" type="button" data-verification-details="${escapeHtml(item.id)}">${item.status === "Pending review" ? "Review details" : "View decision"}</button></td></tr>`).join("")}</tbody></table></div><div class="warning-block">Reviewer-scoped local demonstration. The server rejects access to cases outside this account’s assigned queue.</div>`;
  }

  function dataSourcesPage() {
    const permittedWorkspaces = new Set(demo.identities[state.role].access);
    const sources = demo.documents.filter((source) => permittedWorkspaces.has(source.workspace));
    const healthy = sources.filter((source) => source.health === "Healthy").length;
    const averageQuality = Math.round(sources.reduce((total, source) => total + Number(source.qualityPct || 0), 0) / Math.max(sources.length, 1));
    return `<div class="page-toolbar"><span class="status-pill approved">${healthy} healthy</span></div>
      <div class="source-summary"><div><span>Visible sources</span><strong>${sources.length}</strong></div><div><span>Average quality</span><strong>${averageQuality}%</strong></div><div><span>Needs attention</span><strong>${sources.length - healthy}</strong></div><div><span>Review scope</span><strong>${escapeHtml(demo.identities[state.role].reviewerFor.join(", "))}</strong></div></div>
      <div class="data-table-wrap source-table-wrap"><table class="data-table source-table"><thead><tr><th>Data source</th><th>Freshness</th><th>Quality</th><th>Usage</th><th>Updated by</th><th>Health</th></tr></thead><tbody>${sources.map((source) => `<tr><td><span class="source-file-mark ${source.format.toLowerCase()}">${escapeHtml(source.format)}</span><span><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(workspaceConfig[source.workspace]?.title || source.workspace)} · ${escapeHtml(source.filename)}</small></span></td><td><time>${escapeHtml(source.updated)}</time><small>${escapeHtml(source.freshness || "Current")}</small></td><td><div class="quality-cell"><span><i style="width:${Number(source.qualityPct || 0)}%"></i></span><strong>${Number(source.qualityPct || 0)}%</strong></div></td><td>${escapeHtml(source.usage || "No recent use")}</td><td><strong>${escapeHtml(source.updatedBy || source.owner)}</strong><small>${escapeHtml(source.owner)}</small></td><td><span class="status-pill ${source.health === "Healthy" ? "approved" : "denied"}">${escapeHtml(source.health || source.status)}</span><small>Next · ${escapeHtml(source.nextReview || "Not scheduled")}</small></td></tr>`).join("")}</tbody></table></div>
      <div class="warning-block">Synthetic demonstration sources only. Health combines illustrative freshness and quality controls; “Updated by” identifies the accountable demo owner in the local manifest.</div>`;
  }

  function updateNavigationVisibility() {
    const regAllowed = hasAccess("reg");
    dom.ask_reg_nav.hidden = !regAllowed;
    dom.ask_reg_nav.setAttribute("aria-hidden", String(!regAllowed));
    const reviewerAllowed = isReviewer();
    const managementAllowed = hasManagementAccess();
    dom.management_brief_nav.hidden = !managementAllowed;
    dom.management_brief_nav.setAttribute("aria-hidden", String(!managementAllowed));
    dom.workflow_nav_label.hidden = !(reviewerAllowed || managementAllowed);
    dom.verification_nav.hidden = !reviewerAllowed;
    dom.verification_nav.setAttribute("aria-hidden", String(!reviewerAllowed));
    dom.data_sources_nav.hidden = !reviewerAllowed;
    dom.data_sources_nav.setAttribute("aria-hidden", String(!reviewerAllowed));
    dom.decision_memory_nav.hidden = !managementAllowed;
    dom.decision_memory_nav.setAttribute("aria-hidden", String(!managementAllowed));
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
    toast("Identity switched", `${identity.name} is now the active demo identity.`);
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
    let item = { id: `VER-${Date.now().toString().slice(-8)}`, title: state.currentAnswer.title, workspace: workspaceConfig[state.answerWorkspace].title, requestedBy: demo.identities[state.role].name, reviewer: "Market Intelligence Lead", status: "Pending review", created: new Date().toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }), scope: "Answer narrative, calculations and source citations", details };
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
      answerText: state.currentAnswer.agentNarrative || plainText(state.currentAnswer.html),
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
    if (dom.verification_count) dom.verification_count.textContent = reviewerCases().filter((item) => item.status === "Pending review").length;
    if (dom.watchlist_count) dom.watchlist_count.textContent = roleWatchlist().length;
  }

  function toggleWatch(signalId) {
    const signal = signalById(signalId);
    if (!signal) return;
    const items = [...roleWatchlist()];
    const existingIndex = items.indexOf(signalId);
    if (existingIndex >= 0) items.splice(existingIndex, 1);
    else items.unshift(signalId);
    persistRoleCollection("bursaiq_watchlists", "watchlists", items);
    updateCounts();
    toast(existingIndex >= 0 ? "Removed from watchlist" : "Signal added", existingIndex >= 0 ? `${signal.title} is no longer monitored.` : `${signal.title} is now monitored for this identity.`);
  }

  function saveCurrentDecision() {
    if (!state.currentAnswer) return;
    const existing = (state.decisionMemories[state.role] || []).some((item) => item.question === state.currentQuestion);
    if (existing) {
      toast("Already recorded", "This answer is already in Decision Memory for the active identity.");
      return;
    }
    const record = {
      id: `DEC-${Date.now().toString().slice(-8)}`,
      title: state.currentAnswer.title,
      rationale: plainText(state.currentAnswer.agentNarrative || state.currentAnswer.html).slice(0, 220),
      owner: demo.identities[state.role].name,
      workspace: workspaceConfig[state.answerWorkspace]?.title || "BursaIQ",
      status: "Awaiting verification",
      created: new Date().toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }),
      question: state.currentQuestion
    };
    persistRoleCollection("bursaiq_decision_memories", "decisionMemories", [record, ...(state.decisionMemories[state.role] || [])]);
    toast("Decision recorded", `${record.id} was added to Decision Memory.`);
  }

  function askFromPage(question) {
    const workspace = routeQuestion(question);
    switchWorkspace(workspace === "blocked" ? "home" : workspace);
    window.setTimeout(() => ask(question), 0);
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

  let navigationReturnFocus = null;

  function isMobileNavigation() {
    return window.matchMedia("(max-width: 980px)").matches;
  }

  function syncNavigationAccessibility() {
    const sidebar = document.getElementById("primary-sidebar");
    const mainShell = document.querySelector(".main-shell");
    if (!sidebar || !mainShell) return;
    const open = document.body.classList.contains("nav-open");
    const mobile = isMobileNavigation();
    sidebar.inert = mobile && !open;
    if (mobile && !open) sidebar.setAttribute("aria-hidden", "true");
    else sidebar.removeAttribute("aria-hidden");
    mainShell.inert = mobile && open;
  }

  function openNavigation() {
    if (!isMobileNavigation()) return;
    const sidebar = document.getElementById("primary-sidebar");
    navigationReturnFocus = document.activeElement;
    document.body.classList.add("nav-open");
    dom.menu_button?.setAttribute("aria-expanded", "true");
    syncNavigationAccessibility();
    window.requestAnimationFrame(() => sidebar?.querySelector("button:not([hidden]), select")?.focus());
  }

  function closeNavigation({ restoreFocus = true } = {}) {
    const wasOpen = document.body.classList.contains("nav-open");
    document.body.classList.remove("nav-open");
    dom.menu_button?.setAttribute("aria-expanded", "false");
    syncNavigationAccessibility();
    if (wasOpen && restoreFocus && navigationReturnFocus instanceof HTMLElement) navigationReturnFocus.focus();
    if (wasOpen) navigationReturnFocus = null;
  }

  function toggleNavigation() {
    if (document.body.classList.contains("nav-open")) closeNavigation({ restoreFocus: true });
    else openNavigation();
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
    const briefQuestion = event.target.closest("[data-brief-question]");
    if (briefQuestion) {
      askFromPage(briefQuestion.dataset.briefQuestion);
      return;
    }
    const watchToggle = event.target.closest("[data-watch-toggle]");
    if (watchToggle) {
      toggleWatch(watchToggle.dataset.watchToggle);
      renderPage(state.workspace);
      return;
    }
    const insightAction = event.target.closest("[data-insight-action]");
    if (insightAction) {
      const command = insightAction.dataset.insightAction;
      if (command === "watch") toggleWatch(insightAction.dataset.signalId);
      if (command === "memory") saveCurrentDecision();
      if (command === "verify") submitVerification(insightAction);
      if (command === "brief") {
        switchWorkspace("management-brief");
        toast("Added to management view", "The current insight is represented in the prototype briefing narrative.");
        return;
      }
      if (command !== "verify") renderEvidence();
      return;
    }
    if (event.target.closest("[data-management-print]")) {
      window.print();
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
    if (event.target.closest("[data-open-insight]")) return showEvidence(state.insightTab, false);
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
    dom.menu_button.addEventListener("click", toggleNavigation);
    dom.mobile_scrim.addEventListener("click", () => closeNavigation({ restoreFocus: true }));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("nav-open")) closeNavigation({ restoreFocus: true });
    });
    window.addEventListener("resize", syncNavigationAccessibility);
    dom.workspace_grid.addEventListener("click", handleWorkspaceClick);
    dom.workspace_grid.addEventListener("submit", (event) => {
      if (event.target.id === "chat-form") {
        event.preventDefault();
        ask(document.getElementById("question-input").value);
      }
      if (event.target.matches("[data-management-form]")) {
        event.preventDefault();
        refreshManagementBrief(event.target);
      }
    });
    dom.workspace_grid.addEventListener("input", (event) => {
      if (event.target.id === "question-input") resizeInput();
      if (event.target.matches("[data-management-instruction]")) {
        const count = event.target.form?.querySelector("[data-management-count]");
        if (count) count.textContent = String(event.target.value.length);
      }
    });
    dom.workspace_grid.addEventListener("change", updateSetting);
    dom.workspace_grid.addEventListener("keydown", (event) => {
      if (event.target.id === "question-input" && event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.target.form.requestSubmit();
        return;
      }
      if (event.target.matches("[data-management-instruction]") && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        event.target.form.requestSubmit();
        return;
      }
      const tab = event.target.closest(".evidence-tab");
      if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const tabs = [...dom.workspace_grid.querySelectorAll(".evidence-tab")];
      let index = tabs.indexOf(tab);
      if (event.key === "Home") index = 0;
      else if (event.key === "End") index = tabs.length - 1;
      else index = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[index].focus();
      tabs[index].click();
    });
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
    syncNavigationAccessibility();
    const initialWorkspace = state.preferences.defaultWorkspace;
    if (workspaceConfig[initialWorkspace] && hasAccess(initialWorkspace)) renderWorkspace(initialWorkspace);
    else if (initialWorkspace === "today-brief") renderPage("today-brief");
    else renderHome();
    updateSystemIndicator();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
