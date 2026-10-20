(function () {
  "use strict";

  var root = document.getElementById("page-root");
  var appShell = document.getElementById("app-shell");
  var createButton = document.getElementById("create-button");
  var createMenu = document.getElementById("create-menu");
  var commandOverlay = document.getElementById("command-overlay");
  var commandInput = document.getElementById("command-input");
  var commandResults = document.getElementById("command-results");
  var experienceOverlay = document.getElementById("experience-overlay");
  var experienceTitle = document.getElementById("experience-title");
  var experienceSubtitle = document.getElementById("experience-subtitle");
  var experienceBody = document.getElementById("experience-body");
  var experienceFoot = document.getElementById("experience-foot");
  var lastFocusedControl = null;
  function storedRoutingProvider() {
    try {
      var saved = window.localStorage.getItem("bursaiq-routing-provider");
      return saved === "copilot" ? "copilot" : "ollama";
    } catch (_error) {
      return "ollama";
    }
  }
  var requestedPage = new URLSearchParams(window.location.search).get("page");
  if (["assistant", "ask-bursa", "workforce", "exchange", "automation", "rooms", "workspace", "brief", "verification", "connectors", "action", "settings"].indexOf(requestedPage) === -1) requestedPage = "home";
  var state = {
    page: requestedPage,
    exchangeCategory: "featured",
    homeAssetCategory: "Featured",
    routingProvider: storedRoutingProvider(),
    modelProviders: [],
    assistantMessages: [],
    assistantCanvasTab: "plot",
    askBursaMessages: [],
    savedDecisions: [],
    emailAutomations: [],
    selectedNode: "trigger",
    selectedRoom: "product",
    missionProgress: 67,
    automationTab: "workflows",
    roomScope: "mine",
    roomTab: "overview",
    briefFilter: "for-you",
    workspaceView: "projects",
    verificationFilter: "pending",
    notificationCount: 0,
    reducedUpdates: false,
    liveMissions: [],
    missionLoading: true,
    missionError: "",
    selectedMissionId: null,
    selectedVerificationMissionId: null,
    missionPoll: null
  };

  var pages = {
    home: ["Home", "Your command centre", "i-home", "blue"],
    assistant: ["AI Assistant", "Ask, understand, decide", "i-spark", "violet"],
    "ask-bursa": ["Ask Bursa", "Internal knowledge Q&A", "i-book", "blue"],
    workforce: ["My Workforce", "Agents, tasks and missions", "i-agents", "blue"],
    exchange: ["Intelligence Exchange", "Discover approved capabilities", "i-exchange", "teal"],
    automation: ["Automation Studio", "Build intelligent workflows", "i-automation", "violet"],
    rooms: ["Collaborative Rooms", "Work with people and AI", "i-room", "blue"],
    workspace: ["Projects & Workspace", "Your files, context and decision memory", "i-folder", "amber"],
    brief: ["Today's Brief", "Priorities, approvals and relevant changes", "i-brief", "blue"],
    verification: ["Verification Centre", "Evidence, approvals and accountable actions", "i-shield", "teal"],
    connectors: ["Connectors", "Approved systems and data sources", "i-plug", "violet"],
    action: ["Action", "Decision memory and email follow-ups", "i-check", "teal"],
    settings: ["Settings", "Preferences, access and governance", "i-settings", "blue"]
  };

  var agents = [
    { name: "Research Agent", initials: "RA", tone: "violet", job: "Internal research and knowledge retrieval", state: "Active" },
    { name: "Data Analyst Agent", initials: "DA", tone: "blue", job: "Data analysis, validation and insights", state: "Active" },
    { name: "Workflow Agent", initials: "WA", tone: "teal", job: "Process automation and orchestration", state: "Working" },
    { name: "Report Agent", initials: "RP", tone: "amber", job: "Business reports and presentations", state: "Active" },
    { name: "Verifier Agent", initials: "VA", tone: "red", job: "Fact checking, evidence and compliance", state: "Active" },
    { name: "Knowledge Agent", initials: "KA", tone: "blue", job: "Organisational knowledge and learning", state: "Active" }
  ];

  var missions = [];

  var missionAgents = [
    { name: "Mission Manager", initials: "MM", tone: "violet", job: "Validates scope, dependencies and review gates", state: "Ready" },
    { name: "Data Agent", initials: "DA", tone: "blue", job: "Validates CSV schema, quality and eligible coverage", state: "Ready" },
    { name: "Analysis Agent", initials: "AA", tone: "teal", job: "Calculates ADV, trends and contributions", state: "Ready" },
    { name: "Insight Agent", initials: "IA", tone: "amber", job: "Writes bounded observations from verified metrics", state: "Ready" },
    { name: "Report Agent", initials: "RA", tone: "blue", job: "Builds and validates the executive PDF", state: "Ready" }
  ];

  var assets = [];

  var rooms = [];

  function svg(id) {
    return '<svg aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }

  function miniIcon(id, tone) {
    return '<span class="mini-icon ' + (tone || "blue") + '">' + svg(id) + "</span>";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function apiJson(url, options) {
    var request = options || {};
    request.headers = Object.assign({ "Content-Type": "application/json" }, request.headers || {});
    return fetch(url, request).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (payload) {
        if (!response.ok) throw new Error(payload.error || "The mission service could not complete this request.");
        return payload;
      });
    });
  }

  function loadModelProviders() {
    return apiJson("/api/model-providers").then(function (payload) {
      state.modelProviders = payload.providers || [];
      if (state.page === "home" || state.page === "settings") render();
    }).catch(function () {
      state.modelProviders = [];
    });
  }

  function routingProviderControl() {
    var selected = state.modelProviders.filter(function (item) { return item.id === state.routingProvider; })[0];
    var availability = selected ? selected.available === true ? "Ready" : selected.available === false ? "Unavailable" : "Not checked" : "Checking";
    return '<label class="router-provider"><span>Route with</span><select id="routing-provider" aria-label="Language model for semantic routing"><option value="ollama"' + (state.routingProvider === "ollama" ? " selected" : "") + '>Local model · Ollama</option><option value="copilot"' + (state.routingProvider === "copilot" ? " selected" : "") + '>Microsoft Copilot Studio</option></select><small class="' + (availability === "Unavailable" ? "is-error" : "") + '">' + escapeHtml(availability) + '</small></label>';
  }

  function loadMissions(quiet) {
    if (!quiet) {
      state.missionLoading = true;
      state.missionError = "";
      if (state.page === "workforce" || state.page === "verification") render();
    }
    return apiJson("/api/missions").then(function (payload) {
      state.liveMissions = payload.missions || [];
      state.missionLoading = false;
      state.missionError = "";
      if (state.page === "workforce" || state.page === "verification") render();
      return state.liveMissions;
    }).catch(function (error) {
      state.missionLoading = false;
      state.missionError = error.message;
      if (state.page === "workforce" || state.page === "verification") render();
      return [];
    });
  }

  function missionById(id) {
    return state.liveMissions.filter(function (mission) { return mission.id === id; })[0];
  }

  function missionDisplayStatus(value) {
    return String(value || "PLANNED").replace(/_/g, " ").toLowerCase().replace(/^./, function (letter) { return letter.toUpperCase(); });
  }

  function missionStatus(value) {
    var label = missionDisplayStatus(value);
    var tone = value === "APPROVED" || value === "DRAFT READY" ? "green" : value === "FAILED" || value === "REVISION REQUESTED" ? "red" : value === "AWAITING REVIEW" ? "amber" : "blue";
    return '<span class="status ' + tone + '">' + escapeHtml(label) + '</span>';
  }

  function formatMoneyBn(value) {
    return "RM" + (Number(value || 0) / 1000000000).toFixed(2) + "bn";
  }

  function status(label) {
    var color = label === "On track" || label === "Active" || label === "Completed" ? "green" :
      label === "At risk" ? "red" :
      label === "Waiting review" || label === "Pending" ? "amber" : "blue";
    return '<span class="status ' + color + '">' + escapeHtml(label) + "</span>";
  }

  function avatarStack(items) {
    var tones = ["", "violet", "teal", "amber"];
    return '<span class="avatar-stack">' + items.map(function (item, index) {
      return '<span class="' + tones[index % tones.length] + '">' + item + "</span>";
    }).join("") + "</span>";
  }

  function panelHead(title, icon, action) {
    return '<div class="panel-head"><h2>' + (icon ? svg(icon) : "") + escapeHtml(title) + '</h2>' +
      (action ? '<button type="button" data-demo-action="' + escapeHtml(action) + '">View all</button>' : "") + "</div>";
  }

  function pageHead(title, description, actionLabel, actionType) {
    return '<header class="page-head"><div><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + '</p></div>' +
      (actionLabel ? '<div class="page-head-actions"><button class="primary-button" type="button" data-create="' + actionType + '">' + svg("i-plus") + escapeHtml(actionLabel) + "</button></div>" : "") + "</header>";
  }

  function homePage() {
    var quick = [
      ["i-research", "blue", "Deep Research", "Investigate a complex question", "assistant"],
      ["i-document", "teal", "Create & Analyse", "Work with files and data", "assistant"],
      ["i-agents", "violet", "Delegate to AI", "Assign multi-step work", "workforce"],
      ["i-automation", "amber", "Automate a Task", "Build an intelligent flow", "automation"],
      ["i-book", "red", "Find Intelligence", "Search verified solutions", "exchange"],
      ["i-cube", "violet", "Build an AI Skill", "Teach a reusable capability", "exchange"]
    ];
    var assetSlice = assets.filter(function (asset) {
      return state.homeAssetCategory === "Featured" || asset.type === state.homeAssetCategory.slice(0, -1) || asset.type === state.homeAssetCategory;
    }).slice(0, 4);
    if (!assetSlice.length) assetSlice = assets.slice(0, 4);
    return [
      '<section class="page page-enter">',
      '<div class="home-grid"><div class="home-main">',
      '<section class="home-hero">',
      '<div class="hero-content"><h1 class="hero-title">Bursa<span>IQ</span></h1><p class="hero-subtitle">The Intelligence Exchange</p>',
      '<p class="hero-copy">Your AI workforce. Your knowledge network. One trusted place to get work moving.</p>',
      '<div class="trust-row"><span>' + svg("i-shield") + 'Trusted information</span><span>' + svg("i-check") + 'Secure and governed</span><span>' + svg("i-agents") + 'Built for every employee</span></div></div>',
      '<span class="hero-live"><i></i> 6 governed services ready</span>',
      '<svg class="hero-skyline" viewBox="0 0 540 230" aria-hidden="true"><path d="M20 225V142l62-56 62 56v83M56 225v-76h51v76M144 225V64l72-45 72 45v161M177 225V78h77v147M288 225v-98l47-39 48 39v98M383 225V83l66-60 65 60v142M420 225V99h56v126"/><path d="M20 169h124M144 92h144M288 150h95M383 111h131M191 51v174M216 36v189M241 51v174M405 83h88M405 124h88M405 164h88"/></svg>',
      "</section>",
      '<section class="panel command-centre"><h2>What would you like to accomplish today?</h2><div class="command-box">',
      '<textarea id="home-command" aria-label="Describe what you want BursaIQ to do" placeholder="Ask a question, delegate a task, find knowledge, or describe what you want to build…"></textarea>',
      '<div class="command-tools"><div class="command-tools-left">' + routingProviderControl() + '<button class="tool-button" type="button" data-demo-action="attach">' + svg("i-paperclip") + 'Attach</button><button class="tool-button" type="button" data-assistant-prompt="Research our options for a new cross-department initiative">' + svg("i-research") + 'Deep Research</button><button class="tool-button" type="button" data-page-jump="automation">' + svg("i-flow") + 'Build workflow</button><button class="tool-button" type="button" data-page-jump="exchange">' + svg("i-book") + 'Search Exchange</button></div><button class="send-button" id="home-send" type="button" aria-label="Start with BursaIQ">' + svg("i-send") + "</button></div>",
      "</div></section>",
      '<div class="quick-actions">' + quick.map(function (item) {
        return '<button class="quick-action" type="button" data-page-jump="' + item[4] + '">' + miniIcon(item[0], item[1]) + '<span><strong>' + item[2] + '</strong><small>' + item[3] + "</small></span></button>";
      }).join("") + "</div>",
      '<div class="brief-continuation">',
      '<section class="panel">' + panelHead("My Work Brief", "i-spark", "brief") + '<div class="clean-empty">' + miniIcon("i-brief", "blue") + '<strong>Your brief is clear</strong><p>Priorities and approvals will appear here as you start working.</p></div></section>',
      '<section class="panel">' + panelHead("Continue Your Work", "i-brief", "workforce") + '<div class="clean-empty">' + miniIcon("i-flow", "teal") + '<strong>No work in progress</strong><p>Start a mission or ask BursaIQ a question to begin.</p></div></section></div>',
      '<section class="panel exchange-strip">' + panelHead("Explore the Intelligence Exchange", "i-exchange", "exchange") +
      '<div class="strip-tabs">' + ["Featured", "AI Agent", "Workflow", "Template", "Knowledge"].map(function (label) {
        var display = label === "AI Agent" ? "Agents" : label === "Workflow" ? "Workflows" : label === "Template" ? "Templates" : label;
        return '<button class="' + (state.homeAssetCategory === label || (label === "Featured" && state.homeAssetCategory === "Featured") ? "is-active" : "") + '" type="button" data-home-asset-type="' + label + '">' + display + '</button>';
      }).join("") + '</div>',
      '<div class="asset-row">' + (assetSlice.length ? assetSlice.map(homeAssetCard).join("") : '<div class="clean-empty"><strong>No saved intelligence yet</strong><p>Verified assets will appear after they are published to the Exchange.</p></div>') + "</div></section>",
      "</div>",
      '<aside class="home-rail">',
      '<section class="panel rail-panel">' + panelHead("Active AI Workforce", "i-agents", "workforce") + '<div class="clean-empty compact"><strong>No agents working yet</strong><p>Agents will appear here when a mission starts.</p></div></section>',
      '<section class="panel rail-panel">' + panelHead("Pending Approvals", "i-shield", "verification") + '<div class="clean-empty compact"><strong>No pending approvals</strong><p>Items sent for review will appear here.</p></div></section>',
      '<section class="panel rail-panel">' + panelHead("Recommended for You", "i-spark", "exchange") + '<div class="clean-empty compact"><strong>No recommendations yet</strong><p>Recommendations will improve as you use BursaIQ.</p></div></section>',
      "</aside></div></section>"
    ].join("");
  }

  function workItem(icon, tone, title, meta, tag, tagTone) {
    return '<button class="work-item" type="button" data-demo-action="detail" data-action-context="' + escapeHtml(title) + '">' + miniIcon(icon, tone) + '<span><strong>' + title + '</strong><small>' + meta + '</small></span><span class="status ' + tagTone + '">' + tag + '</span>' + svg("i-chevron") + "</button>";
  }

  function progressItem(icon, tone, title, meta, progress, label) {
    return '<article class="progress-item">' + miniIcon(icon, tone) + '<span><strong>' + title + '</strong><small>' + meta + '</small>' + lifecycle(progress) + '<span class="progress-track"><i style="width:' + progress + '%"></i></span></span><span><span class="status ' + (label === "Running" ? "blue" : "amber") + '">' + label + '</span><small class="progress-number">' + progress + "%</small></span></article>";
  }

  function lifecycle(progress) {
    var stages = ["Research", "Synthesis", "Verification", "Exchange"];
    var active = Math.min(3, Math.max(0, Math.floor(Number(progress) / 25)));
    return '<span class="mission-lifecycle" aria-label="Mission lifecycle: Research, Synthesis, Verification, Exchange">' + stages.map(function (stage, index) {
      var className = index < active ? "is-done" : index === active ? "is-active" : "";
      return '<span class="' + className + '">' + stage + '</span>';
    }).join("") + '</span>';
  }

  function homeAssetCard(asset) {
    return '<article class="asset-card"><button class="asset-open" type="button" data-asset-open="' + escapeHtml(asset.title) + '"><div class="asset-cover">' + svg(asset.icon) + '</div><div class="asset-body"><strong>' + asset.title + '</strong><div class="asset-meta"><span>' + asset.uses + '</span><span>Open ' + svg("i-arrow") + '</span></div></div></button></article>';
  }

  function railItem(icon, tone, title, meta, action) {
    return '<li>' + miniIcon(icon, tone) + '<span><strong>' + title + '</strong><small>' + meta + '</small></span><button type="button" data-demo-action="' + action.toLowerCase() + '" data-action-context="' + escapeHtml(title) + '">' + action + "</button></li>";
  }

  function assistantPage() {
    var messages = state.assistantMessages.map(messageHtml).join("");
    var currentAnswer = assistantCurrentAnswer();
    return [
      '<section class="assistant-page">',
      '<header class="assistant-head"><div><h1>Ask BursaIQ</h1><p>Question-and-answer intelligence grounded in approved Bursa sources.</p></div><span class="context-state"><i class="dot"></i> Governed workspace</span></header>',
      '<div class="assistant-layout"><div class="assistant-main">',
      '<div class="assistant-thread" id="assistant-thread">',
      state.assistantMessages.length ? messages : assistantWelcome(),
      "</div>",
      '<button class="mobile-canvas-entry" type="button" data-assistant-canvas-entry>' + svg("i-spark") + '<span><strong>Open Decision Canvas</strong><small>Plot · Analysis · Source · Action</small></span>' + svg("i-chevron") + '</button>',
      '<div class="assistant-composer-wrap"><form class="assistant-composer" id="assistant-form"><label class="sr-only" for="assistant-input">Ask BursaIQ</label><textarea id="assistant-input" placeholder="Ask a question about Bursa, markets, policy, or approved knowledge…" required></textarea><div class="assistant-composer-tools"><div><button class="tool-button" type="button" data-demo-action="attach">' + svg("i-paperclip") + 'Attach files</button><button class="tool-button" type="button" data-demo-action="sources">' + svg("i-shield") + 'Approved sources</button></div><button class="send-button" type="submit" aria-label="Send question">' + svg("i-send") + '</button></div></form><p class="assistant-note">Answers are synthetic for this demo and show their supporting evidence.</p></div>',
      '</div>',
      assistantCanvas(currentAnswer),
      '</div></section>'
    ].join("");
  }

  function assistantWelcome() {
    return '<div class="assistant-welcome"><span class="assistant-eyebrow">Governed question &amp; answer</span><h2>What would you like to <span>understand?</span></h2><p>Ask a question and BursaIQ will explain the answer, show the calculation, and keep every source in view.</p><div class="suggestion-grid">' +
      suggestion("How did July market activity compare with June?", "Compare trading activity and explain the movement behind the figures.") +
      suggestion("What is driving the change in average daily value?", "Separate the strongest signals from short-term market noise.") +
      suggestion("Explain Bursa Malaysia's market structure", "Get a concise overview of markets, participants, and governance.") +
      suggestion("Which governed sources support the latest market view?", "See the approved evidence, ownership, and coverage behind the answer.") +
      "</div></div>";
  }

  function askBursaPage() {
    var messages = state.askBursaMessages.map(bursaMessageHtml).join("");
    return [
      '<section class="ask-bursa-page">',
      '<header class="assistant-head"><div><h1>Ask Bursa</h1><p>Your internal question-and-answer channel across Bursa departments.</p></div><span class="context-state"><i class="dot"></i> Internal knowledge only</span></header>',
      '<div class="ask-bursa-main">',
      '<div class="assistant-thread ask-bursa-thread" id="ask-bursa-thread">',
      state.askBursaMessages.length ? messages : askBursaWelcome(),
      '</div>',
      '<div class="assistant-composer-wrap ask-bursa-composer-wrap"><form class="assistant-composer" id="ask-bursa-form"><label class="sr-only" for="ask-bursa-input">Ask an internal Bursa question</label><textarea id="ask-bursa-input" placeholder="Ask about HR, Group Technology, Regulations, or Market Operations…" required></textarea><div class="assistant-composer-tools"><div><button class="tool-button" type="button" data-demo-action="internal-sources">' + svg("i-book") + 'Internal sources</button><span class="bursa-answer-mode">Q&amp;A only</span></div><button class="send-button" type="submit" aria-label="Send internal question">' + svg("i-send") + '</button></div></form><p class="assistant-note">Synthetic internal guidance for demonstration · access boundaries remain in effect.</p></div>',
      '</div></section>'
    ].join("");
  }

  function askBursaWelcome() {
    return '<div class="assistant-welcome ask-bursa-welcome"><h2>Ask anything <span>inside Bursa.</span></h2><p>Get a direct answer from approved internal guidance—without launching a task or opening a Decision Canvas.</p><div class="suggestion-grid">' +
      bursaSuggestion("How do I submit a leave request?", "HR · Leave and employee services") +
      bursaSuggestion("How do I report a suspected phishing email?", "Group Technology · Cybersecurity") +
      bursaSuggestion("What changed in the latest internal regulatory notice?", "Regulations · Current guidance") +
      bursaSuggestion("Who should be contacted during a trading incident?", "Market Operations · Escalation") +
      '</div></div>';
  }

  function bursaSuggestion(title, description) {
    return '<button class="suggestion" type="button" data-bursa-prompt="' + escapeHtml(title) + '"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(description) + '</small></button>';
  }

  function bursaMessageHtml(message) {
    if (message.role === "user") return '<article class="chat-message user"><div class="chat-bubble"><p>' + escapeHtml(message.text) + '</p></div></article>';
    if (message.pending) return '<article class="chat-message"><div class="avatar blue">B</div><div class="chat-bubble"><div class="typing" aria-label="Ask Bursa is preparing an answer"><i></i><i></i><i></i></div></div></article>';
    var answer = message.answer || askBursaAnswer(message.question || "");
    return '<article class="chat-message"><div class="avatar blue">B</div><div class="chat-bubble bursa-answer"><span class="bursa-department">' + escapeHtml(answer.department) + '</span><h3>' + escapeHtml(answer.title) + '</h3><p>' + escapeHtml(answer.body) + '</p><div class="bursa-source-note">' + svg("i-book") + '<span><strong>' + escapeHtml(answer.source) + '</strong><small>Approved internal guidance · synthetic demo</small></span></div><div class="answer-actions"><button type="button" data-bursa-prompt="' + escapeHtml(answer.followup) + '">Ask a follow-up</button><button type="button" data-demo-action="internal-sources">View source scope</button></div></div></article>';
  }

  function askBursaAnswer(question) {
    var value = String(question || "").toLowerCase();
    if (/\b(hr|leave|working|benefit|onboard|employee)\b/.test(value)) {
      return { department: "Human Resources", title: "Start with the MyHR employee service", body: "For leave, flexible-working, benefits, or onboarding guidance, use the relevant MyHR request and follow the approval path shown for your role. Personal employee records are not exposed in Ask Bursa.", source: "HR Employee Services Handbook · 2026", followup: "What information should I prepare before submitting the HR request?" };
    }
    if (/\b(gt|technology|system|access|phishing|cyber|password|device)\b/.test(value)) {
      return { department: "Group Technology (GT)", title: "Use the GT Service Portal and select the matching service", body: "System access requests require the application name, business purpose, requested role, and manager approval. Suspected phishing or security incidents should be reported immediately through the security incident option.", source: "GT Service Catalogue · Access & Security", followup: "What details are required for a system access request?" };
    }
    if (/\b(regulation|regulatory|policy|rule|compliance|notice)\b/.test(value)) {
      return { department: "Regulations", title: "Use the current controlled guidance", body: "The latest internal regulatory notice is the authoritative reference for process changes. Confirm its effective date and owner before applying it, and route interpretation questions to the named policy owner.", source: "Regulatory Guidance Register · Current version", followup: "How can I confirm that a regulatory notice is still current?" };
    }
    if (/\b(market operations|trading|incident|settlement|clearing|session)\b/.test(value)) {
      return { department: "Market Operations", title: "Follow the operational incident escalation path", body: "Record the affected market or service, time detected, observed impact, and any containment already taken. Contact the Market Operations duty lead first; material incidents then follow the governed escalation matrix.", source: "Market Operations Incident Playbook · v4", followup: "What information is required in the first incident update?" };
    }
    return { department: "Internal Knowledge", title: "Here is the approved internal route", body: "Ask Bursa answers questions from permitted internal guidance. Add the department, process, or policy name to your question and I will route it to the most relevant source without starting an agent task.", source: "Bursa Internal Knowledge Directory", followup: "Which internal departments can Ask Bursa answer from?" };
  }

  function suggestion(title, description) {
    return '<button class="suggestion" type="button" data-assistant-prompt="' + escapeHtml(title) + '"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(description) + "</small></button>";
  }

  function messageHtml(message) {
    if (message.role === "user") {
      return '<article class="chat-message user"><div class="chat-bubble"><p>' + escapeHtml(message.text) + "</p></div></article>";
    }
    if (message.pending) {
      return '<article class="chat-message"><div class="avatar violet">IQ</div><div class="chat-bubble"><div class="typing" aria-label="BursaIQ is preparing an answer"><i></i><i></i><i></i></div></div></article>';
    }
    var answer = message.answer || assistantAnswer(message.question || "");
    return '<article class="chat-message"><div class="avatar violet">IQ</div><div class="chat-bubble"><span class="answer-label">Governed answer</span><h3>' + escapeHtml(answer.title) + '</h3><p>' + escapeHtml(answer.summary) + '</p><div class="answer-evidence">' + answer.stats.map(function (item) {
      return '<div class="evidence-stat"><strong>' + escapeHtml(item[0]) + '</strong><small>' + escapeHtml(item[1]) + '</small></div>';
    }).join("") + '</div><p class="answer-takeaway"><strong>What this means:</strong> ' + escapeHtml(answer.takeaway) + '</p><div class="answer-actions"><button type="button" data-assistant-canvas-tab="analysis">View analysis</button><button type="button" data-assistant-canvas-tab="source">Check sources</button><button type="button" data-demo-action="verify">Verify answer</button><button type="button" data-demo-action="briefing">Create briefing</button></div></div></article>';
  }

  function assistantCurrentAnswer() {
    for (var index = state.assistantMessages.length - 1; index >= 0; index -= 1) {
      if (state.assistantMessages[index].answer) return state.assistantMessages[index].answer;
    }
    return null;
  }

  function assistantCurrentQuestion() {
    for (var index = state.assistantMessages.length - 1; index >= 0; index -= 1) {
      if (state.assistantMessages[index].role === "user") return state.assistantMessages[index].text;
    }
    return "Governed BursaIQ answer";
  }

  function assistantAnswerKey(answer) {
    var value = assistantCurrentQuestion() + "|" + answer.title;
    var hash = 0;
    for (var index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    return "answer-" + Math.abs(hash).toString(36);
  }

  function assistantAnswer(question) {
    var value = String(question || "").toLowerCase();
    if (/\b(prepare|build|automate|create|turn .* into|delegate)\b/.test(value)) {
      return {
        title: "This space is for questions and evidence",
        summary: "I can explain the topic, compare information, or show the evidence behind a decision. To run multi-step work, use My Workforce or the Action workspace.",
        stats: [["Q&A", "Assistant mode"], ["3", "Approved source groups"], ["100%", "Evidence visible"]],
        takeaway: "Rephrase the request as a question and I will answer it here with analysis and sources.",
        analysis: "The AI Assistant is intentionally scoped to knowledge work: asking, explaining, comparing, and tracing evidence. Task execution remains in the governed workforce areas.",
        method: "Intent classified as task execution; no external action was started.",
        plotTitle: "Workspace routing",
        plotValues: [82, 48, 64, 91, 73],
        plotLabels: ["Ask", "Find", "Explain", "Verify", "Decide"],
        observation: "The request is best answered after it is framed as a question.",
        sources: defaultAssistantSources()
      };
    }
    if (/\b(july|june|market activity|average daily value|adv|trading|market view)\b/.test(value)) {
      return {
        title: "July market activity was firmer than June",
        summary: "Synthetic governed data indicates higher average daily value and steadier participation in July. The increase was broad enough to suggest a genuine improvement rather than a single-session spike.",
        stats: [["RM 2.31b", "July average daily value"], ["+8.5%", "Compared with June"], ["19 / 22", "Sessions above June median"]],
        takeaway: "Activity strengthened across most of the month, but the gain should still be read alongside sector concentration and foreign-flow context.",
        analysis: "July's improvement was supported by more consistently active sessions, with financials and industrial counters contributing most to the uplift. The highest-volume days did not dominate the monthly result.",
        method: "Average daily value = total on-market trading value divided by trading sessions. July is compared with the same governed measure for June.",
        plotTitle: "Average daily trading value",
        plotValues: [1.92, 2.04, 2.13, 2.07, 2.31],
        plotLabels: ["Mar", "Apr", "May", "Jun", "Jul"],
        observation: "July reached RM 2.31b, up 8.5% from June's RM 2.13b in this synthetic demo series.",
        sources: defaultAssistantSources()
      };
    }
    if (/\b(structure|participant|governance|exchange)\b/.test(value)) {
      return {
        title: "Bursa Malaysia connects markets, participants, and oversight",
        summary: "At a high level, the exchange ecosystem brings together listed issuers, investors, brokers, clearing and depository services, with rules and surveillance supporting an orderly market.",
        stats: [["3", "Core market layers"], ["2", "Post-trade functions"], ["1", "Governed ecosystem"]],
        takeaway: "The useful mental model is a connected lifecycle: raise and list capital, trade through approved participants, then clear, settle, and supervise the activity.",
        analysis: "The market layer supports listing and trading. The participant layer connects investors through licensed intermediaries. The infrastructure and governance layer provides clearing, depository, rules, and surveillance.",
        method: "The explanation consolidates approved introductory material into a functional market-lifecycle view.",
        plotTitle: "Market ecosystem coverage",
        plotValues: [76, 92, 84, 88, 96],
        plotLabels: ["Issuers", "Trading", "Brokers", "Post-trade", "Oversight"],
        observation: "Trading and oversight are the most connected parts of the simplified ecosystem view.",
        sources: defaultAssistantSources()
      };
    }
    if (/\b(source|evidence|support|citation|document)\b/.test(value)) {
      return {
        title: "The latest market view is supported by three governed source groups",
        summary: "The answer uses an approved market activity dataset, the internal methodology note, and a verified market commentary brief. Each item is versioned and owned.",
        stats: [["3", "Source groups"], ["92%", "Evidence coverage"], ["14 Oct", "Latest verification"]],
        takeaway: "The calculation is traceable to primary internal data, while interpretation is separated and labelled in the analysis.",
        analysis: "Quantitative claims are grounded in the market activity dataset. Definitions come from the methodology note. Narrative context comes from the verified market commentary brief.",
        method: "Claims are mapped to a source owner, freshness date, and verification state before inclusion.",
        plotTitle: "Evidence coverage by claim type",
        plotValues: [98, 95, 86, 90, 92],
        plotLabels: ["Volume", "Value", "Method", "Context", "Overall"],
        observation: "All numeric claims have direct coverage; contextual interpretation has one open corroboration item.",
        sources: defaultAssistantSources()
      };
    }
    return {
      title: "Here is the governed view",
      summary: "BursaIQ has interpreted your question against the approved knowledge available in this demonstration workspace and separated the answer from its supporting evidence.",
      stats: [["3", "Approved sources"], ["92%", "Evidence coverage"], ["Current", "Workspace context"]],
      takeaway: "Use the Decision Canvas to inspect the pattern, reasoning, and exact source trail before relying on the answer.",
      analysis: "The answer combines approved organisational knowledge with the current workspace context. Assumptions and interpretation remain visible so they can be challenged.",
      method: "Relevant source passages are retrieved, compared, and summarised; claims without sufficient support are excluded.",
      plotTitle: "Evidence confidence",
      plotValues: [68, 74, 81, 88, 92],
      plotLabels: ["Retrieve", "Match", "Compare", "Verify", "Answer"],
      observation: "Confidence improves as evidence is matched, compared, and verified.",
      sources: defaultAssistantSources()
    };
  }

  function defaultAssistantSources() {
    return [
      { title: "Monthly Market Activity", meta: "Market Data · market-activity-jul-2026.csv", detail: "Trading value, sessions, and participation measures", coverage: "Primary data" },
      { title: "Trading Statistics Methodology", meta: "Data Governance · methodology-v3.2.pdf", detail: "Approved definitions and calculation rules", coverage: "Method" },
      { title: "Market Commentary Brief", meta: "Strategy · verified 14 Oct 2026", detail: "Governed context for interpreting the latest movement", coverage: "Context" }
    ];
  }

  function assistantCanvas(answer) {
    var tabs = ["plot", "analysis", "source", "action"];
    var content = answer ? assistantCanvasContent(answer) : '<div class="canvas-empty">' + miniIcon("i-spark", "blue") + '<h3>Your answer will become explorable</h3><p>Ask a question to reveal its visual pattern, reasoning, and governed source trail.</p><div><span>1</span><span>Question</span><i></i><span>2</span><span>Answer</span><i></i><span>3</span><span>Evidence</span></div></div>';
    return '<aside class="decision-canvas" aria-label="Decision Canvas"><div class="canvas-head"><div><span>Decision canvas</span><h2>Evidence &amp; analysis</h2></div><span class="canvas-confidence">' + (answer ? '92% covered' : 'Ready') + '</span></div><div class="canvas-tabs" role="tablist" aria-label="Decision Canvas views">' + tabs.map(function (tab) {
      var label = tab.charAt(0).toUpperCase() + tab.slice(1);
      var badge = tab === "source" && answer ? '<b>' + answer.sources.length + '</b>' : '';
      return '<button id="assistant-canvas-tab-' + tab + '" type="button" role="tab" aria-selected="' + (state.assistantCanvasTab === tab) + '" aria-controls="assistant-canvas-panel" tabindex="' + (state.assistantCanvasTab === tab ? '0' : '-1') + '" class="' + (state.assistantCanvasTab === tab ? 'is-active' : '') + '" data-assistant-canvas-tab="' + tab + '">' + label + badge + '</button>';
    }).join("") + '</div><div class="canvas-body" id="assistant-canvas-panel" role="tabpanel" aria-labelledby="assistant-canvas-tab-' + state.assistantCanvasTab + '" tabindex="0">' + content + '</div><div class="canvas-foot">' + svg("i-shield") + '<span><strong>Governed answer</strong><small>Sources, methods, and assumptions remain visible.</small></span></div></aside>';
  }

  function assistantCanvasContent(answer) {
    if (state.assistantCanvasTab === "action") {
      var actionKey = assistantAnswerKey(answer);
      var decisionSaved = state.savedDecisions.some(function (item) { return item.answerKey === actionKey || item.question === assistantCurrentQuestion() && item.title === answer.title; });
      var emailSaved = state.emailAutomations.some(function (item) { return item.answerKey === actionKey || item.question === assistantCurrentQuestion() && item.title === answer.title; });
      return '<section class="canvas-actions"><h3>Move this answer into action</h3><p>Keep the evidence attached when you record the decision or schedule a refreshed answer.</p><div class="canvas-action-list"><button type="button" class="' + (decisionSaved ? 'is-complete' : '') + '" data-canvas-action="memory"><span>' + svg("i-brief") + '</span><span><strong>' + (decisionSaved ? 'Saved to Decision Memory' : 'Save to Decision Memory') + '</strong><small>Record the question, rationale, owner, and evidence trail.</small></span><em>' + (decisionSaved ? 'Saved' : 'Record') + '</em></button><button type="button" class="' + (emailSaved ? 'is-complete' : '') + '" data-canvas-action="email"><span>' + svg("i-send") + '</span><span><strong>' + (emailSaved ? 'Email automation scheduled' : 'Automate by Email') + '</strong><small>Repeat this question weekly with a refreshed source snapshot.</small></span><em>' + (emailSaved ? 'Active' : 'Schedule') + '</em></button></div><button class="canvas-action-link" type="button" data-page-jump="action">Open Action workspace ' + svg("i-arrow") + '</button><div class="action-boundary"><strong>Synthetic workflow</strong><p>Decision records and email schedules are stored only in this browser demo. No external email is sent.</p></div></section>';
    }
    if (state.assistantCanvasTab === "analysis") {
      return '<section class="canvas-analysis"><span class="canvas-kicker">Interpretation</span><h3>' + escapeHtml(answer.title) + '</h3><p>' + escapeHtml(answer.analysis) + '</p><div class="analysis-method"><span>' + svg("i-research") + '</span><div><strong>How this was calculated</strong><p>' + escapeHtml(answer.method) + '</p></div></div><div class="analysis-stats">' + answer.stats.map(function (item) { return '<article><strong>' + escapeHtml(item[0]) + '</strong><small>' + escapeHtml(item[1]) + '</small></article>'; }).join("") + '</div></section>';
    }
    if (state.assistantCanvasTab === "source") {
      return '<section class="canvas-sources"><div class="source-summary"><span><strong>92%</strong><small>Evidence coverage</small></span><i><b></b></i><em>High confidence</em></div>' + answer.sources.map(function (source, index) {
        return '<article class="canvas-source"><span class="source-index">' + (index + 1) + '</span><div><h3>' + escapeHtml(source.title) + '</h3><small>' + escapeHtml(source.meta) + '</small><p>' + escapeHtml(source.detail) + '</p><span class="source-tag">' + svg("i-check") + 'Verified · ' + escapeHtml(source.coverage) + '</span></div><button type="button" data-demo-action="detail" data-action-context="' + escapeHtml(source.title) + '" aria-label="Inspect ' + escapeHtml(source.title) + '">' + svg("i-chevron") + '</button></article>';
      }).join("") + '</section>';
    }
    return '<section class="canvas-plot"><div class="plot-heading"><div><span class="canvas-kicker">' + escapeHtml(answer.plotTitle) + '</span><h3>' + escapeHtml(answer.stats[0][0]) + '</h3><small>' + escapeHtml(answer.stats[0][1]) + '</small></div><span class="plot-delta">' + escapeHtml(answer.stats[1][0]) + '</span></div>' + assistantChart(answer) + '<div class="plot-note"><span>' + svg("i-spark") + '</span><div><strong>Latest observation</strong><p>' + escapeHtml(answer.observation) + '</p></div></div><div class="plot-guide"><strong>How to read</strong><p>Values are normalised for the visual. Hover or inspect the analysis for the governed figures and calculation method.</p></div></section>';
  }

  function assistantChart(answer) {
    var values = answer.plotValues;
    var maximum = Math.max.apply(Math, values);
    var points = values.map(function (value, index) {
      var x = 28 + index * 67;
      var y = 142 - (Number(value) / maximum) * 104;
      return x + ',' + y.toFixed(1);
    }).join(' ');
    var areas = values.map(function (value, index) {
      var x = 13 + index * 67;
      var height = Math.max(14, (Number(value) / maximum) * 104);
      var y = 142 - height;
      return '<rect x="' + x + '" y="' + y.toFixed(1) + '" width="30" height="' + height.toFixed(1) + '" rx="6"></rect><text x="' + (x + 15) + '" y="164" text-anchor="middle">' + escapeHtml(answer.plotLabels[index]) + '</text>';
    }).join("");
    return '<div class="assistant-chart"><svg viewBox="0 0 320 178" role="img" aria-label="' + escapeHtml(answer.plotTitle) + '"><title>' + escapeHtml(answer.plotTitle) + '</title><desc>Five-point visual summary. Exact figures are stated in the answer and analysis.</desc><g class="chart-grid"><path d="M10 38H310M10 90H310M10 142H310"></path></g><g class="chart-bars">' + areas + '</g><polyline class="chart-line" points="' + points + '"></polyline><g class="chart-points">' + values.map(function (value, index) { var x = 28 + index * 67; var y = 142 - (Number(value) / maximum) * 104; return '<circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="4"></circle>'; }).join("") + '</g></svg></div>';
  }

  function workforcePage() {
    var active = state.liveMissions.filter(function (mission) { return ["APPROVED", "FAILED"].indexOf(mission.status) === -1; });
    var awaiting = state.liveMissions.filter(function (mission) { return mission.status === "AWAITING REVIEW"; });
    var completed = state.liveMissions.filter(function (mission) { return ["DRAFT READY", "APPROVED"].indexOf(mission.status) !== -1; });
    var missionRows = state.missionLoading ? '<tr><td colspan="7"><div class="mission-empty"><strong>Loading mission history…</strong><span>Connecting to the local mission service.</span></div></td></tr>' :
      state.missionError ? '<tr><td colspan="7"><div class="mission-empty is-error"><strong>Mission service unavailable</strong><span>' + escapeHtml(state.missionError) + ' Start the Flask service, then retry.</span><button class="secondary-button" type="button" data-mission-refresh>Retry</button></div></td></tr>' :
      state.liveMissions.length ? state.liveMissions.map(missionRow).join("") : '<tr><td colspan="7"><div class="mission-empty"><strong>No live missions yet</strong><span>Run the prepared ADV mission to create a persisted execution record.</span></div></td></tr>';
    return [
      '<section class="page page-enter">',
      pageHead("My Workforce", "Run one traceable market-intelligence mission from approved synthetic data.", "Configure mission", "mission"),
      '<section class="mission-launch panel"><div class="mission-launch-copy"><h2>Malaysia Equity Market ADV Intelligence Report</h2><p>Deterministic mission · two approved synthetic CSV files · human review required.</p><form class="mission-inline-intake" id="mission-inline-form" data-creation-type="mission"><input type="hidden" name="title" value="Malaysia Equity Market ADV Intelligence Report"><label><small>Objective</small><input name="description" maxlength="1000" value="Explain Malaysia equity-market ADV and key shifts" required></label><label><small>Start date</small><input type="date" name="dateStart" min="2026-01-01" max="2026-09-30" value="2026-01-01" required></label><label><small>End date</small><input type="date" name="dateEnd" min="2026-01-01" max="2026-09-30" value="2026-09-30" required></label><label><small>Source scope</small><select name="scope"><option value="all">2 CSVs · all boards</option><option value="MAIN MARKET">Main Market only</option><option value="ACE MARKET">ACE Market only</option></select></label><label><small>Report output</small><select name="output"><option>Dashboard + chart + verified PDF</option></select></label></form></div><div class="mission-launch-action"><strong>Ready to run locally</strong><small>Edit the mission contract here, then start the persisted five-worker run.</small><p class="form-error" hidden></p><button class="primary-button" type="submit" form="mission-inline-form">Run mission</button></div></section>',
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="mission-status-ledger" aria-label="Mission status summary"><span><b>' + active.length + '</b> active</span><span><b>' + awaiting.length + '</b> awaiting review</span><span><b>5</b> controlled workers</span><span><b>' + completed.length + '</b> completed</span><em>Persisted locally · same dashboard and PDF payload</em></div>',
      '<section class="panel">' + panelHead("Mission Control", "i-flow") + '<div class="table-wrap"><table class="mission-table live-mission-table"><thead><tr><th>Mission</th><th>Reporting window</th><th>Progress</th><th>Current worker</th><th>Updated</th><th>Status</th><th>Action</th></tr></thead><tbody>' + missionRows + "</tbody></table></div></section>",
      "</div><aside class=\"page-rail\">",
      '<section class="panel rail-panel">' + panelHead("Mission team", "i-agents") + '<ul class="agent-feed mission-agent-feed">' + missionAgents.map(function (agent) { return '<li>' + miniIcon("i-spark", agent.tone) + '<span><strong>' + agent.name + '</strong><small>' + agent.job + '</small></span><span class="worker-ready">Ready</span></li>'; }).join("") + "</ul></section>",
      '<section class="panel rail-panel mission-rulebook"><div class="panel-head"><h2>' + svg("i-shield") + 'Calculation contract</h2></div><dl><div><dt>Formula</dt><dd>Total eligible traded value ÷ distinct eligible trading days</dd></div><div><dt>Duplicates</dt><dd>Exact duplicate rows excluded</dd></div><div><dt>Interpretation</dt><dd>No unsupported causal claims</dd></div><div><dt>Classification</dt><dd>Synthetic demonstration data</dd></div></dl></section>',
      "</aside></div></section>"
    ].join("");
  }

  function metric(icon, tone, value, label, delta) {
    return '<button class="panel metric" type="button" data-metric-context="' + escapeHtml(label) + '">' + miniIcon(icon, tone) + '<span><strong>' + value + '</strong><small>' + label + '</small><em>' + delta + "</em></span>" + svg("i-chevron") + "</button>";
  }

  function agentCard(agent) {
    return '<article class="agent-card"><div class="agent-card-head">' + miniIcon("i-spark", agent.tone) + '<span><strong>' + agent.name + '</strong><small><i class="dot"></i> ' + agent.state + '</small></span></div><p>' + agent.job + '</p><button type="button" data-agent-open="' + escapeHtml(agent.name) + '">Open ' + svg("i-arrow") + "</button></article>";
  }

  function missionRow(mission) {
    var worker = mission.currentWorker ? mission.currentWorker.replace(/-/g, " ").replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) : "Mission Manager";
    var updated = mission.updatedAt ? new Date(mission.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
    return '<tr data-mission-row="' + escapeHtml(mission.id) + '"><td><button class="mission-title mission-title-button" type="button" data-mission="' + escapeHtml(mission.id) + '" aria-label="Open mission ' + escapeHtml(mission.title) + '">' + miniIcon("i-document", mission.status === "FAILED" ? "red" : "blue") + '<span><strong>' + escapeHtml(mission.title) + '</strong><small>' + escapeHtml(mission.id) + '</small></span></button></td><td><span class="mission-window">' + escapeHtml(mission.dateStart) + '<b>→</b>' + escapeHtml(mission.dateEnd) + '</span></td><td><span class="table-progress"><span class="progress-track"><i style="width:' + Number(mission.progress || 0) + '%"></i></span><span>' + Number(mission.progress || 0) + '%</span></span></td><td>' + escapeHtml(worker) + '</td><td>' + escapeHtml(updated) + '</td><td>' + missionStatus(mission.status) + '</td><td><button class="table-action" type="button" data-mission="' + escapeHtml(mission.id) + '">' + (mission.status === "DRAFT READY" ? "Inspect draft" : mission.status === "AWAITING REVIEW" ? "Track review" : "Open") + '</button></td></tr>';
  }

  function exchangePage() {
    var categoryMap = { agent: "AI Agent", workflow: "Workflow", template: "Template", knowledge: "Knowledge" };
    var visibleAssets = categoryMap[state.exchangeCategory] ? assets.filter(function (asset) { return asset.type === categoryMap[state.exchangeCategory]; }) : assets;
    return [
      '<section class="page page-enter">',
      pageHead("Intelligence Exchange", "Discover, adapt and share verified intelligence across Bursa.", "Publish asset", "skill"),
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="metric-row">' + metric("i-exchange", "blue", "0", "Verified assets", "Nothing published yet") + metric("i-document", "violet", "0", "Published this month", "New workspace") + metric("i-flow", "blue", "0", "Active reuses", "No reuse yet") + metric("i-agents", "teal", "0", "Departments contributing", "No contributors yet") + "</div>",
      '<section class="panel exchange-search"><div class="exchange-search-box"><label class="large-search">' + svg("i-search") + '<input id="exchange-search-input" type="search" placeholder="Search agents, workflows, templates or knowledge…"></label><select class="select-field" id="exchange-category-select" aria-label="Exchange category"><option value="featured">All categories</option><option value="agent">AI agents</option><option value="workflow">Workflows</option><option value="template">Templates</option><option value="knowledge">Knowledge</option></select></div>',
      '<div class="category-row">' +
      category("featured", "i-spark", "Featured") + category("agent", "i-agents", "Agents") + category("workflow", "i-flow", "Workflows") + category("template", "i-document", "Templates") + category("knowledge", "i-book", "Knowledge") + category("department", "i-grid", "By department") +
      "</div></section>",
      '<section class="panel">' + panelHead(state.exchangeCategory === "featured" ? "Featured Intelligence Assets" : "Recommended " + (categoryMap[state.exchangeCategory] || "Intelligence"), "i-spark", "featured") + '<div class="clean-empty"><strong>No intelligence assets yet</strong><p>Published and verified assets will appear here.</p></div></section>',
      '<section class="panel">' + panelHead("Explore the Exchange", "i-exchange", "all-assets") + '<div class="clean-empty"><strong>The Exchange is empty</strong><p>Teach or publish a verified capability to add the first asset.</p></div></section>',
      '</div><aside class="page-rail">',
      '<section class="panel rail-panel">' + panelHead("Recommended for You", "i-spark", "recommendations") + '<div class="clean-empty compact"><strong>No recommendations yet</strong><p>Use BursaIQ to build your recommendations.</p></div></section>',
      '<section class="panel rail-panel">' + panelHead("Top Contributors", "i-agents", "contributors") + '<div class="clean-empty compact"><strong>No contributors yet</strong></div></section>',
      '<section class="panel rail-panel">' + panelHead("My Saved Assets", "i-book", "saved") + '<div class="clean-empty compact"><strong>No saved assets</strong></div></section>',
      "</aside></div></section>"
    ].join("");
  }

  function category(id, icon, label) {
    return '<button class="category-button ' + (state.exchangeCategory === id ? "is-active" : "") + '" type="button" data-category="' + id + '">' + svg(icon) + label + "</button>";
  }

  function featuredCard(asset) {
    return '<article class="featured-card"><div class="featured-top">' + miniIcon(asset.icon, asset.tone) + '<span class="status green">' + svg("i-check") + ' Verified</span></div><h3>' + asset.title + '</h3><p>' + asset.description + '</p><div class="featured-foot"><span>' + asset.owner + '<br>' + asset.uses + '</span><button type="button" data-asset-open="' + escapeHtml(asset.title) + '">Inspect</button></div></article>';
  }

  function marketAsset(asset) {
    return '<article class="market-asset" data-asset-type="' + asset.type.toLowerCase() + '">' + miniIcon(asset.icon, asset.tone) + '<span><strong>' + asset.title + '</strong><small>' + asset.description + '<br>' + asset.owner + ' · ' + asset.uses + '</small></span><button type="button" data-asset-open="' + escapeHtml(asset.title) + '">Inspect</button></article>';
  }

  function contributor(rank, name, count) {
    return '<li><span class="avatar">' + rank + '</span><span><strong>' + name + '</strong><small>' + count + '</small></span><span class="status green">↑ ' + (25 - Number(rank) * 3) + "%</span></li>";
  }

  function automationPage() {
    var node = {
      trigger: ["Trigger", "Scheduled every Monday", "i-clock", "teal"],
      gather: ["Gather data", "Collect approved sources", "i-folder", "blue"],
      summarise: ["AI summarise", "Generate key findings", "i-spark", "violet"],
      approve: ["Approval checkpoint", "Human review required", "i-shield", "amber"],
      report: ["Generate report", "Compile board pack", "i-document", "blue"],
      publish: ["Send / publish", "Distribute to stakeholders", "i-send", "violet"]
    };
    var keys = Object.keys(node);
    return [
      '<section class="page page-enter">',
      pageHead("Automation Studio", "Build, run and monitor intelligent workflows across Bursa.", "Create workflow", "workflow"),
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="metric-row">' + metric("i-automation", "blue", "0", "Active workflows", "No workflows yet") + metric("i-shield", "violet", "0", "Pending approvals", "Nothing awaiting review") + metric("i-flow", "blue", "0", "Runs this week", "No runs yet") + metric("i-check", "teal", "—", "Success rate", "Available after first run") + "</div>",
      '<section class="panel tabs-toolbar"><button class="tab-button ' + (state.automationTab === "workflows" ? "is-active" : "") + '" type="button" data-automation-tab="workflows">' + svg("i-automation") + 'My workflows</button><button class="tab-button ' + (state.automationTab === "templates" ? "is-active" : "") + '" type="button" data-automation-tab="templates">' + svg("i-book") + 'Templates</button><button class="tab-button ' + (state.automationTab === "runs" ? "is-active" : "") + '" type="button" data-automation-tab="runs">' + svg("i-clock") + 'Runs</button><span class="toolbar-spacer"></span><label class="inline-search">' + svg("i-search") + '<input id="automation-search" type="search" placeholder="Search ' + state.automationTab + '…"></label></section>',
      automationTabContent(node, keys),
      '</div><aside class="page-rail">',
      '<section class="panel rail-panel">' + panelHead("Upcoming Runs", "i-clock", "runs") + '<div class="clean-empty compact"><strong>No upcoming runs</strong></div></section>',
      '<section class="panel rail-panel">' + panelHead("Pending Approval Steps", "i-shield", "approvals") + '<div class="clean-empty compact"><strong>No pending approvals</strong></div></section>',
      "</aside></div></section>"
    ].join("");
  }

  function automationTabContent(node, keys) {
    var heading = state.automationTab === "templates" ? "No templates available" : state.automationTab === "runs" ? "No execution history" : "No workflows yet";
    var detail = state.automationTab === "templates" ? "Approved templates will appear here when published." : state.automationTab === "runs" ? "Completed and active runs will appear after a workflow starts." : "Create your first workflow to begin automating repeatable work.";
    return '<section class="panel content-view"><div class="clean-empty">' + miniIcon("i-automation", "violet") + '<strong>' + heading + '</strong><p>' + detail + '</p><button class="primary-button" type="button" data-create="workflow">Create workflow</button></div></section>';
  }

  function nodeConfig(key) {
    var labels = {
      trigger: ["Trigger configuration", "Scheduled (recurring)", "Weekly · Monday", "08:00 AM"],
      gather: ["Source configuration", "Approved repositories", "Board materials", "Current version only"],
      summarise: ["Agent configuration", "Report Agent", "Executive summary", "Citations required"],
      approve: ["Approval configuration", "Human checkpoint", "Corporate Secretariat", "Block until approved"],
      report: ["Output configuration", "Board report", "PPTX + PDF", "Bursa template"],
      publish: ["Delivery configuration", "Microsoft Teams", "Board workspace", "Authorised members only"]
    };
    var item = labels[key] || labels.trigger;
    return '<h3>' + item[0] + '</h3><label class="form-field">Step type<select><option>' + item[1] + '</option></select></label><label class="form-field">Configuration<input value="' + item[2] + '"></label><label class="form-field">Control<input value="' + item[3] + '"></label><div class="switch-row"><span>Require fresh content</span><button class="switch is-on" type="button" aria-label="Toggle fresh-content requirement"></button></div><button class="primary-button" type="button" data-demo-action="save-step">Save step</button>';
  }

  function workflowRow(name, owner, last, next, runs, workflowStatus) {
    return '<tr><td><span class="mission-title">' + miniIcon("i-automation", "violet") + '<span><strong>' + name + '</strong><small>Intelligent enterprise workflow</small></span></span></td><td>' + owner + '</td><td>' + last + '</td><td>' + next + '</td><td>' + runs + '</td><td>' + status(workflowStatus) + '</td><td><button class="table-action" type="button" data-demo-action="run-now">Run now</button></td></tr>';
  }

  function roomsPage() {
    if (!rooms.length) {
      return '<section class="page page-enter">' + pageHead("Collaborative Rooms", "Work with colleagues and AI agents in shared mission spaces.", "Create room", "room") + '<div class="metric-row">' + metric("i-room", "blue", "0", "Active rooms", "No rooms yet") + metric("i-spark", "violet", "0", "Rooms with AI agents", "No agents assigned") + metric("i-document", "blue", "0", "Pending decisions", "Nothing pending") + metric("i-exchange", "teal", "0", "Cross-department projects", "No shared projects") + '</div><section class="panel"><div class="clean-empty">' + miniIcon("i-room", "violet") + '<strong>No collaborative rooms yet</strong><p>Create a room when you are ready to bring colleagues, evidence, and AI agents together.</p><button class="primary-button" type="button" data-create="room">Create room</button></div></section></section>';
    }
    var current = rooms.filter(function (room) { return room.id === state.selectedRoom; })[0] || rooms[0];
    var visibleRooms = state.roomScope === "shared" ? rooms.slice(1, 5) : state.roomScope === "discover" ? rooms.slice(2) : rooms;
    return [
      '<section class="page page-enter">',
      pageHead("Collaborative Rooms", "Work with colleagues and AI agents in shared mission spaces.", "Create room", "room"),
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="metric-row">' + metric("i-room", "blue", "18", "Active rooms", "↑ 3 this month") + metric("i-spark", "violet", "12", "Rooms with AI agents", "↑ 4 this month") + metric("i-document", "blue", "6", "Pending decisions", "1 needs attention") + metric("i-exchange", "teal", "9", "Cross-department projects", "↑ 2 this month") + "</div>",
      '<section class="panel"><div class="tabs-toolbar"><button class="tab-button ' + (state.roomScope === "mine" ? "is-active" : "") + '" type="button" data-room-scope="mine">' + svg("i-room") + 'My rooms</button><button class="tab-button ' + (state.roomScope === "shared" ? "is-active" : "") + '" type="button" data-room-scope="shared">' + svg("i-agents") + 'Shared with me</button><button class="tab-button ' + (state.roomScope === "discover" ? "is-active" : "") + '" type="button" data-room-scope="discover">' + svg("i-search") + 'Discover</button><span class="toolbar-spacer"></span><label class="inline-search">' + svg("i-search") + '<input id="room-search" type="search" placeholder="Search rooms, people or topics…"></label></div><div class="room-cards">' + visibleRooms.map(roomCard).join("") + '<div class="empty-state" id="room-empty" hidden>' + miniIcon("i-search", "blue") + '<h3>No rooms match</h3><p>Try a different name or topic.</p></div></div></section>',
      '<section class="panel room-detail"><div class="room-detail-head"><div class="room-detail-title">' + miniIcon("i-room", "violet") + '<div><h2>' + current.title + '</h2><p>' + current.description + '</p></div></div><div class="avatar-stack"><span>KH</span><span class="violet">SC</span><span class="teal">TY</span><span class="soft">+5</span></div></div>',
      '<div class="room-tabs">' + ["overview", "activity", "tasks", "files", "agents", "members"].map(function (tab) { var label = tab === "agents" ? "AI agents" : tab.charAt(0).toUpperCase() + tab.slice(1); return '<button class="' + (state.roomTab === tab ? "is-active" : "") + '" type="button" data-room-tab="' + tab + '">' + label + '</button>'; }).join("") + '</div>',
      '<div id="room-tab-content">' + roomTabContent(current) + '</div>',
      '</section></div><aside class="page-rail">',
      '<section class="panel rail-panel">' + panelHead("Active Participants", "i-agents", "participants") + '<ul class="rail-list">' + participant("LH", "Lim Kim Hoong", "Product Development", "Online") + participant("SC", "Soon Cheng", "Strategy & Planning", "Online") + participant("TY", "Tan Yee", "Market Strategy", "In a meeting") + participant("AM", "Aisyah Md Noor", "Legal & Compliance", "Online") + "</ul></section>",
      '<section class="panel rail-panel">' + panelHead("Pending Room Decisions", "i-shield", "decisions") + '<ul class="rail-list">' + railItem("i-document", "amber", "Approve product requirements", "Requested 2 days ago", "Review") + railItem("i-shield", "violet", "Sign off market validation plan", "Requested 3 days ago", "Review") + "</ul></section>",
      "</aside></div></section>"
    ].join("");
  }

  function roomTabContent(current) {
    if (state.roomTab === "overview") {
      return '<div class="room-summary"><article class="summary-block"><h3>Shared mission</h3><p>' + current.description + '</p><span class="progress-track"><i style="width:65%"></i></span></article><article class="summary-block"><h3>Current focus</h3><p>Finalise product requirements and conduct market validation.</p></article><article class="summary-block"><h3>Upcoming milestone</h3><p>Stakeholder review session · 30 Apr 2027</p></article></div><div class="room-bottom"><section class="panel">' + panelHead("Recent Activity", "i-clock", "activity") + '<ul class="compact-list"><li><span><strong>Soon Cheng added a comment</strong><small>Product Requirements v2 · 2 min ago</small></span><span class="avatar">SC</span></li><li><span><strong>Data Analyst generated insights</strong><small>4 market opportunities identified</small></span><span class="avatar violet">AI</span></li></ul></section><section class="panel">' + panelHead("Shared Files", "i-folder", "files") + '<ul class="compact-list"><li><span><strong>Product Requirements v2.0.pdf</strong><small>2.4 MB · Updated 2 hours ago</small></span>' + status("Verified") + '</li><li><span><strong>Market Analysis Summary.pptx</strong><small>12.8 MB · Updated yesterday</small></span>' + status("Active") + '</li></ul></section><section class="panel">' + panelHead("Current Tasks", "i-check", "tasks") + '<ul class="compact-list"><li><span><strong>Finalise requirements</strong><small>Due 25 Apr 2027</small></span>' + status("Completed") + '</li><li><span><strong>Conduct validation</strong><small>Due 30 Apr 2027</small></span>' + status("Active") + '</li></ul></section></div>';
    }
    var content = {
      activity: ["Room activity", "A chronological record of member and agent work.", [["Soon Cheng commented on requirements", "2 min ago"], ["Data Analyst generated four insights", "1 hour ago"], ["Research Agent added six governed sources", "Yesterday"]]],
      tasks: ["Room tasks", "Shared ownership and due dates for this mission.", [["Finalise product requirements", "Completed"], ["Conduct market validation", "In progress"], ["Prepare stakeholder deck", "Due 2 May"]]],
      files: ["Files and knowledge", "Verified documents available to every room member.", [["Product Requirements v2.0.pdf", "Verified"], ["Market Analysis Summary.pptx", "Active"], ["Pricing Model_v3.xlsx", "Restricted"]]],
      agents: ["AI teammates", "Specialists assigned with transparent responsibilities.", [["Research Agent", "Market and policy evidence"], ["Data Analyst Agent", "Validation and insight"], ["Verifier Agent", "Claims and citations"]]],
      members: ["Room members", "People with access to this shared mission.", [["Lim Kim Hoong", "Product Development"], ["Soon Cheng", "Strategy & Planning"], ["Tan Yee", "Market Strategy"]]]
    }[state.roomTab];
    return '<section class="room-focus"><div class="content-view-head"><div><h2>' + content[0] + '</h2><p>' + content[1] + '</p></div><button class="secondary-button" type="button" data-demo-action="room-add">Add ' + (state.roomTab === "files" ? "file" : state.roomTab === "members" ? "member" : state.roomTab === "tasks" ? "task" : "item") + '</button></div><div class="focus-list">' + content[2].map(function (item) { return '<button type="button" data-demo-action="room-item" data-action-context="' + item[0] + '"><span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></span>' + svg("i-chevron") + '</button>'; }).join("") + '</div></section>';
  }

  function roomCard(room) {
    return '<button class="room-card ' + (room.id === state.selectedRoom ? "is-selected" : "") + '" type="button" data-room="' + room.id + '"><div class="featured-top">' + miniIcon("i-room", room.id === "esg" ? "teal" : "violet") + '<span class="status blue">' + room.tag + '</span></div><h3>' + room.title + '</h3><p>' + room.description + '</p><div class="room-meta"><span>' + room.members + ' members</span><span>' + room.agents + " AI agents</span></div></button>";
  }

  function participant(initials, name, dept, presence) {
    return '<li><span class="avatar">' + initials + '</span><span><strong>' + name + '</strong><small>' + dept + '</small></span><span class="status ' + (presence === "Online" ? "green" : "amber") + '">' + presence + "</span></li>";
  }

  function workspacePage() {
    var projectData = [];
    return '<section class="page page-enter">' + pageHead("Projects & Workspace", "Files, governed context and decision memory for people and AI.", "New project", "project") +
      '<div class="metric-row">' + metric("i-folder", "blue", "0", "Active projects", "No projects yet") + metric("i-document", "violet", "0", "Governed files", "No files yet") + metric("i-book", "teal", "0", "Saved decisions", "No decisions yet") + metric("i-agents", "amber", "0", "Contributors", "No collaborators yet") + '</div>' +
      '<section class="panel tabs-toolbar"><button class="tab-button ' + (state.workspaceView === "projects" ? "is-active" : "") + '" type="button" data-workspace-view="projects">' + svg("i-folder") + 'Projects</button><button class="tab-button ' + (state.workspaceView === "files" ? "is-active" : "") + '" type="button" data-workspace-view="files">' + svg("i-document") + 'Recent files</button><button class="tab-button ' + (state.workspaceView === "decisions" ? "is-active" : "") + '" type="button" data-workspace-view="decisions">' + svg("i-shield") + 'Decision memory</button><span class="toolbar-spacer"></span><label class="inline-search">' + svg("i-search") + '<input id="workspace-search" type="search" placeholder="Search workspace…"></label></section>' +
      '<div class="support-layout"><div class="support-main"><section class="panel content-view">' + workspaceContent(projectData) + '</section></div><aside class="support-rail"><section class="panel rail-panel">' + panelHead("Workspace health", "i-shield", "workspace-health") + '<div class="clean-empty compact"><strong>No workspace data yet</strong><p>Governance health will appear after files are added.</p></div></section><section class="panel rail-panel">' + panelHead("Recent collaborators", "i-agents", "participants") + '<div class="clean-empty compact"><strong>No collaborators yet</strong></div></section></aside></div></section>';
  }

  function workspaceContent(projectData) {
    if (state.workspaceView === "files") return '<div class="content-view-head"><div><h2>Recent files</h2><p>Documents retain owner, sensitivity and verification state.</p></div><button class="secondary-button" type="button" data-demo-action="upload">Upload files</button></div><div class="clean-empty"><strong>No files yet</strong><p>Upload a governed file to add it to this workspace.</p></div>';
    if (state.workspaceView === "decisions") return '<div class="content-view-head"><div><h2>Decision memory</h2><p>The rationale, evidence and accountable owner behind important choices.</p></div><button class="secondary-button" type="button" data-demo-action="new-decision">Record decision</button></div><div class="clean-empty"><strong>No decisions recorded</strong><p>Approved decisions and their evidence will appear here.</p></div>';
    return '<div class="content-view-head"><div><h2>Active projects</h2><p>Spaces that carry approved context into every mission.</p></div><button class="secondary-button" type="button" data-create="project">New project</button></div><div class="clean-empty"><strong>No projects yet</strong><p>Create a project to organise missions, files and decisions.</p></div>';
  }

  function briefPage() {
    return '<section class="page page-enter">' + pageHead("Today\'s Brief", "Priorities, approvals and verified changes will appear here.", "Ask about today", "assistant") + '<section class="brief-hero"><div><h2>Good morning, Kim Hoong.</h2><p>You are all caught up. New priorities will appear as work begins.</p></div><div class="brief-orbit" aria-hidden="true"><i></i><i></i><i></i><span>' + svg("i-spark") + '</span></div></section><div class="support-layout"><div class="support-main"><section class="panel"><div class="filter-tabs"><button class="is-active" type="button" data-brief-filter="for-you">For you <b>0</b></button><button type="button" data-brief-filter="approvals">Approvals <b>0</b></button><button type="button" data-brief-filter="updates">Updates <b>0</b></button></div><div class="clean-empty"><strong>Nothing needs your attention</strong><p>Your tasks, approvals and updates will appear here.</p></div></section></div><aside class="support-rail"><section class="panel rail-panel">' + panelHead("Mission pulse", "i-flow", "workforce") + '<div class="clean-empty compact"><strong>0 missions moving</strong><p>Mission activity will appear here.</p></div></section><section class="panel rail-panel">' + panelHead("Next on your calendar", "i-clock", "calendar") + '<div class="clean-empty compact"><strong>No upcoming events</strong></div></section></aside></div></section>';
  }

  function verificationPage() {
    var reviewable = state.liveMissions.filter(function (mission) { return ["AWAITING REVIEW", "APPROVED", "REVISION REQUESTED"].indexOf(mission.status) !== -1; });
    var pending = reviewable.filter(function (mission) { return mission.status === "AWAITING REVIEW"; });
    var selected = missionById(state.selectedVerificationMissionId) || pending[0] || reviewable[0];
    var queue = state.missionLoading ? '<div class="mission-empty"><strong>Loading review queue…</strong></div>' : reviewable.length ? reviewable.map(function (mission) { return '<button class="verification-item ' + (selected && selected.id === mission.id ? "is-selected" : "") + '" type="button" data-verification-mission="' + escapeHtml(mission.id) + '">' + miniIcon("i-document", mission.status === "AWAITING REVIEW" ? "amber" : "teal") + '<span><strong>' + escapeHtml(mission.title) + '</strong><small>' + escapeHtml(mission.id) + ' · ' + escapeHtml(mission.dateStart) + ' → ' + escapeHtml(mission.dateEnd) + '</small></span>' + missionStatus(mission.status) + svg("i-chevron") + '</button>'; }).join("") : '<div class="mission-empty"><strong>No mission packages awaiting review</strong><span>Complete an ADV mission and submit its draft from My Workforce.</span></div>';
    var preview = selected && selected.result ? '<div class="content-view-head"><div><h2>' + escapeHtml(selected.title) + '</h2><p>' + escapeHtml(selected.id) + ' · immutable mission draft</p></div>' + missionStatus(selected.status) + '</div><div class="evidence-score"><span><strong>100%</strong><small>Metric traceability</small></span><div><b>' + selected.result.quality.marketRowsEligible.toLocaleString() + ' market rows used</b><small>' + selected.result.metrics.tradingDays + ' trading days · two source files fingerprinted</small></div></div><div class="review-scope"><div><small>Period ADV</small><strong>RM' + Number(selected.result.metrics.periodAdvBn).toFixed(3) + 'bn</strong></div><div><small>Reporting window</small><strong>' + escapeHtml(selected.dateStart) + ' → ' + escapeHtml(selected.dateEnd) + '</strong></div><div><small>Quality checks</small><strong>' + (selected.result.quality.passed ? "Passed" : "Exceptions present") + '</strong></div></div><div class="claim-list">' + selected.result.findings.map(function (finding) { return '<article><span>' + svg("i-check") + '</span><div><strong>' + escapeHtml(finding) + '</strong><small>Linked to the persisted mission result and calculation trace.</small></div></article>'; }).join("") + '</div><p class="review-boundary">' + escapeHtml(selected.result.interpretationBoundary) + '</p><div class="evidence-actions">' + (selected.downloadUrl ? '<a class="secondary-button" href="' + escapeHtml(selected.downloadUrl) + '" target="_blank" rel="noopener">Open PDF</a>' : "") + (selected.status === "AWAITING REVIEW" ? '<button class="secondary-button" type="button" data-mission-review="Changes requested" data-mission-id="' + escapeHtml(selected.id) + '">Request changes</button><button class="primary-button" type="button" data-mission-review="Approved" data-mission-id="' + escapeHtml(selected.id) + '">Approve package</button>' : "") + '</div>' : '<div class="mission-empty"><strong>Select a mission package</strong><span>Its figures, sources and review actions will appear here.</span></div>';
    return '<section class="page page-enter">' + pageHead("Verification Centre", "Inspect the immutable ADV draft before it moves forward.") + '<div class="metric-row">' + metric("i-shield", "amber", String(pending.length), "Pending review", "Market Intelligence Lead") + metric("i-check", "teal", String(reviewable.filter(function (item) { return item.status === "APPROVED"; }).length), "Approved missions", "Audit event retained") + metric("i-document", "blue", reviewable.length ? "100%" : "—", "Metric traceability", reviewable.length ? "Same dashboard and PDF payload" : "Available after the first mission") + metric("i-clock", "violet", reviewable.length ? "2" : "0", "Source files", reviewable.length ? "Fingerprinted evidence" : "No evidence yet") + '</div><div class="verification-layout"><section class="panel verification-queue"><div class="filter-tabs"><button class="is-active" type="button">Mission reviews <b>' + reviewable.length + '</b></button><button type="button" data-page-jump="workforce">My Workforce</button></div>' + queue + '</section><section class="panel evidence-preview">' + preview + '</section></div><p class="verification-demo-note">Reviewer actions use the simulated Market Intelligence Lead identity and are persisted in the local audit store.</p></section>';
  }

  function connectorsPage() {
    return '<section class="page page-enter">' + pageHead("Connectors", "Approved systems and data sources, governed by your existing access.", "Request connector", "connector") + '<section class="connector-boundary">' + svg("i-shield") + '<div><strong>Your permissions travel with every request.</strong><p>BursaIQ never grants new source access. Actions against external systems remain visible and require the configured approval.</p></div><button type="button" data-demo-action="access-boundary">View access boundary</button></section><section class="panel clean-empty"><strong>No connectors configured</strong><p>Request an approved system or data source to get started.</p><button class="primary-button" type="button" data-create="connector">Request connector</button></section></section>';
  }

  function actionPage() {
    var decisionRows = state.savedDecisions.map(function (item) {
      return '<article class="action-record"><span class="action-record-icon">' + svg("i-brief") + '</span><div><div><strong>' + escapeHtml(item.title) + '</strong>' + status(item.status) + '</div><p>' + escapeHtml(item.question) + '</p><small>' + escapeHtml(item.id) + ' · ' + escapeHtml(item.owner) + ' · ' + escapeHtml(item.created) + '</small></div><button type="button" data-action-open="' + escapeHtml(item.id) + '" aria-label="Open ' + escapeHtml(item.title) + '">' + svg("i-chevron") + '</button></article>';
    }).join("");
    var emailRows = state.emailAutomations.map(function (item) {
      return '<article class="email-action-row"><span class="action-record-icon email">' + svg("i-send") + '</span><div><div><strong>' + escapeHtml(item.title) + '</strong>' + status(item.status) + '</div><p>' + escapeHtml(item.question) + '</p><small>' + escapeHtml(item.schedule) + ' · ' + escapeHtml(item.recipient) + '</small></div><button class="secondary-button" type="button" data-email-toggle="' + escapeHtml(item.id) + '">' + (item.status === "Active" ? "Pause" : "Resume") + '</button></article>';
    }).join("");
    return '<section class="page page-enter action-page">' + pageHead("Action", "Decision records and scheduled follow-ups created from governed answers.") +
      '<section class="action-summary"><div>' + miniIcon("i-check", "teal") + '<span><strong>From answer to accountable follow-up</strong><p>Actions preserve the original question and evidence trail. Email schedules remain reviewable and reversible.</p></span></div><button class="primary-button" type="button" data-page-jump="assistant">Ask a new question</button></section>' +
      '<div class="metric-row action-metrics">' + metric("i-brief", "blue", String(state.savedDecisions.length), "Decision memories", "Recorded with evidence") + metric("i-send", "violet", String(state.emailAutomations.length), "Email automations", "Reviewable schedules") + metric("i-shield", "teal", state.savedDecisions.length || state.emailAutomations.length ? "100%" : "—", "Governed actions", state.savedDecisions.length || state.emailAutomations.length ? "Source context retained" : "Available after the first action") + metric("i-clock", "amber", "0", "External sends", "Synthetic demo only") + '</div>' +
      '<div class="action-workspace"><section class="panel action-panel"><div class="content-view-head"><div><h2>Decision Memory</h2><p>Answers saved with their question, owner, and evidence context.</p></div><button class="secondary-button" type="button" data-page-jump="assistant">Add from AI Assistant</button></div><div class="action-list">' + (decisionRows || '<div class="action-empty"><strong>No saved decisions yet</strong><p>Save a governed answer from the AI Assistant Decision Canvas.</p></div>') + '</div></section>' +
      '<section class="panel action-panel"><div class="content-view-head"><div><h2>Email automations</h2><p>Questions refreshed on a schedule with a current source snapshot.</p></div><span class="status blue">Local demo</span></div><div class="action-list">' + (emailRows || '<div class="action-empty"><strong>No email automations yet</strong><p>Choose Automate by Email from an AI Assistant answer.</p></div>') + '</div></section></div>' +
      '<p class="action-disclosure">This front-end demo stores actions in the current browser session. It does not send external email or change Bursa systems.</p></section>';
  }

  function settingsPage() {
    return '<section class="page page-enter settings-page">' + pageHead("Settings", "Preferences, access and AI governance for your BursaIQ experience.") + '<div class="settings-layout"><nav class="panel settings-nav"><button class="is-active" type="button" data-settings-section="general">' + svg("i-settings") + 'General</button><button type="button" data-settings-section="notifications">' + svg("i-bell") + 'Notifications</button><button type="button" data-settings-section="agents">' + svg("i-agents") + 'Agent access</button><button type="button" data-settings-section="privacy">' + svg("i-shield") + 'Privacy & data</button></nav><div class="settings-content"><section class="panel settings-section" id="settings-general"><div class="content-view-head"><div><h2>General</h2><p>Choose how BursaIQ opens and presents your work.</p></div><span class="save-state" id="settings-save-state">Saved</span></div><label class="settings-field"><span><strong>Default workspace</strong><small>The context used when you start a new request.</small></span><select><option>Product Development</option><option>Personal workspace</option><option>Ask every time</option></select></label>' + settingToggle("Start with Today\'s Brief", "Open your role-aware brief after sign-in.", true) + settingToggle("Compact enterprise density", "Show more operational information on larger screens.", true) + settingToggle("Reduce non-essential updates", "Keep notifications limited to approvals and mission changes.", state.reducedUpdates) + '</section><section class="panel settings-section"><div class="content-view-head"><div><h2>AI governance</h2><p>Controls inherited from Bursa policy are visible but cannot be weakened here.</p></div>' + status("Policy managed") + '</div>' + settingToggle("Require evidence for factual answers", "Answers must retain citations to permitted sources.", true, true) + settingToggle("Human approval for external actions", "Publishing, sending and permission changes always pause for review.", true, true) + settingToggle("Use synthetic demo activity", "Keep all people and operational counts in illustrative mode.", true, true) + '</section></div></div></section>';
  }

  function settingToggle(title, detail, on, locked) {
    return '<div class="settings-field"><span><strong>' + title + '</strong><small>' + detail + '</small></span><button class="switch ' + (on ? "is-on" : "") + '" type="button" data-setting-toggle="' + escapeHtml(title) + '" aria-pressed="' + String(on) + '"' + (locked ? " disabled" : "") + '></button></div>';
  }

  function openExperience(options) {
    lastFocusedControl = document.activeElement;
    experienceTitle.textContent = options.title || "BursaIQ";
    experienceSubtitle.textContent = options.subtitle || "";
    experienceBody.innerHTML = options.body || "";
    experienceFoot.innerHTML = options.footer || '<button class="secondary-button" type="button" data-experience-close>Close</button>';
    experienceOverlay.hidden = false;
    appShell.inert = true;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(function () {
      experienceOverlay.classList.add("is-open");
      var focusTarget = experienceBody.querySelector("input, textarea, select, button") || document.getElementById("experience-close");
      focusTarget.focus();
    });
  }

  function closeExperience() {
    experienceOverlay.classList.remove("is-open");
    appShell.inert = false;
    document.body.style.overflow = "";
    window.setTimeout(function () {
      experienceOverlay.hidden = true;
      experienceBody.innerHTML = "";
      experienceFoot.innerHTML = "";
      if (lastFocusedControl && document.contains(lastFocusedControl)) lastFocusedControl.focus();
    }, 180);
  }

  function creationConfig(type) {
    var config = {
      mission: ["Create AI mission", "Define the outcome; BursaIQ will propose the specialist team and approval path.", "Mission name", "e.g. Prepare the quarterly market readiness brief", "Desired outcome", "Describe what success should look like…", "Create mission"],
      workflow: ["Create workflow", "Turn a repeatable process into a governed sequence of people, agents and approvals.", "Workflow name", "e.g. Weekly project digest", "Process to automate", "Describe the trigger, steps and desired result…", "Open workflow builder"],
      room: ["Create collaborative room", "Bring the right colleagues, evidence and AI specialists into one mission space.", "Room name", "e.g. Market Data Pilot", "Shared mission", "What will this room accomplish?", "Create room"],
      skill: ["Teach a reusable skill", "Package trusted instructions, examples and boundaries for the Intelligence Exchange.", "Skill name", "e.g. Budget Justification", "What should BursaIQ learn?", "Describe the method and quality bar…", "Start teaching"],
      project: ["Create project", "Establish a governed home for files, decisions and mission context.", "Project name", "e.g. Institutional Data Services", "Project objective", "Describe the outcome and accountable team…", "Create project"],
      connector: ["Request a connector", "Submit a scoped request for an approved system or data source.", "System name", "e.g. Records Management", "Business need", "Explain the data and actions required…", "Submit request"],
      policy: ["Verification policy", "Policy-managed controls keep evidence and accountability in every high-impact workflow.", "Policy question", "e.g. Which actions require approval?", "Context", "Describe the workflow or decision you are checking…", "Ask policy agent"]
    }[type] || null;
    return config;
  }

  function openCreation(type) {
    if (type === "assistant") {
      navigate("assistant");
      window.setTimeout(function () { var input = document.getElementById("assistant-input"); if (input) input.focus(); }, 60);
      return;
    }
    var config = creationConfig(type);
    if (!config) return;
    if (type === "mission") {
      openExperience({
        title: "Configure ADV mission",
        subtitle: "A real deterministic run over the two approved synthetic CSV files.",
        body: '<form class="creation-form mission-form" id="creation-form" data-creation-type="mission"><label class="form-field">Mission title<input name="title" maxlength="140" required value="Malaysia Equity Market ADV Intelligence Report"></label><label class="form-field">Business objective<textarea name="description" maxlength="1000" required>Analyse Malaysia\'s equity market Average Daily Trading Value (ADV), explain key shifts, visualise important patterns and prepare an executive report for review.</textarea></label><div class="form-split"><label class="form-field">Start date<input type="date" name="dateStart" min="2026-01-01" max="2026-09-30" value="2026-01-01" required></label><label class="form-field">End date<input type="date" name="dateEnd" min="2026-01-01" max="2026-09-30" value="2026-09-30" required></label></div><fieldset class="mission-board-scope"><legend>Market-board scope</legend><label><input type="checkbox" name="board" value="MAIN MARKET" checked>Main Market</label><label><input type="checkbox" name="board" value="ACE MARKET" checked>ACE Market</label><label><input type="checkbox" name="board" value="LEAP MARKET" checked>LEAP Market</label><label><input type="checkbox" name="board" value="SECOND BOARD" checked>Second Board</label><label><input type="checkbox" name="board" value="STRCWARR" checked>Structured Warrants</label><label><input type="checkbox" name="board" value="EXCHANGE TRADED" checked>Exchange Traded</label><label><input type="checkbox" name="board" value="LOANS" checked>Loans</label></fieldset><div class="mission-worker-plan"><strong>Execution plan</strong><ol><li>Mission Manager validates scope</li><li>Data Agent checks source quality</li><li>Analysis Agent recomputes figures</li><li>Insight Agent writes bounded findings</li><li>Report Agent exports and verifies PDF</li></ol></div><p class="form-hint">Synthetic demonstration data only. The run is persisted locally and never sends data to a language model.</p><p class="form-error" id="mission-form-error" hidden></p></form>',
        footer: '<button class="secondary-button" type="button" data-experience-close>Cancel</button><button class="primary-button" type="submit" form="creation-form">Create and run mission</button>'
      });
      return;
    }
    openExperience({
      title: config[0],
      subtitle: config[1],
      body: '<form class="creation-form" id="creation-form" data-creation-type="' + type + '"><label class="form-field">' + config[2] + '<input name="title" maxlength="90" required placeholder="' + config[3] + '"></label><label class="form-field">' + config[4] + '<textarea name="description" maxlength="420" required placeholder="' + config[5] + '"></textarea></label><div class="form-split"><label class="form-field">Accountable owner<select name="owner"><option>Lim Kim Hoong</option><option>Product Development</option><option>Assign later</option></select></label><label class="form-field">Governance<select name="governance"><option>Standard approval</option><option>High-impact review</option><option>Read-only research</option></select></label></div><p class="form-hint">Synthetic demo only. No external system will be changed.</p></form>',
      footer: '<button class="secondary-button" type="button" data-experience-close>Cancel</button><button class="primary-button" type="submit" form="creation-form">' + config[6] + '</button>'
    });
  }

  function routeHomeCommand(command) {
    var button = document.getElementById("home-send");
    if (button) {
      button.disabled = true;
      button.setAttribute("aria-label", "BursaIQ is routing your request");
    }
    return apiJson("/api/intent-route", {
      method: "POST",
      body: JSON.stringify({ command: command, provider: state.routingProvider })
    }).then(function (decision) {
      if (decision.route === "mission") {
        openCreation("mission");
        var form = document.getElementById("creation-form");
        if (form) {
          form.elements.title.value = decision.title;
          form.elements.description.value = decision.objective;
        }
        toast("Live model routed this to My Workforce", decision.reason || "Review the mission scope, then start the governed run.");
        return;
      }
      state.assistantMessages = [];
      navigate("assistant");
      window.setTimeout(function () { submitAssistant(command); }, 80);
    }).catch(function (error) {
      toast("Live routing unavailable", error.message + " No keyword fallback was used.");
      if (button) {
        button.disabled = false;
        button.setAttribute("aria-label", "Start with BursaIQ");
      }
    });
  }

  function completeCreation(form) {
    var data = new FormData(form);
    var type = form.dataset.creationType;
    var title = String(data.get("title") || "Untitled").trim();
    if (!title) return;
    if (type === "mission") {
      var submit = form.querySelector('[type="submit"]') || document.querySelector('[type="submit"][form="' + form.id + '"]');
      var error = form.querySelector(".form-error") || form.closest(".mission-launch") && form.closest(".mission-launch").querySelector(".form-error") || document.getElementById("mission-form-error");
      var boards = Array.prototype.slice.call(form.querySelectorAll('[name="board"]:checked')).map(function (input) { return input.value; });
      var scope = String(data.get("scope") || "");
      if (!boards.length && scope === "all") boards = ["MAIN MARKET", "ACE MARKET", "LEAP MARKET", "SECOND BOARD", "STRCWARR", "EXCHANGE TRADED", "LOANS"];
      else if (!boards.length && scope) boards = [scope];
      if (!boards.length) {
        error.hidden = false;
        error.textContent = "Select at least one market board to continue.";
        return;
      }
      submit.disabled = true;
      submit.textContent = "Creating mission…";
      apiJson("/api/missions", { method: "POST", body: JSON.stringify({ title: title, objective: String(data.get("description") || ""), requestedBy: "Lim Kim Hoong", dateStart: data.get("dateStart"), dateEnd: data.get("dateEnd"), boards: boards }) }).then(function (mission) {
        return apiJson("/api/missions/" + encodeURIComponent(mission.id) + "/run", { method: "POST", body: "{}" }).then(function () { return mission; });
      }).then(function (mission) {
        if (form.closest("#experience-overlay")) closeExperience();
        state.page = "workforce";
        state.selectedMissionId = mission.id;
        return loadMissions(true).then(function () {
          startMissionPolling(mission.id, true);
          window.setTimeout(function () { openMission(mission.id); }, 220);
          toast("Mission started", "The five-worker ADV mission is running against the approved CSV files.");
        });
      }).catch(function (problem) {
        submit.disabled = false;
        submit.textContent = "Create and run mission";
        error.hidden = false;
        error.textContent = problem.message;
      });
      return;
    }
    if (type === "room") rooms.unshift({ id: "room-" + Date.now(), title: title, tag: "New", members: 1, agents: 2, description: String(data.get("description") || "New shared mission") });
    if (type === "skill") assets.unshift({ title: title, type: "AI Skill", icon: "i-cube", tone: "violet", description: String(data.get("description") || "New reusable capability"), owner: "Product Development", uses: "Draft", verified: false });
    closeExperience();
    if (type === "mission") navigate("workforce");
    else if (type === "workflow") { state.automationTab = "workflows"; navigate("automation"); }
    else if (type === "room") { state.selectedRoom = rooms[0].id; navigate("rooms"); }
    else if (type === "skill") navigate("exchange");
    else if (type === "project") navigate("workspace");
    else if (type === "connector") navigate("connectors");
    else if (type === "policy") navigate("verification");
    window.setTimeout(function () { toast(configuredTitle(type), title + " is ready in this browser session."); }, 180);
  }

  function configuredTitle(type) {
    return { mission: "Mission created", workflow: "Workflow draft created", room: "Room created", skill: "Skill draft created", project: "Project created", connector: "Connector request submitted", policy: "Policy answer ready" }[type] || "Created";
  }

  function openAsset(title) {
    var asset = assets.filter(function (item) { return item.title === title; })[0] || assets[0];
    openExperience({
      title: asset.title,
      subtitle: asset.type + " · " + asset.owner + " · " + asset.uses,
      body: '<div class="asset-detail-hero">' + miniIcon(asset.icon, asset.tone) + '<div><span class="status green">' + svg("i-check") + ' Verified intelligence</span><p>' + asset.description + '</p></div></div><div class="detail-grid"><article><small>What it can do</small><strong>Turn an approved request into a reusable, governed result.</strong></article><article><small>Access boundary</small><strong>Uses only sources already permitted to the employee.</strong></article><article><small>Human control</small><strong>External actions pause for accountable approval.</strong></article><article><small>Last verified</small><strong>Today · synthetic demonstration state</strong></article></div><div class="detail-callout">' + svg("i-shield") + '<span><strong>Intelligence Passport included</strong><small>Owner, sources, version and reuse history travel with this asset.</small></span></div>',
      footer: '<button class="secondary-button" type="button" data-dialog-action="save-asset" data-context="' + escapeHtml(asset.title) + '">Save</button><button class="primary-button" type="button" data-dialog-action="use-asset" data-context="' + escapeHtml(asset.title) + '">Use in workspace</button>'
    });
  }

  function openAgent(name) {
    var agent = agents.filter(function (item) { return item.name === name; })[0] || agents[0];
    openExperience({
      title: agent.name,
      subtitle: agent.job,
      body: '<div class="agent-profile">' + miniIcon("i-spark", agent.tone) + '<div><span class="status green"><i class="dot"></i> ' + agent.state + '</span><p>Specialist agent operating inside your existing Bursa permissions and approval controls.</p></div></div><div class="agent-capabilities"><article><strong>Find and synthesise</strong><small>Search approved internal knowledge with citations.</small></article><article><strong>Work with your team</strong><small>Join missions and rooms with visible responsibilities.</small></article><article><strong>Escalate responsibly</strong><small>Pause when human judgment or permission is required.</small></article></div><label class="form-field">Task for this agent<textarea id="agent-task" placeholder="Describe the result you need…"></textarea></label>',
      footer: '<button class="secondary-button" type="button" data-experience-close>Close</button><button class="primary-button" type="button" data-dialog-action="assign-agent" data-context="' + escapeHtml(agent.name) + '">Assign task</button>'
    });
  }

  function missionChart(monthly) {
    if (!monthly || !monthly.length) return "";
    var width = 520;
    var height = 190;
    var values = monthly.map(function (item) { return Number(item.advBn); });
    var minimum = Math.min.apply(null, values) * .96;
    var maximum = Math.max.apply(null, values) * 1.04;
    var range = Math.max(.01, maximum - minimum);
    var points = values.map(function (value, index) {
      var x = 34 + index * ((width - 68) / Math.max(1, values.length - 1));
      var y = 138 - ((value - minimum) / range) * 96;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    return '<div class="mission-result-chart"><svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Monthly Average Daily Trading Value in RM billions"><title>Monthly ADV</title><g class="mission-chart-grid"><path d="M28 42H492M28 90H492M28 138H492"></path></g><polyline points="' + points + '"></polyline><g class="mission-chart-points">' + values.map(function (value, index) { var x = 34 + index * ((width - 68) / Math.max(1, values.length - 1)); var y = 138 - ((value - minimum) / range) * 96; return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4"></circle><text x="' + x.toFixed(1) + '" y="' + (y - 10).toFixed(1) + '" text-anchor="middle">' + value.toFixed(2) + '</text><text x="' + x.toFixed(1) + '" y="166" text-anchor="middle">' + escapeHtml(monthly[index].label.split(" ")[0]) + '</text>'; }).join("") + '</g></svg></div>';
  }

  function missionLifecycleMarkup(mission) {
    var progress = Number(mission.progress || 0);
    var statusValue = mission.status || "PLANNED";
    var healthy = statusValue !== "FAILED";
    var verificationActive = ["DRAFT READY", "AWAITING REVIEW", "REVISION REQUESTED"].indexOf(statusValue) !== -1;
    var approved = statusValue === "APPROVED";
    var stages = [
      ["Research", "Validate approved CSVs", healthy && (progress >= 50 || verificationActive || approved), healthy && progress < 50],
      ["Synthesis", "Calculate and explain", healthy && progress >= 100, healthy && progress >= 50 && progress < 100],
      ["Verification", "Review dashboard and PDF", approved, verificationActive],
      ["Exchange", "Approve for reuse", approved, false]
    ];
    return '<div class="journey-wrap mission-detail-lifecycle" aria-label="Mission lifecycle"><div class="mission-journey">' + stages.map(function (stage, index) {
      var itemClass = stage[2] ? "is-done" : stage[3] ? "is-active" : "";
      return '<div class="journey-step ' + itemClass + '" data-step="' + (index + 1) + '"><strong>' + stage[0] + '</strong>' + stage[1] + '</div>';
    }).join("") + '</div></div>';
  }

  function missionDetailMarkup(mission) {
    var events = mission.events || [];
    var latestByWorker = {};
    events.forEach(function (event) { if (event.workerId !== "mission-manager" || !latestByWorker[event.workerId]) latestByWorker[event.workerId] = event; });
    var workerMarkup = missionAgents.map(function (agent, index) {
      var workerId = ["mission-manager", "data-agent", "analysis-agent", "insight-agent", "report-agent"][index];
      var matching = events.filter(function (event) { return event.workerId === workerId; });
      var event = matching[matching.length - 1];
      var stateLabel = event ? event.status : "QUEUED";
      var itemClass = stateLabel === "COMPLETED" || stateLabel === "DRAFT READY" ? "is-done" : stateLabel === "RUNNING" ? "is-active" : stateLabel === "FAILED" ? "is-failed" : "";
      return '<article class="' + itemClass + '">' + miniIcon(index === 1 ? "i-folder" : index === 4 ? "i-document" : "i-spark", agent.tone) + '<span><strong>' + agent.name + '</strong><small>' + escapeHtml(event ? event.message : agent.job) + '</small>' + (event && event.payload && Object.keys(event.payload).length ? '<button type="button" data-worker-evidence="' + workerId + '">Inspect output</button>' : "") + '</span>' + missionStatus(stateLabel) + '</article>';
    }).join("");
    var result = mission.result;
    var resultMarkup = "";
    if (result) {
      resultMarkup = '<section class="mission-results"><div class="mission-result-head"><div><h3>Verified mission output</h3><p>' + escapeHtml(result.classification) + '</p></div>' + missionStatus(mission.status) + '</div><div class="mission-kpis"><article><small>Period ADV</small><strong>RM' + Number(result.metrics.periodAdvBn).toFixed(3) + 'bn</strong><span>' + result.metrics.tradingDays + ' trading days</span></article><article><small>Total traded value</small><strong>' + formatMoneyBn(result.metrics.totalTradedValueMyr) + '</strong><span>Selected scope</span></article><article><small>First → last month</small><strong>' + (result.metrics.firstToLastChangePct >= 0 ? "+" : "") + Number(result.metrics.firstToLastChangePct).toFixed(2) + '%</strong><span>Monthly ADV change</span></article></div>' + missionChart(result.monthly) + '<div class="mission-findings"><h3>Management read</h3>' + result.findings.map(function (finding) { return '<p>' + svg("i-check") + '<span>' + escapeHtml(finding) + '</span></p>'; }).join("") + '<small>' + escapeHtml(result.interpretationBoundary) + '</small></div><div class="mission-method"><strong>Calculation trace</strong><code>' + escapeHtml(result.formula) + '</code><span>' + escapeHtml(result.scope.tradingDayRule) + ' · ' + result.quality.marketRowsEligible.toLocaleString() + ' eligible market rows</span></div></section>';
    }
    var failure = mission.error ? '<div class="mission-failure">' + svg("i-help") + '<span><strong>Mission failed</strong><small>' + escapeHtml(mission.error) + ' Correct the inputs and run again.</small></span></div>' : "";
    return '<div class="mission-detail-progress"><div><span>' + escapeHtml(mission.id) + ' · ' + escapeHtml(mission.dateStart) + ' → ' + escapeHtml(mission.dateEnd) + '</span>' + missionStatus(mission.status) + '</div><span class="progress-track"><i style="width:' + Number(mission.progress || 0) + '%"></i></span></div>' + missionLifecycleMarkup(mission) + failure + '<div class="mission-detail-journey live-worker-journey">' + workerMarkup + '</div>' + resultMarkup;
  }

  function missionFooter(mission) {
    var controls = '<button class="secondary-button" type="button" data-mission-rerun="' + escapeHtml(mission.id) + '">Rerun with new dates</button>';
    if (mission.downloadUrl) controls += '<a class="secondary-button" href="' + escapeHtml(mission.downloadUrl) + '" target="_blank" rel="noopener">Open PDF</a>';
    if (mission.status === "DRAFT READY" || mission.status === "REVISION REQUESTED") controls += '<button class="primary-button" type="button" data-mission-submit-review="' + escapeHtml(mission.id) + '">Submit for review</button>';
    else if (mission.status === "AWAITING REVIEW") controls += '<button class="primary-button" type="button" data-page-target="verification">Open Verification Centre</button>';
    else if (mission.status === "APPROVED") controls += '<span class="status green">Approved for reuse</span>';
    return controls;
  }

  function openMission(id) {
    state.selectedMissionId = id;
    apiJson("/api/missions/" + encodeURIComponent(id)).then(function (mission) {
      var existing = missionById(id);
      if (existing) Object.assign(existing, mission);
      else state.liveMissions.unshift(mission);
      openExperience({ title: mission.title, subtitle: "Live mission · worker outputs, calculations and deliverables", body: missionDetailMarkup(mission), footer: missionFooter(mission) });
      if (mission.status === "RUNNING" || mission.status === "PLANNED") startMissionPolling(id, false);
    }).catch(function (error) { toast("Mission unavailable", error.message); });
  }

  function refreshOpenMission(mission) {
    if (state.selectedMissionId !== mission.id || experienceOverlay.hidden) return;
    var scrollTop = experienceBody.scrollTop;
    experienceBody.classList.add("is-live-refresh");
    experienceTitle.textContent = mission.title;
    experienceSubtitle.textContent = "Live mission · " + missionDisplayStatus(mission.status) + " · " + mission.progress + "%";
    experienceBody.innerHTML = missionDetailMarkup(mission);
    experienceFoot.innerHTML = missionFooter(mission);
    experienceBody.scrollTop = scrollTop;
    window.requestAnimationFrame(function () { experienceBody.classList.remove("is-live-refresh"); });
  }

  function bindMissionOpenButtons(scope) {
    (scope || root).querySelectorAll("[data-mission]").forEach(function (button) {
      button.addEventListener("click", function () { openMission(button.dataset.mission); });
    });
  }

  function refreshMissionRow(mission) {
    if (state.page !== "workforce") return;
    var currentRow = root.querySelector('[data-mission-row="' + window.CSS.escape(mission.id) + '"]');
    if (!currentRow) return;
    var holder = document.createElement("tbody");
    holder.innerHTML = missionRow(mission);
    var nextRow = holder.firstElementChild;
    currentRow.replaceWith(nextRow);
    bindMissionOpenButtons(nextRow);
  }

  function startMissionPolling(id, forceOpen) {
    if (state.missionPoll) window.clearInterval(state.missionPoll);
    var poll = function () {
      apiJson("/api/missions/" + encodeURIComponent(id)).then(function (mission) {
        var existing = missionById(id);
        if (existing) Object.assign(existing, mission);
        else state.liveMissions.unshift(mission);
        refreshMissionRow(mission);
        refreshOpenMission(mission);
        if (["RUNNING", "PLANNED"].indexOf(mission.status) === -1) {
          window.clearInterval(state.missionPoll);
          state.missionPoll = null;
          if (mission.status === "DRAFT READY") toast("Draft ready", "The dashboard and PDF were produced from the same verified metrics.");
        }
      }).catch(function () {
        window.clearInterval(state.missionPoll);
        state.missionPoll = null;
      });
    };
    if (forceOpen) poll();
    state.missionPoll = window.setInterval(poll, 650);
  }

  function openReview(context) {
    openExperience({
      title: context || "Review package",
      subtitle: "Human approval checkpoint · synthetic demo",
      body: '<div class="review-summary"><div class="evidence-score"><span><strong>92%</strong><small>Evidence coverage</small></span><div><b>Ready with one clarification</b><small>12 sources checked · 1 calculation flagged</small></div></div><div class="review-checks"><article>' + svg("i-check") + '<span><strong>Sources permitted</strong><small>All evidence is available to your role.</small></span></article><article>' + svg("i-check") + '<span><strong>Owner accountable</strong><small>Product Development retains final responsibility.</small></span></article><article class="needs-review">' + svg("i-help") + '<span><strong>One claim needs attention</strong><small>Confirm the latest percentage before approval.</small></span></article></div><label class="form-field">Reviewer note<textarea placeholder="Add context for the requester…"></textarea></label></div>',
      footer: '<button class="secondary-button" type="button" data-dialog-action="request-change" data-context="' + escapeHtml(context || "package") + '">Request changes</button><button class="primary-button" type="button" data-dialog-action="approve-package" data-context="' + escapeHtml(context || "package") + '">Approve</button>'
    });
  }

  function openInfoPanel(action, context) {
    if (action === "notifications") {
      openExperience({ title: "Notifications", subtitle: "You are all caught up", body: '<div class="clean-empty"><strong>No notifications</strong><p>Approvals, mentions and mission updates will appear here.</p></div>', footer: '<button class="primary-button" type="button" data-experience-close>Close</button>' });
      return;
    }
    if (action === "apps") { navigate("connectors"); return; }
    if (action === "identity") {
      openExperience({ title: "Lim Kim Hoong", subtitle: "Product Development · Demo identity", body: '<div class="identity-profile"><span>KH</span><div><strong>Employee workspace</strong><small>Role-aware access inherited from Product Development.</small></div></div><div class="detail-grid"><article><small>Primary workspace</small><strong>Product Development</strong></article><article><small>Approval role</small><strong>Mission owner</strong></article><article><small>Connected systems</small><strong>4 approved</strong></article><article><small>Demo mode</small><strong>Synthetic activity enabled</strong></article></div>', footer: '<button class="secondary-button" type="button" data-page-target="settings">Open settings</button><button class="primary-button" type="button" data-experience-close>Done</button>' });
      return;
    }
    if (action === "help") {
      openExperience({ title: "IQ Guide", subtitle: "A fast orientation to the AI workforce", body: '<div class="guide-steps"><article><b>1</b><span><strong>Ask or define an outcome</strong><small>Begin on Home or with the AI Assistant.</small></span></article><article><b>2</b><span><strong>Let BursaIQ assemble the work</strong><small>Agents, knowledge and approvals become one mission.</small></span></article><article><b>3</b><span><strong>Verify before impact</strong><small>Evidence and human accountability remain visible.</small></span></article><article><b>4</b><span><strong>Reuse what works</strong><small>Publish approved intelligence back to the Exchange.</small></span></article></div>', footer: '<button class="secondary-button" type="button" data-experience-close>Close</button><button class="primary-button" type="button" data-page-target="assistant">Ask BursaIQ</button>' });
      return;
    }
    if (action === "review" || action === "approve" || action === "request-changes") { openReview(context); return; }
    if (action === "agent") { openAgent(context || agents[0].name); return; }
    if (action === "canvas") { openExperience({ title: "Decision Canvas", subtitle: "A structured view of evidence, assumptions and next actions", body: '<div class="canvas-grid"><article><small>Decision</small><strong>Advance the product-readiness review</strong><p>Proceed once the remaining customer evidence and pricing assumption are verified.</p></article><article><small>Evidence</small><strong>12 governed sources</strong><p>Requirements, validation notes and accountable decision records.</p></article><article><small>Open assumptions</small><strong>2 items</strong><p>Customer evidence coverage and pricing baseline.</p></article><article><small>Recommended action</small><strong>Review the evidence</strong><p>Complete the two checks before the stakeholder review.</p></article></div>', footer: '<button class="secondary-button" type="button" data-dialog-action="canvas-copy">Copy summary</button><button class="primary-button" type="button" data-page-target="assistant">Return to Q&amp;A</button>' }); return; }
    if (action === "sources") { openExperience({ title: "Permitted source scope", subtitle: "What this assistant can use for the current request", body: '<div class="source-list"><article>' + miniIcon("i-folder", "blue") + '<span><strong>Product Development knowledge</strong><small>12 governed files · read access</small></span>' + status("Active") + '</article><article>' + miniIcon("i-book", "teal") + '<span><strong>Internal Knowledge Base</strong><small>Policies and approved guidance</small></span>' + status("Active") + '</article><article>' + miniIcon("i-shield", "violet") + '<span><strong>Verified market evidence</strong><small>3 permitted source groups</small></span>' + status("Active") + '</article></div>', footer: '<button class="primary-button" type="button" data-experience-close>Understood</button>' }); return; }
    if (action === "internal-sources") { openExperience({ title: "Ask Bursa source scope", subtitle: "Internal guidance available within your existing role", body: '<div class="source-list"><article>' + miniIcon("i-agents", "blue") + '<span><strong>Human Resources</strong><small>Employee services and workplace guidance</small></span>' + status("Active") + '</article><article>' + miniIcon("i-settings", "violet") + '<span><strong>Group Technology (GT)</strong><small>Services, access, devices, and security</small></span>' + status("Active") + '</article><article>' + miniIcon("i-shield", "teal") + '<span><strong>Regulations</strong><small>Controlled internal notices and guidance</small></span>' + status("Active") + '</article><article>' + miniIcon("i-exchange", "amber") + '<span><strong>Market Operations</strong><small>Operational processes and escalation paths</small></span>' + status("Active") + '</article></div>', footer: '<button class="primary-button" type="button" data-experience-close>Understood</button>' }); return; }
    if (action === "test-run" || action === "run-now") { openRunPanel(context || (action === "test-run" ? "Board Pack Distribution" : "Selected workflow")); return; }
    var title = context || action.replace(/-/g, " ").replace(/^./, function (letter) { return letter.toUpperCase(); });
    openExperience({ title: title, subtitle: "Interactive front-end demonstration", body: '<div class="detail-callout">' + svg("i-spark") + '<span><strong>This workspace is ready</strong><small>The control now opens a complete, synthetic demo state without changing external systems.</small></span></div><div class="detail-grid"><article><small>Scope</small><strong>Current employee workspace</strong></article><article><small>Governance</small><strong>Human approval retained</strong></article></div>', footer: '<button class="primary-button" type="button" data-experience-close>Done</button>' });
  }

  function openRunPanel(name) {
    openExperience({ title: name, subtitle: "Governed workflow execution", body: '<div class="run-animation"><div class="run-track"><i></i></div><div class="run-stages"><span class="is-done">Trigger</span><span class="is-active">Gather data</span><span>Summarise</span><span>Approve</span><span>Publish</span></div></div><div class="execution-log" aria-live="polite"><article><time>Now</time><span><strong>Trigger validated</strong><small>Schedule and owner confirmed.</small></span>' + status("Completed") + '</article><article><time>Now</time><span><strong>Retrieving governed inputs</strong><small>Checking permitted repositories and current versions.</small></span>' + status("Active") + '</article><article class="is-muted"><time>Next</time><span><strong>Human approval checkpoint</strong><small>The workflow will pause before distribution.</small></span>' + status("Pending") + '</article></div>', footer: '<button class="secondary-button" type="button" data-dialog-action="stop-run">Stop run</button><button class="primary-button" type="button" data-experience-close>Run in background</button>' });
  }

  function render() {
    var html;
    if (state.page === "home") html = homePage();
    else if (state.page === "assistant") html = assistantPage();
    else if (state.page === "ask-bursa") html = askBursaPage();
    else if (state.page === "workforce") html = workforcePage();
    else if (state.page === "exchange") html = exchangePage();
    else if (state.page === "automation") html = automationPage();
    else if (state.page === "rooms") html = roomsPage();
    else if (state.page === "workspace") html = workspacePage();
    else if (state.page === "brief") html = briefPage();
    else if (state.page === "verification") html = verificationPage();
    else if (state.page === "connectors") html = connectorsPage();
    else if (state.page === "action") html = actionPage();
    else if (state.page === "settings") html = settingsPage();
    else html = homePage();
    root.innerHTML = html;
    document.querySelectorAll(".nav-link[data-page]").forEach(function (button) {
      var active = button.dataset.page === state.page;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.title = (pages[state.page] ? pages[state.page][0] : "BursaIQ") + " — BursaIQ";
    var actionCount = document.getElementById("action-nav-count");
    if (actionCount) actionCount.textContent = String(state.savedDecisions.length + state.emailAutomations.length);
    bindPageEvents();
  }

  function navigate(page) {
    if (!pages[page]) return;
    state.page = page;
    render();
    closeMobileNav();
    document.getElementById("main-content").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (page === "workforce" || page === "verification") loadMissions(true);
  }

  function bindPageEvents() {
    var inlineMissionForm = document.getElementById("mission-inline-form");
    if (inlineMissionForm) inlineMissionForm.addEventListener("submit", function (event) { event.preventDefault(); completeCreation(inlineMissionForm); });
    root.querySelectorAll("[data-page-jump]").forEach(function (button) {
      button.addEventListener("click", function () { navigate(button.dataset.pageJump); });
    });
    root.querySelectorAll("[data-assistant-prompt]").forEach(function (button) {
      button.addEventListener("click", function () {
        var prompt = button.dataset.assistantPrompt;
        if (state.page !== "assistant") {
          state.assistantMessages = [];
          navigate("assistant");
          window.setTimeout(function () { submitAssistant(prompt); }, 60);
        } else {
          submitAssistant(prompt);
        }
      });
    });
    root.querySelectorAll("[data-bursa-prompt]").forEach(function (button) {
      button.addEventListener("click", function () {
        var prompt = button.dataset.bursaPrompt;
        if (state.page !== "ask-bursa") {
          state.askBursaMessages = [];
          navigate("ask-bursa");
          window.setTimeout(function () { submitAskBursa(prompt); }, 60);
        } else {
          submitAskBursa(prompt);
        }
      });
    });
    root.querySelectorAll("[data-assistant-canvas-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectAssistantCanvasTab(button.dataset.assistantCanvasTab, !button.closest(".canvas-tabs"));
      });
    });
    var canvasTabList = root.querySelector(".canvas-tabs");
    if (canvasTabList) {
      canvasTabList.addEventListener("keydown", function (event) {
        var order = ["plot", "analysis", "source", "action"];
        var current = order.indexOf(state.assistantCanvasTab);
        var next = current;
        if (event.key === "ArrowRight") next = (current + 1) % order.length;
        else if (event.key === "ArrowLeft") next = (current + order.length - 1) % order.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = order.length - 1;
        else return;
        event.preventDefault();
        selectAssistantCanvasTab(order[next], false);
      });
    }
    var canvasEntry = root.querySelector("[data-assistant-canvas-entry]");
    if (canvasEntry) {
      canvasEntry.addEventListener("click", function () { selectAssistantCanvasTab(state.assistantCanvasTab, true); });
    }
    root.querySelectorAll("[data-demo-action]").forEach(function (button) {
      button.addEventListener("click", function () { demoAction(button.dataset.demoAction, button.dataset.actionContext || button.closest("li, article, tr") && button.closest("li, article, tr").querySelector("strong") && button.closest("li, article, tr").querySelector("strong").textContent); });
    });
    root.querySelectorAll("[data-create]").forEach(function (button) {
      button.addEventListener("click", function () { createAction(button.dataset.create); });
    });
    root.querySelectorAll("[data-asset-use]").forEach(function (button) {
      button.addEventListener("click", function () { openAsset(button.dataset.assetUse); });
    });
    root.querySelectorAll("[data-asset-open]").forEach(function (button) {
      button.addEventListener("click", function () { openAsset(button.dataset.assetOpen); });
    });
    root.querySelectorAll("[data-agent-open]").forEach(function (button) {
      button.addEventListener("click", function () { openAgent(button.dataset.agentOpen); });
    });
    root.querySelectorAll("[data-metric-context]").forEach(function (button) {
      button.addEventListener("click", function () { openInfoPanel("detail", button.dataset.metricContext); });
    });
    root.querySelectorAll("[data-home-asset-type]").forEach(function (button) {
      button.addEventListener("click", function () { state.homeAssetCategory = button.dataset.homeAssetType; render(); });
    });

    var routingProvider = document.getElementById("routing-provider");
    if (routingProvider) {
      routingProvider.addEventListener("change", function () {
        state.routingProvider = routingProvider.value;
        try { window.localStorage.setItem("bursaiq-routing-provider", state.routingProvider); } catch (_error) {}
        render();
      });
    }
    var homeSend = document.getElementById("home-send");
    if (homeSend) {
      homeSend.addEventListener("click", function () {
        var input = document.getElementById("home-command");
        var value = input.value.trim();
        if (!value) value = "Prepare a product launch readiness brief";
        routeHomeCommand(value);
      });
    }

    var assistantForm = document.getElementById("assistant-form");
    if (assistantForm) {
      assistantForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = document.getElementById("assistant-input");
        var value = input.value.trim();
        if (value) submitAssistant(value);
      });
    }

    var askBursaForm = document.getElementById("ask-bursa-form");
    if (askBursaForm) {
      askBursaForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = document.getElementById("ask-bursa-input");
        var value = input.value.trim();
        if (value) submitAskBursa(value);
      });
    }

    root.querySelectorAll("[data-canvas-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.dataset.canvasAction === "memory") saveAssistantDecision();
        else scheduleAssistantEmail();
      });
    });
    root.querySelectorAll("[data-action-open]").forEach(function (button) {
      button.addEventListener("click", function () {
        var item = state.savedDecisions.find(function (decision) { return decision.id === button.dataset.actionOpen; });
        if (!item) return;
        openExperience({ title: item.title, subtitle: "Decision Memory · " + item.id, body: '<div class="detail-callout">' + svg("i-shield") + '<span><strong>Evidence context retained</strong><small>This decision record remains linked to the governed answer that created it.</small></span></div><div class="detail-grid"><article><small>Original question</small><strong>' + escapeHtml(item.question) + '</strong></article><article><small>Owner</small><strong>' + escapeHtml(item.owner) + '</strong></article><article><small>Recorded</small><strong>' + escapeHtml(item.created) + '</strong></article><article><small>Status</small><strong>' + escapeHtml(item.status) + '</strong></article></div>', footer: '<button class="primary-button" type="button" data-experience-close>Done</button>' });
      });
    });
    root.querySelectorAll("[data-email-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        var item = state.emailAutomations.find(function (automation) { return automation.id === button.dataset.emailToggle; });
        if (!item) return;
        item.status = item.status === "Active" ? "Paused" : "Active";
        render();
        toast(item.status === "Active" ? "Email automation resumed" : "Email automation paused", "The synthetic schedule is now " + item.status.toLowerCase() + ".");
      });
    });

    bindMissionOpenButtons(root);
    var missionRefresh = root.querySelector("[data-mission-refresh]");
    if (missionRefresh) missionRefresh.addEventListener("click", function () { loadMissions(false); });
    root.querySelectorAll("[data-verification-mission]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedVerificationMissionId = button.dataset.verificationMission;
        render();
      });
    });
    root.querySelectorAll("[data-mission-review]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.dataset.missionId;
        button.disabled = true;
        apiJson("/api/verification/" + encodeURIComponent(missionById(id).verificationCaseId), { method: "PATCH", body: JSON.stringify({ role: "securities", status: button.dataset.missionReview }) }).then(function () {
          return loadMissions(true);
        }).then(function () {
          render();
          toast(button.dataset.missionReview === "Approved" ? "Mission approved" : "Changes requested", "The human decision is persisted in the mission audit history.");
        }).catch(function (error) {
          button.disabled = false;
          toast("Review action failed", error.message);
        });
      });
    });
    root.querySelectorAll("[data-category]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.exchangeCategory = button.dataset.category;
        render();
      });
    });
    var exchangeCategorySelect = document.getElementById("exchange-category-select");
    if (exchangeCategorySelect) {
      exchangeCategorySelect.value = state.exchangeCategory === "department" ? "featured" : state.exchangeCategory;
      exchangeCategorySelect.addEventListener("change", function () { state.exchangeCategory = exchangeCategorySelect.value; render(); });
    }
    var exchangeSearch = document.getElementById("exchange-search-input");
    if (exchangeSearch) {
      exchangeSearch.addEventListener("input", function () {
        var term = exchangeSearch.value.trim().toLowerCase();
        var visible = 0;
        root.querySelectorAll(".market-asset").forEach(function (card) {
          card.hidden = term && card.textContent.toLowerCase().indexOf(term) === -1;
          if (!card.hidden) visible += 1;
        });
        var empty = document.getElementById("exchange-empty");
        if (empty) empty.hidden = visible !== 0;
      });
    }
    root.querySelectorAll("[data-node]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedNode = button.dataset.node;
        root.querySelectorAll("[data-node]").forEach(function (node) { node.classList.toggle("is-active", node === button); });
        var config = document.getElementById("node-config");
        config.innerHTML = nodeConfig(state.selectedNode);
        config.querySelectorAll("[data-demo-action]").forEach(function (item) {
          item.addEventListener("click", function () { demoAction(item.dataset.demoAction); });
        });
        var toggle = config.querySelector(".switch");
        if (toggle) toggle.addEventListener("click", function () { toggle.classList.toggle("is-on"); });
      });
    });
    var switchButton = root.querySelector(".switch");
    if (switchButton) switchButton.addEventListener("click", function () { switchButton.classList.toggle("is-on"); });
    root.querySelectorAll("[data-room]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedRoom = button.dataset.room;
        state.roomTab = "overview";
        render();
      });
    });
    root.querySelectorAll("[data-automation-tab]").forEach(function (button) {
      button.addEventListener("click", function () { state.automationTab = button.dataset.automationTab; render(); });
    });
    root.querySelectorAll("[data-template-use]").forEach(function (button) {
      button.addEventListener("click", function () { openCreation("workflow"); var title = document.querySelector('#creation-form [name="title"]'); if (title) title.value = button.dataset.templateUse + " Workflow"; });
    });
    root.querySelectorAll("[data-run-open]").forEach(function (button) {
      button.addEventListener("click", function () { openRunPanel(button.dataset.runOpen); });
    });
    var automationSearch = document.getElementById("automation-search");
    if (automationSearch) automationSearch.addEventListener("input", function () { filterCurrentView(automationSearch.value, "[data-filter-text], .mission-table tbody tr", null); });
    root.querySelectorAll("[data-room-scope]").forEach(function (button) {
      button.addEventListener("click", function () { state.roomScope = button.dataset.roomScope; render(); });
    });
    root.querySelectorAll("[data-room-tab]").forEach(function (button) {
      button.addEventListener("click", function () { state.roomTab = button.dataset.roomTab; render(); });
    });
    var roomSearch = document.getElementById("room-search");
    if (roomSearch) roomSearch.addEventListener("input", function () { filterCurrentView(roomSearch.value, ".room-card", document.getElementById("room-empty")); });
    root.querySelectorAll("[data-workspace-view]").forEach(function (button) {
      button.addEventListener("click", function () { state.workspaceView = button.dataset.workspaceView; render(); });
    });
    var workspaceSearch = document.getElementById("workspace-search");
    if (workspaceSearch) workspaceSearch.addEventListener("input", function () { filterCurrentView(workspaceSearch.value, "[data-filter-text]", null); });
    root.querySelectorAll("[data-project-open], [data-file-open], [data-decision-open], [data-brief-item], [data-verification-open]").forEach(function (button) {
      button.addEventListener("click", function () {
        var context = button.dataset.projectOpen || button.dataset.fileOpen || button.dataset.decisionOpen || button.dataset.briefItem || button.dataset.verificationOpen;
        if (button.dataset.verificationOpen || button.dataset.briefItem && button.dataset.briefItem.toLowerCase().indexOf("review") !== -1) openReview(context);
        else openInfoPanel("detail", context);
      });
    });
    root.querySelectorAll("[data-brief-filter]").forEach(function (button) {
      button.addEventListener("click", function () { state.briefFilter = button.dataset.briefFilter; render(); });
    });
    root.querySelectorAll("[data-connector]").forEach(function (button) {
      button.addEventListener("click", function () {
        var name = button.dataset.connector;
        var connected = button.dataset.connected === "true";
        openExperience({ title: name, subtitle: connected ? "Connected through your Bursa access" : "Available with administrator approval", body: '<div class="detail-callout">' + svg("i-shield") + '<span><strong>' + (connected ? "Permission-aware connection" : "Connection request required") + '</strong><small>' + (connected ? "BursaIQ can act only within your existing role and configured approval gates." : "An administrator must approve the requested data and action scope.") + '</small></span></div><div class="detail-grid"><article><small>Data access</small><strong>' + (connected ? "Role inherited" : "Not granted") + '</strong></article><article><small>External actions</small><strong>Human approval required</strong></article><article><small>Audit</small><strong>Every request logged</strong></article><article><small>Demo boundary</small><strong>No live connection</strong></article></div>', footer: '<button class="secondary-button" type="button" data-experience-close>Close</button><button class="primary-button" type="button" data-dialog-action="' + (connected ? "manage-connector" : "request-connector") + '" data-context="' + escapeHtml(name) + '">' + (connected ? "Manage access" : "Request connection") + '</button>' });
      });
    });
    root.querySelectorAll("[data-setting-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.disabled) return;
        var on = button.classList.toggle("is-on");
        button.setAttribute("aria-pressed", String(on));
        state.reducedUpdates = button.dataset.settingToggle === "Reduce non-essential updates" ? on : state.reducedUpdates;
        var saveState = document.getElementById("settings-save-state");
        if (saveState) { saveState.textContent = "Saving…"; window.setTimeout(function () { saveState.textContent = "Saved"; }, 500); }
      });
    });
    root.querySelectorAll("[data-settings-section]").forEach(function (button) {
      button.addEventListener("click", function () {
        root.querySelectorAll("[data-settings-section]").forEach(function (item) { item.classList.toggle("is-active", item === button); });
        var label = button.textContent.trim();
        if (button.dataset.settingsSection !== "general") toast(label, "This preference group is represented in the complete demo controls below.");
      });
    });
  }

  function filterCurrentView(value, selector, empty) {
    var term = String(value || "").trim().toLowerCase();
    var visible = 0;
    root.querySelectorAll(selector).forEach(function (item) {
      var haystack = (item.dataset.filterText || item.textContent).toLowerCase();
      item.hidden = Boolean(term && haystack.indexOf(term) === -1);
      if (!item.hidden) visible += 1;
    });
    if (empty) empty.hidden = visible !== 0;
  }

  function selectAssistantCanvasTab(tab, revealCanvas) {
    state.assistantCanvasTab = tab;
    render();
    window.requestAnimationFrame(function () {
      var activeTab = root.querySelector('.canvas-tabs [data-assistant-canvas-tab="' + state.assistantCanvasTab + '"]');
      var canvas = root.querySelector(".decision-canvas");
      if (revealCanvas && canvas && window.matchMedia("(max-width: 1080px)").matches) {
        canvas.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (activeTab) {
        activeTab.focus({ preventScroll: true });
      }
    });
  }

  function submitAssistant(text) {
    state.assistantMessages.push({ role: "user", text: text });
    state.assistantMessages.push({ role: "assistant", pending: true });
    state.assistantCanvasTab = "plot";
    render();
    scrollAssistant();
    window.setTimeout(function () {
      state.assistantMessages[state.assistantMessages.length - 1] = { role: "assistant", question: text, answer: assistantAnswer(text) };
      render();
      scrollAssistant();
    }, 850);
  }

  function submitAskBursa(text) {
    state.askBursaMessages.push({ role: "user", text: text });
    state.askBursaMessages.push({ role: "assistant", pending: true });
    render();
    scrollAskBursa();
    window.setTimeout(function () {
      state.askBursaMessages[state.askBursaMessages.length - 1] = { role: "assistant", question: text, answer: askBursaAnswer(text) };
      render();
      scrollAskBursa();
    }, 650);
  }

  function scrollAskBursa() {
    window.requestAnimationFrame(function () {
      var thread = document.getElementById("ask-bursa-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  }

  function saveAssistantDecision() {
    var answer = assistantCurrentAnswer();
    if (!answer) return;
    var answerKey = assistantAnswerKey(answer);
    if (!state.savedDecisions.some(function (item) { return item.answerKey === answerKey; })) {
      state.savedDecisions.unshift({ id: "DEC-" + String(Date.now()).slice(-4), answerKey: answerKey, title: answer.title, question: assistantCurrentQuestion(), owner: "Lim Kim Hoong", created: "18 Oct 2026", status: "Recorded" });
    }
    render();
    toast("Saved to Decision Memory", "The question, rationale, owner, and evidence trail are now recorded in Action.");
  }

  function scheduleAssistantEmail() {
    var answer = assistantCurrentAnswer();
    if (!answer) return;
    var answerKey = assistantAnswerKey(answer);
    if (!state.emailAutomations.some(function (item) { return item.answerKey === answerKey; })) {
      state.emailAutomations.unshift({ id: "MAIL-" + String(Date.now()).slice(-3), answerKey: answerKey, title: answer.title, question: assistantCurrentQuestion(), schedule: "Every Monday · 8:00 AM", recipient: "My inbox", status: "Active" });
    }
    render();
    toast("Email automation scheduled", "This synthetic weekly refresh is now visible in the Action workspace. No external email was sent.");
  }

  function scrollAssistant() {
    window.requestAnimationFrame(function () {
      var thread = document.getElementById("assistant-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  }

  function demoAction(action, context) {
    if (pages[action]) {
      navigate(action);
      return;
    }
    var panelActions = ["notifications", "apps", "identity", "help", "review", "approve", "agent", "canvas", "sources", "test-run", "run-now", "request-changes", "detail", "room-item", "access-boundary", "workspace-health", "participants", "activity", "files", "tasks", "missions", "verification", "featured", "all-assets", "recommendations", "contributors", "saved", "workflows", "runs", "approvals", "calendar", "verification-history", "audit-log", "upload", "new-decision", "room-add", "export-log", "manage-agents", "decisions", "use", "view", "open"];
    if (panelActions.indexOf(action) !== -1) {
      openInfoPanel(action, context);
      return;
    }
    if (action === "briefing" || action === "verify") {
      openReview(action === "verify" ? "Product readiness answer" : "Executive briefing draft");
      return;
    }
    var messages = {
      attach: ["Demo attachment ready", "Use the Local Analysis workspace in the current BursaIQ prototype for memory-only file analysis."],
      "save-step": ["Step saved", "The workflow configuration is updated for this browser session."],
      "explore-module": ["Module ready", "The complete interactive workspace is available from the navigation."],
      "canvas-copy": ["Summary copied", "The decision summary is ready to paste in this synthetic demo."],
      "stop-run": ["Run stopped", "The synthetic workflow stopped before any external action."],
      "room-add": ["Draft added", "A new item is ready to configure in this room."],
      "export-log": ["Audit export prepared", "A synthetic CSV log is ready for the demo."],
      "request-change": ["Changes requested", "The package has returned to its accountable owner."],
      "approve-package": ["Package approved", "The verified item can continue to Exchange."],
      "mark-read": ["Notifications cleared", "All current synthetic updates are marked as read."]
    };
    var message = messages[action] || ["Demo interaction", "This control is active in the BursaIQ front-end concept."];
    toast(message[0], message[1]);
  }

  function createAction(type) {
    createMenu.hidden = true;
    createButton.setAttribute("aria-expanded", "false");
    openCreation(type);
  }

  function toast(title, detail) {
    var region = document.getElementById("toast-region");
    var item = document.createElement("div");
    item.className = "toast";
    item.innerHTML = miniIcon("i-check", "teal") + "<span><strong>" + escapeHtml(title) + "</strong><small>" + escapeHtml(detail) + "</small></span>";
    region.appendChild(item);
    window.setTimeout(function () {
      item.style.opacity = "0";
      item.style.transform = "translateY(8px)";
      window.setTimeout(function () { item.remove(); }, 220);
    }, 3200);
  }

  function commandPaletteResults(term) {
    var lower = (term || "").trim().toLowerCase();
    var primary = Object.keys(pages).filter(function (key) {
      return !lower || pages[key][0].toLowerCase().indexOf(lower) !== -1 || pages[key][1].toLowerCase().indexOf(lower) !== -1;
    }).slice(0, 7);
    var matchingAssets = assets.filter(function (asset) {
      return !lower || (asset.title + " " + asset.type + " " + asset.owner).toLowerCase().indexOf(lower) !== -1;
    }).slice(0, 4);
    var content = '<p class="command-group-title">Navigate</p>' + primary.map(function (key) {
      var item = pages[key];
      return '<button class="command-result" type="button" data-command-page="' + key + '">' + miniIcon(item[2], item[3]) + '<span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></span>' + svg("i-chevron") + "</button>";
    }).join("");
    if (matchingAssets.length) {
      content += '<p class="command-group-title">Intelligence</p>' + matchingAssets.map(function (asset) {
        return '<button class="command-result" type="button" data-command-asset="' + asset.title + '">' + miniIcon(asset.icon, asset.tone) + '<span><strong>' + asset.title + '</strong><small>' + asset.type + " · " + asset.owner + '</small></span>' + svg("i-chevron") + "</button>";
      }).join("");
    }
    if (lower) {
      content += '<p class="command-group-title">Ask BursaIQ</p><button class="command-result" type="button" data-command-ask="' + escapeHtml(term) + '">' + miniIcon("i-spark", "violet") + '<span><strong>Ask: “' + escapeHtml(term) + '”</strong><small>Open AI Assistant with this question</small></span>' + svg("i-arrow") + "</button>";
    }
    commandResults.innerHTML = content;
    bindCommandResults();
  }

  function bindCommandResults() {
    commandResults.querySelectorAll("[data-command-page]").forEach(function (button) {
      button.addEventListener("click", function () { closeCommandPalette(); navigate(button.dataset.commandPage); });
    });
    commandResults.querySelectorAll("[data-command-asset]").forEach(function (button) {
      button.addEventListener("click", function () { closeCommandPalette(); openAsset(button.dataset.commandAsset); });
    });
    commandResults.querySelectorAll("[data-command-ask]").forEach(function (button) {
      button.addEventListener("click", function () {
        var prompt = button.dataset.commandAsk;
        closeCommandPalette();
        state.assistantMessages = [];
        navigate("assistant");
        window.setTimeout(function () { submitAssistant(prompt); }, 70);
      });
    });
  }

  function openCommandPalette() {
    commandOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    commandInput.value = "";
    commandPaletteResults("");
    window.setTimeout(function () { commandInput.focus(); }, 30);
  }

  function closeCommandPalette() {
    commandOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  function closeMobileNav() {
    document.body.classList.remove("nav-open");
    document.querySelector(".main-column").inert = false;
    document.getElementById("mobile-menu").setAttribute("aria-expanded", "false");
  }

  document.querySelectorAll(".nav-link[data-page]").forEach(function (button) {
    button.addEventListener("click", function () { navigate(button.dataset.page); });
  });
  document.querySelectorAll(".sidebar [data-demo-action], .topbar [data-demo-action]").forEach(function (button) {
    button.addEventListener("click", function () { demoAction(button.dataset.demoAction, button.dataset.actionContext); });
  });
  document.getElementById("global-search").addEventListener("click", openCommandPalette);
  commandInput.addEventListener("input", function () { commandPaletteResults(commandInput.value); });
  commandOverlay.addEventListener("click", function (event) {
    if (event.target === commandOverlay) closeCommandPalette();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Tab" && !experienceOverlay.hidden) {
      var focusable = Array.prototype.slice.call(experienceOverlay.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]')).filter(function (item) { return item.offsetParent !== null; });
      if (focusable.length) {
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
    } else if (event.key === "Escape") {
      if (!experienceOverlay.hidden) closeExperience();
      closeCommandPalette();
      createMenu.hidden = true;
      createButton.setAttribute("aria-expanded", "false");
      closeMobileNav();
    }
  });
  createButton.addEventListener("click", function () {
    var willOpen = createMenu.hidden;
    createMenu.hidden = !willOpen;
    createButton.setAttribute("aria-expanded", String(willOpen));
  });
  createMenu.querySelectorAll("[data-create]").forEach(function (button) {
    button.addEventListener("click", function () { createAction(button.dataset.create); });
  });
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".create-wrap")) {
      createMenu.hidden = true;
      createButton.setAttribute("aria-expanded", "false");
    }
  });
  document.getElementById("mobile-menu").addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    document.querySelector(".main-column").inert = open;
    this.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("mobile-scrim").addEventListener("click", closeMobileNav);
  document.getElementById("experience-close").addEventListener("click", closeExperience);
  experienceOverlay.addEventListener("click", function (event) {
    if (event.target === experienceOverlay || event.target.closest("[data-experience-close]")) closeExperience();
  });
  experienceOverlay.addEventListener("submit", function (event) {
    if (event.target.id !== "creation-form") return;
    event.preventDefault();
    completeCreation(event.target);
  });
  experienceOverlay.addEventListener("click", function (event) {
    var target = event.target.closest("[data-dialog-action], [data-page-target], [data-mission-rerun], [data-mission-submit-review], [data-worker-evidence], [data-mission-back]");
    if (!target) return;
    if (target.dataset.missionBack) { openMission(target.dataset.missionBack); return; }
    if (target.dataset.workerEvidence) {
      var currentMission = missionById(state.selectedMissionId);
      if (!currentMission) return;
      var workerEvents = (currentMission.events || []).filter(function (item) { return item.workerId === target.dataset.workerEvidence; });
      var workerEvent = workerEvents[workerEvents.length - 1];
      var inputEvent = workerEvents.filter(function (item) { return item.status === "RUNNING" || item.status === "PLANNED"; })[0];
      var failureEvent = workerEvents.filter(function (item) { return item.status === "FAILED"; }).slice(-1)[0];
      var formatPayload = function (payload) { return Object.keys(payload || {}).length ? Object.keys(payload).map(function (key) { var value = payload[key]; return key.replace(/([A-Z])/g, " $1") + ": " + (Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : value); }).join(" · ") : "None recorded"; };
      var rows = '<div><dt>Status</dt><dd>' + escapeHtml(workerEvent ? workerEvent.status : "QUEUED") + '</dd></div><div><dt>Inputs</dt><dd>' + escapeHtml(formatPayload(inputEvent && inputEvent.payload)) + '</dd></div><div><dt>Outputs</dt><dd>' + escapeHtml(formatPayload(workerEvent && workerEvent.payload)) + '</dd></div><div><dt>Duration</dt><dd>' + escapeHtml(workerEvent && workerEvent.durationMs != null ? workerEvent.durationMs + " ms" : "Not completed") + '</dd></div><div><dt>Error detail</dt><dd>' + escapeHtml(failureEvent && failureEvent.payload ? failureEvent.payload.error : "No error") + '</dd></div>';
      openExperience({ title: workerEvent ? workerEvent.workerName + " execution" : "Worker execution", subtitle: "Inputs, outputs, duration and failure detail · " + currentMission.id, body: '<dl class="worker-evidence-list">' + rows + '</dl>', footer: '<button class="primary-button" type="button" data-mission-back="' + escapeHtml(currentMission.id) + '">Back to mission</button>' });
      return;
    }
    if (target.dataset.missionRerun) {
      var original = missionById(target.dataset.missionRerun);
      closeExperience();
      window.setTimeout(function () {
        openCreation("mission");
        var form = document.getElementById("creation-form");
        if (!form || !original) return;
        form.elements.title.value = original.title + " — rerun";
        form.elements.dateStart.value = original.dateStart === "2026-01-01" ? "2026-04-01" : original.dateStart;
        form.elements.dateEnd.value = original.dateEnd;
      }, 210);
      return;
    }
    if (target.dataset.missionSubmitReview) {
      var reviewId = target.dataset.missionSubmitReview;
      target.disabled = true;
      target.textContent = "Submitting…";
      apiJson("/api/missions/" + encodeURIComponent(reviewId) + "/submit-review", { method: "POST", body: "{}" }).then(function (payload) {
        var current = missionById(reviewId);
        if (current) Object.assign(current, payload.mission);
        closeExperience();
        toast("Submitted for review", "The immutable draft is now assigned to the Market Intelligence Lead.");
        loadMissions(true).then(function () { navigate("verification"); });
      }).catch(function (error) {
        target.disabled = false;
        target.textContent = "Submit for review";
        toast("Submission failed", error.message);
      });
      return;
    }
    if (target.dataset.pageTarget) {
      var page = target.dataset.pageTarget;
      closeExperience();
      window.setTimeout(function () { navigate(page); }, 180);
      return;
    }
    var action = target.dataset.dialogAction;
    var context = target.dataset.context || "item";
    if (action === "use-asset") { closeExperience(); navigate("assistant"); window.setTimeout(function () { submitAssistant("Use " + context + " for my current work"); }, 240); return; }
    if (action === "assign-agent") { closeExperience(); navigate("workforce"); window.setTimeout(function () { toast("Task assigned", context + " has started a governed synthetic task."); }, 220); return; }
    if (action === "continue-mission") { closeExperience(); window.setTimeout(function () { toast("Mission resumed", context + " is continuing from its verification stage."); }, 220); return; }
    if (action === "request-connector") { closeExperience(); window.setTimeout(function () { openCreation("connector"); }, 200); return; }
    if (action === "manage-connector") { closeExperience(); navigate("settings"); return; }
    if (action === "approve-package") { closeExperience(); window.setTimeout(function () { toast("Approval recorded", context + " can continue to its next governed step."); }, 220); return; }
    if (action === "request-change") { closeExperience(); window.setTimeout(function () { toast("Changes requested", context + " returned to its accountable owner."); }, 220); return; }
    if (action === "mark-read") {
      state.notificationCount = 0;
      var badge = document.querySelector(".top-icon.has-badge i");
      if (badge) badge.hidden = true;
      closeExperience();
      window.setTimeout(function () { toast("Notifications cleared", "All synthetic updates are marked as read."); }, 220);
      return;
    }
    demoAction(action, context);
  });

  render();
  loadMissions(false);
  loadModelProviders();
})();
