(function () {
  "use strict";

  var root = document.getElementById("page-root");
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
  var requestedPage = new URLSearchParams(window.location.search).get("page");
  if (["assistant", "ask-bursa", "workforce", "exchange", "automation", "rooms", "workspace", "brief", "verification", "connectors", "action", "settings"].indexOf(requestedPage) === -1) requestedPage = "home";
  var state = {
    page: requestedPage,
    exchangeCategory: "featured",
    homeAssetCategory: "Featured",
    assistantMessages: [],
    assistantCanvasTab: "plot",
    askBursaMessages: [],
    savedDecisions: [
      { id: "DEC-1014", answerKey: "answer-oimse", title: "July market activity strengthened", question: "How did July market activity compare with June?", owner: "Lim Kim Hoong", created: "14 Oct 2026", status: "Recorded" }
    ],
    emailAutomations: [
      { id: "MAIL-07", answerKey: "seed-weekly-market", title: "Weekly Market Activity Brief", question: "Summarise the latest market activity", schedule: "Every Monday · 8:00 AM", recipient: "Market Strategy", status: "Active" }
    ],
    selectedNode: "trigger",
    selectedRoom: "product",
    missionProgress: 67,
    automationTab: "workflows",
    roomScope: "mine",
    roomTab: "overview",
    briefFilter: "for-you",
    workspaceView: "projects",
    verificationFilter: "pending",
    notificationCount: 3,
    reducedUpdates: false
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

  var missions = [
    { title: "Product Launch Readiness Analysis", subtitle: "New market data service", agents: ["RA", "DA", "VA"], progress: 67, stage: "Verify findings", due: "Today", status: "On track" },
    { title: "Monthly Board Pack Preparation", subtitle: "Q3 2026 executive pack", agents: ["RA", "DA", "RP"], progress: 82, stage: "Draft output", due: "14 Oct", status: "On track" },
    { title: "ESG Reporting Draft", subtitle: "FY2026 sustainability report", agents: ["RP", "VA", "KA"], progress: 44, stage: "Retrieve sources", due: "18 Oct", status: "At risk" },
    { title: "Access Request Automation", subtitle: "Cross-system onboarding", agents: ["WA", "VA"], progress: 58, stage: "Build workflow", due: "21 Oct", status: "On track" },
    { title: "Cross-Department Meeting Prep", subtitle: "Market strategy working group", agents: ["RA", "KA", "RP"], progress: 91, stage: "Await approval", due: "Today", status: "Waiting review" }
  ];

  var assets = [
    { title: "Policy Review Agent", type: "AI Agent", icon: "i-spark", tone: "blue", description: "Analyses policies and regulatory updates with cited recommendations.", owner: "Legal & Compliance", uses: "428 uses", verified: true },
    { title: "Board Pack Generator", type: "Workflow", icon: "i-automation", tone: "violet", description: "Creates board-ready materials from approved sources and structured inputs.", owner: "Corporate Secretariat", uses: "312 uses", verified: true },
    { title: "ESG Reporting Template", type: "Template", icon: "i-document", tone: "teal", description: "Standardised, evidence-led framework for sustainability reporting.", owner: "Sustainability", uses: "276 uses", verified: true },
    { title: "Market Regulation Knowledge Pack", type: "Knowledge", icon: "i-book", tone: "amber", description: "Curated guidance for listing, conduct and regulatory updates.", owner: "Market Regulation", uses: "198 uses", verified: true },
    { title: "HR Onboarding Workflow", type: "Workflow", icon: "i-flow", tone: "violet", description: "End-to-end onboarding process with role-aware approvals.", owner: "People & Culture", uses: "206 uses", verified: true },
    { title: "Data Analysis Template", type: "Template", icon: "i-document", tone: "teal", description: "Reusable structure for governed data analysis and insight reporting.", owner: "Strategy & Transformation", uses: "165 uses", verified: true },
    { title: "Budget Justification Skill", type: "AI Skill", icon: "i-cube", tone: "amber", description: "Builds traceable budget rationales with benchmarks and assumptions.", owner: "Finance", uses: "128 uses", verified: true },
    { title: "New Joiner Knowledge Pack", type: "Knowledge", icon: "i-book", tone: "blue", description: "Essential Bursa information and approved learning paths.", owner: "People & Culture", uses: "96 uses", verified: true }
  ];

  var rooms = [
    { id: "product", title: "Product Development Room", tag: "Strategic", members: 8, agents: 4, description: "Drive new product initiatives and market readiness across Bursa." },
    { id: "esg", title: "ESG Working Group", tag: "Cross-dept", members: 6, agents: 3, description: "Develop the ESG reporting framework and implementation roadmap." },
    { id: "adoption", title: "AI Adoption Taskforce", tag: "Technology", members: 10, agents: 5, description: "Accelerate responsible AI adoption across Bursa Malaysia." },
    { id: "hr", title: "HR Excellence Room", tag: "People", members: 7, agents: 3, description: "Shape HR transformation and employee experience initiatives." },
    { id: "board", title: "Board Pack Preparation", tag: "Executive", members: 3, agents: 3, description: "Prepare verified materials for the upcoming board meeting." },
    { id: "reg", title: "Regulatory Research Room", tag: "Research", members: 5, agents: 3, description: "Analyse regulatory developments with cited evidence." }
  ];

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
      '<div class="command-tools"><div class="command-tools-left"><button class="tool-button" type="button" data-demo-action="attach">' + svg("i-paperclip") + 'Attach</button><button class="tool-button" type="button" data-assistant-prompt="Research our options for a new cross-department initiative">' + svg("i-research") + 'Deep Research</button><button class="tool-button" type="button" data-page-jump="automation">' + svg("i-flow") + 'Build workflow</button><button class="tool-button" type="button" data-page-jump="exchange">' + svg("i-book") + 'Search Exchange</button></div><button class="send-button" id="home-send" type="button" aria-label="Start with BursaIQ">' + svg("i-send") + "</button></div>",
      "</div></section>",
      '<div class="quick-actions">' + quick.map(function (item) {
        return '<button class="quick-action" type="button" data-page-jump="' + item[4] + '">' + miniIcon(item[0], item[1]) + '<span><strong>' + item[2] + '</strong><small>' + item[3] + "</small></span></button>";
      }).join("") + "</div>",
      '<div class="brief-continuation">',
      '<section class="panel">' + panelHead("My Work Brief", "i-spark", "brief") + '<div class="work-list">' +
      workItem("i-document", "amber", "Review Marketing Campaign Brief", "Submitted 1 hour ago", "Approval needed", "amber") +
      workItem("i-brief", "blue", "Updated Flexible Working Policy", "New version available", "New information", "blue") +
      workItem("i-folder", "teal", "Monthly Board Pack Preparation", "Scheduled mission · Due tomorrow", "On track", "green") +
      workItem("i-exchange", "violet", "3 relevant solutions found", "Based on recent activity", "View now", "violet") +
      "</div></section>",
      '<section class="panel">' + panelHead("Continue Your Work", "i-brief", "workforce") + '<div class="progress-list">' +
      progressItem("i-research", "blue", "Product Launch Readiness Analysis", "Research Agent · 4 of 6 steps", 67, "Running") +
      progressItem("i-automation", "teal", "Automate Access Request Process", "Workflow Agent · 2 of 4 steps", 50, "Running") +
      progressItem("i-document", "amber", "ESG Reporting Draft", "Review by Verifier · Due today", 74, "Waiting review") +
      "</div></section></div>",
      '<section class="panel exchange-strip">' + panelHead("Explore the Intelligence Exchange", "i-exchange", "exchange") +
      '<div class="strip-tabs">' + ["Featured", "AI Agent", "Workflow", "Template", "Knowledge"].map(function (label) {
        var display = label === "AI Agent" ? "Agents" : label === "Workflow" ? "Workflows" : label === "Template" ? "Templates" : label;
        return '<button class="' + (state.homeAssetCategory === label || (label === "Featured" && state.homeAssetCategory === "Featured") ? "is-active" : "") + '" type="button" data-home-asset-type="' + label + '">' + display + '</button>';
      }).join("") + '</div>',
      '<div class="asset-row">' + assetSlice.map(homeAssetCard).join("") + "</div></section>",
      "</div>",
      '<aside class="home-rail">',
      '<section class="panel rail-panel">' + panelHead("Active AI Workforce", "i-agents", "workforce") + '<ul class="agent-feed">' + agents.slice(0, 5).map(function (agent) {
        return '<li>' + miniIcon("i-spark", agent.tone) + '<span><strong>' + agent.name + '</strong><small>' + agent.job + '</small></span><i class="agent-state" aria-label="Working"></i></li>';
      }).join("") + "</ul></section>",
      '<section class="panel rail-panel">' + panelHead("Pending Approvals", "i-shield", "verification") + '<ul class="rail-list">' +
      railItem("i-document", "amber", "ESG Report Draft", "Requested by Report Agent", "Review") +
      railItem("i-automation", "teal", "Access Request Workflow", "New workflow configuration", "Approve") +
      railItem("i-book", "blue", "HR Policy Updates", "Summarised changes", "Review") +
      "</ul></section>",
      '<section class="panel rail-panel">' + panelHead("Recommended for You", "i-spark", "exchange") + '<ul class="rail-list">' +
      railItem("i-room", "violet", "Meeting Assistant Agent", "Schedule, recap and follow up", "Use") +
      railItem("i-automation", "amber", "HR Onboarding Workflow", "End-to-end onboarding", "Use") +
      railItem("i-document", "blue", "Data Analysis Template", "Pre-built analysis structure", "Use") +
      "</ul></section>",
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
    return [
      '<section class="page page-enter">',
      pageHead("My Workforce", "Your personal AI team, active missions and accountable work.", "Create mission", "mission"),
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="metric-row">' +
      metric("i-agents", "blue", String(missions.length), "Active missions", "↑ 2 from last week") +
      metric("i-shield", "violet", "3", "Pending approvals", "1 needs attention") +
      metric("i-spark", "blue", "6", "AI agents working", "↑ 2 this week") +
      metric("i-check", "teal", "12", "Completed this week", "↑ 33% from last week") +
      "</div>",
      '<section class="panel">' + panelHead("My AI Team", "i-agents", "manage-agents") + '<div class="agent-team"><div class="agent-cards">' + agents.map(agentCard).join("") + "</div></div></section>",
      '<section class="panel">' + panelHead("Mission Control", "i-flow", "missions") + '<div class="table-wrap"><table class="mission-table"><thead><tr><th>Mission</th><th>Agents</th><th>Progress</th><th>Current stage</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>' + missions.map(missionRow).join("") + "</tbody></table></div>",
      '<div class="journey-wrap"><div class="mission-journey"><div class="journey-step is-done" data-step="1"><strong>Research</strong>Retrieve governed sources</div><div class="journey-step is-done" data-step="2"><strong>Synthesis</strong>Analyse and draft</div><div class="journey-step is-active" data-step="3"><strong>Verification</strong>Fact-check and approve</div><div class="journey-step" data-step="4"><strong>Exchange</strong>Share or deliver</div></div></div></section>',
      "</div><aside class=\"page-rail\">",
      '<section class="panel rail-panel">' + panelHead("Agent Activity Feed", "i-spark", "activity") + '<ul class="agent-feed">' +
      agents.slice(0, 5).map(function (agent, index) { return '<li>' + miniIcon("i-spark", agent.tone) + '<span><strong>' + agent.name + '</strong><small>' + ["Searching approved ESG policies…", "Analysing uploaded data…", "Generating a report draft…", "Checking citations and claims…", "Updating the knowledge map…"][index] + '</small></span><small>' + (index * 3 + 2) + "m</small></li>"; }).join("") + "</ul></section>",
      '<section class="panel rail-panel">' + panelHead("Pending Approvals", "i-shield", "verification") + '<ul class="rail-list">' + railItem("i-document", "amber", "ESG Report Draft", "Requested 1 hour ago", "Review") + railItem("i-automation", "teal", "Access Request Workflow", "Requested 3 hours ago", "Approve") + "</ul></section>",
      "</aside></div></section>"
    ].join("");
  }

  function metric(icon, tone, value, label, delta) {
    return '<button class="panel metric" type="button" data-metric-context="' + escapeHtml(label) + '">' + miniIcon(icon, tone) + '<span><strong>' + value + '</strong><small>' + label + '</small><em>' + delta + "</em></span>" + svg("i-chevron") + "</button>";
  }

  function agentCard(agent) {
    return '<article class="agent-card"><div class="agent-card-head">' + miniIcon("i-spark", agent.tone) + '<span><strong>' + agent.name + '</strong><small><i class="dot"></i> ' + agent.state + '</small></span></div><p>' + agent.job + '</p><button type="button" data-agent-open="' + escapeHtml(agent.name) + '">Open ' + svg("i-arrow") + "</button></article>";
  }

  function missionRow(mission, index) {
    return '<tr><td><span class="mission-title">' + miniIcon(index % 2 ? "i-document" : "i-folder", index % 2 ? "violet" : "amber") + '<span><strong>' + mission.title + '</strong><small>' + mission.subtitle + '</small></span></span></td><td>' + avatarStack(mission.agents) + '</td><td><span class="table-progress"><span class="progress-track"><i style="width:' + mission.progress + '%"></i></span><span>' + mission.progress + '%</span></span></td><td>' + mission.stage + lifecycle(mission.progress) + '</td><td>' + mission.due + '</td><td>' + status(mission.status) + '</td><td><button class="table-action" type="button" data-mission="' + index + '">' + (index % 2 ? "Review" : "Continue") + "</button></td></tr>";
  }

  function exchangePage() {
    var categoryMap = { agent: "AI Agent", workflow: "Workflow", template: "Template", knowledge: "Knowledge" };
    var visibleAssets = categoryMap[state.exchangeCategory] ? assets.filter(function (asset) { return asset.type === categoryMap[state.exchangeCategory]; }) : assets;
    return [
      '<section class="page page-enter">',
      pageHead("Intelligence Exchange", "Discover, adapt and share verified intelligence across Bursa.", "Publish asset", "skill"),
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="metric-row">' + metric("i-exchange", "blue", "1,248", "Verified assets", "↑ 12% this month") + metric("i-document", "violet", "86", "Published this month", "↑ 28% this month") + metric("i-flow", "blue", "3,952", "Active reuses", "↑ 34% this month") + metric("i-agents", "teal", "18", "Departments contributing", "2 more this month") + "</div>",
      '<section class="panel exchange-search"><div class="exchange-search-box"><label class="large-search">' + svg("i-search") + '<input id="exchange-search-input" type="search" placeholder="Search agents, workflows, templates or knowledge…"></label><select class="select-field" id="exchange-category-select" aria-label="Exchange category"><option value="featured">All categories</option><option value="agent">AI agents</option><option value="workflow">Workflows</option><option value="template">Templates</option><option value="knowledge">Knowledge</option></select></div>',
      '<div class="category-row">' +
      category("featured", "i-spark", "Featured") + category("agent", "i-agents", "Agents") + category("workflow", "i-flow", "Workflows") + category("template", "i-document", "Templates") + category("knowledge", "i-book", "Knowledge") + category("department", "i-grid", "By department") +
      "</div></section>",
      '<section class="panel">' + panelHead(state.exchangeCategory === "featured" ? "Featured Intelligence Assets" : "Recommended " + (categoryMap[state.exchangeCategory] || "Intelligence"), "i-spark", "featured") + '<div class="featured-assets">' + visibleAssets.slice(0, 4).map(featuredCard).join("") + "</div></section>",
      '<section class="panel">' + panelHead("Explore the Exchange", "i-exchange", "all-assets") + '<div class="asset-market-grid" id="asset-market-grid">' + visibleAssets.map(marketAsset).join("") + '<div class="empty-state" id="exchange-empty" hidden>' + miniIcon("i-search", "blue") + '<h3>No intelligence found</h3><p>Try a broader search or switch to all categories.</p></div></div></section>',
      '</div><aside class="page-rail">',
      '<section class="panel rail-panel">' + panelHead("Recommended for You", "i-spark", "recommendations") + '<ul class="rail-list">' + railItem("i-spark", "violet", "ESG Disclosure Assistant", "AI agent · 824 uses", "Use") + railItem("i-book", "amber", "Regulatory Update Brief", "Knowledge · 287 uses", "Use") + railItem("i-document", "teal", "People Analytics Dashboard", "Template · 196 uses", "View") + "</ul></section>",
      '<section class="panel rail-panel">' + panelHead("Top Contributors", "i-agents", "contributors") + '<ul class="rail-list">' + contributor("1", "Sustainability", "186 assets") + contributor("2", "Legal & Compliance", "162 assets") + contributor("3", "People & Culture", "148 assets") + contributor("4", "Product Development", "126 assets") + "</ul></section>",
      '<section class="panel rail-panel">' + panelHead("My Saved Assets", "i-book", "saved") + '<ul class="rail-list">' + railItem("i-spark", "blue", "Board Meeting Insights Agent", "Saved 2 days ago", "Use") + railItem("i-document", "teal", "FY2026 Budget Template", "Saved 3 days ago", "View") + "</ul></section>",
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
      '<div class="metric-row">' + metric("i-automation", "blue", "24", "Active workflows", "↑ 26% this month") + metric("i-shield", "violet", "9", "Pending approvals", "3 need attention") + metric("i-flow", "blue", "132", "Runs this week", "↑ 42% this week") + metric("i-check", "teal", "97.8%", "Success rate", "↑ 2.4% this month") + "</div>",
      '<section class="panel tabs-toolbar"><button class="tab-button ' + (state.automationTab === "workflows" ? "is-active" : "") + '" type="button" data-automation-tab="workflows">' + svg("i-automation") + 'My workflows</button><button class="tab-button ' + (state.automationTab === "templates" ? "is-active" : "") + '" type="button" data-automation-tab="templates">' + svg("i-book") + 'Templates</button><button class="tab-button ' + (state.automationTab === "runs" ? "is-active" : "") + '" type="button" data-automation-tab="runs">' + svg("i-clock") + 'Runs</button><span class="toolbar-spacer"></span><label class="inline-search">' + svg("i-search") + '<input id="automation-search" type="search" placeholder="Search ' + state.automationTab + '…"></label></section>',
      automationTabContent(node, keys),
      '</div><aside class="page-rail">',
      '<section class="panel rail-panel">' + panelHead("Upcoming Runs", "i-clock", "runs") + '<ul class="rail-list">' + railItem("i-clock", "blue", "Board Pack Distribution", "Mon, 29 Apr · 8:00 AM", "Open") + railItem("i-clock", "violet", "Weekly Project Digest", "Tue, 30 Apr · 9:00 AM", "Open") + railItem("i-shield", "blue", "Policy Update Monitor", "Tue, 30 Apr · 2:00 PM", "Open") + "</ul></section>",
      '<section class="panel rail-panel">' + panelHead("Pending Approval Steps", "i-shield", "approvals") + '<ul class="rail-list">' + railItem("i-document", "amber", "Board Pack Distribution", "Draft ready for review", "Review") + railItem("i-automation", "teal", "Access Request Automation", "New workflow configuration", "Review") + "</ul></section>",
      "</aside></div></section>"
    ].join("");
  }

  function automationTabContent(node, keys) {
    if (state.automationTab === "templates") {
      return '<section class="panel content-view"><div class="content-view-head"><div><h2>Workflow templates</h2><p>Start from an approved pattern, then adapt its owners, inputs and approval boundaries.</p></div><button class="secondary-button" type="button" data-create="workflow">Create from scratch</button></div><div class="template-grid">' + [
        ["Meeting follow-up", "Capture decisions and assign actions after approved meetings.", "i-room", "blue"],
        ["Document review", "Route documents through evidence checks and accountable approval.", "i-document", "amber"],
        ["New joiner onboarding", "Coordinate access, learning and team introductions.", "i-agents", "teal"],
        ["Risk sign-off", "Assess, verify and record controlled business decisions.", "i-shield", "violet"]
      ].map(function (item) { return '<article class="template-card" data-filter-text="' + item[0].toLowerCase() + '">' + miniIcon(item[2], item[3]) + '<h3>' + item[0] + '</h3><p>' + item[1] + '</p><button type="button" data-template-use="' + item[0] + '">Use template</button></article>'; }).join("") + '</div></section>';
    }
    if (state.automationTab === "runs") {
      return '<section class="panel content-view"><div class="content-view-head"><div><h2>Execution history</h2><p>Every run retains its trigger, outcome, duration and approval trail.</p></div><button class="secondary-button" type="button" data-demo-action="export-log">Export log</button></div><div class="run-ledger">' + [
        ["Board Pack Preparation", "Today · 08:02", "4m 18s", "Completed"],
        ["Policy Update Monitor", "Yesterday · 14:30", "2m 41s", "Completed"],
        ["Weekly Project Digest", "Yesterday · 09:00", "Awaiting approval", "Waiting review"],
        ["Access Request Automation", "10 Oct · 11:45", "Retried once", "On track"]
      ].map(function (item) { return '<button class="run-row" type="button" data-run-open="' + item[0] + '" data-filter-text="' + item[0].toLowerCase() + '"><span>' + miniIcon("i-automation", "violet") + '<span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></span></span><span><small>' + item[2] + '</small>' + status(item[3]) + svg("i-chevron") + '</span></button>'; }).join("") + '</div></section>';
    }
    return '<section class="panel automation-canvas"><div class="workflow-area"><div class="workflow-title"><div><h2>Board Pack Distribution Workflow ' + status("Active") + '</h2><p>Automatically prepare, review and distribute board materials to authorised stakeholders.</p></div><button class="secondary-button" type="button" data-demo-action="test-run">Test run</button></div>' +
      '<div class="node-flow">' + keys.map(function (key, index) { var item = node[key]; return (index ? '<span class="flow-link" aria-hidden="true"></span>' : "") + '<button class="flow-node ' + (state.selectedNode === key ? "is-active" : "") + '" type="button" data-node="' + key + '">' + miniIcon(item[2], item[3]) + '<strong>' + item[0] + '</strong><small>' + item[1] + "</small></button>"; }).join("") + '</div><p class="panel-subtitle">Select any step to inspect its governed inputs, approval boundary and output.</p></div><aside class="node-config" id="node-config">' + nodeConfig(state.selectedNode) + '</aside></section>' +
      '<section class="panel workflow-library">' + panelHead("Workflow Library", "i-folder", "workflows") + '<div class="table-wrap"><table class="mission-table"><thead><tr><th>Name</th><th>Owner / team</th><th>Last run</th><th>Next run</th><th>Runs (30d)</th><th>Status</th><th>Action</th></tr></thead><tbody>' + workflowRow("Board Pack Preparation", "Executive Office", "26 Apr · 8:02", "29 Apr · 8:00", "12", "On track") + workflowRow("HR Onboarding Flow", "People & Culture", "25 Apr · 9:15", "1 May · 9:00", "8", "On track") + workflowRow("Policy Update Monitor", "Legal & Compliance", "26 Apr · 2:30", "30 Apr · 2:00", "15", "Active") + workflowRow("Weekly Project Digest", "PMO", "24 Apr · 6:10", "1 May · 9:00", "10", "Waiting review") + '</tbody></table></div></section>';
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
    var projectData = [
      ["Board Governance", "5 missions · 12 files", "82%", "i-shield", "blue"],
      ["People & Culture", "3 missions · 8 files", "64%", "i-agents", "violet"],
      ["Digital Workplace", "4 missions · 15 files", "71%", "i-grid", "teal"],
      ["Market Intelligence", "6 missions · 21 files", "91%", "i-research", "amber"]
    ];
    return '<section class="page page-enter">' + pageHead("Projects & Workspace", "Files, governed context and decision memory for people and AI.", "New project", "project") +
      '<div class="metric-row">' + metric("i-folder", "blue", "8", "Active projects", "2 updated today") + metric("i-document", "violet", "56", "Governed files", "9 verified this week") + metric("i-book", "teal", "24", "Saved decisions", "Fully traceable") + metric("i-agents", "amber", "11", "Contributors", "Across 5 departments") + '</div>' +
      '<section class="panel tabs-toolbar"><button class="tab-button ' + (state.workspaceView === "projects" ? "is-active" : "") + '" type="button" data-workspace-view="projects">' + svg("i-folder") + 'Projects</button><button class="tab-button ' + (state.workspaceView === "files" ? "is-active" : "") + '" type="button" data-workspace-view="files">' + svg("i-document") + 'Recent files</button><button class="tab-button ' + (state.workspaceView === "decisions" ? "is-active" : "") + '" type="button" data-workspace-view="decisions">' + svg("i-shield") + 'Decision memory</button><span class="toolbar-spacer"></span><label class="inline-search">' + svg("i-search") + '<input id="workspace-search" type="search" placeholder="Search workspace…"></label></section>' +
      '<div class="support-layout"><div class="support-main"><section class="panel content-view">' + workspaceContent(projectData) + '</section></div><aside class="support-rail"><section class="panel rail-panel">' + panelHead("Workspace health", "i-shield", "workspace-health") + '<div class="health-score"><strong>94</strong><span><b>Well governed</b><small>43 of 46 files have a current owner and classification.</small></span></div><div class="health-bar"><i style="width:94%"></i></div></section><section class="panel rail-panel">' + panelHead("Recent collaborators", "i-agents", "participants") + '<ul class="rail-list">' + participant("SC", "Soon Cheng", "Strategy & Planning", "Online") + participant("TY", "Tan Yee", "Market Strategy", "Online") + participant("AM", "Aisyah Md Noor", "Legal & Compliance", "In a meeting") + '</ul></section></aside></div></section>';
  }

  function workspaceContent(projectData) {
    if (state.workspaceView === "files") return '<div class="content-view-head"><div><h2>Recent files</h2><p>Documents retain owner, sensitivity and verification state.</p></div><button class="secondary-button" type="button" data-demo-action="upload">Upload files</button></div><div class="document-ledger">' + [["Product Requirements v2.0.pdf", "Product Development · 2.4 MB", "Verified"], ["FY2027 Market Plan.pptx", "Strategy · 8.1 MB", "Active"], ["Access Controls.xlsx", "Technology · 620 KB", "Restricted"], ["ESG Evidence Register.docx", "Sustainability · 1.2 MB", "Verified"]].map(function (item) { return '<button type="button" data-file-open="' + item[0] + '" data-filter-text="' + item[0].toLowerCase() + '">' + miniIcon("i-document", "blue") + '<span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></span>' + status(item[2]) + svg("i-chevron") + '</button>'; }).join("") + '</div>';
    if (state.workspaceView === "decisions") return '<div class="content-view-head"><div><h2>Decision memory</h2><p>The rationale, evidence and accountable owner behind important choices.</p></div><button class="secondary-button" type="button" data-demo-action="new-decision">Record decision</button></div><div class="decision-list">' + [["Proceed with controlled product pilot", "Approved by Product Steering Committee", "12 Oct"], ["Use verified market dataset as baseline", "Approved by Data Governance", "10 Oct"], ["Retain human approval before publication", "Policy requirement", "8 Oct"]].map(function (item) { return '<button type="button" data-decision-open="' + item[0] + '" data-filter-text="' + item[0].toLowerCase() + '"><span class="decision-mark">' + svg("i-check") + '</span><span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></span><time>' + item[2] + '</time>' + svg("i-chevron") + '</button>'; }).join("") + '</div>';
    return '<div class="content-view-head"><div><h2>Active projects</h2><p>Spaces that carry approved context into every mission.</p></div><button class="secondary-button" type="button" data-create="project">New project</button></div><div class="project-grid">' + projectData.map(function (item) { return '<button class="project-tile" type="button" data-project-open="' + item[0] + '" data-filter-text="' + item[0].toLowerCase() + '">' + miniIcon(item[3], item[4]) + '<span><strong>' + item[0] + '</strong><small>' + item[1] + '</small><span class="progress-track"><i style="width:' + item[2] + '"></i></span></span><b>' + item[2] + '</b>' + svg("i-chevron") + '</button>'; }).join("") + '</div>';
  }

  function briefPage() {
    var tasks = [["Review Marketing Campaign Brief", "Approval requested by Aisyah · 1h", "Approval needed", "amber"], ["Product launch readiness", "Research mission · 67% complete", "On track", "green"], ["Policy update: flexible work", "New verified information · 2h", "Read", "blue"], ["Board Pack Preparation", "Scheduled for tomorrow · 9:00 AM", "Upcoming", "violet"], ["Three Exchange matches", "Based on your active projects", "Explore", "blue"]];
    var visible = state.briefFilter === "approvals" ? tasks.filter(function (item) { return item[2] === "Approval needed"; }) : state.briefFilter === "updates" ? tasks.slice(2) : tasks;
    return '<section class="page page-enter">' + pageHead("Today\'s Brief", "Monday, 12 October · priorities, approvals and verified changes.", "Ask about today", "assistant") + '<section class="brief-hero"><div><h2>Good morning, Kim Hoong.</h2><p>Your AI workforce has prepared five items that need attention. The product-readiness mission remains on track.</p></div><div class="brief-orbit" aria-hidden="true"><i></i><i></i><i></i><span>' + svg("i-spark") + '</span></div></section><div class="support-layout"><div class="support-main"><section class="panel"><div class="filter-tabs"><button class="' + (state.briefFilter === "for-you" ? "is-active" : "") + '" type="button" data-brief-filter="for-you">For you <b>5</b></button><button class="' + (state.briefFilter === "approvals" ? "is-active" : "") + '" type="button" data-brief-filter="approvals">Approvals <b>1</b></button><button class="' + (state.briefFilter === "updates" ? "is-active" : "") + '" type="button" data-brief-filter="updates">Updates <b>3</b></button></div><div class="brief-list">' + visible.map(function (item, index) { return '<button type="button" data-brief-item="' + item[0] + '"><span class="brief-index">' + String(index + 1).padStart(2, "0") + '</span><span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></span><span class="status ' + item[3] + '">' + item[2] + '</span>' + svg("i-chevron") + '</button>'; }).join("") + '</div></section></div><aside class="support-rail"><section class="panel rail-panel">' + panelHead("Mission pulse", "i-flow", "workforce") + '<div class="pulse-stat"><strong>4</strong><span>missions moving</span></div><div class="signal-bars"><i style="--h:62%"></i><i style="--h:88%"></i><i style="--h:74%"></i><i style="--h:94%"></i><i style="--h:72%"></i><i style="--h:85%"></i><i style="--h:98%"></i></div></section><section class="panel rail-panel">' + panelHead("Next on your calendar", "i-clock", "calendar") + '<ul class="rail-list">' + railItem("i-room", "blue", "Product review", "10:00–11:00 AM", "Open") + railItem("i-agents", "violet", "Market validation", "2:00–3:00 PM", "Open") + '</ul></section></aside></div></section>';
  }

  function verificationPage() {
    var items = [["ESG Report Draft", "Report Agent", "12 claims · 8 sources", "High impact"], ["Access Request Workflow", "Workflow Agent", "6 actions · 2 systems", "Permission change"], ["Product Readiness Brief", "Research Agent", "19 claims · 12 sources", "Management briefing"], ["HR Policy Summary", "Knowledge Agent", "7 changes · 4 sources", "Employee guidance"]];
    return '<section class="page page-enter">' + pageHead("Verification Centre", "Inspect evidence, approvals and agent actions before work moves forward.", "Verification policy", "policy") + '<div class="metric-row">' + metric("i-shield", "amber", "4", "Pending review", "2 due today") + metric("i-check", "teal", "18", "Approved this week", "Median review 11m") + metric("i-document", "blue", "96%", "Citation coverage", "Above policy floor") + metric("i-clock", "violet", "2", "Escalations", "Owner assigned") + '</div><div class="verification-layout"><section class="panel verification-queue"><div class="filter-tabs"><button class="is-active" type="button">Pending <b>4</b></button><button type="button" data-demo-action="verification-history">History</button><button type="button" data-demo-action="audit-log">Audit log</button></div>' + items.map(function (item, index) { return '<button class="verification-item ' + (index === 0 ? "is-selected" : "") + '" type="button" data-verification-open="' + item[0] + '">' + miniIcon(index % 2 ? "i-automation" : "i-document", index % 2 ? "violet" : "amber") + '<span><strong>' + item[0] + '</strong><small>' + item[1] + ' · ' + item[2] + '</small></span><span class="status ' + (index < 2 ? "amber" : "blue") + '">' + item[3] + '</span>' + svg("i-chevron") + '</button>'; }).join("") + '</section><section class="panel evidence-preview"><div class="content-view-head"><div><h2>ESG Report Draft</h2><p>Verification package · requested 1 hour ago</p></div>' + status("Waiting review") + '</div><div class="evidence-score"><span><strong>92%</strong><small>Evidence coverage</small></span><div><b>11 claims supported</b><small>1 claim requires clarification</small></div></div><div class="claim-list"><article><span>' + svg("i-check") + '</span><div><strong>Scope 1 emissions decreased 8.4%</strong><small>Cited to FY2026 emissions register, table 3.2</small></div></article><article class="needs-review"><span>' + svg("i-help") + '</span><div><strong>Supplier coverage exceeds target</strong><small>Source gives 78%; draft states 82%. Confirm calculation.</small></div></article><article><span>' + svg("i-check") + '</span><div><strong>Board oversight expanded this year</strong><small>Cited to Governance Committee minutes, 18 Sep</small></div></article></div><div class="evidence-actions"><button class="secondary-button" type="button" data-demo-action="request-changes" data-action-context="ESG Report Draft">Request changes</button><button class="primary-button" type="button" data-demo-action="approve" data-action-context="ESG Report Draft">Approve package</button></div></section></div></section>';
  }

  function connectorsPage() {
    var connectorData = [["Microsoft 365", "Files, mail and calendars", "Connected", "i-grid", "blue"], ["SharePoint", "Approved team repositories", "Connected", "i-folder", "teal"], ["Microsoft Teams", "Rooms, meetings and messages", "Connected", "i-room", "violet"], ["Internal Knowledge Base", "Policies and procedural guidance", "Connected", "i-book", "amber"], ["Document Repository", "Records and published materials", "Available", "i-document", "blue"], ["Service Desk", "Requests and incident workflows", "Available", "i-automation", "teal"]];
    return '<section class="page page-enter">' + pageHead("Connectors", "Approved systems and data sources, governed by your existing access.", "Request connector", "connector") + '<section class="connector-boundary">' + svg("i-shield") + '<div><strong>Your permissions travel with every request.</strong><p>BursaIQ never grants new source access. Actions against external systems remain visible and require the configured approval.</p></div><button type="button" data-demo-action="access-boundary">View access boundary</button></section><div class="connector-grid">' + connectorData.map(function (item) { var connected = item[2] === "Connected"; return '<article class="panel connector-card" data-filter-text="' + item[0].toLowerCase() + '"><div>' + miniIcon(item[3], item[4]) + '<span class="status ' + (connected ? "green" : "blue") + '">' + item[2] + '</span></div><h2>' + item[0] + '</h2><p>' + item[1] + '</p><dl><div><dt>Access</dt><dd>' + (connected ? "Role inherited" : "Admin approval") + '</dd></div><div><dt>Used by</dt><dd>' + (connected ? "8 workflows" : "Not connected") + '</dd></div></dl><button class="' + (connected ? "secondary-button" : "primary-button") + '" type="button" data-connector="' + item[0] + '" data-connected="' + String(connected) + '">' + (connected ? "Manage" : "Connect") + '</button></article>'; }).join("") + '</div></section>';
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
      '<div class="metric-row action-metrics">' + metric("i-brief", "blue", String(state.savedDecisions.length), "Decision memories", "Recorded with evidence") + metric("i-send", "violet", String(state.emailAutomations.length), "Email automations", "Reviewable schedules") + metric("i-shield", "teal", "100%", "Governed actions", "Source context retained") + metric("i-clock", "amber", "0", "External sends", "Synthetic demo only") + '</div>' +
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
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(function () {
      experienceOverlay.classList.add("is-open");
      var focusTarget = experienceBody.querySelector("input, textarea, select, button") || document.getElementById("experience-close");
      focusTarget.focus();
    });
  }

  function closeExperience() {
    experienceOverlay.classList.remove("is-open");
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
    openExperience({
      title: config[0],
      subtitle: config[1],
      body: '<form class="creation-form" id="creation-form" data-creation-type="' + type + '"><label class="form-field">' + config[2] + '<input name="title" maxlength="90" required placeholder="' + config[3] + '"></label><label class="form-field">' + config[4] + '<textarea name="description" maxlength="420" required placeholder="' + config[5] + '"></textarea></label><div class="form-split"><label class="form-field">Accountable owner<select name="owner"><option>Lim Kim Hoong</option><option>Product Development</option><option>Assign later</option></select></label><label class="form-field">Governance<select name="governance"><option>Standard approval</option><option>High-impact review</option><option>Read-only research</option></select></label></div><p class="form-hint">Synthetic demo only. No external system will be changed.</p></form>',
      footer: '<button class="secondary-button" type="button" data-experience-close>Cancel</button><button class="primary-button" type="submit" form="creation-form">' + config[6] + '</button>'
    });
  }

  function completeCreation(form) {
    var data = new FormData(form);
    var type = form.dataset.creationType;
    var title = String(data.get("title") || "Untitled").trim();
    if (!title) return;
    if (type === "mission") missions.unshift({ title: title, subtitle: "New synthetic mission", agents: ["RA", "VA"], progress: 8, stage: "Define scope", due: "Not set", status: "On track" });
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

  function openMission(index) {
    var mission = missions[Number(index)] || missions[0];
    openExperience({
      title: mission.title,
      subtitle: mission.subtitle + " · " + mission.progress + "% complete",
      body: '<div class="mission-detail-progress"><div><span>Mission health</span>' + status(mission.status) + '</div><span class="progress-track"><i style="width:' + mission.progress + '%"></i></span></div><div class="mission-detail-journey"><article class="is-done">' + miniIcon("i-research", "teal") + '<span><strong>Research</strong><small>18 governed sources retrieved</small></span>' + svg("i-check") + '</article><article class="is-done">' + miniIcon("i-spark", "teal") + '<span><strong>Synthesis</strong><small>Working brief and risks assembled</small></span>' + svg("i-check") + '</article><article class="is-active">' + miniIcon("i-shield", "blue") + '<span><strong>Verification</strong><small>' + mission.stage + '</small></span><span class="status blue">Current</span></article><article>' + miniIcon("i-exchange", "violet") + '<span><strong>Exchange</strong><small>Share the approved result</small></span><span class="status">Next</span></article></div><div class="detail-callout">' + svg("i-clock") + '<span><strong>Next accountable action</strong><small>Review two flagged assumptions before ' + mission.due + '.</small></span></div>',
      footer: '<button class="secondary-button" type="button" data-dialog-action="mission-note" data-context="' + escapeHtml(mission.title) + '">Add note</button><button class="primary-button" type="button" data-dialog-action="continue-mission" data-context="' + escapeHtml(mission.title) + '">Continue mission</button>'
    });
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
      openExperience({ title: "Notifications", subtitle: "Three updates need your attention", body: '<div class="notification-list"><button type="button" data-page-target="verification">' + miniIcon("i-shield", "amber") + '<span><strong>ESG draft needs review</strong><small>Verifier Agent · 8 min ago</small></span><i></i></button><button type="button" data-page-target="workforce">' + miniIcon("i-agents", "blue") + '<span><strong>Mission reached verification</strong><small>Product readiness · 23 min ago</small></span><i></i></button><button type="button" data-page-target="rooms">' + miniIcon("i-room", "violet") + '<span><strong>You were mentioned in a room</strong><small>Market strategy · 1 hour ago</small></span><i></i></button></div>', footer: '<button class="secondary-button" type="button" data-dialog-action="mark-read">Mark all read</button><button class="primary-button" type="button" data-page-target="brief">Open Today\'s Brief</button>' });
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
  }

  function bindPageEvents() {
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

    var homeSend = document.getElementById("home-send");
    if (homeSend) {
      homeSend.addEventListener("click", function () {
        var input = document.getElementById("home-command");
        var value = input.value.trim();
        if (!value) value = "Prepare a product launch readiness brief";
        state.assistantMessages = [];
        navigate("assistant");
        window.setTimeout(function () { submitAssistant(value); }, 80);
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

    root.querySelectorAll("[data-mission]").forEach(function (button) {
      button.addEventListener("click", function () {
        openMission(button.dataset.mission);
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
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
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
    var target = event.target.closest("[data-dialog-action], [data-page-target]");
    if (!target) return;
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
})();
