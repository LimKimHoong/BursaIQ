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
    refresh: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5m10.1 0A7 7 0 0 0 6.4 7.7L4 12m16 0-2.4 4.3A7 7 0 0 1 4.9 12"/></svg>`,
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4M5 20h14"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 3h6l1 4H8zM7 7l1 14h8l1-14M10 11v6m4-6v6"/></svg>`
  };

  const preferencesVersion = 4;

  const defaultPreferences = {
    version: preferencesVersion,
    autoOpenInsights: true,
    chartMotion: true,
    theme: "dark",
    showPet: true,
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
    research: { query: "", depth: "deep", scope: "governed", pending: false, result: null, conversationId: "" },
    localAnalysis: { sessionId: "", documents: [], pending: false, uploading: false, question: "", result: null, useCopilot: false, conversationId: "" },
    guideOpen: false
  };

  const dom = {};

  function bindDom() {
    ["chat-thread", "suggestion-row", "chat-form", "question-input", "evidence-content", "evidence-badge", "workspace-grid", "workspace-heading", "workspace-title", "workspace-description", "breadcrumb-label", "asof-chip", "access-chip", "role-select", "identity-name", "identity-role", "avatar", "report-dialog", "report-title", "open-report-button", "verification-count", "watchlist-count", "verification-dialog", "verification-dialog-title", "verification-detail-content", "verification-flow-dialog", "verification-flow-dialog-title", "verification-flow-content", "access-request-dialog", "access-request-form", "access-request-panel-name", "access-request-reason", "access-request-reason-count", "access-request-error", "submit-access-request", "ask-reg-nav", "today-brief-nav", "research-nav", "local-analysis-nav", "watchlist-nav", "workflow-nav-label", "verification-nav", "data-sources-nav", "decision-memory-nav", "settings-nav", "new-thread-button", "menu-button", "mobile-scrim", "theme-toggle", "guide-pet-shell", "guide-panel", "guide-pet-trigger", "guide-close", "guide-form", "guide-input", "guide-messages", "guide-suggestions"].forEach((id) => {
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
      state.verification = accessibleVerificationCases(demo.verification);
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
      state.verification = accessibleVerificationCases(demo.verification);
    }
  }

  function isReviewer() {
    return Boolean(demo.identities[state.role].reviewerFor?.length);
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

  function requestedCases(cases = state.verification) {
    const requester = demo.identities[state.role].name;
    return cases.filter((item) => item.requestedBy === requester);
  }

  function accessibleVerificationCases(cases = state.verification) {
    const accessible = new Map();
    [...reviewerCases(cases), ...requestedCases(cases)].forEach((item) => accessible.set(item.id, item));
    return [...accessible.values()];
  }

  async function refreshVerificationAccess() {
    if (!state.backend) {
      state.verification = accessibleVerificationCases(demo.verification);
      return;
    }
    try {
      const response = await fetch(`/api/verification?role=${encodeURIComponent(state.role)}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Verification requests unavailable");
      const payload = await response.json();
      state.verification = Array.isArray(payload.cases) ? payload.cases : [];
    } catch (_error) {
      state.verification = [];
      toast("Verification requests unavailable", "Your request status could not be loaded. Try again after checking the local server.");
    }
  }

  function selectNavigation(workspace) {
    document.querySelectorAll("[data-workspace]").forEach((item) => item.classList.toggle("is-active", item.dataset.workspace === workspace));
  }

  function savePreferences() {
    localStorage.setItem("bursaiq_preferences", JSON.stringify(state.preferences));
    applyPreferences();
  }

  function applyTheme() {
    const theme = state.preferences.theme === "light" ? "light" : "dark";
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const themeColor = document.getElementById("theme-color");
    if (themeColor) themeColor.content = theme === "light" ? "#eef1f8" : "#070b16";
    if (dom.theme_toggle) {
      const label = `Switch to ${nextTheme} mode`;
      dom.theme_toggle.setAttribute("aria-label", label);
      dom.theme_toggle.setAttribute("title", label);
      dom.theme_toggle.setAttribute("aria-pressed", String(theme === "light"));
    }
    const setting = dom.workspace_grid?.querySelector('[data-setting="theme"]');
    if (setting && setting.value !== theme) setting.value = theme;
  }

  function applyPreferences() {
    applyTheme();
    applyGuideVisibility();
    document.body.classList.toggle("reduce-chart-motion", !state.preferences.chartMotion);
    updateSystemIndicator();
  }

  function toggleTheme() {
    state.preferences.theme = state.preferences.theme === "light" ? "dark" : "light";
    savePreferences();
    toast(`${state.preferences.theme === "light" ? "Light" : "Dark"} mode`, "Appearance was saved for this device.");
  }

  let guideCloseTimer = null;

  function closeGuide({ restoreFocus = true, immediate = false } = {}) {
    if (!dom.guide_panel || !dom.guide_pet_shell) return;
    window.clearTimeout(guideCloseTimer);
    const wasOpen = state.guideOpen;
    state.guideOpen = false;
    dom.guide_pet_shell.classList.remove("is-open", "is-thinking");
    dom.guide_pet_trigger?.setAttribute("aria-expanded", "false");
    dom.guide_pet_trigger?.setAttribute("aria-label", "Open IQ Guide");
    dom.guide_panel.setAttribute("aria-hidden", "true");
    const finish = () => {
      if (!state.guideOpen) dom.guide_panel.hidden = true;
    };
    if (immediate) finish();
    else guideCloseTimer = window.setTimeout(finish, 220);
    if (wasOpen && restoreFocus && state.preferences.showPet !== false) dom.guide_pet_trigger?.focus();
  }

  function applyGuideVisibility() {
    if (!dom.guide_pet_shell) return;
    const visible = state.preferences.showPet !== false;
    document.documentElement.dataset.pet = visible ? "visible" : "hidden";
    if (!visible) closeGuide({ restoreFocus: false, immediate: true });
    dom.guide_pet_shell.hidden = !visible;
  }

  function openGuide() {
    if (!dom.guide_panel || state.preferences.showPet === false) return;
    window.clearTimeout(guideCloseTimer);
    state.guideOpen = true;
    dom.guide_panel.hidden = false;
    dom.guide_panel.setAttribute("aria-hidden", "false");
    dom.guide_pet_trigger?.setAttribute("aria-expanded", "true");
    dom.guide_pet_trigger?.setAttribute("aria-label", "Close IQ Guide");
    window.requestAnimationFrame(() => {
      dom.guide_pet_shell?.classList.add("is-open");
      dom.guide_input?.focus();
    });
  }

  function toggleGuide() {
    if (state.guideOpen) closeGuide();
    else openGuide();
  }

  function guideDestinationAvailable(workspace) {
    if (workspaceConfig[workspace]) return hasAccess(workspace);
    return true;
  }

  function guideReply(question) {
    const value = question.toLowerCase();
    const currentLabels = { home: "BursaIQ Assistant", market: "Market Intelligence", learn: "Learn Bursa", reg: "Ask Reg", "today-brief": "Today’s Brief", research: "Research", "local-analysis": "Local Analysis", watchlist: "Watchlist & Alerts", "decision-memory": "Decision Memory", verification: "Verification Centre", "data-sources": "Source Health", settings: "Settings" };
    if (/(where am i|current panel|current page)/.test(value)) {
      return { text: `You’re in ${currentLabels[state.workspace] || "BursaIQ"}. Tell me the task you want to complete and I can recommend the next panel.` };
    }

    let result;
    if (/(source health|data source|freshness|updated by|data owner|source quality)/.test(value)) {
      result = { workspace: "data-sources", label: "Open Source Health", text: "Use Source Health to check governed data sources, freshness, quality, recent usage, ownership and update dates." };
    } else if (/(verify|verification|review|approve|audit|human check)/.test(value)) {
      result = { workspace: "verification", label: "Open Verification Centre", text: "Use Verification Centre when an answer may inform a decision and needs a reviewer to inspect its narrative, calculation and evidence trail." };
    } else if (/(research|investigate|deep dive|landscape|compare evidence|complete study)/.test(value)) {
      result = { workspace: "research", label: "Open Research", text: "Use Research to turn a broad question into a structured dossier with evidence, counterpoints, implications and open questions." };
    } else if (/(upload|my document|local file|analyse file|analyze file|document analysis|spreadsheet analysis)/.test(value)) {
      result = { workspace: "local-analysis", label: "Open Local Analysis", text: "Use Local Analysis to inspect uploaded PDFs, spreadsheets and text files in a private in-memory workspace, then ask questions against their evidence." };
    } else if (/(decision memory|rationale|previous decision|decision history|why.*decid)/.test(value)) {
      result = { workspace: "decision-memory", label: "Open Decision Memory", text: "Use Decision Memory to revisit the question, evidence, rationale, owner and status behind a recorded decision." };
    } else if (/(watch|alert|monitor|threshold|notify|tracking)/.test(value)) {
      result = { workspace: "watchlist", label: "Open Watchlist & Alerts", text: "Use Watchlist & Alerts to monitor signals over time and see the rule that caused each alert." };
    } else if (/(today|daily brief|what changed|attention|priority|signal)/.test(value)) {
      result = { workspace: "today-brief", label: "Open Today’s Brief", text: "Use Today’s Brief for the signals, decisions and source issues that deserve attention now." };
    } else if (/(learn|onboard|definition|term|plain language|understand bursa)/.test(value)) {
      result = { workspace: "learn", label: "Open Learn Bursa", text: "Use Learn Bursa for plain-language explanations and guided onboarding pathways grounded in approved learning material." };
    } else if (/(regulation|regulatory|listing|disclosure|misconduct|ask reg)/.test(value)) {
      result = { workspace: "reg", label: "Open Ask Reg", text: "Use Ask Reg for controlled regulatory guidance, authority boundaries and escalation to the accountable owner." };
    } else if (/(setting|theme|light mode|dark mode|show.*pet|hide.*pet)/.test(value)) {
      result = { workspace: "settings", label: "Open Settings", text: "Use Settings to change Light or Dark mode, restore this guide pet, choose the default workspace and manage prototype tools." };
    } else if (/(workflow|what happens next|next step)/.test(value)) {
      result = isReviewer()
        ? { workspace: "verification", label: "Open Verification Centre", text: "For reviewer work, Verification Centre is the clearest starting point. It shows the queue, accountable owner and approval trail." }
        : { workspace: "decision-memory", label: "Open Decision Memory", text: "For an accountable workflow, start with Decision Memory to preserve the evidence and rationale, then use Verification Centre to track the request through review." };
    } else {
      result = { workspace: "home", label: "Open BursaIQ Assistant", text: "Start in BursaIQ Assistant when you are unsure. Ask across approved workspaces there, then move a grounded answer into monitoring, review, decision memory or briefing." };
    }

    if (guideDestinationAvailable(result.workspace)) return result;
    if (result.workspace === "reg") {
      return { workspace: "settings", label: "Open access settings", text: "Ask Reg is restricted for the active demo identity. Open Settings to request panel access; the guide will not expose restricted source details." };
    }
    return { workspace: "today-brief", label: "Open Today’s Brief", text: `${currentLabels[result.workspace]} is not available to the active demo identity. Today’s Brief is the best permitted summary of current signals and next actions.` };
  }

  function appendGuideMessage(role, text, action = null) {
    if (!dom.guide_messages) return;
    const message = document.createElement("article");
    message.className = `guide-message is-${role}`;
    if (role === "guide") {
      const avatar = document.createElement("span");
      avatar.className = "guide-message-avatar";
      avatar.setAttribute("aria-hidden", "true");
      const image = document.createElement("img");
      image.src = "/static/assets/bursaiq-guide-pet.png";
      image.alt = "";
      avatar.appendChild(image);
      message.appendChild(avatar);
    }
    const content = document.createElement("div");
    const copy = document.createElement("p");
    copy.textContent = text;
    content.appendChild(copy);
    if (action?.workspace) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "guide-message-action";
      button.dataset.guideGo = action.workspace;
      button.textContent = action.label;
      content.appendChild(button);
    }
    message.appendChild(content);
    dom.guide_messages.appendChild(message);
    dom.guide_messages.scrollTop = dom.guide_messages.scrollHeight;
  }

  function askGuide(question) {
    const cleanQuestion = String(question || "").trim();
    if (!cleanQuestion) return;
    if (/^\/close$/i.test(cleanQuestion)) {
      state.preferences.showPet = false;
      savePreferences();
      toast("IQ Guide hidden", "You can show the pet again from Settings → Appearance.");
      return;
    }
    appendGuideMessage("user", cleanQuestion);
    const reply = guideReply(cleanQuestion);
    appendGuideMessage("guide", reply.text, reply);
    dom.guide_pet_shell?.classList.add("is-thinking");
    window.setTimeout(() => dom.guide_pet_shell?.classList.remove("is-thinking"), 460);
  }

  function submitGuideQuestion(event) {
    event.preventDefault();
    const question = dom.guide_input?.value || "";
    if (dom.guide_input) dom.guide_input.value = "";
    askGuide(question);
  }

  function navigateFromGuide(workspace) {
    if (!workspace || !guideDestinationAvailable(workspace)) return;
    switchWorkspace(workspace);
    closeGuide({ restoreFocus: false });
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
        <button type="button" data-insight-action="research"><span>${icons.search}</span><span><strong>Open a research thread</strong><small>Expand this answer into a sourced dossier with counterpoints and open questions.</small></span><em>Research</em></button>
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
      </section><aside class="brief-side"><div class="section-heading"><div><h3>What to do next</h3><p>Suggested workflow, not an automated decision.</p></div></div><ol class="next-action-list"><li><span>${icons.pulse}</span><div><strong>Check the next market cut</strong><small>Confirm whether the ADV uplift is sustained.</small></div></li><li><span>${icons.shield}</span><div><strong>Close the July review</strong><small>One briefing remains pending with the Data Owner.</small></div></li><li><span>${icons.file}</span><div><strong>Refresh ageing content</strong><small>The conduct guide is outside its freshness target.</small></div></li></ol><button class="button secondary" type="button" data-go="research">Research a signal</button></aside></div>
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

  function fallbackResearchResult(query, depth, scope) {
    const visibleSources = demo.documents.filter((source) => hasAccess(source.workspace)).slice(0, depth === "deep" ? 5 : 3);
    const headline = demo.market.headline;
    const isMarket = /(market|klci|adv|liquidity|sector|trading|investor)/i.test(query);
    return {
      query,
      depth,
      scope,
      mode: "prepared-research-fallback",
      generatedAt: new Date().toISOString(),
      answer: isMarket
        ? `The prepared evidence indicates a constructive July market backdrop. The FBM KLCI closed at ${headline.fbmKLCI.toFixed(1)}, up ${headline.klciMtdPct.toFixed(1)}% month to date, while 30-day ADV reached RM${headline.adv30dBn.toFixed(2)}bn. The conclusion remains conditional on whether activity and participation breadth persist in the next market cut.`
        : `BursaIQ assembled the governed sources most relevant to “${query}”. This offline dossier can frame the question and identify accountable sources, but it does not add current external facts. Connect the published Research agent or enable an approved current-information source before treating the work as complete.`,
      findings: isMarket
        ? [`Index direction improved by ${headline.klciMtdPct.toFixed(1)}% month to date.`, `30-day ADV reached RM${headline.adv30dBn.toFixed(2)}bn versus RM${headline.advPrior30dBn.toFixed(2)}bn previously.`, "Persistence and sector concentration remain the decisive follow-up tests."]
        : ["The governed source pack establishes Bursa context and ownership.", "Time-sensitive external claims still require an approved current-information connection.", "The evidence trail should remain attached if this work enters a decision workflow."],
      counterpoints: ["The demonstration evidence is synthetic and intentionally bounded.", "Research output is not treated as verified until its citations and method are reviewed."],
      nextQuestions: ["Which assumption would change the conclusion most?", "What additional source would resolve the largest uncertainty?", "Which finding needs human verification?"],
      sources: visibleSources.map((source) => ({ id: source.id, title: source.title, filename: source.filename, workspace: source.workspace, owner: source.owner, excerpt: source.excerpt }))
    };
  }

  function researchSourceRows(sources = []) {
    if (!sources.length) return `<div class="research-empty-evidence"><strong>No governed match yet</strong><p>Refine the question or add an approved source connection.</p></div>`;
    return sources.map((source, index) => `<article class="research-source-row"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(source.owner || source.workspace || "Governed source")}</small><p>${escapeHtml(source.excerpt || source.filename || "Source selected for the research trail.")}</p></div><em>${escapeHtml(source.workspace || "BursaIQ")}</em></article>`).join("");
  }

  function researchResultMarkup(result) {
    const modeLabel = result.mode === "copilot-studio-research" ? "Microsoft Copilot Studio" : "Prepared governed fallback";
    const generated = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(result.generatedAt || Date.now()));
    return `<section class="research-dossier" aria-live="polite">
      <header class="research-dossier-head"><div><span class="provenance-chip ${result.mode === "copilot-studio-research" ? "copilot" : "fallback"}">${modeLabel}</span><h2>Research dossier</h2><p>${escapeHtml(result.query)}</p></div><div><span>Generated</span><strong>${escapeHtml(generated)} MYT</strong><small>${result.depth === "deep" ? "Deep research" : "Focused scan"}</small></div></header>
      <div class="research-dossier-grid"><article class="research-synthesis"><h3>Executive finding</h3>${narrativeMarkup(result.answer)}</article><aside class="research-method"><strong>Research method</strong><ol><li>Frame the decision question</li><li>Retrieve permitted evidence</li><li>Test counterpoints</li><li>Synthesise with a source trail</li></ol></aside></div>
      <div class="research-findings"><section><h3>Evidence-led findings</h3><ol>${(result.findings || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section><section><h3>Counterpoints &amp; uncertainty</h3><ul>${(result.counterpoints || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section></div>
      <section class="research-evidence"><div class="section-heading"><div><h3>Source trail</h3><p>Governed material retrieved for this run.</p></div><span>${(result.sources || []).length} sources</span></div>${researchSourceRows(result.sources)}</section>
      <section class="research-next"><h3>Continue the investigation</h3><div>${(result.nextQuestions || []).map((question) => `<button type="button" data-research-prompt="${escapeHtml(question)}">${icons.arrow}<span>${escapeHtml(question)}</span></button>`).join("")}</div></section>
    </section>`;
  }

  function researchPage() {
    const research = state.research;
    const expandedAvailable = state.preferences.plugins.webSearch;
    const working = research.pending ? `<div class="research-progress" role="status" aria-live="polite"><span></span><div><strong>Building the dossier</strong><small>Framing · retrieving · testing · synthesising</small></div></div>` : "";
    const result = research.result ? researchResultMarkup(research.result) : `<section class="research-start"><div class="research-routes"><button type="button" data-research-prompt="Assess whether July’s higher market activity appears broad and sustainable"><span class="research-route-icon">${icons.chart}</span><span class="research-route-copy"><strong>Market &amp; liquidity</strong><small>Test momentum, participation and concentration.</small></span>${icons.arrow}</button><button type="button" data-research-prompt="Research the evidence, obligations and escalation path for continuous disclosure"><span class="research-route-icon">${icons.shield}</span><span class="research-route-copy"><strong>Policy &amp; regulation</strong><small>Map obligations, boundaries and accountable owners.</small></span>${icons.arrow}</button><button type="button" data-research-prompt="Compare Bursa product categories and identify the most important learning gaps for a new joiner"><span class="research-route-icon">${icons.learn}</span><span class="research-route-copy"><strong>Products &amp; landscape</strong><small>Build a structured view from approved material.</small></span>${icons.arrow}</button></div><div class="research-principles"><span>${icons.search}</span><div><strong>Complete means contestable</strong><p>Every dossier separates evidence, counterpoints, implications and open questions. External claims appear only when an approved connector is enabled.</p></div></div></section>`;
    return `<section class="research-command"><div><h2>Turn a broad question into a research dossier</h2><p>Set the depth and evidence boundary. BursaIQ keeps the source trail visible from first question to final finding.</p></div><form data-research-form><label for="research-query">Research question or instruction</label><textarea id="research-query" name="query" rows="3" maxlength="1200" required placeholder="For example: Assess whether July’s increase in market activity was broad, sustainable and decision-relevant.">${escapeHtml(research.query)}</textarea><div class="research-controls"><label><span>Depth</span><select name="depth"><option value="focused" ${research.depth === "focused" ? "selected" : ""}>Focused scan</option><option value="deep" ${research.depth === "deep" ? "selected" : ""}>Deep research</option></select></label><label><span>Evidence boundary</span><select name="scope"><option value="governed" ${research.scope === "governed" ? "selected" : ""}>Governed BursaIQ sources</option><option value="expanded" ${research.scope === "expanded" ? "selected" : ""} ${expandedAvailable ? "" : "disabled"}>Governed + approved public sources</option></select></label><button class="button primary research-run" type="submit" ${research.pending ? "disabled" : ""}>${research.pending ? icons.refresh : icons.spark}<span>${research.pending ? "Researching…" : "Start research"}</span></button></div>${expandedAvailable ? "" : `<small class="research-connector-note">Enable Web Search in Settings to make the expanded evidence boundary available.</small>`}</form></section>${working}${result}<p class="feature-footnote">Research output uses synthetic prototype evidence and is not investment advice. Verify material findings before decision use.</p>`;
  }

  async function runResearch(form) {
    if (state.research.pending) return;
    const data = new FormData(form);
    const query = String(data.get("query") || "").trim();
    if (!query) return;
    const depth = String(data.get("depth") || "deep");
    const scope = String(data.get("scope") || "governed");
    state.research = { ...state.research, query, depth, scope, pending: true };
    renderPage("research");
    try {
      if (!state.backend) throw new Error("Backend unavailable");
      const response = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, depth, scope, role: state.role, conversationId: state.research.conversationId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Research service unavailable");
      state.research = { ...state.research, pending: false, result: payload, conversationId: payload.conversationId || state.research.conversationId };
    } catch (_error) {
      state.research = { ...state.research, pending: false, result: fallbackResearchResult(query, depth, scope) };
      toast("Prepared research fallback", "Copilot Studio was unavailable, so BursaIQ built a transparent dossier from the governed demo evidence.");
    }
    renderPage("research");
    document.querySelector(".research-dossier")?.scrollIntoView({ block: "start", behavior: state.preferences.chartMotion ? "smooth" : "auto" });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function localDocumentRows(documents) {
    return documents.map((document) => `<article class="local-document-row"><span class="source-file-mark ${String(document.format || "file").toLowerCase()}">${escapeHtml(document.format || "FILE")}</span><div><strong>${escapeHtml(document.name)}</strong><small>${escapeHtml(document.detail || `${formatFileSize(document.size || 0)} · ready`)}</small></div><span>${formatFileSize(document.size || 0)}</span></article>`).join("");
  }

  function localAnalysisResultMarkup(result) {
    const assisted = result.mode === "copilot-assisted-local-analysis";
    return `<article class="local-answer" aria-live="polite"><header><span class="provenance-chip ${assisted ? "copilot" : ""}">${assisted ? "Copilot-assisted" : "Local extractive analysis"}</span><small>${result.documentCount} document${result.documentCount === 1 ? "" : "s"} analysed</small></header><h3>Analysis</h3>${narrativeMarkup(result.answer)}<section><div class="section-heading"><div><h3>Evidence used</h3><p>Exact passages selected for this answer.</p></div><span>${(result.citations || []).length} extracts</span></div>${(result.citations || []).map((citation) => `<article class="local-citation"><span>${citation.index}</span><div><strong>${escapeHtml(citation.name)}</strong><p>${escapeHtml(citation.excerpt)}</p></div></article>`).join("")}</section></article>`;
  }

  function localAnalysisPage() {
    const analysis = state.localAnalysis;
    const hasDocuments = analysis.documents.length > 0;
    const status = analysis.uploading ? "Reading documents…" : hasDocuments ? `${analysis.documents.length} document${analysis.documents.length === 1 ? "" : "s"} ready` : "No documents loaded";
    return `<div class="local-analysis-layout"><section class="local-intake"><header><div><h2>Private document bench</h2><p>Files are parsed by the local Python service and held in memory only for this running session.</p></div>${hasDocuments ? `<button class="button ghost" type="button" data-local-clear>${icons.trash}<span>Clear</span></button>` : ""}</header><input id="local-file-input" data-local-files type="file" accept=".pdf,.xlsx,.csv,.json,.txt,.md" multiple hidden><button class="local-dropzone${analysis.uploading ? " is-loading" : ""}" type="button" data-local-browse ${analysis.uploading ? "disabled" : ""}>${icons.upload}<strong>${analysis.uploading ? "Reading your documents" : "Drop documents here"}</strong><span>or choose files from this device</span><small>PDF, XLSX, CSV, JSON, TXT or MD · up to 5 MB each · maximum 6 files</small></button><div class="local-file-status"><span></span><strong>${status}</strong><small>Nothing is added to BursaIQ’s governed source library.</small></div>${hasDocuments ? `<div class="local-document-list">${localDocumentRows(analysis.documents)}</div>` : ""}</section><section class="local-dialogue"><header><span>${icons.spark}</span><div><h2>Ask against the evidence</h2><p>Give a question, comparison or transformation instruction.</p></div></header><div class="local-suggestions"><button type="button" data-local-question="Summarise the most important findings and decisions">Summarise findings</button><button type="button" data-local-question="Compare the documents and identify contradictions or gaps">Find contradictions</button><button type="button" data-local-question="Extract the key numbers, dates and accountable owners">Extract facts</button></div>${analysis.result ? localAnalysisResultMarkup(analysis.result) : `<div class="local-empty-result">${icons.file}<strong>${hasDocuments ? "Your documents are ready" : "Add evidence to begin"}</strong><p>${hasDocuments ? "Ask a question below. Every local answer will show the passages it used." : "Upload documents on the left, then ask BursaIQ to summarise, compare or extract."}</p></div>`}<form data-local-analysis-form><label class="sr-only" for="local-analysis-question">Question or instruction for the uploaded documents</label><textarea id="local-analysis-question" name="question" rows="3" maxlength="1200" placeholder="Ask a question or describe the analysis you need…" ${hasDocuments ? "" : "disabled"}>${escapeHtml(analysis.question)}</textarea><div><label class="local-copilot-choice"><input type="checkbox" name="useCopilot" ${analysis.useCopilot ? "checked" : ""} ${state.agent.available ? "" : "disabled"}><span><strong>Copilot-assisted synthesis</strong><small>${state.agent.available ? "Send only the selected evidence extracts to the published agent." : "Available when the Copilot Studio agent is connected."}</small></span></label><button class="button primary" type="submit" ${!hasDocuments || analysis.pending ? "disabled" : ""}>${analysis.pending ? icons.refresh : icons.arrow}<span>${analysis.pending ? "Analysing…" : "Analyse"}</span></button></div></form></section></div><div class="local-privacy-note">${icons.lock}<p><strong>Local by default.</strong> Use only sanitized files approved for this prototype. Uploads stay in server memory and are cleared when the Python process stops. Evidence leaves the local service only if you explicitly enable Copilot-assisted synthesis for a question.</p></div>`;
  }

  async function uploadLocalFiles(fileList) {
    const files = [...(fileList || [])];
    if (!files.length || state.localAnalysis.uploading) return;
    if (!state.backend) {
      toast("Local server required", "Run python server.py before uploading documents for Local Analysis.");
      return;
    }
    state.localAnalysis = { ...state.localAnalysis, uploading: true, result: null };
    renderPage("local-analysis");
    try {
      const body = new FormData();
      files.forEach((file) => body.append("files", file));
      if (state.localAnalysis.sessionId) body.append("sessionId", state.localAnalysis.sessionId);
      const response = await fetch("/api/local-analysis/upload", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The documents could not be read.");
      state.localAnalysis = { ...state.localAnalysis, uploading: false, sessionId: payload.sessionId, documents: payload.documents, result: null };
      toast("Documents ready", `${files.length} file${files.length === 1 ? " was" : "s were"} added to the in-memory analysis workspace.`);
    } catch (error) {
      state.localAnalysis = { ...state.localAnalysis, uploading: false };
      toast("Upload not completed", error.message || "Check the file type and size, then try again.");
    }
    renderPage("local-analysis");
  }

  async function askLocalDocuments(form) {
    if (state.localAnalysis.pending || !state.localAnalysis.sessionId) return;
    const data = new FormData(form);
    const question = String(data.get("question") || "").trim();
    if (!question) return;
    const useCopilot = data.get("useCopilot") === "on";
    state.localAnalysis = { ...state.localAnalysis, question, useCopilot, pending: true };
    renderPage("local-analysis");
    try {
      const response = await fetch("/api/local-analysis/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: state.localAnalysis.sessionId, question, useCopilot, role: state.role, conversationId: state.localAnalysis.conversationId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analysis could not be completed.");
      state.localAnalysis = { ...state.localAnalysis, pending: false, result: payload, conversationId: payload.conversationId || state.localAnalysis.conversationId };
      if (payload.agentFallback) toast("Local analysis used", "Copilot Studio was unavailable, so the answer stayed local and extractive.");
    } catch (error) {
      state.localAnalysis = { ...state.localAnalysis, pending: false };
      toast("Analysis unavailable", error.message || "Upload the documents again and retry.");
    }
    renderPage("local-analysis");
  }

  async function clearLocalAnalysis() {
    const sessionId = state.localAnalysis.sessionId;
    state.localAnalysis = { sessionId: "", documents: [], pending: false, uploading: false, question: "", result: null, useCopilot: false, conversationId: "" };
    renderPage("local-analysis");
    if (state.backend && sessionId) {
      try { await fetch(`/api/local-analysis/${encodeURIComponent(sessionId)}`, { method: "DELETE" }); } catch (_error) { /* memory expires with the server */ }
    }
    toast("Local workspace cleared", "Uploaded evidence and the current analysis were removed from server memory.");
  }

  function decisionMemoryPage() {
    const decisions = roleDecisionMemory();
    return `<div class="page-toolbar"><span class="status-pill approved">${decisions.length} records</span></div>
      <div class="memory-ledger">${decisions.map((item) => `<article class="memory-row"><div class="memory-date"><time>${escapeHtml(item.created)}</time><span></span></div><div class="memory-copy"><div><span>${escapeHtml(item.id)}</span><span class="status-pill ${item.status === "Recorded" ? "approved" : "denied"}">${escapeHtml(item.status)}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.rationale)}</p><dl><div><dt>Owner</dt><dd>${escapeHtml(item.owner)}</dd></div><div><dt>Workspace</dt><dd>${escapeHtml(item.workspace)}</dd></div><div><dt>Originating question</dt><dd>${escapeHtml(item.question)}</dd></div></dl><button type="button" data-brief-question="${escapeHtml(item.question)}">Reopen evidence trail ${icons.arrow}</button></div></article>`).join("")}</div><div class="warning-block">Local prototype record. Production Decision Memory would require an approved retention policy, access control and enterprise system of record.</div>`;
  }

  function renderPage(page) {
    state.requestId += 1;
    state.pending = false;
    state.workspace = page;
    state.currentAnswer = null;
    const labels = { "today-brief": "Today’s Brief", research: "Research", "local-analysis": "Local Analysis", watchlist: "Watchlist & Alerts", "decision-memory": "Decision Memory", verification: "Verification Centre", "data-sources": "Source Health", settings: "Settings" };
    const descriptions = {
      "today-brief": "The signals, decisions and source issues that need attention now.",
      research: "A complete, evidence-led investigation from question to source trail.",
      "local-analysis": "Analyse documents from this device without adding them to the governed source library.",
      watchlist: "Monitored signals and transparent alert rules.",
      "decision-memory": "The evidence and rationale behind prior decisions.",
      verification: isReviewer() ? "Review assigned cases and track the status of requests you submitted." : "Track the latest status of requests you submitted.",
      "data-sources": "Freshness, quality, usage and ownership of governed demo sources.",
      settings: "Choose how BursaIQ responds and behaves on this device."
    };
    setHeading({ title: labels[page], description: descriptions[page] });
    dom.asof_chip.style.display = "none";
    selectNavigation(page);
    dom.workspace_grid.className = "workspace-grid";
    const pageRenderers = { "today-brief": todayBriefPage, research: researchPage, "local-analysis": localAnalysisPage, watchlist: watchlistPage, "decision-memory": decisionMemoryPage, verification: verificationPage, "data-sources": dataSourcesPage, settings: settingsPage };
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
        <section class="settings-section"><h3>Appearance</h3><p>Choose the liquid-glass environment that best suits your workspace.</p>
          <label class="setting-row setting-select"><span><strong>Colour mode</strong><small>Light uses pearl glass; Dark keeps the current violet midnight palette.</small></span><select data-setting="theme" aria-label="Colour mode"><option value="dark" ${preferences.theme === "dark" ? "selected" : ""}>Dark</option><option value="light" ${preferences.theme === "light" ? "selected" : ""}>Light</option></select></label>
          ${settingSwitch("showPet", "Show IQ Guide pet", "Keep the animated workspace guide at the bottom-left. Type /Close in its chat to hide it.", preferences.showPet !== false)}
        </section>
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
    const assignedPending = reviewerCases().filter((item) => item.status === "Pending review");
    const submitted = requestedCases();
    const statusClass = (item) => item.status === "Approved" ? "approved" : item.status === "Changes requested" ? "denied" : "";
    const requestRows = submitted.length
      ? `<div class="verification-case-list">${submitted.map((item) => `<article class="verification-case-row"><div class="verification-case-title"><span>${escapeHtml(item.id)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.created || item.createdAt || "Demo queue")}</small></div><span class="status-pill ${statusClass(item)}">${escapeHtml(item.status)}</span><dl><div><dt>Workspace</dt><dd>${escapeHtml(item.workspace)}</dd></div><div><dt>Assigned reviewer</dt><dd>${escapeHtml(item.reviewer)}</dd></div></dl><button class="button ghost" type="button" data-verification-details="${escapeHtml(item.id)}">View request</button></article>`).join("")}</div>`
      : `<div class="verification-empty">${icons.shield}<strong>No requests submitted</strong><p>Submit an answer through Verify to track its review status here.</p></div>`;
    const reviewPanel = isReviewer()
      ? `<section class="verification-panel is-reviewer-panel"><header class="verification-panel-head"><div><span class="verification-scope">${icons.lock} Reviewer only</span><h2>Pending my review</h2><p>Outstanding cases assigned to ${escapeHtml(demo.identities[state.role].name)}.</p></div><span class="status-pill">${assignedPending.length} pending</span></header>${assignedPending.length ? `<div class="verification-case-list">${assignedPending.map((item) => `<article class="verification-case-row"><div class="verification-case-title"><span>${escapeHtml(item.id)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.created || item.createdAt || "Demo queue")}</small></div><span class="status-pill">${escapeHtml(item.status)}</span><dl><div><dt>Requested by</dt><dd>${escapeHtml(item.requestedBy)}</dd></div><div><dt>Workspace</dt><dd>${escapeHtml(item.workspace)}</dd></div></dl><button class="button secondary" type="button" data-verification-details="${escapeHtml(item.id)}">Review details</button></article>`).join("")}</div>` : `<div class="verification-empty">${icons.check}<strong>You’re all caught up</strong><p>No outstanding cases are assigned to this reviewer account.</p></div>`}</section>`
      : "";
    return `<div class="verification-workspace${isReviewer() ? " has-review-queue" : " request-only"}">${reviewPanel}<section class="verification-panel"><header class="verification-panel-head"><div><h2>My submitted requests</h2><p>Requests created by ${escapeHtml(demo.identities[state.role].name)}, with their latest review status.</p></div><span class="status-pill approved">${submitted.length} ${submitted.length === 1 ? "request" : "requests"}</span></header>${requestRows}</section></div><div class="warning-block">Stage 02 local workflow. Each identity can see its own submitted requests; only assigned reviewers can open the pending review queue or record a decision.</div>`;
  }

  function dataSourcesPage() {
    const permittedWorkspaces = new Set(demo.identities[state.role].access);
    const sources = demo.documents.filter((source) => permittedWorkspaces.has(source.workspace));
    const healthy = sources.filter((source) => source.health === "Healthy").length;
    const averageQuality = Math.round(sources.reduce((total, source) => total + Number(source.qualityPct || 0), 0) / Math.max(sources.length, 1));
    const reviewScope = isReviewer() ? demo.identities[state.role].reviewerFor.join(", ") : "Permitted workspaces";
    return `<div class="page-toolbar"><span class="status-pill approved">${healthy} healthy</span></div>
      <div class="source-summary"><div><span>Visible sources</span><strong>${sources.length}</strong></div><div><span>Average quality</span><strong>${averageQuality}%</strong></div><div><span>Needs attention</span><strong>${sources.length - healthy}</strong></div><div><span>Review scope</span><strong>${escapeHtml(reviewScope)}</strong></div></div>
      <div class="data-table-wrap source-table-wrap"><table class="data-table source-table"><thead><tr><th>Data source</th><th>Freshness</th><th>Quality</th><th>Usage</th><th>Updated by</th><th>Health</th></tr></thead><tbody>${sources.map((source) => `<tr><td><span class="source-cell"><span class="source-file-mark ${source.format.toLowerCase()}">${escapeHtml(source.format)}</span><span><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(workspaceConfig[source.workspace]?.title || source.workspace)} · ${escapeHtml(source.filename)}</small></span></span></td><td><time>${escapeHtml(source.updated)}</time><small>${escapeHtml(source.freshness || "Current")}</small></td><td><div class="quality-cell"><span><i style="width:${Number(source.qualityPct || 0)}%"></i></span><strong>${Number(source.qualityPct || 0)}%</strong></div></td><td>${escapeHtml(source.usage || "No recent use")}</td><td><strong>${escapeHtml(source.updatedBy || source.owner)}</strong><small>${escapeHtml(source.owner)}</small></td><td><span class="status-pill ${source.health === "Healthy" ? "approved" : "denied"}">${escapeHtml(source.health || source.status)}</span><small>Next · ${escapeHtml(source.nextReview || "Not scheduled")}</small></td></tr>`).join("")}</tbody></table></div>
      <div class="warning-block">Synthetic demonstration sources only. Health combines illustrative freshness and quality controls; “Updated by” identifies the accountable demo owner in the local manifest.</div>`;
  }

  function updateNavigationVisibility() {
    const regAllowed = hasAccess("reg");
    dom.ask_reg_nav.hidden = !regAllowed;
    dom.ask_reg_nav.setAttribute("aria-hidden", String(!regAllowed));
    dom.workflow_nav_label.hidden = false;
    dom.verification_nav.hidden = false;
    dom.verification_nav.setAttribute("aria-hidden", "false");
    dom.data_sources_nav.hidden = false;
    dom.data_sources_nav.setAttribute("aria-hidden", "false");
    dom.decision_memory_nav.hidden = false;
    dom.decision_memory_nav.setAttribute("aria-hidden", "false");
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
      if (payload.verification) state.verification.unshift(payload.verification);
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
    state.verification.unshift(item);
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
    const item = accessibleVerificationCases().find((entry) => entry.id === id);
    if (!item || !dom.verification_dialog) return;
    const details = item.details || {};
    const context = details.context && typeof details.context === "object" ? Object.entries(details.context) : [];
    const canReview = item.status === "Pending review" && reviewerCases().some((entry) => entry.id === item.id);
    const checklistLabel = item.status === "Pending review" && !canReview ? "included" : "inspected";
    dom.verification_dialog_title.textContent = canReview ? "Review verification case" : "Verification request";
    const outcome = canReview
      ? `<div class="dialog-actions"><button class="button danger" type="button" data-verify="${escapeHtml(item.id)}" data-status="Changes requested">Request changes</button><button class="button primary" type="button" data-verify="${escapeHtml(item.id)}" data-status="Approved">Approve case</button></div>`
      : item.status === "Pending review"
        ? `<div class="warning-block">Awaiting review by ${escapeHtml(item.reviewer)}. Only the assigned reviewer can approve this request or ask for changes.</div>`
        : `<div class="warning-block">Decision recorded in the local audit store.</div>`;
    dom.verification_detail_content.innerHTML = `<div class="review-case-head"><div><span>${escapeHtml(item.id)}</span><h3>${escapeHtml(item.title)}</h3></div><span class="status-pill ${item.status === "Approved" ? "approved" : item.status === "Changes requested" ? "denied" : ""}">${escapeHtml(item.status)}</span></div><dl class="review-meta"><div><dt>Workspace</dt><dd>${escapeHtml(item.workspace)}</dd></div><div><dt>Requested by</dt><dd>${escapeHtml(item.requestedBy)}</dd></div><div><dt>Assigned reviewer</dt><dd>${escapeHtml(item.reviewer)}</dd></div><div><dt>Submitted</dt><dd>${escapeHtml(item.created || item.createdAt || "Demo queue")}</dd></div></dl><section class="review-section"><h4>Question and answer</h4><p class="review-question">${escapeHtml(details.question || "How did the market perform in July?")}</p><h5>${escapeHtml(details.answerTitle || item.title)}</h5><p>${escapeHtml(details.answerText || "This seeded demonstration case packages the answer narrative, deterministic calculations and cited source locations for reviewer inspection.")}</p></section><section class="review-section"><h4>Calculation</h4><div class="formula-box">${escapeHtml(details.formula || item.scope)}</div>${context.length ? `<ul class="context-list">${context.map(([key, value]) => `<li><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></li>`).join("")}</ul>` : ""}</section><section class="review-section"><h4>Evidence package</h4>${verificationSourceList(details.sources)}</section><div class="review-checklist"><span>${icons.check} Narrative ${checklistLabel}</span><span>${icons.check} Calculation ${checklistLabel}</span><span>${icons.check} Sources ${checklistLabel}</span></div>${outcome}`;
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
    if (dom.verification_count) dom.verification_count.textContent = accessibleVerificationCases().filter((item) => item.status === "Pending review").length;
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
      if (command === "research") {
        const question = state.currentQuestion || "Investigate this insight and test the evidence behind it";
        state.research = { ...state.research, query: question, result: null };
        switchWorkspace("research");
        window.requestAnimationFrame(() => document.getElementById("research-query")?.focus());
        toast("Research thread prepared", "The originating question is ready for a deeper evidence-led investigation.");
        return;
      }
      if (command !== "verify") renderEvidence();
      return;
    }
    const researchPrompt = event.target.closest("[data-research-prompt]");
    if (researchPrompt) {
      state.research = { ...state.research, query: researchPrompt.dataset.researchPrompt, result: null };
      renderPage("research");
      window.requestAnimationFrame(() => document.getElementById("research-query")?.focus());
      return;
    }
    if (event.target.closest("[data-local-browse]")) {
      document.getElementById("local-file-input")?.click();
      return;
    }
    if (event.target.closest("[data-local-clear]")) {
      clearLocalAnalysis();
      return;
    }
    const localQuestion = event.target.closest("[data-local-question]");
    if (localQuestion) {
      const input = document.getElementById("local-analysis-question");
      if (input) {
        input.value = localQuestion.dataset.localQuestion;
        input.focus();
      }
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
    dom.new_thread_button.addEventListener("click", () => switchWorkspace("home"));
    dom.theme_toggle.addEventListener("click", toggleTheme);
    dom.guide_pet_trigger.addEventListener("click", toggleGuide);
    dom.guide_close.addEventListener("click", () => closeGuide());
    dom.guide_form.addEventListener("submit", submitGuideQuestion);
    dom.guide_panel.addEventListener("click", (event) => {
      const suggestion = event.target.closest("[data-guide-question]");
      if (suggestion) {
        askGuide(suggestion.dataset.guideQuestion);
        dom.guide_input?.focus();
        return;
      }
      const destination = event.target.closest("[data-guide-go]");
      if (destination) navigateFromGuide(destination.dataset.guideGo);
    });
    dom.menu_button.addEventListener("click", toggleNavigation);
    dom.mobile_scrim.addEventListener("click", () => closeNavigation({ restoreFocus: true }));
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (state.guideOpen) {
        closeGuide();
        return;
      }
      if (document.body.classList.contains("nav-open")) closeNavigation({ restoreFocus: true });
    });
    window.addEventListener("resize", syncNavigationAccessibility);
    dom.workspace_grid.addEventListener("click", handleWorkspaceClick);
    dom.workspace_grid.addEventListener("submit", (event) => {
      if (event.target.id === "chat-form") {
        event.preventDefault();
        ask(document.getElementById("question-input").value);
      }
      if (event.target.matches("[data-research-form]")) {
        event.preventDefault();
        runResearch(event.target);
      }
      if (event.target.matches("[data-local-analysis-form]")) {
        event.preventDefault();
        askLocalDocuments(event.target);
      }
    });
    dom.workspace_grid.addEventListener("input", (event) => {
      if (event.target.id === "question-input") resizeInput();
    });
    dom.workspace_grid.addEventListener("change", (event) => {
      if (event.target.matches("[data-local-files]")) {
        uploadLocalFiles(event.target.files);
        return;
      }
      updateSetting(event);
    });
    dom.workspace_grid.addEventListener("dragover", (event) => {
      const dropzone = event.target.closest(".local-dropzone");
      if (!dropzone) return;
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    });
    dom.workspace_grid.addEventListener("dragleave", (event) => event.target.closest(".local-dropzone")?.classList.remove("is-dragging"));
    dom.workspace_grid.addEventListener("drop", (event) => {
      const dropzone = event.target.closest(".local-dropzone");
      if (!dropzone) return;
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
      uploadLocalFiles(event.dataTransfer?.files);
    });
    dom.workspace_grid.addEventListener("keydown", (event) => {
      if (event.target.id === "question-input" && event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.target.form.requestSubmit();
        return;
      }
      if ((event.target.id === "research-query" || event.target.id === "local-analysis-question") && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
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
