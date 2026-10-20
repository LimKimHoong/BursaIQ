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
  var requestedMissionId = new URLSearchParams(window.location.search).get("mission");
  if (["assistant", "ask-bursa", "knowledge-admin", "workforce", "agent-library", "agent-builder", "mission-teams", "mission-team-builder", "capability-library", "exchange", "automation", "workflow-builder", "rooms", "workspace", "brief", "verification", "connectors", "action", "settings"].indexOf(requestedPage) === -1) requestedPage = "home";
  var requestedWorkflowId = new URLSearchParams(window.location.search).get("workflow");
  var requestedAgentId = new URLSearchParams(window.location.search).get("agent");
  var requestedTeamId = new URLSearchParams(window.location.search).get("team");
  var state = {
    page: requestedPage,
    exchangeCategory: "featured",
    homeAssetCategory: "Featured",
    routingProvider: storedRoutingProvider(),
    modelProviders: [],
    registeredAgents: [],
    activeAgent: null,
    agentExecutions: [],
    agentLoading: false,
    agentError: "",
    missionTeams: [],
    activeMissionTeam: null,
    selectedTeamStageId: null,
    teamLoading: false,
    teamError: "",
    missionCapabilities: [],
    capabilityError: "",
    assistantMessages: [],
    assistantConversationId: null,
    assistantCanvasTab: "plot",
    askBursaMessages: [],
    askBursaConversationId: null,
    askBursaKnowledge: null,
    askBursaSuggestions: [],
    knowledgeAdmin: null,
    knowledgeAdminError: "",
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
    selectedVerificationCaseId: null,
    verificationCases: [],
    verificationError: "",
    pendingActionCount: null,
    pendingActions: [],
    workflows: [],
    workflowRuns: [],
    activeWorkflow: null,
    selectedWorkflowNodeId: null,
    workflowLoading: false,
    workflowError: "",
    projects: [],
    connectors: [],
    skills: [],
    roomItems: [],
    userSettings: {},
    settingsSection: "general",
    platformLoading: true,
    platformError: "",
    localAnalysisSessionId: null,
    missionPoll: null
  };

  var pages = {
    home: ["Home", "Your command centre", "i-home", "blue"],
    assistant: ["AI Assistant", "Ask, understand, decide", "i-spark", "violet"],
    "ask-bursa": ["Ask Bursa", "Internal knowledge Q&A", "i-book", "blue"],
    "knowledge-admin": ["Knowledge Administration", "Govern Ask Bursa documents and topics", "i-folder", "teal"],
    workforce: ["My Workforce", "Agents, tasks and missions", "i-agents", "blue"],
    "agent-library": ["Agent Library", "Create and govern reusable AI agents", "i-agents", "violet"],
    "agent-builder": ["Agent Builder", "Configure models, tools and permissions", "i-spark", "violet"],
    "mission-teams": ["Mission Teams", "Reusable governed agent teams", "i-agents", "teal"],
    "mission-team-builder": ["Mission Team Builder", "Assign stages, agents and dependencies", "i-flow", "teal"],
    "capability-library": ["Mission Capabilities", "Executable mission contracts", "i-cube", "blue"],
    exchange: ["Intelligence Exchange", "Discover approved capabilities", "i-exchange", "teal"],
    automation: ["Automation Studio", "Build intelligent workflows", "i-automation", "violet"],
    "workflow-builder": ["Workflow Builder", "Configure nodes, dependencies and execution", "i-flow", "violet"],
    rooms: ["Collaborative Rooms", "Work with people and AI", "i-room", "blue"],
    workspace: ["Projects & Workspace", "Your files, context and decision memory", "i-folder", "amber"],
    brief: ["Today's Brief", "Priorities, approvals and relevant changes", "i-brief", "blue"],
    verification: ["Verification Centre", "Evidence, approvals and accountable actions", "i-shield", "teal"],
    connectors: ["Connectors", "Approved systems and data sources", "i-plug", "violet"],
    action: ["Action", "Decision memory and email follow-ups", "i-check", "teal"],
    settings: ["Settings", "Preferences, access and governance", "i-settings", "blue"]
  };

  var agents = [];

  var missions = [];

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

  function apiForm(url, formData) {
    return fetch(url, { method: "POST", body: formData }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (payload) {
        if (!response.ok) throw new Error(payload.error || "The knowledge service could not complete this request.");
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

  function loadAskBursaStatus() {
    return apiJson("/api/ask-bursa/status").then(function (payload) {
      state.askBursaKnowledge = payload;
      if (state.page === "ask-bursa") render();
      return payload;
    }).catch(function () {
      state.askBursaKnowledge = null;
      return null;
    });
  }

  function loadAskBursaSuggestions() {
    return apiJson("/api/ask-bursa/suggestions?role=gcmc").then(function (payload) {
      state.askBursaSuggestions = payload.suggestions || [];
      if (state.page === "ask-bursa" && !state.askBursaMessages.length) render();
      return state.askBursaSuggestions;
    }).catch(function () {
      state.askBursaSuggestions = [];
      return [];
    });
  }

  function loadKnowledgeAdmin() {
    return apiJson("/api/knowledge-admin").then(function (payload) {
      state.knowledgeAdmin = payload;
      state.knowledgeAdminError = "";
      if (state.page === "knowledge-admin") render();
      return payload;
    }).catch(function (error) {
      state.knowledgeAdminError = error.message;
      if (state.page === "knowledge-admin") render();
      return null;
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
      if (state.page === "home" || state.page === "workforce" || state.page === "verification") render();
    }
    return apiJson("/api/missions").then(function (payload) {
      state.liveMissions = payload.missions || [];
      state.missionLoading = false;
      state.missionError = "";
      if (state.page === "home" || state.page === "workforce" || state.page === "verification") render();
      return state.liveMissions;
    }).catch(function (error) {
      state.missionLoading = false;
      state.missionError = error.message;
      if (state.page === "home" || state.page === "workforce" || state.page === "verification") render();
      return [];
    });
  }

  function loadExchangeAssets() {
    return apiJson("/api/exchange/assets").then(function (payload) {
      assets = payload.assets || [];
      if (state.page === "home" || state.page === "exchange") render();
      return assets;
    }).catch(function () {
      assets = [];
      if (state.page === "home" || state.page === "exchange") render();
      return [];
    });
  }

  function loadVerification() {
    return apiJson("/api/verification?role=securities").then(function (payload) {
      state.verificationCases = payload.cases || [];
      state.verificationError = "";
      if (state.page === "verification") render();
      return state.verificationCases;
    }).catch(function (error) {
      state.verificationCases = [];
      state.verificationError = error.message;
      if (state.page === "verification") render();
      return [];
    });
  }

  function loadWorkflows() {
    state.workflowLoading = true;
    return apiJson("/api/workflows").then(function (payload) {
      state.workflows = payload.workflows || [];
      state.workflowRuns = payload.runs || [];
      state.workflowError = "";
      state.workflowLoading = false;
      if (state.page === "automation") render();
      return state.workflows;
    }).catch(function (error) {
      state.workflowError = error.message;
      state.workflowLoading = false;
      if (state.page === "automation") render();
      return [];
    });
  }

  function loadAgents() {
    state.agentLoading = true;
    return apiJson("/api/agents?role=employee&includeArchived=true").then(function (payload) {
      state.registeredAgents = payload.agents || [];
      agents = state.registeredAgents;
      state.agentLoading = false;
      state.agentError = "";
      if (["workforce", "agent-library", "agent-builder", "workflow-builder"].indexOf(state.page) !== -1) render();
      return agents;
    }).catch(function (error) {
      state.agentLoading = false;
      state.agentError = error.message;
      if (["workforce", "agent-library", "agent-builder", "workflow-builder"].indexOf(state.page) !== -1) render();
      return [];
    });
  }

  function loadMissionTeams() {
    state.teamLoading = true;
    return apiJson("/api/mission-teams?includeArchived=true").then(function (payload) {
      state.missionTeams = payload.teams || [];
      state.teamLoading = false;
      state.teamError = "";
      if (["workforce", "mission-teams", "mission-team-builder"].indexOf(state.page) !== -1) render();
      return state.missionTeams;
    }).catch(function (error) {
      state.teamLoading = false;
      state.teamError = error.message;
      if (["workforce", "mission-teams", "mission-team-builder"].indexOf(state.page) !== -1) render();
      return [];
    });
  }

  function loadMissionCapabilities() {
    return apiJson("/api/mission-capabilities?includeArchived=true").then(function (payload) {
      state.missionCapabilities = payload.capabilities || [];
      state.capabilityError = "";
      if (["workforce", "capability-library", "mission-team-builder"].indexOf(state.page) !== -1) render();
      return state.missionCapabilities;
    }).catch(function (error) {
      state.capabilityError = error.message;
      if (["workforce", "capability-library", "mission-team-builder"].indexOf(state.page) !== -1) render();
      return [];
    });
  }

  function defaultTeamStages() {
    var defaults = [["mission-manager", "mission-manager", "Scope and plan"], ["data", "data-agent", "Gather and validate data"], ["analysis", "analysis-agent", "Execute analysis"], ["insight", "insight-agent", "Develop findings"], ["report", "report-agent", "Generate deliverable"]];
    var base = "stage-" + Date.now() + "-";
    return defaults.map(function (item, index) { return { id: base + index, stageType: item[0], agentId: item[1], name: item[2], responsibility: "", dependencies: index ? [base + (index - 1)] : [] }; });
  }

  function openMissionTeamBuilder(id) {
    state.page = "mission-team-builder";
    state.teamError = "";
    if (!id) {
      var stages = defaultTeamStages();
      state.activeMissionTeam = { name: "", description: "", owner: "Lim Kim Hoong", capability: "adv-analysis", status: "ACTIVE", version: 1, stages: stages };
      state.selectedTeamStageId = stages[0].id;
      window.history.replaceState(null, "", "?page=mission-team-builder");
      render();
      return;
    }
    state.teamLoading = true;
    window.history.replaceState(null, "", "?page=mission-team-builder&team=" + encodeURIComponent(id));
    apiJson("/api/mission-teams/" + encodeURIComponent(id)).then(function (team) {
      state.activeMissionTeam = team;
      state.selectedTeamStageId = team.stages.length ? team.stages[0].id : null;
      state.teamLoading = false;
      render();
    }).catch(function (error) { state.teamError = error.message; state.teamLoading = false; state.activeMissionTeam = null; render(); });
  }

  function openAgentBuilder(id) {
    state.agentLoading = true;
    state.page = "agent-builder";
    if (!id) {
      state.activeAgent = { name: "", description: "", instructions: "", owner: "Lim Kim Hoong", department: "Product Development", provider: "ollama", model: "qwen2.5:3b", generation: { temperature: 0.2, maxTokens: 1200 }, knowledgeCollections: [], connectors: [], tools: [], capabilities: [], inputSchema: { type: "object" }, outputSchema: { type: "object" }, approvalPolicy: "human-review", roles: ["employee"], status: "ACTIVE", version: 1 };
      state.agentExecutions = [];
      state.agentLoading = false;
      window.history.replaceState(null, "", "?page=agent-builder");
      render();
      return;
    }
    window.history.replaceState(null, "", "?page=agent-builder&agent=" + encodeURIComponent(id));
    apiJson("/api/agents/" + encodeURIComponent(id) + "?role=employee").then(function (payload) {
      state.activeAgent = payload.agent;
      state.agentExecutions = payload.executions || [];
      state.agentLoading = false;
      render();
    }).catch(function (error) {
      state.agentError = error.message;
      state.activeAgent = null;
      state.agentLoading = false;
      render();
    });
  }

  function loadPlatform() {
    state.platformLoading = true;
    return apiJson("/api/platform").then(function (payload) {
      var items = payload.items || {};
      rooms = (items.room || []).map(function (item) { return Object.assign({ id: item.id, title: item.title, status: item.status, owner: item.owner }, item.data || {}); });
      state.projects = items.project || [];
      state.savedDecisions = (items.decision || []).map(platformActionItem);
      state.emailAutomations = (items["email-automation"] || []).map(platformActionItem);
      state.connectors = items.connector || [];
      state.skills = items.skill || [];
      state.roomItems = items["room-item"] || [];
      state.userSettings = payload.settings || {};
      state.reducedUpdates = state.userSettings.reducedUpdates === true;
      state.platformLoading = false;
      state.platformError = "";
      updateActionBadge();
      if (["rooms", "workspace", "brief", "connectors", "action", "settings", "exchange", "home"].indexOf(state.page) !== -1) render();
      return payload;
    }).catch(function (error) {
      state.platformLoading = false;
      state.platformError = error.message;
      if (["rooms", "workspace", "brief", "connectors", "action", "settings"].indexOf(state.page) !== -1) render();
      return null;
    });
  }

  function platformActionItem(item) {
    return Object.assign({ id: item.id, title: item.title, status: missionDisplayStatus(item.status), owner: item.owner, created: formatWorkflowDate(item.createdAt) }, item.data || {});
  }

  function createPlatformItem(type, payload) {
    return apiJson("/api/platform/" + encodeURIComponent(type), { method: "POST", body: JSON.stringify(payload) }).then(function (item) {
      return loadPlatform().then(function () { return item; });
    });
  }

  function chooseAttachments() {
    var input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".txt,.md,.csv,.json,.pdf,.docx,.xlsx";
    input.addEventListener("change", function () {
      if (!input.files.length) return;
      var form = new FormData();
      Array.prototype.forEach.call(input.files, function (file) { form.append("files", file); });
      if (state.localAnalysisSessionId) form.append("sessionId", state.localAnalysisSessionId);
      fetch("/api/local-analysis/upload", { method: "POST", body: form }).then(function (response) { return response.json().then(function (payload) { if (!response.ok) throw new Error(payload.error || "Upload failed."); return payload; }); }).then(function (payload) {
        state.localAnalysisSessionId = payload.sessionId;
        openExperience({ title: "Files ready for local analysis", subtitle: payload.documents.length + " governed upload" + (payload.documents.length === 1 ? "" : "s"), body: '<div class="detail-callout">' + svg("i-shield") + '<span><strong>Extracted in local memory</strong><small>No file content was sent to a language model. Session ' + escapeHtml(payload.sessionId) + '</small></span></div><div class="focus-list">' + payload.documents.map(function (item) { return '<div><span><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.format || "document") + ' · ' + Number(item.size || 0).toLocaleString() + ' bytes</small></span></div>'; }).join("") + '</div>', footer: '<button class="primary-button" type="button" data-experience-close>Done</button>' });
      }).catch(function (error) { toast("Attachment failed", error.message); });
    });
    input.click();
  }

  function openWorkflowBuilder(workflowId) {
    state.workflowLoading = true;
    state.page = "workflow-builder";
    state.activeWorkflow = null;
    state.selectedWorkflowNodeId = null;
    window.history.replaceState(null, "", "?page=workflow-builder&workflow=" + encodeURIComponent(workflowId));
    render();
    return apiJson("/api/workflows/" + encodeURIComponent(workflowId)).then(function (payload) {
      state.activeWorkflow = payload.workflow;
      state.workflowRuns = payload.runs || [];
      state.selectedWorkflowNodeId = state.activeWorkflow.nodes.length ? state.activeWorkflow.nodes[0].id : null;
      state.workflowLoading = false;
      state.workflowError = "";
      render();
    }).catch(function (error) {
      state.workflowLoading = false;
      state.workflowError = error.message;
      render();
    });
  }

  function updateActionBadge() {
    var badge = document.getElementById("action-nav-count");
    if (!badge) return;
    var count = state.pendingActionCount;
    badge.hidden = !(count > 0);
    badge.textContent = count > 0 ? String(count) : "";
  }

  function loadPendingActionCount() {
    return apiJson("/api/actions/pending-count?role=securities").then(function (payload) {
      state.pendingActionCount = Math.max(0, Number(payload.count) || 0);
      state.pendingActions = payload.actions || [];
      updateActionBadge();
      return state.pendingActionCount;
    }).catch(function () {
      state.pendingActionCount = null;
      state.pendingActions = [];
      updateActionBadge();
      return null;
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
    var activeMissions = state.liveMissions.filter(function (mission) { return ["PLANNED", "RUNNING", "DRAFT READY", "REVISION REQUESTED"].indexOf(mission.status) !== -1; });
    var pendingReviews = state.liveMissions.filter(function (mission) { return mission.status === "AWAITING REVIEW"; });
    var latestMission = state.liveMissions[0];
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
      '<section class="panel">' + panelHead("My Work Brief", "i-spark", "verification") + (pendingReviews.length ? '<div class="home-live-list">' + pendingReviews.slice(0, 3).map(homeMissionItem).join("") + '</div>' : '<div class="clean-empty">' + miniIcon("i-brief", "blue") + '<strong>Your brief is clear</strong><p>No mission approvals currently need attention.</p></div>') + '</section>',
      '<section class="panel">' + panelHead("Continue Your Work", "i-brief", "workforce") + (latestMission ? '<div class="home-live-list">' + homeMissionItem(latestMission) + '</div>' : '<div class="clean-empty">' + miniIcon("i-flow", "teal") + '<strong>No work in progress</strong><p>Start a mission or ask BursaIQ a question to begin.</p></div>') + '</section></div>',
      '<section class="panel exchange-strip">' + panelHead("Explore the Intelligence Exchange", "i-exchange", "exchange") +
      '<div class="strip-tabs">' + ["Featured", "AI Agent", "Workflow", "Template", "Knowledge"].map(function (label) {
        var display = label === "AI Agent" ? "Agents" : label === "Workflow" ? "Workflows" : label === "Template" ? "Templates" : label;
        return '<button class="' + (state.homeAssetCategory === label || (label === "Featured" && state.homeAssetCategory === "Featured") ? "is-active" : "") + '" type="button" data-home-asset-type="' + label + '">' + display + '</button>';
      }).join("") + '</div>',
      '<div class="asset-row">' + (assetSlice.length ? assetSlice.map(homeAssetCard).join("") : '<div class="clean-empty"><strong>No saved intelligence yet</strong><p>Verified assets will appear after they are published to the Exchange.</p></div>') + "</div></section>",
      "</div>",
      '<aside class="home-rail">',
      '<section class="panel rail-panel">' + panelHead("Active AI Workforce", "i-agents", "workforce") + (activeMissions.length ? '<div class="home-live-count"><strong>' + activeMissions.length + '</strong><span>mission' + (activeMissions.length === 1 ? '' : 's') + ' active</span></div>' : '<div class="clean-empty compact"><strong>No agents working yet</strong><p>Agents will appear here when a mission starts.</p></div>') + '</section>',
      '<section class="panel rail-panel">' + panelHead("Pending Approvals", "i-shield", "verification") + (pendingReviews.length ? '<div class="home-live-count"><strong>' + pendingReviews.length + '</strong><span>mission' + (pendingReviews.length === 1 ? '' : 's') + ' awaiting review</span></div>' : '<div class="clean-empty compact"><strong>No pending approvals</strong><p>Items sent for review will appear here.</p></div>') + '</section>',
      '<section class="panel rail-panel">' + panelHead("Recommended for You", "i-spark", "exchange") + '<div class="clean-empty compact"><strong>No recommendations yet</strong><p>Recommendations will improve as you use BursaIQ.</p></div></section>',
      "</aside></div></section>"
    ].join("");
  }

  function homeMissionItem(mission) {
    return '<button type="button" data-mission="' + escapeHtml(mission.id) + '"><span><strong>' + escapeHtml(mission.title) + '</strong><small>' + escapeHtml(mission.id) + ' · ' + Number(mission.progress || 0) + '%</small></span>' + missionStatus(mission.status) + svg("i-chevron") + '</button>';
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
    return '<article class="asset-card"><button class="asset-open" type="button" data-asset-open="' + escapeHtml(asset.id || asset.title) + '"><div class="asset-cover">' + svg(asset.icon || "i-flow") + '</div><div class="asset-body"><strong>' + escapeHtml(asset.title) + '</strong><div class="asset-meta"><span>' + escapeHtml(asset.version || asset.uses || "Verified") + '</span><span>Open ' + svg("i-arrow") + '</span></div></div></button></article>';
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
      suggestion("Summarise the evidence behind a current decision", "Review approved sources, assumptions, and evidence gaps.") +
      suggestion("Compare two approved internal sources", "Identify aligned findings and material differences.") +
      suggestion("Explain a Bursa process in plain language", "Turn governed guidance into a concise explanation.") +
      suggestion("Which sources support the latest answer?", "See approved evidence, ownership, and coverage.") +
      "</div></div>";
  }

  function askBursaPage() {
    var messages = state.askBursaMessages.map(bursaMessageHtml).join("");
    var documentCount = state.askBursaKnowledge ? Number(state.askBursaKnowledge.documents || 0) : null;
    return [
      '<section class="ask-bursa-page">',
      '<header class="assistant-head"><div><h1>Ask Bursa</h1><p>Your internal question-and-answer channel across Bursa departments.</p></div><div class="page-head-actions"><span class="context-state"><i class="dot"></i> ' + (documentCount === null ? "Checking knowledge index" : documentCount + " indexed document" + (documentCount === 1 ? "" : "s")) + '</span><button class="secondary-button" type="button" data-page-jump="knowledge-admin">Manage knowledge</button></div></header>',
      '<div class="ask-bursa-main">',
      '<div class="assistant-thread ask-bursa-thread" id="ask-bursa-thread">',
      state.askBursaMessages.length ? messages : askBursaWelcome(),
      '</div>',
      '<div class="assistant-composer-wrap ask-bursa-composer-wrap"><form class="assistant-composer" id="ask-bursa-form"><label class="sr-only" for="ask-bursa-input">Ask an internal Bursa question</label><textarea id="ask-bursa-input" placeholder="Ask about HR, Group Technology, Regulations, or Market Operations…" required></textarea><div class="assistant-composer-tools"><div><button class="tool-button" type="button" data-demo-action="internal-sources">' + svg("i-book") + 'Internal sources</button><span class="bursa-answer-mode">Document-grounded Q&amp;A</span></div><button class="send-button" type="submit" aria-label="Send internal question">' + svg("i-send") + '</button></div></form><p class="assistant-note">Answers use role-permitted indexed documents and retain page or section citations.</p></div>',
      '</div></section>'
    ].join("");
  }

  function askBursaWelcome() {
    var suggestions = state.askBursaSuggestions.map(function (item) { return bursaSuggestion(item.question, item.department + " · " + item.description); }).join("");
    return '<div class="assistant-welcome ask-bursa-welcome"><h2>Ask anything <span>inside Bursa.</span></h2><p>Get a direct answer from approved internal guidance—without launching a task or opening a Decision Canvas.</p>' + (suggestions ? '<div class="suggestion-grid">' + suggestions + '</div>' : '<div class="clean-empty"><strong>No suggested topics yet</strong><p>Add approved documents and run the knowledge ingestion command. Ask Bursa will generate grounded questions from the indexed content.</p></div>') + '</div>';
  }

  function bursaSuggestion(title, description) {
    return '<button class="suggestion" type="button" data-bursa-prompt="' + escapeHtml(title) + '"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(description) + '</small></button>';
  }

  function knowledgeAdministrationPage() {
    var data = state.knowledgeAdmin;
    if (!data) return '<section class="page page-enter">' + pageHead("Knowledge Administration", "Upload, govern, index, and retire Ask Bursa sources.") + '<div class="clean-empty"><strong>' + escapeHtml(state.knowledgeAdminError || "Loading knowledge catalogue…") + '</strong></div></section>';
    var departments = (data.departments || []).map(function (item) { return '<option value="' + escapeHtml(item) + '">' + escapeHtml(item.replace(/_/g, " ").replace(/\b\w/g, function (letter) { return letter.toUpperCase(); })) + '</option>'; }).join("");
    var roles = (data.roles || []).map(function (role) { return '<label><input type="checkbox" name="allowedRoles" value="' + escapeHtml(role) + '" checked>' + escapeHtml(role.toUpperCase()) + '</label>'; }).join("");
    var replacementOptions = '<option value="">Does not replace another source</option>' + (data.documentsList || []).map(function (item) { return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.filename + " · v" + item.version) + '</option>'; }).join("");
    var documents = (data.documentsList || []).map(function (item) {
      var roleChecks = (data.roles || []).map(function (role) { return '<label><input type="checkbox" name="allowedRoles" value="' + escapeHtml(role) + '"' + (item.allowedRoles.indexOf(role) !== -1 ? " checked" : "") + '>' + escapeHtml(role.toUpperCase()) + '</label>'; }).join("");
      var lifecycleTone = item.lifecycle === "ACTIVE" ? "teal" : "amber";
      return '<article class="knowledge-document-card"><div class="knowledge-document-summary">' + miniIcon("i-document", lifecycleTone) + '<span><strong>' + escapeHtml(item.filename) + '</strong><small>' + escapeHtml(item.departmentLabel + " · " + item.classification + " · v" + item.version) + '</small><small>' + Number(item.chunks) + ' chunks · ' + Number(item.suggestions) + ' suggested questions · indexed ' + escapeHtml(formatWorkflowDate(item.indexedAt)) + '</small></span>' + status(item.lifecycle) + '</div><details><summary>Edit governance and permissions</summary><form class="knowledge-metadata-form" data-document-id="' + escapeHtml(item.id) + '"><div class="form-split"><label class="form-field">Owner<input name="owner" required maxlength="120" value="' + escapeHtml(item.owner) + '"></label><label class="form-field">Classification<select name="classification"><option' + (item.classification === "Internal" ? " selected" : "") + '>Internal</option><option' + (item.classification === "Confidential" ? " selected" : "") + '>Confidential</option><option' + (item.classification === "Public" ? " selected" : "") + '>Public</option></select></label></div><div class="form-split"><label class="form-field">Version<input name="version" required maxlength="40" value="' + escapeHtml(item.version) + '"></label><label class="form-field">Effective date<input name="effectiveDate" type="date" value="' + escapeHtml(item.effectiveDate || "") + '"></label></div><div class="form-split"><label class="form-field">Expiry date<input name="expiryDate" type="date" value="' + escapeHtml(item.expiryDate || "") + '"></label><label class="form-field">Replaces source<select name="replacesDocumentId">' + replacementOptions.replace('value="' + item.id + '"', 'value="' + item.id + '" disabled') .replace('value="' + (item.replacesDocumentId || "__none__") + '"', 'value="' + (item.replacesDocumentId || "__none__") + '" selected') + '</select></label></div><fieldset class="knowledge-role-list"><legend>Permitted roles</legend>' + roleChecks + '</fieldset><div class="node-config-actions"><button class="danger-button" type="button" data-knowledge-remove="' + escapeHtml(item.id) + '">Remove source</button><button class="secondary-button" type="button" data-knowledge-reindex="' + escapeHtml(item.id) + '">Re-index</button><button class="primary-button" type="submit">Save metadata</button></div></form></details></article>';
    }).join("");
    var suggestions = (data.suggestionsList || []).map(function (item) { return '<form class="knowledge-suggestion-row" data-suggestion-id="' + escapeHtml(item.id) + '"><div><strong>' + escapeHtml(item.sourceDocument) + '</strong><small>' + escapeHtml(item.department + " · source v" + item.sourceVersion) + '</small></div><label class="form-field">Question<input name="question" maxlength="180" value="' + escapeHtml(item.question) + '" required></label><label class="form-field">Description<input name="description" maxlength="220" value="' + escapeHtml(item.description) + '"></label><select name="status" aria-label="Suggestion visibility"><option value="ACTIVE"' + (item.status === "ACTIVE" ? " selected" : "") + '>Visible</option><option value="HIDDEN"' + (item.status === "HIDDEN" ? " selected" : "") + '>Hidden</option></select><button class="secondary-button" type="submit">Save</button></form>'; }).join("");
    var runs = (data.ingestionRuns || []).map(function (run) { var errors = (run.errors || []).map(function (error) { return '<li><strong>' + escapeHtml(error.path) + '</strong> — ' + escapeHtml(error.error) + '</li>'; }).join(""); return '<article class="ingestion-run"><div><strong>' + escapeHtml(run.id) + '</strong><small>' + escapeHtml(formatWorkflowDate(run.completedAt)) + '</small></div><span>Indexed ' + Number(run.indexed) + ' · unchanged ' + Number(run.unchanged) + ' · removed ' + Number(run.removed) + '</span>' + (errors ? '<details><summary>' + run.errors.length + ' failure' + (run.errors.length === 1 ? "" : "s") + '</summary><ul>' + errors + '</ul></details>' : status("Completed")) + '</article>'; }).join("");
    return '<section class="page page-enter knowledge-admin-page"><header class="page-head"><div><h1>Knowledge Administration</h1><p>Maintain the governed document collection used by Ask Bursa.</p></div><div class="page-head-actions"><button class="secondary-button" type="button" data-page-jump="ask-bursa">Open Ask Bursa</button><button class="primary-button" type="button" data-knowledge-ingest>Run ingestion</button></div></header>' + (state.knowledgeAdminError ? '<div class="mission-failure"><strong>Knowledge service unavailable</strong><small>' + escapeHtml(state.knowledgeAdminError) + '</small></div>' : '') + '<div class="metric-row">' + metric("i-document", "blue", String(data.documents || 0), "Indexed documents", "Permission filtered") + metric("i-cube", "teal", String(data.chunks || 0), "Searchable passages", "Embedded locally") + metric("i-spark", "violet", String(data.suggestions || 0), "Generated topics", "Reviewable below") + metric("i-clock", "amber", String((data.documentsList || []).filter(function (item) { return item.lifecycle !== "ACTIVE"; }).length), "Expired or replaced", "Excluded from retrieval") + '</div><section class="panel knowledge-upload-panel"><div class="panel-head"><div><h2>Upload an approved source</h2><p>The file is stored in its department folder and indexed using its governance metadata.</p></div></div><form id="knowledge-upload-form" class="knowledge-upload-form"><label class="form-field">Document<input name="file" type="file" required accept="' + escapeHtml((data.supportedExtensions || []).join(",")) + '"></label><div class="form-split"><label class="form-field">Department<select name="department" required>' + departments + '</select></label><label class="form-field">Owner<input name="owner" maxlength="120" required></label></div><div class="form-split"><label class="form-field">Classification<select name="classification"><option>Internal</option><option>Confidential</option><option>Public</option></select></label><label class="form-field">Version<input name="version" value="1.0" maxlength="40" required></label></div><div class="form-split"><label class="form-field">Effective date<input name="effectiveDate" type="date"></label><label class="form-field">Expiry date<input name="expiryDate" type="date"></label></div><label class="form-field">Replaces source<select name="replacesDocumentId">' + replacementOptions + '</select></label><fieldset class="knowledge-role-list"><legend>Permitted roles</legend>' + roles + '</fieldset><button class="primary-button" type="submit">Upload and index</button></form></section><section class="panel knowledge-admin-section"><div class="panel-head"><div><h2>Document catalogue</h2><p>Edit access, re-index changed sources, or remove retired content.</p></div></div><div class="knowledge-document-list">' + (documents || '<div class="clean-empty"><strong>No indexed documents</strong><p>Upload the first approved source above.</p></div>') + '</div></section><section class="panel knowledge-admin-section"><div class="panel-head"><div><h2>Suggested question review</h2><p>Only visible questions can appear on the Ask Bursa welcome screen.</p></div></div><div class="knowledge-suggestion-list">' + (suggestions || '<div class="clean-empty"><strong>No generated questions</strong><p>Questions are generated when supported documents are ingested.</p></div>') + '</div></section><section class="panel knowledge-admin-section"><div class="panel-head"><div><h2>Ingestion history and failures</h2><p>Extraction, embedding, and suggestion errors remain visible for remediation.</p></div></div><div class="ingestion-run-list">' + (runs || '<div class="clean-empty"><strong>No ingestion runs yet</strong></div>') + '</div></section></section>';
  }

  function bursaMessageHtml(message, messageIndex) {
    if (message.role === "user") return '<article class="chat-message user"><div class="chat-bubble"><p>' + escapeHtml(message.text) + '</p></div></article>';
    if (message.pending) return '<article class="chat-message"><div class="avatar blue">B</div><div class="chat-bubble"><div class="typing" aria-label="Ask Bursa is preparing an answer"><i></i><i></i><i></i></div></div></article>';
    var answer = message.answer;
    if (!answer) return "";
    return '<article class="chat-message"><div class="avatar blue">B</div><div class="chat-bubble bursa-answer"><span class="bursa-department">' + escapeHtml(answer.department) + '</span><h3>' + escapeHtml(answer.title) + '</h3><p>' + escapeHtml(answer.body) + '</p><div class="answer-actions"><button type="button" data-bursa-sources="' + Number(messageIndex) + '">View Source Scope</button></div></div></article>';
  }

  function openAskBursaSources(messageIndex) {
    var message = state.askBursaMessages[Number(messageIndex)];
    var answer = message && message.answer;
    if (!answer) return;
    var citations = (answer.citations || []).map(function (item) { return '<a class="bursa-citation" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener"><b>[' + Number(item.number) + ']</b><span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.location) + ' · ' + escapeHtml(item.department) + ' · v' + escapeHtml(item.version) + ' · ' + escapeHtml(item.classification || "Internal") + '</small></span></a>'; }).join("");
    openExperience({
      title: "Ask Bursa source scope",
      subtitle: (answer.citations || []).length + " permitted source passage" + ((answer.citations || []).length === 1 ? "" : "s"),
      body: '<div class="bursa-source-note">' + svg("i-book") + '<span><strong>' + escapeHtml(answer.source) + '</strong><small>Sources were filtered for the active role before answer generation.</small></span></div>' + (citations ? '<div class="bursa-citations">' + citations + '</div>' : '<div class="clean-empty"><strong>No indexed evidence retrieved</strong><p>The answer service did not receive any document passage for this response.</p></div>'),
      footer: '<button class="primary-button" type="button" data-experience-close>Done</button>'
    });
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
    var answer = message.answer;
    if (!answer) return "";
    return '<article class="chat-message"><div class="avatar violet">IQ</div><div class="chat-bubble"><span class="answer-label">' + (answer.isError ? "Connection error" : "Live governed answer") + '</span><h3>' + escapeHtml(answer.title) + '</h3><p>' + escapeHtml(answer.summary) + '</p><div class="answer-evidence">' + answer.stats.map(function (item) {
      return '<div class="evidence-stat"><strong>' + escapeHtml(item[0]) + '</strong><small>' + escapeHtml(item[1]) + '</small></div>';
    }).join("") + '</div><p class="answer-takeaway"><strong>What this means:</strong> ' + escapeHtml(answer.takeaway) + '</p><div class="answer-actions"><button type="button" data-assistant-canvas-tab="analysis">View analysis</button><button type="button" data-assistant-canvas-tab="source">Check sources</button><button type="button" data-demo-action="verify">Verify answer</button><button type="button" data-demo-action="briefing">Create briefing</button></div></div></article>';
  }

  function liveAssistantAnswer(payload, question) {
    var provider = payload.provider === "copilot" ? "Microsoft Copilot Studio" : "Local Ollama model";
    return {
      title: "BursaIQ live response",
      summary: payload.answer,
      stats: [[provider, "Live language model"], [payload.workspace || "assistant", "Governed workspace"], [payload.classification || "Controlled", "Data classification"]],
      takeaway: payload.answer,
      analysis: payload.answer,
      method: "Generated live through the Flask /api/chat integration. Route: " + (payload.routedBy || "selected workspace") + ".",
      plotTitle: "Live response provenance",
      plotValues: [100, 100, 100],
      plotLabels: ["Request", "Model", "Response"],
      observation: "This response came from " + provider + " for the current question.",
      sources: [{ title: provider, meta: payload.narrativeMode || "live-model", detail: "Live model response for: " + question, coverage: payload.workspace || "assistant" }],
      suggestedActions: payload.suggestedActions || []
    };
  }

  function chatErrorAnswer(error) {
    return {
      title: "Live response unavailable",
      summary: error.message,
      stats: [["Unavailable", "Language model"], ["No fallback", "Response mode"], ["Retry", "Next step"]],
      takeaway: "Check the selected model connection, then retry the question.",
      analysis: error.message,
      method: "The Flask API returned an error; no static answer was substituted.",
      plotTitle: "Connection state",
      plotValues: [100, 35, 0],
      plotLabels: ["Request", "API", "Model"],
      observation: "The request did not produce a live model response.",
      sources: [],
      isError: true
    };
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
    var availableAgents = state.registeredAgents.filter(function (agent) { return agent.status === "ACTIVE"; }).slice(0, 5);
    var missionRows = state.missionLoading ? '<tr><td colspan="7"><div class="mission-empty"><strong>Loading mission history…</strong><span>Connecting to the local mission service.</span></div></td></tr>' :
      state.missionError ? '<tr><td colspan="7"><div class="mission-empty is-error"><strong>Mission service unavailable</strong><span>' + escapeHtml(state.missionError) + ' Start the Flask service, then retry.</span><button class="secondary-button" type="button" data-mission-refresh>Retry</button></div></td></tr>' :
      state.liveMissions.length ? state.liveMissions.map(missionRow).join("") : '<tr><td colspan="7"><div class="mission-empty"><strong>No missions yet</strong><span>Create a mission to plan and run work through the available AI capabilities.</span><button class="secondary-button" type="button" data-create="mission">Create mission</button></div></td></tr>';
    return [
      '<section class="page page-enter">',
      pageHead("My Workforce", "Create, run, and monitor governed AI missions.", "New AI mission", "mission"),
      '<section class="mission-launch panel"><div class="mission-launch-copy"><span class="assistant-eyebrow">AI-planned missions</span><h2>What outcome should your AI workforce deliver?</h2><p>Describe the objective, reporting period, and expected output. BursaIQ validates the routed capability and selected reusable team before execution, then retains both versioned contracts.</p></div><div class="mission-launch-action"><strong>Start with an objective</strong><small>The live model may select only a registered, executable capability.</small><button class="primary-button" type="button" data-create="mission">Create mission</button><button class="secondary-button" type="button" data-page-jump="mission-teams">Build mission team</button><button class="secondary-button" type="button" data-page-jump="capability-library">View capabilities</button></div></section>',
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="mission-status-ledger" aria-label="Mission status summary"><span><b>' + active.length + '</b> active</span><span><b>' + awaiting.length + '</b> awaiting review</span><span><b>' + state.liveMissions.length + '</b> total missions</span><span><b>' + completed.length + '</b> completed</span><em>Mission state and review history are persisted by the backend</em></div>',
      '<section class="panel">' + panelHead("Mission Control", "i-flow") + '<div class="table-wrap"><table class="mission-table live-mission-table"><thead><tr><th>Mission</th><th>Reporting window</th><th>Progress</th><th>Current worker</th><th>Updated</th><th>Status</th><th>Action</th></tr></thead><tbody>' + missionRows + "</tbody></table></div></section>",
      "</div><aside class=\"page-rail\">",
      '<section class="panel rail-panel"><div class="panel-head"><h2>' + svg("i-agents") + 'Agent Library</h2><button type="button" data-page-jump="agent-library">Manage</button></div><ul class="agent-feed mission-agent-feed">' + (availableAgents.length ? availableAgents.map(function (agent) { return '<li>' + miniIcon("i-spark", agent.provider === "ollama" ? "blue" : "violet") + '<span><strong>' + escapeHtml(agent.name) + '</strong><small>' + escapeHtml(agent.description) + '</small></span><button class="worker-ready" type="button" data-agent-id="' + escapeHtml(agent.id) + '">Open</button></li>'; }).join("") : '<li><span></span><span><strong>No active agents</strong><small>Create or enable an agent in the library.</small></span></li>') + "</ul><div class=\"rail-panel-action\"><button class=\"secondary-button\" type=\"button\" data-agent-new>Create agent</button></div></section>",
      '<section class="panel rail-panel mission-rulebook"><div class="panel-head"><h2>' + svg("i-shield") + 'Mission governance</h2></div><dl><div><dt>Scope</dt><dd>Objective, inputs, and output are retained with each mission</dd></div><div><dt>Evidence</dt><dd>Results remain linked to their permitted sources</dd></div><div><dt>Review</dt><dd>Human approval is required before publication</dd></div><div><dt>History</dt><dd>Revisions and reviewer decisions remain auditable</dd></div></dl></section>',
      "</aside></div></section>"
    ].join("");
  }

  function metric(icon, tone, value, label, delta) {
    return '<button class="panel metric" type="button" data-metric-context="' + escapeHtml(label) + '">' + miniIcon(icon, tone) + '<span><strong>' + value + '</strong><small>' + label + '</small><em>' + delta + "</em></span>" + svg("i-chevron") + "</button>";
  }

  function agentCard(agent) {
    return '<article class="agent-card registry-agent-card" data-filter-text="' + escapeHtml(agent.name + " " + agent.department + " " + agent.provider) + '"><div class="agent-card-head">' + miniIcon("i-spark", agent.provider === "ollama" ? "blue" : "violet") + '<span><strong>' + escapeHtml(agent.name) + '</strong><small>' + escapeHtml(agent.status) + ' · v' + Number(agent.version) + '</small></span></div><p>' + escapeHtml(agent.description) + '</p><div class="agent-card-meta"><span>' + escapeHtml(agent.department) + '</span><span>' + escapeHtml(agent.provider === "ollama" ? "Ollama" : "Copilot Studio") + '</span></div><button type="button" data-agent-id="' + escapeHtml(agent.id) + '">Configure ' + svg("i-arrow") + "</button></article>";
  }

  function agentLibraryPage() {
    var active = state.registeredAgents.filter(function (agent) { return agent.status === "ACTIVE"; });
    var custom = state.registeredAgents.filter(function (agent) { return !agent.builtIn; });
    var cards = state.agentLoading ? '<div class="clean-empty"><strong>Loading registered agents…</strong></div>' : state.agentError ? '<div class="mission-failure"><strong>Agent Registry unavailable</strong><small>' + escapeHtml(state.agentError) + '</small></div>' : state.registeredAgents.length ? '<div class="agent-cards registry-agent-grid">' + state.registeredAgents.map(agentCard).join("") + '</div><div class="empty-state" id="agent-library-empty" hidden><h3>No agents match</h3></div>' : '<div class="clean-empty"><strong>No permitted agents</strong><p>Create an agent or ask an administrator for access.</p></div>';
    return '<section class="page page-enter agent-library-page">' + pageHead("Agent Library", "Create, configure, test, and govern reusable agents for missions and workflows.", "Create agent", "agent") + '<div class="metric-row">' + metric("i-spark", "teal", String(active.length), "Active agents", "Available for assignment") + metric("i-agents", "violet", String(custom.length), "Custom agents", "Created in this registry") + metric("i-shield", "amber", String(state.registeredAgents.filter(function (agent) { return agent.approvalPolicy !== "none"; }).length), "Approval governed", "Human controls retained") + metric("i-flow", "blue", String(state.registeredAgents.reduce(function (total, agent) { return total + agent.capabilities.length; }, 0)), "Capability assignments", "Declared and versioned") + '</div><section class="panel"><div class="tabs-toolbar"><button class="secondary-button" type="button" data-page-jump="workforce">← My Workforce</button><label class="inline-search">' + svg("i-search") + '<input id="agent-search" type="search" placeholder="Search agents, departments or providers…"></label><span class="toolbar-spacer"></span><button class="primary-button" type="button" data-agent-new>Create agent</button></div>' + cards + '</section></section>';
  }

  function agentListValue(values) { return (values || []).join(", "); }

  function agentBuilderPage() {
    if (state.agentLoading) return '<section class="page page-enter"><div class="clean-empty"><strong>Opening Agent Builder…</strong></div></section>';
    if (!state.activeAgent) return '<section class="page page-enter">' + pageHead("Agent Builder", "The selected agent could not be opened.") + '<div class="mission-failure"><strong>Agent unavailable</strong><small>' + escapeHtml(state.agentError || "Return to the Agent Library and choose an agent.") + '</small></div><button class="secondary-button" type="button" data-page-jump="agent-library">Back to Agent Library</button></section>';
    var agent = state.activeAgent;
    var persisted = Boolean(agent.id);
    var executions = state.agentExecutions.length ? state.agentExecutions.map(function (item) { return '<article class="agent-run-row">' + workflowStatus(item.status) + '<span><strong>' + escapeHtml(item.prompt) + '</strong><small>' + escapeHtml(item.response || item.error || "No response recorded") + '</small></span><time>' + escapeHtml(formatWorkflowDate(item.createdAt)) + '</time></article>'; }).join("") : '<div class="clean-empty compact"><strong>No test executions yet</strong><p>Save the agent, then run a live provider test.</p></div>';
    return '<section class="page page-enter agent-builder-page"><header class="builder-head"><button class="secondary-button" type="button" data-page-jump="agent-library">← Agent Library</button><div><strong>' + escapeHtml(persisted ? agent.name : "New agent") + '</strong><p>' + (persisted ? escapeHtml(agent.id) + ' · version ' + Number(agent.version) : 'Unsaved registry agent') + '</p></div><div class="builder-actions">' + (persisted ? '<button class="danger-button" type="button" data-agent-action="archive">Archive</button><button class="secondary-button" type="button" data-agent-action="duplicate">Duplicate</button>' : '') + '<button class="primary-button" type="submit" form="agent-builder-form">' + (persisted ? "Save new version" : "Create agent") + '</button></div></header><div class="agent-builder-layout"><form class="panel agent-builder-form" id="agent-builder-form"><div class="content-view-head"><div><h2>Identity &amp; instructions</h2><p>Define what the agent may do and who is accountable for it.</p></div>' + workflowStatus(agent.status) + '</div><div class="form-split"><label class="form-field">Agent name<input name="name" maxlength="120" required value="' + escapeHtml(agent.name) + '"></label><label class="form-field">Department<input name="department" maxlength="120" required value="' + escapeHtml(agent.department) + '"></label></div><label class="form-field">Description<textarea name="description" maxlength="500" required>' + escapeHtml(agent.description) + '</textarea></label><label class="form-field">System instructions<textarea name="instructions" maxlength="5000" required>' + escapeHtml(agent.instructions) + '</textarea></label><div class="form-split"><label class="form-field">Owner<input name="owner" maxlength="120" required value="' + escapeHtml(agent.owner) + '"></label><label class="form-field">Status<select name="status"><option value="ACTIVE"' + (agent.status === "ACTIVE" ? " selected" : "") + '>Active</option><option value="DISABLED"' + (agent.status === "DISABLED" ? " selected" : "") + '>Disabled</option><option value="ARCHIVED"' + (agent.status === "ARCHIVED" ? " selected" : "") + '>Archived</option></select></label></div><h2>Model configuration</h2><div class="form-split"><label class="form-field">Provider<select name="provider"><option value="ollama"' + (agent.provider === "ollama" ? " selected" : "") + '>Local Ollama</option><option value="copilot"' + (agent.provider === "copilot" ? " selected" : "") + '>Microsoft Copilot Studio</option></select></label><label class="form-field">Model<input name="model" maxlength="120" required value="' + escapeHtml(agent.model) + '"></label></div><div class="form-split"><label class="form-field">Temperature<input type="number" name="temperature" min="0" max="2" step="0.1" value="' + Number(agent.generation.temperature) + '"></label><label class="form-field">Maximum output tokens<input type="number" name="maxTokens" min="64" max="32768" step="1" value="' + Number(agent.generation.maxTokens) + '"></label></div><h2>Access &amp; capabilities</h2><label class="form-field">Allowed roles <small>Comma-separated: employee, gcmc, hr, securities, finance</small><input name="roles" value="' + escapeHtml(agentListValue(agent.roles)) + '"></label><label class="form-field">Knowledge collections<input name="knowledgeCollections" value="' + escapeHtml(agentListValue(agent.knowledgeCollections)) + '" placeholder="market_operations, regulations"></label><label class="form-field">Connectors<input name="connectors" value="' + escapeHtml(agentListValue(agent.connectors)) + '" placeholder="sharepoint, email"></label><label class="form-field">Supported tools<input name="tools" value="' + escapeHtml(agentListValue(agent.tools)) + '"></label><label class="form-field">Mission capabilities<input name="capabilities" value="' + escapeHtml(agentListValue(agent.capabilities)) + '"></label><label class="form-field">Approval policy<select name="approvalPolicy"><option value="none"' + (agent.approvalPolicy === "none" ? " selected" : "") + '>No additional approval</option><option value="human-review"' + (agent.approvalPolicy === "human-review" ? " selected" : "") + '>Human review</option><option value="high-impact"' + (agent.approvalPolicy === "high-impact" ? " selected" : "") + '>High-impact approval</option></select></label><div class="form-split"><label class="form-field">Input schema (JSON)<textarea name="inputSchema" class="schema-field">' + escapeHtml(JSON.stringify(agent.inputSchema, null, 2)) + '</textarea></label><label class="form-field">Output schema (JSON)<textarea name="outputSchema" class="schema-field">' + escapeHtml(JSON.stringify(agent.outputSchema, null, 2)) + '</textarea></label></div><p class="form-error" id="agent-form-error" hidden></p></form><aside class="agent-test-column"><section class="panel agent-test-panel"><div class="panel-head"><h2>' + svg("i-spark") + 'Live test console</h2></div><form id="agent-test-form"><label class="form-field">Test request<textarea name="prompt" required placeholder="Ask this agent to perform a bounded test…"></textarea></label><button class="primary-button" type="submit"' + (persisted && agent.status === "ACTIVE" ? "" : " disabled") + '>Run live test</button><p class="form-hint">Tests call the configured provider and are retained in execution history.</p></form></section><section class="panel agent-history"><div class="panel-head"><h2>' + svg("i-clock") + 'Execution history</h2></div>' + executions + '</section></aside></div></section>';
  }

  function missionTeamsPage() {
    var cards = state.missionTeams.map(function (team) { return '<article class="agent-card team-card" data-filter-text="' + escapeHtml(team.name + " " + team.owner + " " + team.capability) + '"><div class="agent-card-head">' + miniIcon("i-agents", "teal") + '<span><strong>' + escapeHtml(team.name) + '</strong><small>' + escapeHtml(team.status) + ' · v' + Number(team.version) + '</small></span></div><p>' + escapeHtml(team.description) + '</p><div class="agent-card-meta"><span>' + team.stages.length + ' stages</span><span>' + escapeHtml(team.capability) + '</span></div><button type="button" data-team-id="' + escapeHtml(team.id) + '">Configure ' + svg("i-arrow") + '</button></article>'; }).join("");
    return '<section class="page page-enter">' + pageHead("Mission Teams", "Build reusable teams from registered agents, responsibilities, and dependency rules.") + '<section class="panel"><div class="tabs-toolbar"><button class="secondary-button" type="button" data-page-jump="workforce">← My Workforce</button><label class="inline-search">' + svg("i-search") + '<input id="team-search" type="search" placeholder="Search mission teams…"></label><span class="toolbar-spacer"></span><button class="primary-button" type="button" data-team-new>Build mission team</button></div>' + (state.teamLoading ? '<div class="clean-empty"><strong>Loading mission teams…</strong></div>' : state.teamError ? '<div class="mission-failure"><strong>Mission Team service unavailable</strong><small>' + escapeHtml(state.teamError) + '</small></div>' : cards ? '<div class="agent-cards registry-agent-grid">' + cards + '</div><div class="empty-state" id="team-empty" hidden><h3>No teams match</h3></div>' : '<div class="clean-empty"><strong>No mission teams yet</strong><p>Build a reusable team from registered agents.</p></div>') + '</section></section>';
  }

  function capabilityLibraryPage() {
    var cards = state.missionCapabilities.map(function (item) {
      return '<article class="agent-card team-card"><div class="agent-card-head">' + miniIcon("i-cube", item.executable ? "teal" : "amber") + '<span><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.status) + ' · v' + Number(item.version) + '</small></span></div><p>' + escapeHtml(item.description) + '</p><div class="agent-card-meta"><span>' + escapeHtml(item.outputSchema) + '</span><span>' + escapeHtml(item.executor) + '</span></div><div class="detail-callout">' + svg(item.executable ? "i-check" : "i-clock") + '<span><strong>' + (item.executable ? "Executable" : "Unavailable") + '</strong><small>' + escapeHtml(item.availabilityReason) + '</small></span></div><small>Required inputs: ' + escapeHtml((item.requiredInputs || []).join(", ") || "None") + '</small></article>';
    }).join("");
    return '<section class="page page-enter">' + pageHead("Mission Capabilities", "The registry controls what the live router may select and what Python may execute.") + '<section class="panel"><div class="tabs-toolbar"><button class="secondary-button" type="button" data-page-jump="workforce">← My Workforce</button><span class="toolbar-spacer"></span><small>Metadata alone cannot install an executor.</small></div>' + (state.capabilityError ? '<div class="mission-failure"><strong>Capability Registry unavailable</strong><small>' + escapeHtml(state.capabilityError) + '</small></div>' : cards ? '<div class="agent-cards registry-agent-grid">' + cards + '</div>' : '<div class="clean-empty"><strong>No mission capabilities registered</strong></div>') + '</section></section>';
  }

  function missionTeamBuilderPage() {
    if (state.teamLoading) return '<section class="page page-enter"><div class="clean-empty"><strong>Opening Mission Team Builder…</strong></div></section>';
    var team = state.activeMissionTeam;
    if (!team) return '<section class="page page-enter">' + pageHead("Mission Team Builder", "The selected team could not be opened.") + '<div class="mission-failure"><strong>Mission team unavailable</strong><small>' + escapeHtml(state.teamError) + '</small></div></section>';
    var selected = team.stages.filter(function (stage) { return stage.id === state.selectedTeamStageId; })[0] || team.stages[0];
    var typeLabels = { "mission-manager": "Mission Manager", data: "Gather Data", analysis: "Analysis", insight: "Insight", report: "Report" };
    var stages = team.stages.map(function (stage, index) { var agent = state.registeredAgents.filter(function (item) { return item.id === stage.agentId; })[0]; return '<article class="builder-node ' + (selected && selected.id === stage.id ? "is-selected" : "") + '" data-team-stage="' + escapeHtml(stage.id) + '"><span class="builder-node-order">' + (index + 1) + '</span>' + miniIcon("i-spark", "teal") + '<span><strong>' + escapeHtml(stage.name) + '</strong><small>' + escapeHtml(typeLabels[stage.stageType] || stage.stageType) + ' · ' + escapeHtml(agent ? agent.name : stage.agentId) + '</small></span><span class="builder-node-controls"><button type="button" data-team-stage-move="up" data-stage-id="' + escapeHtml(stage.id) + '"' + (index === 0 ? " disabled" : "") + '>↑</button><button type="button" data-team-stage-move="down" data-stage-id="' + escapeHtml(stage.id) + '"' + (index === team.stages.length - 1 ? " disabled" : "") + '>↓</button></span></article>'; }).join('<span class="builder-connector">↓</span>');
    var activeAgents = state.registeredAgents.filter(function (agent) { return agent.status === "ACTIVE"; });
    var configuration = selected ? '<form id="team-stage-form" class="node-config-form"><input type="hidden" name="id" value="' + escapeHtml(selected.id) + '"><label class="form-field">Stage name<input name="name" required maxlength="120" value="' + escapeHtml(selected.name) + '"></label><label class="form-field">Stage responsibility<textarea name="responsibility" maxlength="1000">' + escapeHtml(selected.responsibility || "") + '</textarea></label><label class="form-field">Stage type<select name="stageType">' + Object.keys(typeLabels).map(function (type) { return '<option value="' + type + '"' + (selected.stageType === type ? " selected" : "") + '>' + typeLabels[type] + '</option>'; }).join("") + '</select></label><label class="form-field">Assigned registered agent<select name="agentId">' + activeAgents.map(function (agent) { return '<option value="' + escapeHtml(agent.id) + '"' + (agent.id === selected.agentId ? " selected" : "") + '>' + escapeHtml(agent.name + " · " + agent.model + " · v" + agent.version) + '</option>'; }).join("") + '</select></label><div class="agent-assignment-scope">' + (function () { var agent = activeAgents.filter(function (item) { return item.id === selected.agentId; })[0]; return agent ? '<small>Tools</small><strong>' + escapeHtml(agentListValue(agent.tools) || "None declared") + '</strong><small>Knowledge</small><strong>' + escapeHtml(agentListValue(agent.knowledgeCollections) || "None declared") + '</strong><small>Connectors</small><strong>' + escapeHtml(agentListValue(agent.connectors) || "None declared") + '</strong>' : '<small>Select an active agent.</small>'; }()) + '</div><fieldset class="node-dependencies"><legend>Dependencies</legend>' + team.stages.filter(function (item) { return item.id !== selected.id; }).map(function (item) { return '<label><input type="checkbox" name="dependency" value="' + escapeHtml(item.id) + '"' + ((selected.dependencies || []).indexOf(item.id) !== -1 ? " checked" : "") + '>' + escapeHtml(item.name) + '</label>'; }).join("") + '</fieldset><div class="node-config-actions"><button class="danger-button" type="button" data-team-stage-delete="' + escapeHtml(selected.id) + '">Remove stage</button><button class="primary-button" type="submit">Apply stage</button></div></form>' : '<div class="clean-empty compact"><strong>Add or select a stage</strong></div>';
    var capabilityOptions = state.missionCapabilities.map(function (item) { return '<option value="' + escapeHtml(item.id) + '"' + (item.id === team.capability ? " selected" : "") + '>' + escapeHtml(item.name + (item.executable ? " · executable" : " · unavailable")) + '</option>'; }).join("");
    return '<section class="page page-enter workflow-builder-page"><header class="builder-head"><button class="secondary-button" type="button" data-page-jump="mission-teams">← Mission Teams</button><div><input id="team-name" maxlength="120" value="' + escapeHtml(team.name) + '" placeholder="Mission team name"><p>' + (team.id ? escapeHtml(team.id) + ' · version ' + Number(team.version) : 'Unsaved reusable team') + '</p></div><div class="builder-actions">' + (team.id ? '<button class="secondary-button" type="button" data-team-action="duplicate">Duplicate</button><button class="secondary-button" type="button" data-team-action="validate">Validate team</button>' : '') + '<button class="primary-button" type="button" data-team-action="save">Save team</button></div></header><div class="builder-layout"><section class="panel builder-canvas"><div class="builder-toolbar"><strong>Team stages</strong><button class="secondary-button" type="button" data-team-stage-add>Add stage</button></div><div class="builder-flow">' + stages + '</div></section><aside class="panel builder-properties"><div class="panel-head"><h2>' + svg("i-settings") + 'Stage configuration</h2></div>' + configuration + '</aside></div><section class="panel team-details"><div class="form-split"><label class="form-field">Description<textarea id="team-description" maxlength="600">' + escapeHtml(team.description) + '</textarea></label><label class="form-field">Owner<input id="team-owner" maxlength="120" value="' + escapeHtml(team.owner) + '"><span>Capability</span><select id="team-capability"' + (team.builtIn ? " disabled" : "") + '>' + capabilityOptions + '</select></label></div><p class="form-error" id="team-form-error" hidden></p></section></section>';
  }

  function missionRow(mission) {
    var worker = mission.currentWorker ? mission.currentWorker.replace(/-/g, " ").replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) : "Mission Manager";
    var updated = mission.updatedAt ? new Date(mission.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
    return '<tr data-mission-row="' + escapeHtml(mission.id) + '"><td><button class="mission-title mission-title-button" type="button" data-mission="' + escapeHtml(mission.id) + '" aria-label="Open mission ' + escapeHtml(mission.title) + '">' + miniIcon("i-document", mission.status === "FAILED" ? "red" : "blue") + '<span><strong>' + escapeHtml(mission.title) + '</strong><small>v' + Number(mission.version || 1) + ' · ' + escapeHtml(mission.id) + '</small></span></button></td><td><span class="mission-window">' + escapeHtml(mission.dateStart) + '<b>→</b>' + escapeHtml(mission.dateEnd) + '</span></td><td><span class="table-progress"><span class="progress-track"><i style="width:' + Number(mission.progress || 0) + '%"></i></span><span>' + Number(mission.progress || 0) + '%</span></span></td><td>' + escapeHtml(worker) + '</td><td>' + escapeHtml(updated) + '</td><td>' + missionStatus(mission.status) + '</td><td><button class="table-action" type="button" data-mission="' + escapeHtml(mission.id) + '">' + (mission.status === "DRAFT READY" ? "Inspect draft" : mission.status === "AWAITING REVIEW" ? "Track review" : mission.status === "REVISION REQUESTED" ? "Revise" : "Open") + '</button></td></tr>';
  }

  function exchangePage() {
    var reuseTotal = assets.reduce(function (total, asset) { return total + Number(asset.reuseCount || 0); }, 0);
    var assetGrid = assets.length ? assets.map(featuredCard).join("") : '<div class="clean-empty"><strong>No reusable missions yet</strong><p>Approve a mission, then publish it from My Workforce.</p></div>';
    var marketGrid = assets.length ? assets.map(marketAsset).join("") + '<div class="empty-state" id="exchange-empty" hidden><h3>No reusable missions found</h3></div>' : '<div class="clean-empty"><strong>The Exchange is empty</strong><p>Published mission intelligence will appear here with its evidence and approval record.</p></div>';
    return [
      '<section class="page page-enter">',
      pageHead("Intelligence Exchange", "Turn approved mission results into reusable, governed intelligence."),
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="metric-row">' + metric("i-exchange", "blue", String(assets.length), "Reusable missions", assets.length ? "Approved and versioned" : "Nothing published yet") + metric("i-document", "violet", String(assets.length), "Versioned reports", "Evidence retained") + metric("i-flow", "blue", String(reuseTotal), "Mission reuses", reuseTotal ? "Fresh executions created" : "No reuse yet") + metric("i-shield", "teal", String(assets.length), "Approval records", "Human decisions attached") + "</div>",
      '<section class="panel exchange-search"><div class="exchange-search-box"><label class="large-search">' + svg("i-search") + '<input id="exchange-search-input" type="search" placeholder="Search reusable missions, owners or evidence…"></label></div></section>',
      '<section class="panel">' + panelHead("Approved reusable missions", "i-spark", "featured") + '<div class="featured-assets">' + assetGrid + '</div></section>',
      '<section class="panel">' + panelHead("Mission library", "i-exchange", "all-assets") + '<div class="asset-market-grid" id="asset-market-grid">' + marketGrid + '</div></section>',
      (state.skills.length ? '<section class="panel">' + panelHead("Skill drafts", "i-cube") + '<div class="asset-market-grid">' + state.skills.map(function (item) { return '<article class="market-asset">' + miniIcon("i-cube", "amber") + '<span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.status) + ' · ' + escapeHtml(item.owner) + ' · approval required before publication</small></span><button type="button" data-platform-open="skill:' + escapeHtml(item.id) + '">Open</button></article>'; }).join("") + '</div></section>' : ''),
      '</div><aside class="page-rail">',
      '<section class="panel rail-panel">' + panelHead("How intelligence travels", "i-flow", "lifecycle") + '<div class="exchange-flow"><strong>Approved Mission</strong><span>→</span><strong>Intelligence Exchange</strong><span>→</span><strong>Reusable Mission</strong></div></section>',
      '<section class="panel rail-panel">' + panelHead("Publication contract", "i-shield", "governance") + '<div class="clean-empty compact"><strong>Nothing is published automatically</strong><p>An employee publishes only after human approval. The report, parameters, sources, owner and approval record travel together.</p></div></section>',
      "</aside></div></section>"
    ].join("");
  }

  function category(id, icon, label) {
    return '<button class="category-button ' + (state.exchangeCategory === id ? "is-active" : "") + '" type="button" data-category="' + id + '">' + svg(icon) + label + "</button>";
  }

  function featuredCard(asset) {
    return '<article class="featured-card"><div class="featured-top">' + miniIcon("i-flow", "violet") + '<span class="status green">' + svg("i-check") + ' Approved · ' + escapeHtml(asset.version) + '</span></div><h3>' + escapeHtml(asset.title) + '</h3><p>' + escapeHtml(asset.resultSummary.classification || "Verified mission intelligence") + '</p><div class="featured-foot"><span>' + escapeHtml(asset.owner) + '<br>' + Number(asset.reuseCount || 0) + ' reuses</span><button type="button" data-asset-open="' + escapeHtml(asset.id) + '">Inspect &amp; reuse</button></div></article>';
  }

  function marketAsset(asset) {
    return '<article class="market-asset">' + miniIcon("i-document", "blue") + '<span><strong>' + escapeHtml(asset.title) + '</strong><small>' + escapeHtml(asset.version) + ' · ' + escapeHtml(asset.owner) + ' · ' + asset.evidence.length + ' evidence sources</small></span><button type="button" data-asset-open="' + escapeHtml(asset.id) + '">Open</button></article>';
  }

  function contributor(rank, name, count) {
    return '<li><span class="avatar">' + rank + '</span><span><strong>' + name + '</strong><small>' + count + '</small></span><span class="status green">↑ ' + (25 - Number(rank) * 3) + "%</span></li>";
  }

  function automationPage() {
    var active = state.workflows.filter(function (item) { return item.status === "ACTIVE"; }).length;
    var runs = state.workflowRuns.filter(function (item) { return item.mode === "RUN"; });
    var successful = runs.filter(function (item) { return item.status === "COMPLETED"; }).length;
    var pending = runs.filter(function (item) { return item.status === "WAITING_APPROVAL"; }).length;
    return [
      '<section class="page page-enter">',
      pageHead("Automation Studio", "Build, run and monitor intelligent workflows across Bursa.", "Create workflow", "workflow"),
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="metric-row">' + metric("i-automation", "blue", String(active), "Active workflows", state.workflows.length + " saved") + metric("i-shield", "violet", String(pending), "Pending approvals", pending ? "Human action required" : "Nothing awaiting review") + metric("i-flow", "blue", String(runs.length), "Recorded runs", "Persisted execution history") + metric("i-check", "teal", runs.length ? Math.round(successful / runs.length * 100) + "%" : "—", "Success rate", runs.length ? "From actual runs" : "Available after first run") + "</div>",
      '<section class="panel tabs-toolbar"><button class="tab-button ' + (state.automationTab === "workflows" ? "is-active" : "") + '" type="button" data-automation-tab="workflows">' + svg("i-automation") + 'My workflows</button><button class="tab-button ' + (state.automationTab === "templates" ? "is-active" : "") + '" type="button" data-automation-tab="templates">' + svg("i-book") + 'Templates</button><button class="tab-button ' + (state.automationTab === "runs" ? "is-active" : "") + '" type="button" data-automation-tab="runs">' + svg("i-clock") + 'Runs</button><span class="toolbar-spacer"></span><label class="inline-search">' + svg("i-search") + '<input id="automation-search" type="search" placeholder="Search ' + state.automationTab + '…"></label></section>',
      automationTabContent(),
      '</div><aside class="page-rail">',
      '<section class="panel rail-panel">' + panelHead("Upcoming Runs", "i-clock", "runs") + '<div class="clean-empty compact"><strong>No upcoming runs</strong></div></section>',
      '<section class="panel rail-panel">' + panelHead("Pending Approval Steps", "i-shield", "approvals") + '<div class="clean-empty compact"><strong>No pending approvals</strong></div></section>',
      "</aside></div></section>"
    ].join("");
  }

  function automationTabContent() {
    if (state.workflowLoading) return '<section class="panel content-view"><div class="clean-empty"><strong>Loading workflows…</strong></div></section>';
    if (state.workflowError) return '<section class="panel content-view"><div class="mission-failure"><strong>Workflow API unavailable</strong><small>' + escapeHtml(state.workflowError) + '</small></div></section>';
    if (state.automationTab === "runs") {
      if (!state.workflowRuns.length) return automationEmpty("No execution history", "Test and run records will appear here after a workflow action.");
      return '<section class="panel content-view"><div class="table-wrap"><table class="mission-table"><thead><tr><th>Run</th><th>Workflow</th><th>Mode</th><th>Started</th><th>Status</th><th>Result</th></tr></thead><tbody>' + state.workflowRuns.map(function (run) { var workflow = state.workflows.filter(function (item) { return item.id === run.workflowId; })[0]; return '<tr><td><strong>' + escapeHtml(run.id) + '</strong></td><td><button class="workflow-name-button" type="button" data-workflow-open="' + escapeHtml(run.workflowId) + '">' + escapeHtml(workflow ? workflow.name : run.workflowId) + '</button></td><td>' + escapeHtml(run.mode) + '</td><td>' + escapeHtml(formatWorkflowDate(run.startedAt)) + '</td><td>' + workflowStatus(run.status) + '</td><td>' + escapeHtml(run.events.length ? run.events[run.events.length - 1].message : (run.validation.errors || []).join(" ")) + '</td></tr>'; }).join("") + '</tbody></table></div></section>';
    }
    if (state.automationTab === "templates") return automationEmpty("No templates available", "Approved templates will appear here when published.");
    if (!state.workflows.length) return automationEmpty("No workflows yet", "Create your first workflow to begin automating repeatable work.");
    return '<section class="panel content-view"><div class="table-wrap"><table class="mission-table workflow-table"><thead><tr><th>Workflow</th><th>Owner</th><th>Updated</th><th>Runs</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + state.workflows.map(workflowRow).join("") + '</tbody></table></div></section>';
  }

  function automationEmpty(heading, detail) {
    return '<section class="panel content-view"><div class="clean-empty">' + miniIcon("i-automation", "violet") + '<strong>' + heading + '</strong><p>' + detail + '</p><button class="primary-button" type="button" data-create="workflow">Create workflow</button></div></section>';
  }

  function workflowRow(workflow) {
    return '<tr data-filter-text="' + escapeHtml(workflow.name + " " + workflow.owner) + '"><td><button class="mission-title mission-title-button" type="button" data-workflow-open="' + escapeHtml(workflow.id) + '">' + miniIcon("i-automation", "violet") + '<span><strong>' + escapeHtml(workflow.name) + '</strong><small>' + workflow.nodes.length + ' steps · ' + escapeHtml(workflow.id) + '</small></span></button></td><td>' + escapeHtml(workflow.owner) + '</td><td>' + escapeHtml(formatWorkflowDate(workflow.updatedAt)) + '</td><td>' + workflow.runCount + '</td><td>' + workflowStatus(workflow.status) + '</td><td><div class="workflow-row-actions"><button class="table-action" type="button" data-workflow-open="' + escapeHtml(workflow.id) + '">Edit</button><button class="table-action" type="button" data-workflow-duplicate="' + escapeHtml(workflow.id) + '">Duplicate</button></div></td></tr>';
  }

  function formatWorkflowDate(value) {
    if (!value) return "Never";
    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function workflowStatus(value) {
    var tone = value === "ACTIVE" || value === "COMPLETED" || value === "VALIDATED" ? "green" : value === "BLOCKED" || value === "INVALID" ? "red" : value === "WAITING_APPROVAL" ? "amber" : "blue";
    return '<span class="status ' + tone + '">' + escapeHtml(String(value || "DRAFT").replace(/_/g, " ")) + '</span>';
  }

  function workflowBuilderPage() {
    if (state.workflowLoading) return '<section class="page page-enter"><div class="clean-empty"><strong>Opening Workflow Builder…</strong></div></section>';
    if (!state.activeWorkflow) return '<section class="page page-enter">' + pageHead("Workflow Builder", "The selected workflow could not be opened.") + '<div class="mission-failure"><strong>Workflow unavailable</strong><small>' + escapeHtml(state.workflowError || "Return to Automation Studio and choose a workflow.") + '</small></div><button class="secondary-button" type="button" data-page-jump="automation">Back to Automation Studio</button></section>';
    var workflow = state.activeWorkflow;
    var selected = workflow.nodes.filter(function (node) { return node.id === state.selectedWorkflowNodeId; })[0] || null;
    var selectedConfig = selected && selected.config || {};
    var connectionTargets = selected ? workflow.nodes.filter(function (node) { return node.id !== selected.id; }) : [];
    var dependencies = selected ? workflow.connections.filter(function (connection) { return connection.target === selected.id; }).map(function (connection) { return connection.source; }) : [];
    var nodeTypes = [["trigger", "Trigger"], ["gather-data", "Gather Data"], ["ai-agent", "AI Agent"], ["condition", "Condition"], ["human-approval", "Human Approval"], ["generate-report", "Generate Report"], ["publish-send", "Publish / Send"]];
    var nodes = workflow.nodes.map(function (node, index) { var incoming = workflow.connections.filter(function (item) { return item.target === node.id; }).map(function (item) { var source = workflow.nodes.filter(function (candidate) { return candidate.id === item.source; })[0]; return source ? source.name : item.source; }); return '<article class="builder-node ' + (selected && selected.id === node.id ? "is-selected" : "") + '" draggable="true" data-workflow-node="' + escapeHtml(node.id) + '"><span class="builder-node-order">' + (index + 1) + '</span>' + miniIcon(workflowNodeIcon(node.type), workflowNodeTone(node.type)) + '<span><strong>' + escapeHtml(node.name) + '</strong><small>' + escapeHtml(nodeTypes.filter(function (item) { return item[0] === node.type; })[0][1]) + (incoming.length ? " · after " + escapeHtml(incoming.join(", ")) : "") + '</small></span><span class="builder-node-controls"><button type="button" aria-label="Move step up" data-node-move="up" data-node-id="' + escapeHtml(node.id) + '"' + (index === 0 ? " disabled" : "") + '>↑</button><button type="button" aria-label="Move step down" data-node-move="down" data-node-id="' + escapeHtml(node.id) + '"' + (index === workflow.nodes.length - 1 ? " disabled" : "") + '>↓</button></span></article>'; }).join('<span class="builder-connector">↓</span>');
    var assignableAgents = state.registeredAgents.filter(function (agent) { return agent.status === "ACTIVE"; });
    var capabilityOptions = state.missionCapabilities.filter(function (item) { return item.status === "ACTIVE"; }).map(function (item) { return '<option value="' + escapeHtml(item.id) + '"' + (item.id === selectedConfig.capabilityId ? " selected" : "") + '>' + escapeHtml(item.name + " · v" + item.version) + '</option>'; }).join("");
    var config = selected ? '<form id="node-config-form" class="node-config-form"><input type="hidden" name="id" value="' + escapeHtml(selected.id) + '"><label class="form-field">Step name<input name="name" maxlength="100" required value="' + escapeHtml(selected.name) + '"></label><label class="form-field">Step type<select name="type">' + nodeTypes.map(function (item) { return '<option value="' + item[0] + '"' + (item[0] === selected.type ? " selected" : "") + '>' + item[1] + '</option>'; }).join("") + '</select></label><label class="form-field">Assigned AI agent<select name="agentId"><option value="">Select a registered agent</option>' + assignableAgents.map(function (agent) { return '<option value="' + escapeHtml(agent.id) + '"' + (agent.id === (selectedConfig.agentId || selectedConfig.agent) ? " selected" : "") + '>' + escapeHtml(agent.name + " · " + agent.provider + " · v" + agent.version) + '</option>'; }).join("") + '</select></label><button class="canvas-action-link" type="button" data-page-jump="agent-library">Manage Agent Library ' + svg("i-arrow") + '</button><label class="form-field">Registered capability<select name="capabilityId"><option value="">No capability constraint</option>' + capabilityOptions + '</select></label><button class="canvas-action-link" type="button" data-page-jump="capability-library">View Capability Registry ' + svg("i-arrow") + '</button><label class="form-field">Inputs<textarea name="inputs" maxlength="1000" placeholder="Describe required inputs">' + escapeHtml(selectedConfig.inputs || "") + '</textarea></label><label class="form-field">Outputs<textarea name="outputs" maxlength="1000" placeholder="Describe expected outputs">' + escapeHtml(selectedConfig.outputs || "") + '</textarea></label><label class="form-field">Condition<input name="expression" maxlength="300" value="' + escapeHtml(selectedConfig.expression || "") + '" placeholder="e.g. agent.response contains approved"></label><div class="form-split"><label class="form-field">Maximum retries<input type="number" name="maxRetries" min="0" max="3" value="' + Number(selectedConfig.maxRetries || 0) + '"></label><label class="form-field">Approver<input name="approver" maxlength="100" value="' + escapeHtml(selectedConfig.approver || workflow.owner) + '"></label></div><label class="form-field">Publish / Send integration<select name="integration"><option value=""' + (!selectedConfig.integration ? " selected" : "") + '>No configured integration</option><option value="publish-approved-mission"' + (selectedConfig.integration === "publish-approved-mission" ? " selected" : "") + '>Publish approved mission to Exchange</option></select></label><label class="form-field">Approved mission ID<input name="missionId" maxlength="100" value="' + escapeHtml(selectedConfig.missionId || "") + '" placeholder="Required only for Exchange publication"></label><fieldset class="node-dependencies"><legend>Dependencies / connections</legend>' + connectionTargets.map(function (node) { return '<label><input type="checkbox" name="dependency" value="' + escapeHtml(node.id) + '"' + (dependencies.indexOf(node.id) !== -1 ? " checked" : "") + '>' + escapeHtml(node.name) + '</label>'; }).join("") + '</fieldset><div class="node-config-actions"><button class="danger-button" type="button" data-node-delete="' + escapeHtml(selected.id) + '">Remove step</button><button class="primary-button" type="submit">Apply configuration</button></div></form>' : '<div class="clean-empty compact"><strong>Select a node</strong><p>Choose a step on the canvas to edit its inputs, outputs and dependencies.</p></div>';
    var latestRun = state.workflowRuns[0];
    var runEvents = latestRun && latestRun.events ? latestRun.events.map(function (event) { return '<article class="agent-run-row">' + workflowStatus(event.status) + '<span><strong>' + escapeHtml(event.nodeName || "Validation") + '</strong><small>' + escapeHtml(event.message) + (event.retries ? " · retries: " + event.retries : "") + (event.error ? " · error: " + event.error : "") + '</small></span><time>' + escapeHtml(formatWorkflowDate(event.occurredAt)) + '</time></article>'; }).join("") : "";
    var approvalActions = latestRun && latestRun.status === "WAITING_APPROVAL" ? '<div class="detail-callout">' + svg("i-shield") + '<span><strong>Review in Verification Centre</strong><small>This run is linked to the shared review queue and audit history.</small></span><button class="primary-button" type="button" data-page-jump="verification">Open review</button></div>' : "";
    return '<section class="page page-enter workflow-builder-page"><header class="builder-head"><button class="secondary-button" type="button" data-page-jump="automation">← Automation Studio</button><div><input id="workflow-name" maxlength="120" value="' + escapeHtml(workflow.name) + '" aria-label="Workflow name"><p>' + escapeHtml(workflow.id) + ' · Last saved ' + escapeHtml(formatWorkflowDate(workflow.updatedAt)) + '</p></div><div class="builder-actions"><button class="danger-button" type="button" data-workflow-action="delete">Delete</button><button class="secondary-button" type="button" data-workflow-action="duplicate">Duplicate</button><button class="secondary-button" type="button" data-workflow-action="test">Test Workflow</button><button class="secondary-button" type="button" data-workflow-action="save">Save Draft</button><button class="primary-button" type="button" data-workflow-action="run">Run Workflow</button></div></header><div class="builder-layout"><section class="panel builder-canvas"><div class="builder-toolbar"><strong>Workflow canvas</strong><label>Add step<select id="workflow-node-type">' + nodeTypes.map(function (item) { return '<option value="' + item[0] + '">' + item[1] + '</option>'; }).join("") + '</select></label><button class="secondary-button" type="button" data-node-add>Add step</button></div><div class="builder-flow">' + (nodes || '<div class="clean-empty"><strong>No steps yet</strong><p>Add a Trigger to begin.</p></div>') + '</div></section><aside class="panel builder-properties"><div class="panel-head"><h2>' + svg("i-settings") + 'Node configuration</h2></div>' + config + '</aside></div><section class="panel builder-history"><div class="content-view-head"><div><h2>Validation &amp; execution history</h2><p>Inputs, outputs, errors, retries, and approval transitions are persisted by the Flask backend.</p></div>' + workflowStatus(workflow.status) + '</div>' + (latestRun ? '<div class="run-result">' + workflowStatus(latestRun.status) + '<span><strong>' + escapeHtml(latestRun.mode + " · " + latestRun.id) + '</strong><small>' + escapeHtml(latestRun.events.length ? latestRun.events[latestRun.events.length - 1].message : (latestRun.validation.errors || []).join(" ")) + '</small></span></div>' + approvalActions + '<div class="agent-run-list">' + runEvents + '</div>' : '<div class="clean-empty compact"><strong>No tests or runs yet</strong></div>') + '</section></section>';
  }

  function workflowNodeIcon(type) {
    return { trigger: "i-clock", "gather-data": "i-folder", "ai-agent": "i-spark", condition: "i-flow", "human-approval": "i-shield", "generate-report": "i-document", "publish-send": "i-send" }[type] || "i-flow";
  }

  function workflowNodeTone(type) {
    return { trigger: "teal", "gather-data": "blue", "ai-agent": "violet", condition: "amber", "human-approval": "amber", "generate-report": "blue", "publish-send": "violet" }[type] || "blue";
  }

  function roomsPage() {
    if (!rooms.length) {
      return '<section class="page page-enter">' + pageHead("Collaborative Rooms", "Work with colleagues and AI agents in shared mission spaces.", "Create room", "room") + '<div class="metric-row">' + metric("i-room", "blue", "0", "Active rooms", "No rooms yet") + metric("i-spark", "violet", "0", "Rooms with AI agents", "No agents assigned") + metric("i-document", "blue", "0", "Pending decisions", "Nothing pending") + metric("i-exchange", "teal", "0", "Cross-department projects", "No shared projects") + '</div><section class="panel"><div class="clean-empty">' + miniIcon("i-room", "violet") + '<strong>No collaborative rooms yet</strong><p>Create a room when you are ready to bring colleagues, evidence, and AI agents together.</p><button class="primary-button" type="button" data-create="room">Create room</button></div></section></section>';
    }
    var current = rooms.filter(function (room) { return room.id === state.selectedRoom; })[0] || rooms[0];
    var visibleRooms = rooms.filter(function (room) { return state.roomScope === "mine" ? room.scope !== "shared" : state.roomScope === "shared" ? room.scope === "shared" : true; });
    var currentItems = state.roomItems.filter(function (item) { return item.data.roomId === current.id; });
    var pendingRoomDecisions = currentItems.filter(function (item) { return item.data.kind === "decision" && item.status === "PENDING"; });
    return [
      '<section class="page page-enter">',
      pageHead("Collaborative Rooms", "Work with colleagues and AI agents in shared mission spaces.", "Create room", "room"),
      '<div class="page-with-rail"><div class="page-primary">',
      '<div class="metric-row">' + metric("i-room", "blue", String(rooms.length), "Active rooms", "Persisted in BursaIQ") + metric("i-spark", "violet", String(rooms.filter(function (room) { return Number(room.agents || 0) > 0; }).length), "Rooms with AI agents", "Assigned explicitly") + metric("i-document", "blue", String(pendingRoomDecisions.length), "Pending decisions", pendingRoomDecisions.length ? "Needs attention" : "Nothing pending") + metric("i-exchange", "teal", String(state.projects.length), "Linked projects", "Workspace records") + "</div>",
      '<section class="panel"><div class="tabs-toolbar"><button class="tab-button ' + (state.roomScope === "mine" ? "is-active" : "") + '" type="button" data-room-scope="mine">' + svg("i-room") + 'My rooms</button><button class="tab-button ' + (state.roomScope === "shared" ? "is-active" : "") + '" type="button" data-room-scope="shared">' + svg("i-agents") + 'Shared with me</button><button class="tab-button ' + (state.roomScope === "discover" ? "is-active" : "") + '" type="button" data-room-scope="discover">' + svg("i-search") + 'Discover</button><span class="toolbar-spacer"></span><label class="inline-search">' + svg("i-search") + '<input id="room-search" type="search" placeholder="Search rooms, people or topics…"></label></div><div class="room-cards">' + visibleRooms.map(roomCard).join("") + '<div class="empty-state" id="room-empty" hidden>' + miniIcon("i-search", "blue") + '<h3>No rooms match</h3><p>Try a different name or topic.</p></div></div></section>',
      '<section class="panel room-detail"><div class="room-detail-head"><div class="room-detail-title">' + miniIcon("i-room", "violet") + '<div><h2>' + escapeHtml(current.title) + '</h2><p>' + escapeHtml(current.description || "No shared mission defined.") + '</p></div></div><span class="status blue">' + escapeHtml(current.status || "DRAFT") + '</span></div>',
      '<div class="room-tabs">' + ["overview", "activity", "tasks", "files", "agents", "members"].map(function (tab) { var label = tab === "agents" ? "AI agents" : tab.charAt(0).toUpperCase() + tab.slice(1); return '<button class="' + (state.roomTab === tab ? "is-active" : "") + '" type="button" data-room-tab="' + tab + '">' + label + '</button>'; }).join("") + '</div>',
      '<div id="room-tab-content">' + roomTabContent(current) + '</div>',
      '</section></div><aside class="page-rail">',
      '<section class="panel rail-panel">' + panelHead("Room owner", "i-agents") + '<ul class="rail-list">' + participant("KH", current.owner || "Lim Kim Hoong", "Accountable owner", "Online") + "</ul></section>",
      '<section class="panel rail-panel">' + panelHead("Pending Room Decisions", "i-shield") + (pendingRoomDecisions.length ? '<ul class="rail-list">' + pendingRoomDecisions.map(function (item) { return railItem("i-document", "amber", escapeHtml(item.title), "Persisted room decision", "Review"); }).join("") + '</ul>' : '<div class="clean-empty compact"><strong>No pending decisions</strong></div>') + "</section>",
      "</aside></div></section>"
    ].join("");
  }

  function roomTabContent(current) {
    if (state.roomTab === "overview") {
      return '<div class="room-summary"><article class="summary-block"><h3>Shared mission</h3><p>' + escapeHtml(current.description || "No mission description saved.") + '</p></article><article class="summary-block"><h3>Governance</h3><p>' + escapeHtml(current.governance || "Standard approval") + '</p></article><article class="summary-block"><h3>Persisted activity</h3><p>' + state.roomItems.filter(function (item) { return item.data.roomId === current.id; }).length + ' room items saved.</p></article></div>';
    }
    var labels = { activity: ["Room activity", "activity"], tasks: ["Room tasks", "task"], files: ["Files and knowledge", "file"], agents: ["AI teammates", "agent"], members: ["Room members", "member"] }[state.roomTab];
    var items = state.roomItems.filter(function (item) { return item.data.roomId === current.id && item.data.kind === labels[1]; });
    return '<section class="room-focus"><div class="content-view-head"><div><h2>' + labels[0] + '</h2><p>Saved room records with accountable ownership.</p></div><button class="secondary-button" type="button" data-room-add="' + labels[1] + '">Add ' + labels[1] + '</button></div><div class="focus-list">' + (items.length ? items.map(function (item) { return '<button type="button" data-platform-open="room-item:' + escapeHtml(item.id) + '"><span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.status) + ' · ' + escapeHtml(formatWorkflowDate(item.updatedAt)) + '</small></span>' + svg("i-chevron") + '</button>'; }).join("") : '<div class="clean-empty compact"><strong>No ' + labels[1] + ' records yet</strong></div>') + '</div></section>';
  }

  function roomCard(room) {
    return '<button class="room-card ' + (room.id === state.selectedRoom ? "is-selected" : "") + '" type="button" data-room="' + escapeHtml(room.id) + '"><div class="featured-top">' + miniIcon("i-room", "violet") + '<span class="status blue">' + escapeHtml(room.tag || "Owned") + '</span></div><h3>' + escapeHtml(room.title) + '</h3><p>' + escapeHtml(room.description || "No description") + '</p><div class="room-meta"><span>' + Number(room.members || 1) + ' members</span><span>' + Number(room.agents || 0) + " AI agents</span></div></button>";
  }

  function participant(initials, name, dept, presence) {
    return '<li><span class="avatar">' + initials + '</span><span><strong>' + name + '</strong><small>' + dept + '</small></span><span class="status ' + (presence === "Online" ? "green" : "amber") + '">' + presence + "</span></li>";
  }

  function workspacePage() {
    var projectData = state.projects;
    var governedFiles = state.roomItems.filter(function (item) { return item.data.kind === "file"; });
    return '<section class="page page-enter">' + pageHead("Projects & Workspace", "Files, governed context and decision memory for people and AI.", "New project", "project") +
      '<div class="metric-row">' + metric("i-folder", "blue", String(projectData.length), "Active projects", "Persisted workspaces") + metric("i-document", "violet", String(governedFiles.length), "Governed files", "Room file records") + metric("i-book", "teal", String(state.savedDecisions.length), "Saved decisions", "Evidence retained") + metric("i-agents", "amber", String(new Set(projectData.map(function (item) { return item.owner; })).size), "Contributors", "Accountable owners") + '</div>' +
      '<section class="panel tabs-toolbar"><button class="tab-button ' + (state.workspaceView === "projects" ? "is-active" : "") + '" type="button" data-workspace-view="projects">' + svg("i-folder") + 'Projects</button><button class="tab-button ' + (state.workspaceView === "files" ? "is-active" : "") + '" type="button" data-workspace-view="files">' + svg("i-document") + 'Recent files</button><button class="tab-button ' + (state.workspaceView === "decisions" ? "is-active" : "") + '" type="button" data-workspace-view="decisions">' + svg("i-shield") + 'Decision memory</button><span class="toolbar-spacer"></span><label class="inline-search">' + svg("i-search") + '<input id="workspace-search" type="search" placeholder="Search workspace…"></label></section>' +
      '<div class="support-layout"><div class="support-main"><section class="panel content-view">' + workspaceContent(projectData) + '</section></div><aside class="support-rail"><section class="panel rail-panel">' + panelHead("Workspace health", "i-shield") + '<div class="clean-empty compact"><strong>' + (projectData.length ? "Governance active" : "No workspace data yet") + '</strong><p>' + (projectData.length ? projectData.length + " persisted project records." : "Governance health will appear after work is added.") + '</p></div></section><section class="panel rail-panel">' + panelHead("Accountable owners", "i-agents") + (projectData.length ? '<ul class="compact-list">' + projectData.map(function (item) { return '<li><span><strong>' + escapeHtml(item.owner) + '</strong><small>' + escapeHtml(item.title) + '</small></span></li>'; }).join("") + '</ul>' : '<div class="clean-empty compact"><strong>No collaborators yet</strong></div>') + '</section></aside></div></section>';
  }

  function workspaceContent(projectData) {
    if (state.workspaceView === "files") { var files = state.roomItems.filter(function (item) { return item.data.kind === "file"; }); return '<div class="content-view-head"><div><h2>Recent files</h2><p>Documents retain owner, sensitivity and verification state.</p></div><button class="secondary-button" type="button" data-platform-create="file">Add file record</button></div>' + platformItemList(files, "No files yet"); }
    if (state.workspaceView === "decisions") return '<div class="content-view-head"><div><h2>Decision memory</h2><p>The rationale, evidence and accountable owner behind important choices.</p></div><button class="secondary-button" type="button" data-platform-create="decision">Record decision</button></div>' + platformItemList(state.savedDecisions, "No decisions recorded");
    return '<div class="content-view-head"><div><h2>Active projects</h2><p>Spaces that carry approved context into every mission.</p></div><button class="secondary-button" type="button" data-create="project">New project</button></div>' + platformItemList(projectData, "No projects yet");
  }

  function platformItemList(items, emptyLabel) {
    if (!items.length) return '<div class="clean-empty"><strong>' + emptyLabel + '</strong><p>Create a record to add governed context to this workspace.</p></div>';
    return '<div class="focus-list">' + items.map(function (item) { return '<button type="button" data-platform-open="' + escapeHtml((item.type || "decision") + ":" + item.id) + '" data-filter-text="' + escapeHtml(item.title) + '"><span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.status || "Draft") + ' · ' + escapeHtml(item.owner || "Lim Kim Hoong") + '</small></span>' + svg("i-chevron") + '</button>'; }).join("") + '</div>';
  }

  function briefPage() {
    var approvals = state.liveMissions.filter(function (item) { return item.status === "AWAITING REVIEW"; });
    var active = state.liveMissions.filter(function (item) { return ["PLANNED", "RUNNING", "DRAFT READY", "REVISION REQUESTED"].indexOf(item.status) !== -1; });
    var updates = state.workflowRuns.slice(0, 5);
    var briefItems = state.briefFilter === "approvals" ? approvals.map(function (item) { return { id: item.id, title: item.title, detail: "Mission awaiting human review", page: "verification" }; }) : state.briefFilter === "updates" ? updates.map(function (item) { return { id: item.id, title: item.mode + " · " + item.status, detail: formatWorkflowDate(item.startedAt), page: "automation" }; }) : approvals.concat(active).slice(0, 8).map(function (item) { return { id: item.id, title: item.title, detail: missionDisplayStatus(item.status), page: item.status === "AWAITING REVIEW" ? "verification" : "workforce" }; });
    return '<section class="page page-enter">' + pageHead("Today\'s Brief", "Priorities, approvals and verified changes from live backend data.", "Ask about today", "assistant") + '<section class="brief-hero"><div><h2>Good morning, Kim Hoong.</h2><p>' + (briefItems.length ? briefItems.length + " current items need context or attention." : "You are all caught up. New priorities will appear as work begins.") + '</p></div><div class="brief-orbit" aria-hidden="true"><i></i><i></i><i></i><span>' + svg("i-spark") + '</span></div></section><div class="support-layout"><div class="support-main"><section class="panel"><div class="filter-tabs"><button class="' + (state.briefFilter === "for-you" ? "is-active" : "") + '" type="button" data-brief-filter="for-you">For you <b>' + (approvals.length + active.length) + '</b></button><button class="' + (state.briefFilter === "approvals" ? "is-active" : "") + '" type="button" data-brief-filter="approvals">Approvals <b>' + approvals.length + '</b></button><button class="' + (state.briefFilter === "updates" ? "is-active" : "") + '" type="button" data-brief-filter="updates">Updates <b>' + updates.length + '</b></button></div>' + (briefItems.length ? '<div class="focus-list">' + briefItems.map(function (item) { return '<button type="button" data-page-jump="' + item.page + '"><span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.detail) + '</small></span>' + svg("i-chevron") + '</button>'; }).join("") + '</div>' : '<div class="clean-empty"><strong>Nothing needs your attention</strong><p>Your tasks, approvals and updates will appear here.</p></div>') + '</section></div><aside class="support-rail"><section class="panel rail-panel">' + panelHead("Mission pulse", "i-flow", "workforce") + '<div class="clean-empty compact"><strong>' + active.length + ' missions moving</strong><p>Loaded from My Workforce.</p></div></section><section class="panel rail-panel">' + panelHead("Workflow activity", "i-clock", "runs") + '<div class="clean-empty compact"><strong>' + updates.length + ' recent records</strong></div></section></aside></div></section>';
  }

  function verificationPage() {
    var reviewable = state.liveMissions.filter(function (mission) { return ["AWAITING REVIEW", "APPROVED", "REVISION REQUESTED"].indexOf(mission.status) !== -1; });
    var pending = reviewable.filter(function (mission) { return mission.status === "AWAITING REVIEW"; });
    var selected = missionById(state.selectedVerificationMissionId) || pending[0] || reviewable[0];
    var selectedCase = selected ? state.verificationCases.filter(function (item) { return item.id === selected.verificationCaseId; })[0] : null;
    var linkedCaseIds = state.liveMissions.map(function (item) { return item.verificationCaseId; }).filter(Boolean);
    var standaloneCases = state.verificationCases.filter(function (item) { return linkedCaseIds.indexOf(item.id) === -1; });
    var standaloneSelected = state.selectedVerificationCaseId ? standaloneCases.filter(function (item) { return item.id === state.selectedVerificationCaseId; })[0] : (!state.selectedVerificationMissionId && !pending.length ? standaloneCases.filter(function (item) { return item.status === "Pending review"; })[0] || standaloneCases[0] : null);
    if (standaloneSelected) { selected = null; selectedCase = standaloneSelected; }
    var retainedComment = selectedCase && selectedCase.reviewerComment ? '<div class="detail-callout review-comment-callout">' + svg("i-help") + '<span><strong>Reviewer comment retained</strong><small>' + escapeHtml(selectedCase.reviewerComment) + '</small></span></div>' : "";
    var queueItems = reviewable.map(function (mission) { return '<button class="verification-item ' + (selected && selected.id === mission.id ? "is-selected" : "") + '" type="button" data-verification-mission="' + escapeHtml(mission.id) + '">' + miniIcon("i-document", mission.status === "AWAITING REVIEW" ? "amber" : "teal") + '<span><strong>' + escapeHtml(mission.title) + '</strong><small>' + escapeHtml(mission.id) + ' · ' + escapeHtml(mission.dateStart) + ' → ' + escapeHtml(mission.dateEnd) + '</small></span>' + missionStatus(mission.status) + svg("i-chevron") + '</button>'; }).concat(standaloneCases.map(function (item) { return '<button class="verification-item ' + (standaloneSelected && standaloneSelected.id === item.id ? "is-selected" : "") + '" type="button" data-verification-case="' + escapeHtml(item.id) + '">' + miniIcon("i-document", item.status === "Pending review" ? "amber" : "teal") + '<span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.id) + ' · ' + escapeHtml(item.workspace) + '</small></span>' + status(item.status) + svg("i-chevron") + '</button>'; }));
    var queue = state.missionLoading ? '<div class="mission-empty"><strong>Loading review queue…</strong></div>' : queueItems.length ? queueItems.join("") : '<div class="mission-empty"><strong>No packages awaiting review</strong><span>Submit a mission draft or verify an Assistant answer.</span></div>';
    var missionPreview = selected && selected.result ? '<div class="content-view-head"><div><h2>' + escapeHtml(selected.title) + '</h2><p>Version ' + Number(selected.version || 1) + ' · ' + escapeHtml(selected.id) + ' · immutable mission draft</p></div>' + missionStatus(selected.status) + '</div>' + retainedComment + missionResultSections(selected.result) + (selected.status === "AWAITING REVIEW" ? '<label class="review-comment"><span>Reviewer comment</span><textarea id="mission-review-comment" maxlength="1000" placeholder="Required when requesting changes; optional for approval"></textarea></label>' : '') + '<div class="evidence-actions">' + (selected.status === "AWAITING REVIEW" ? '<button class="secondary-button" type="button" data-mission-review="Changes requested" data-mission-id="' + escapeHtml(selected.id) + '">Request changes</button><button class="primary-button" type="button" data-mission-review="Approved" data-mission-id="' + escapeHtml(selected.id) + '">Approve package</button>' : selected.status === "REVISION REQUESTED" ? '<button class="primary-button" type="button" data-mission-revise="' + escapeHtml(selected.id) + '">Create revision</button>' : '') + '</div>' : "";
    var caseDetails = standaloneSelected && standaloneSelected.details || {};
    var caseEvents = (caseDetails.nodeEvents || []).map(function (event) { return '<article class="agent-run-row">' + workflowStatus(event.status) + '<span><strong>' + escapeHtml(event.nodeName || "Workflow step") + '</strong><small>' + escapeHtml(event.message || "") + (event.error ? " · " + event.error : "") + '</small></span><time>' + escapeHtml(formatWorkflowDate(event.occurredAt)) + '</time></article>'; }).join("");
    var isWorkflowReview = caseDetails.kind === "workflow-approval";
    var casePreview = standaloneSelected ? '<div class="content-view-head"><div><h2>' + escapeHtml(standaloneSelected.title) + '</h2><p>' + escapeHtml(standaloneSelected.id) + ' · ' + escapeHtml(standaloneSelected.workspace) + '</p></div>' + status(standaloneSelected.status) + '</div>' + retainedComment + '<div class="detail-callout">' + svg(isWorkflowReview ? "i-flow" : "i-shield") + '<span><strong>' + escapeHtml(caseDetails.answerTitle || standaloneSelected.title) + '</strong><small>' + escapeHtml(caseDetails.answerText || caseDetails.question || standaloneSelected.scope) + '</small></span></div>' + (caseEvents ? '<div class="agent-run-list">' + caseEvents + '</div>' : '') + (standaloneSelected.status === "Pending review" ? '<label class="review-comment"><span>Reviewer comment</span><textarea id="case-review-comment" maxlength="1000" placeholder="Required for rejection or requested changes"></textarea></label><div class="evidence-actions">' + (isWorkflowReview ? '<button class="danger-button" type="button" data-case-review="Rejected" data-case-id="' + escapeHtml(standaloneSelected.id) + '">Reject</button>' : '') + '<button class="secondary-button" type="button" data-case-review="Changes requested" data-case-id="' + escapeHtml(standaloneSelected.id) + '">Request changes</button><button class="primary-button" type="button" data-case-review="Approved" data-case-id="' + escapeHtml(standaloneSelected.id) + '">' + (isWorkflowReview ? "Approve and resume" : "Approve") + '</button></div>' : '') : "";
    var preview = missionPreview || casePreview || '<div class="mission-empty"><strong>Select a review package</strong><span>Its evidence, audit context, and review actions will appear here.</span></div>';
    return '<section class="page page-enter">' + pageHead("Verification Centre", "Inspect versioned mission outputs, evidence, and review history before they move forward.") + (state.verificationError ? '<div class="mission-failure"><strong>Verification API unavailable</strong><small>' + escapeHtml(state.verificationError) + '</small></div>' : '') + '<div class="metric-row">' + metric("i-shield", "amber", String(pending.length + state.verificationCases.filter(function (item) { return item.status === "Pending review" && linkedCaseIds.indexOf(item.id) === -1; }).length), "Pending review", "Assigned reviewer") + metric("i-check", "teal", String(reviewable.filter(function (item) { return item.status === "APPROVED"; }).length), "Approved missions", "Audit event retained") + metric("i-document", "blue", reviewable.length ? "100%" : "—", "Metric traceability", reviewable.length ? "Persisted output and source payload" : "Available after the first mission") + metric("i-clock", "violet", String(state.verificationCases.length), "Persisted review cases", "Loaded from verification API") + '</div><div class="verification-layout"><section class="panel verification-queue"><div class="filter-tabs"><button class="is-active" type="button">Review queue <b>' + queueItems.length + '</b></button><button type="button" data-page-jump="workforce">My Workforce</button></div>' + queue + '</section><section class="panel evidence-preview">' + preview + '</section></div><p class="verification-demo-note">Reviewer actions are recorded with the active reviewer identity and persisted in the audit store.</p></section>';
  }

  function connectorsPage() {
    var rows = state.connectors.map(function (item) { return '<article class="market-asset"><span>' + miniIcon("i-plug", "violet") + '</span><span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.data.description || "No business need supplied") + ' · ' + escapeHtml(item.owner) + '</small></span>' + workflowStatus(item.status) + '<button type="button" data-platform-open="connector:' + escapeHtml(item.id) + '">Manage</button></article>'; }).join("");
    return '<section class="page page-enter">' + pageHead("Connectors", "Approved systems and data sources, governed by your existing access.", "Request connector", "connector") + '<section class="connector-boundary">' + svg("i-shield") + '<div><strong>Your permissions travel with every request.</strong><p>BursaIQ never grants new source access. Requests remain unavailable until an administrator configures and approves the external credentials.</p></div><button type="button" data-access-boundary>View access boundary</button></section><section class="panel">' + (rows || '<div class="clean-empty"><strong>No connectors configured</strong><p>Request an approved system or data source to get started.</p><button class="primary-button" type="button" data-create="connector">Request connector</button></div>') + '</section></section>';
  }

  function actionPage() {
    var pendingRows = state.pendingActions.map(function (item) {
      var target = item.type === "workflow-approval" ? ' data-verification-case="' + escapeHtml(item.id) + '"' : ' data-page-jump="' + escapeHtml(item.page) + '"';
      return '<button class="verification-item" type="button"' + target + '>' + miniIcon(item.type === "verification" ? "i-shield" : "i-flow", "amber") + '<span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.detail) + '</small></span>' + status(item.status) + svg("i-chevron") + '</button>';
    }).join("");
    var decisionRows = state.savedDecisions.map(function (item) {
      return '<article class="action-record"><span class="action-record-icon">' + svg("i-brief") + '</span><div><div><strong>' + escapeHtml(item.title) + '</strong>' + status(item.status) + '</div><p>' + escapeHtml(item.question) + '</p><small>' + escapeHtml(item.id) + ' · ' + escapeHtml(item.owner) + ' · ' + escapeHtml(item.created) + '</small></div><button type="button" data-action-open="' + escapeHtml(item.id) + '" aria-label="Open ' + escapeHtml(item.title) + '">' + svg("i-chevron") + '</button></article>';
    }).join("");
    var emailRows = state.emailAutomations.map(function (item) {
      return '<article class="email-action-row"><span class="action-record-icon email">' + svg("i-send") + '</span><div><div><strong>' + escapeHtml(item.title) + '</strong>' + status(item.status) + '</div><p>' + escapeHtml(item.question) + '</p><small>' + escapeHtml(item.schedule) + ' · ' + escapeHtml(item.recipient) + (item.limitation ? ' · ' + escapeHtml(item.limitation) : '') + '</small></div><button class="secondary-button" type="button" data-email-toggle="' + escapeHtml(item.id) + '"' + (item.status === "Unavailable" ? " disabled" : "") + '>' + (item.status === "Unavailable" ? "Unavailable" : item.status === "Active" ? "Pause" : "Resume") + '</button></article>';
    }).join("");
    return '<section class="page page-enter action-page">' + pageHead("Action", "Decision records and scheduled follow-ups created from governed answers.") +
      '<section class="action-summary"><div>' + miniIcon("i-check", "teal") + '<span><strong>From answer to accountable follow-up</strong><p>Actions preserve the original question and evidence trail. Email schedules remain reviewable and reversible.</p></span></div><button class="primary-button" type="button" data-page-jump="assistant">Ask a new question</button></section>' +
      '<div class="metric-row action-metrics">' + metric("i-clock", "amber", String(state.pendingActionCount || 0), "Pending actions", state.pendingActionCount ? "Human attention required" : "You are all caught up") + metric("i-brief", "blue", String(state.savedDecisions.length), "Decision memories", "Recorded with evidence") + metric("i-send", "violet", String(state.emailAutomations.length), "Email automations", "Reviewable schedules") + metric("i-shield", "teal", state.savedDecisions.length || state.emailAutomations.length ? "100%" : "—", "Governed actions", state.savedDecisions.length || state.emailAutomations.length ? "Source context retained" : "Available after the first action") + '</div>' +
      '<section class="panel action-panel"><div class="content-view-head"><div><h2>Needs your attention</h2><p>The same persisted review and approval queue shown by the sidebar badge.</p></div>' + (state.pendingActionCount ? '<span class="status amber">' + state.pendingActionCount + ' pending</span>' : '') + '</div><div class="verification-queue">' + (pendingRows || '<div class="action-empty"><strong>No pending actions</strong><p>Completed, approved, rejected, cancelled, and inactive items are excluded.</p></div>') + '</div></section>' +
      '<div class="action-workspace"><section class="panel action-panel"><div class="content-view-head"><div><h2>Decision Memory</h2><p>Answers saved with their question, owner, and evidence context.</p></div><button class="secondary-button" type="button" data-page-jump="assistant">Add from AI Assistant</button></div><div class="action-list">' + (decisionRows || '<div class="action-empty"><strong>No saved decisions yet</strong><p>Save a governed answer from the AI Assistant Decision Canvas.</p></div>') + '</div></section>' +
      '<section class="panel action-panel"><div class="content-view-head"><div><h2>Email automations</h2><p>Questions refreshed on a schedule with a current source snapshot.</p></div><span class="status blue">Local demo</span></div><div class="action-list">' + (emailRows || '<div class="action-empty"><strong>No email automations yet</strong><p>Choose Automate by Email from an AI Assistant answer.</p></div>') + '</div></section></div>' +
      '<p class="action-disclosure">Decision and automation records are persisted in the BursaIQ SQLite store. External email remains unavailable until a connector is approved and configured.</p></section>';
  }

  function settingsPage() {
    var section = state.settingsSection;
    var content;
    if (section === "general") content = '<section class="panel settings-section"><div class="content-view-head"><div><h2>General</h2><p>Choose how BursaIQ opens and presents your work.</p></div><span class="save-state" id="settings-save-state">Saved</span></div><label class="settings-field"><span><strong>Default workspace</strong><small>The context used when you start a new request.</small></span><select id="default-workspace"><option' + (state.userSettings.defaultWorkspace === "Product Development" ? " selected" : "") + '>Product Development</option><option' + (state.userSettings.defaultWorkspace === "Personal workspace" ? " selected" : "") + '>Personal workspace</option><option' + (state.userSettings.defaultWorkspace === "Ask every time" ? " selected" : "") + '>Ask every time</option></select></label>' + settingToggle("Start with Today\'s Brief", "Open your role-aware brief after sign-in.", state.userSettings.startWithBrief === true) + settingToggle("Compact enterprise density", "Show more operational information on larger screens.", state.userSettings.compactDensity === true) + settingToggle("Reduce non-essential updates", "Keep notifications limited to approvals and mission changes.", state.reducedUpdates) + '</section>';
    else if (section === "notifications") content = '<section class="panel settings-section"><div class="content-view-head"><div><h2>Notifications</h2><p>Notification counts come from pending backend reviews and workflow approvals.</p></div></div>' + settingToggle("Reduce non-essential updates", "Keep notifications limited to approvals and mission changes.", state.reducedUpdates) + '</section>';
    else if (section === "agents") content = '<section class="panel settings-section"><div class="content-view-head"><div><h2>Agent access</h2><p>Live language-model providers and their current availability.</p></div></div>' + state.modelProviders.map(function (item) { return '<div class="settings-field"><span><strong>' + escapeHtml(item.label || item.id) + '</strong><small>' + escapeHtml(item.provider || item.id) + '</small></span>' + workflowStatus(item.available === true ? "ACTIVE" : "UNAVAILABLE") + '</div>'; }).join("") + '</section>';
    else content = '<section class="panel settings-section"><div class="content-view-head"><div><h2>Privacy &amp; data</h2><p>Controls inherited from Bursa policy are visible and cannot be weakened here.</p></div>' + status("Policy managed") + '</div>' + settingToggle("Require evidence for factual answers", "Answers must retain citations to permitted sources.", true, true) + settingToggle("Human approval for external actions", "Publishing, sending and permission changes always pause for review.", true, true) + '</section>';
    return '<section class="page page-enter settings-page">' + pageHead("Settings", "Preferences, access and AI governance for your BursaIQ experience.") + '<div class="settings-layout"><nav class="panel settings-nav">' + [["general", "i-settings", "General"], ["notifications", "i-bell", "Notifications"], ["agents", "i-agents", "Agent access"], ["privacy", "i-shield", "Privacy & data"]].map(function (item) { return '<button class="' + (section === item[0] ? "is-active" : "") + '" type="button" data-settings-section="' + item[0] + '">' + svg(item[1]) + item[2] + '</button>'; }).join("") + '</nav><div class="settings-content">' + content + '</div></div></section>';
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
      var executableCapabilities = state.missionCapabilities.filter(function (item) { return item.executable; });
      var capabilityOptions = executableCapabilities.map(function (item) { return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name + " · v" + item.version) + '</option>'; }).join("");
      var defaultCapabilityId = executableCapabilities.length ? executableCapabilities[0].id : "";
      var teamOptions = state.missionTeams.filter(function (team) { return team.status === "ACTIVE" && (!defaultCapabilityId || team.capability === defaultCapabilityId); }).map(function (team) { return '<option value="' + escapeHtml(team.id) + '">' + escapeHtml(team.name + " · v" + team.version + " · " + team.stages.length + " stages") + '</option>'; }).join("");
      openExperience({
        title: "Create AI mission",
        subtitle: "Describe the outcome. Your selected AI model will identify the supported mission capability and prepare the governed run.",
        body: '<form class="creation-form mission-form" id="creation-form" data-creation-type="mission"><label class="form-field">Mission name<input name="title" maxlength="140" required placeholder="e.g. Review operational incidents and prepare a management brief"></label><label class="form-field">What should the AI workforce accomplish?<textarea name="description" maxlength="1000" required placeholder="Describe the question, business outcome, evidence to use, and decisions this mission should support."></textarea></label><label class="form-field">Executable capability<select name="capabilityId" required>' + capabilityOptions + '</select><small>The live model confirms this selection from the executable registry.</small></label><label class="form-field">Mission team<select name="teamId" required>' + teamOptions + '</select><small>The backend validates agent status, capability coverage, and dependencies before creating the mission.</small></label><div class="form-split"><label class="form-field">Analysis period from <small>Optional</small><input type="date" name="dateStart"></label><label class="form-field">Analysis period to <small>Optional</small><input type="date" name="dateEnd"></label></div><div class="form-split"><label class="form-field">Preferred output<select name="output"><option>Interactive analysis and report</option><option>Executive briefing</option><option>Evidence review package</option><option>Reusable intelligence asset</option></select></label><label class="form-field">Governance<select name="governance"><option>Human review before publishing</option><option>High-impact approval</option><option>Draft for internal review</option></select></label></div><div class="detail-callout">' + svg("i-spark") + '<span><strong>AI-planned, capability-governed</strong><small>The live model interprets the request. BursaIQ starts work only when an executable mission capability, active team, and required data are available.</small></span></div><p class="form-error" id="mission-form-error" hidden></p></form>',
        footer: '<button class="secondary-button" type="button" data-experience-close>Cancel</button><button class="primary-button" type="submit" form="creation-form">Plan and run mission</button>'
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

  function openPlatformCreate(kind, roomId) {
    var label = kind === "file" ? "file record" : kind;
    openExperience({ title: "Add " + label, subtitle: "Persisted governed workspace record", body: '<form class="creation-form" id="platform-item-form" data-platform-kind="' + escapeHtml(kind) + '" data-room-id="' + escapeHtml(roomId || "") + '"><label class="form-field">Title<input name="title" maxlength="160" required></label><label class="form-field">Details<textarea name="description" maxlength="1000" required></textarea></label><label class="form-field">Status<select name="status"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option></select></label></form>', footer: '<button class="secondary-button" type="button" data-experience-close>Cancel</button><button class="primary-button" type="submit" form="platform-item-form">Save record</button>' });
  }

  function openPlatformItem(reference) {
    var parts = String(reference || "").split(":");
    var type = parts[0], id = parts[1];
    var collection = type === "project" ? state.projects : type === "connector" ? state.connectors : type === "skill" ? state.skills : type === "room-item" ? state.roomItems : state.savedDecisions;
    var item = collection.filter(function (candidate) { return candidate.id === id; })[0];
    if (!item) return;
    var data = item.data || item;
    openExperience({ title: item.title, subtitle: escapeHtml(item.status || "Saved") + " · " + escapeHtml(item.owner || "Lim Kim Hoong"), body: '<div class="detail-callout">' + svg("i-shield") + '<span><strong>Persisted BursaIQ record</strong><small>' + escapeHtml(data.description || data.question || data.limitation || "No additional details were supplied.") + '</small></span></div><div class="detail-grid"><article><small>Record ID</small><strong>' + escapeHtml(item.id) + '</strong></article><article><small>Updated</small><strong>' + escapeHtml(formatWorkflowDate(item.updatedAt || item.createdAt)) + '</strong></article></div>', footer: '<button class="danger-button" type="button" data-platform-delete="' + escapeHtml(type + ":" + id) + '">Delete</button><button class="primary-button" type="button" data-experience-close>Done</button>' });
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
          if (form.elements.capabilityId) form.elements.capabilityId.value = decision.missionType;
          form.dataset.routed = "true";
          form.dataset.missionType = decision.missionType;
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
      var boards = ["MAIN MARKET", "ACE MARKET", "LEAP MARKET", "SECOND BOARD", "STRCWARR", "EXCHANGE TRADED", "LOANS"];
      var objective = String(data.get("description") || "").trim();
      var routingCommand = title + ". " + objective + " Preferred output: " + String(data.get("output") || "Interactive analysis and report") + ". Governance: " + String(data.get("governance") || "Human review before publishing") + ".";
      submit.disabled = true;
      submit.textContent = "Planning mission…";
      var routing = form.dataset.routed === "true" ? Promise.resolve({ route: "mission", missionType: form.dataset.missionType, title: title, objective: objective }) : apiJson("/api/intent-route", { method: "POST", body: JSON.stringify({ command: routingCommand, provider: state.routingProvider }) });
      routing.then(function (decision) {
        if (decision.route !== "mission") throw new Error(decision.reason || "No executable mission capability currently supports this request. Add the required dataset and mission implementation before running it.");
        submit.textContent = "Creating mission…";
        return apiJson("/api/missions", { method: "POST", body: JSON.stringify({ title: decision.title || title, objective: decision.objective || objective, requestedBy: "Lim Kim Hoong", dateStart: data.get("dateStart") || "2026-01-01", dateEnd: data.get("dateEnd") || "2026-09-30", boards: boards, capabilityId: decision.missionType || String(data.get("capabilityId") || ""), teamId: String(data.get("teamId") || "team-adv-governed") }) });
      }).then(function (mission) {
        return apiJson("/api/missions/" + encodeURIComponent(mission.id) + "/run", { method: "POST", body: "{}" }).then(function () { return mission; });
      }).then(function (mission) {
        if (form.closest("#experience-overlay")) closeExperience();
        state.page = "workforce";
        state.selectedMissionId = mission.id;
        return loadMissions(true).then(function () {
          startMissionPolling(mission.id, true);
          window.setTimeout(function () { openMission(mission.id); }, 220);
          toast("Mission started", "The AI-routed mission is running through its governed workforce.");
        });
      }).catch(function (problem) {
        submit.disabled = false;
        submit.textContent = "Plan and run mission";
        error.hidden = false;
        error.textContent = problem.message;
      });
      return;
    }
    if (type === "workflow") {
      var workflowSubmit = form.querySelector('[type="submit"]') || document.querySelector('[type="submit"][form="' + form.id + '"]');
      if (workflowSubmit) { workflowSubmit.disabled = true; workflowSubmit.textContent = "Creating workflow…"; }
      var triggerId = "node-" + Date.now();
      apiJson("/api/workflows", { method: "POST", body: JSON.stringify({ name: title, description: String(data.get("description") || ""), owner: String(data.get("owner") || "Lim Kim Hoong"), nodes: [{ id: triggerId, type: "trigger", name: "Trigger", config: { inputs: String(data.get("description") || ""), outputs: "", agent: "", expression: "" } }], connections: [] }) }).then(function (workflow) {
        closeExperience();
        state.workflows.unshift(workflow);
        window.setTimeout(function () { openWorkflowBuilder(workflow.id); }, 190);
        toast("Workflow draft created", "Configure the trigger and add steps in Workflow Builder.");
      }).catch(function (error) {
        if (workflowSubmit) { workflowSubmit.disabled = false; workflowSubmit.textContent = "Open workflow builder"; }
        toast("Workflow creation failed", error.message);
      });
      return;
    }
    if (["room", "project", "connector", "skill"].indexOf(type) !== -1) {
      var itemStatus = type === "connector" ? "REQUESTED" : "DRAFT";
      var itemData = { description: String(data.get("description") || ""), governance: String(data.get("governance") || "Standard approval") };
      if (type === "room") Object.assign(itemData, { tag: "Owned", members: 1, agents: 0, scope: "mine" });
      createPlatformItem(type, { title: title, owner: String(data.get("owner") || "Lim Kim Hoong"), status: itemStatus, data: itemData }).then(function (item) {
        closeExperience();
        if (type === "room") { state.selectedRoom = item.id; navigate("rooms"); }
        else if (type === "project") navigate("workspace");
        else if (type === "connector") navigate("connectors");
        else navigate("exchange");
        toast(configuredTitle(type), title + " was saved to BursaIQ.");
      }).catch(function (error) { toast("Creation failed", error.message); });
      return;
    }
    closeExperience();
    if (type === "mission") navigate("workforce");
    else if (type === "workflow") { state.automationTab = "workflows"; navigate("automation"); }
    else if (type === "room") navigate("rooms");
    else if (type === "skill") navigate("exchange");
    else if (type === "project") navigate("workspace");
    else if (type === "connector") navigate("connectors");
    else if (type === "policy") navigate("verification");
    window.setTimeout(function () { toast(configuredTitle(type), title + " was completed through the available BursaIQ workflow."); }, 180);
  }

  function configuredTitle(type) {
    return { mission: "Mission created", workflow: "Workflow draft created", room: "Room created", skill: "Skill draft created", project: "Project created", connector: "Connector request submitted", policy: "Policy answer ready" }[type] || "Created";
  }

  function openAsset(id) {
    var asset = assets.filter(function (item) { return item.id === id || item.title === id; })[0];
    if (!asset) return;
    var approval = asset.approvalRecord && asset.approvalRecord.case || {};
    var evidence = (asset.evidence || []).map(function (item) { return '<li><strong>' + escapeHtml(item.filename || item.title) + '</strong><small>' + escapeHtml(item.role || item.detail || "Approved evidence") + '</small></li>'; }).join("");
    openExperience({
      title: asset.title,
      subtitle: "Reusable Mission · " + asset.version + " · " + asset.owner,
      body: '<div class="asset-detail-hero">' + miniIcon("i-flow", "violet") + '<div><span class="status green">' + svg("i-check") + ' Approved reusable mission</span><p>' + escapeHtml(asset.parameters.objective) + '</p></div></div><div class="detail-grid"><article><small>Owner</small><strong>' + escapeHtml(asset.owner) + '</strong></article><article><small>Parameters</small><strong>' + escapeHtml(asset.parameters.dateStart) + ' → ' + escapeHtml(asset.parameters.dateEnd) + '</strong></article><article><small>Approval</small><strong>' + escapeHtml(approval.status || "Approved") + ' by ' + escapeHtml(approval.reviewer || "Reviewer") + '</strong></article><article><small>Reuse history</small><strong>' + Number(asset.reuseCount || 0) + ' fresh missions</strong></article></div><section class="asset-passport"><h3>Evidence passport</h3><ul>' + evidence + '</ul></section><div class="detail-callout">' + svg("i-shield") + '<span><strong>' + escapeHtml(asset.version) + ' keeps the approved snapshot intact</strong><small>A reuse starts a new execution with copied parameters. It does not alter the approved result.</small></span></div>',
      footer: (asset.report && asset.report.downloadUrl ? '<a class="secondary-button" href="' + escapeHtml(asset.report.downloadUrl) + '" target="_blank" rel="noopener">Open approved report</a>' : '') + '<button class="primary-button" type="button" data-asset-reuse="' + escapeHtml(asset.id) + '">Run reusable mission</button>'
    });
  }

  function openAgent(name) {
    var agent = agents.filter(function (item) { return item.name === name || item.id === name; })[0] || agents[0];
    if (!agent) { navigate("agent-library"); return; }
    openExperience({
      title: agent.name,
      subtitle: agent.department + " · " + agent.provider + " · v" + agent.version,
      body: '<div class="agent-profile">' + miniIcon("i-spark", agent.provider === "ollama" ? "blue" : "violet") + '<div>' + workflowStatus(agent.status) + '<p>' + escapeHtml(agent.description) + '</p></div></div><div class="detail-grid"><article><small>Owner</small><strong>' + escapeHtml(agent.owner) + '</strong></article><article><small>Model</small><strong>' + escapeHtml(agent.model) + '</strong></article><article><small>Approval</small><strong>' + escapeHtml(agent.approvalPolicy) + '</strong></article><article><small>Role scope</small><strong>' + escapeHtml(agent.roles.join(", ")) + '</strong></article></div>',
      footer: '<button class="secondary-button" type="button" data-experience-close>Close</button><button class="primary-button" type="button" data-page-target="agent-library">Open Agent Library</button>'
    });
  }

  function resultValue(item) {
    var value = item.value;
    if (typeof value !== "number") return escapeHtml(value == null ? "—" : value);
    var decimals = Number.isInteger(item.decimals) ? item.decimals : 2;
    var formatted = value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (item.valueType === "percentage") return formatted + (item.unit || "%");
    return escapeHtml(item.unit || "") + (item.unit ? " " : "") + formatted;
  }

  function normalizedMissionResult(result) {
    if (result.summaryMetrics) return result;
    return Object.assign({}, result, {
      summaryMetrics: [],
      tables: [],
      charts: [], evidence: [], qualityChecks: [], interpretationBoundaries: [],
      downloadableOutputs: []
    });
  }

  function missionChart(chart) {
    var series = chart && chart.series && chart.series[0];
    if (!series || !series.values || !series.values.length) return "";
    var width = 520;
    var height = 190;
    var values = series.values.map(Number);
    var categories = chart.categories || [];
    var minimum = Math.min.apply(null, values) * .96;
    var maximum = Math.max.apply(null, values) * 1.04;
    var range = Math.max(.01, maximum - minimum);
    var points = values.map(function (value, index) {
      var x = 34 + index * ((width - 68) / Math.max(1, values.length - 1));
      var y = 138 - ((value - minimum) / range) * 96;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    var bars = chart.type === "bar" ? values.map(function (value, index) { var x = 34 + index * ((width - 68) / Math.max(1, values.length)); var barWidth = Math.max(12, (width - 90) / values.length - 8); var y = 138 - ((value - Math.min(0, minimum)) / Math.max(.01, maximum - Math.min(0, minimum))) * 96; return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barWidth.toFixed(1) + '" height="' + (138 - y).toFixed(1) + '" rx="4"></rect>'; }).join("") : '';
    return '<div class="mission-result-chart"><h4>' + escapeHtml(chart.title || series.name || "Result chart") + '</h4><svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(chart.title || "Mission result chart") + '"><title>' + escapeHtml(chart.title || "Mission result chart") + '</title><g class="mission-chart-grid"><path d="M28 42H492M28 90H492M28 138H492"></path></g>' + (chart.type === "bar" ? '<g class="mission-chart-bars">' + bars + '</g>' : '<polyline points="' + points + '"></polyline>') + '<g class="mission-chart-points">' + values.map(function (value, index) { var x = 34 + index * ((width - 68) / Math.max(1, values.length - 1)); var y = 138 - ((value - minimum) / range) * 96; return (chart.type === "bar" ? "" : '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4"></circle>') + '<text x="' + x.toFixed(1) + '" y="' + (y - 10).toFixed(1) + '" text-anchor="middle">' + value.toFixed(2) + '</text><text x="' + x.toFixed(1) + '" y="166" text-anchor="middle">' + escapeHtml(String(categories[index] || index + 1).split(" ")[0]) + '</text>'; }).join("") + '</g></svg></div>';
  }

  function missionResultSections(rawResult) {
    var result = normalizedMissionResult(rawResult);
    var metrics = '<div class="mission-kpis">' + result.summaryMetrics.map(function (item) { return '<article><small>' + escapeHtml(item.label) + '</small><strong>' + resultValue(item) + '</strong><span>' + escapeHtml(item.description || item.unit || "Recorded result") + '</span></article>'; }).join("") + '</div>';
    var charts = result.charts.map(missionChart).join("");
    var tables = result.tables.map(function (table) { return '<section class="mission-result-table"><h3>' + escapeHtml(table.title) + '</h3><div class="table-wrap"><table><thead><tr>' + table.columns.map(function (column) { return '<th>' + escapeHtml(column.label) + '</th>'; }).join("") + '</tr></thead><tbody>' + table.rows.map(function (row) { return '<tr>' + table.columns.map(function (column) { return '<td>' + resultValue({ value: row[column.key], valueType: column.valueType, unit: column.unit, decimals: column.decimals }) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table></div></section>'; }).join("");
    var findings = '<div class="mission-findings"><h3>Findings</h3>' + result.findings.map(function (finding) { var text = typeof finding === "object" ? finding.text : finding; return '<p>' + svg("i-check") + '<span>' + escapeHtml(text) + '</span></p>'; }).join("") + '</div>';
    var quality = '<div class="claim-list"><h3>Quality checks</h3>' + result.qualityChecks.map(function (check) { return '<article><span>' + svg(check.status === "PASSED" ? "i-check" : "i-help") + '</span><div><strong>' + escapeHtml(check.label) + ' · ' + escapeHtml(check.status) + '</strong><small>' + escapeHtml(check.detail || "No detail supplied") + '</small></div></article>'; }).join("") + '</div>';
    var evidence = '<div class="claim-list"><h3>Evidence references</h3>' + result.evidence.map(function (item) { return '<article><span>' + svg("i-document") + '</span><div><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.detail || item.reference || "Governed evidence") + '</small></div></article>'; }).join("") + '</div>';
    var boundaries = result.interpretationBoundaries.map(function (item) { return '<p class="review-boundary">' + escapeHtml(item) + '</p>'; }).join("");
    var outputs = result.downloadableOutputs.map(function (item) { return '<a class="secondary-button" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">' + escapeHtml(item.label) + '</a>'; }).join("");
    return metrics + charts + tables + findings + quality + evidence + boundaries + (outputs ? '<div class="evidence-actions">' + outputs + '</div>' : "");
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
      ["Exchange", "Publish for governed reuse", Boolean(mission.publishedAsset), approved && !mission.publishedAsset]
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
    var teamStages = mission.team && mission.team.stages && mission.team.stages.length ? mission.team.stages : ["mission-manager", "data-agent", "analysis-agent", "insight-agent", "report-agent"].map(function (id) { var agent = state.registeredAgents.filter(function (item) { return item.id === id; })[0] || {}; return { agentId: id, agentName: agent.name || id.replace(/-/g, " "), responsibility: agent.description || "Configured mission responsibility", provider: agent.provider || "registered", model: agent.model || "configured", tools: agent.tools || [], knowledgeCollections: agent.knowledgeCollections || [] }; });
    var workerMarkup = teamStages.map(function (stage, index) {
      var workerId = stage.agentId;
      var matching = events.filter(function (event) { return event.workerId === workerId; });
      var event = matching[matching.length - 1];
      var stateLabel = event ? event.status : "QUEUED";
      var itemClass = stateLabel === "COMPLETED" || stateLabel === "DRAFT READY" ? "is-done" : stateLabel === "RUNNING" ? "is-active" : stateLabel === "FAILED" ? "is-failed" : "";
      return '<article class="' + itemClass + '">' + miniIcon(index === 1 ? "i-folder" : index === teamStages.length - 1 ? "i-document" : "i-spark", "teal") + '<span><strong>' + escapeHtml(stage.agentName || workerId) + '</strong><small>' + escapeHtml(event ? event.message : stage.responsibility) + '</small><em>' + escapeHtml((stage.provider || "registered") + " · " + (stage.model || "configured") + " · tools: " + agentListValue(stage.tools || []) + " · data: " + agentListValue(stage.knowledgeCollections || [])) + '</em>' + (event && event.payload && Object.keys(event.payload).length ? '<button type="button" data-worker-evidence="' + workerId + '">Inspect output</button>' : "") + '</span>' + missionStatus(stateLabel) + '</article>';
    }).join("");
    var result = mission.result;
    var resultMarkup = "";
    if (result) {
      resultMarkup = '<section class="mission-results"><div class="mission-result-head"><div><h3>Verified mission output</h3><p>' + escapeHtml(result.classification || "Governed mission result") + '</p></div>' + missionStatus(mission.status) + '</div>' + missionResultSections(result) + '</section>';
    }
    var failure = mission.error ? '<div class="mission-failure">' + svg("i-help") + '<span><strong>Mission failed</strong><small>' + escapeHtml(mission.error) + ' Correct the inputs and run again.</small></span></div>' : "";
    var reviewComment = mission.verification && mission.verification.reviewerComment ? '<div class="detail-callout review-comment-callout">' + svg("i-help") + '<span><strong>Reviewer comment</strong><small>' + escapeHtml(mission.verification.reviewerComment) + '</small></span></div>' : "";
    var versions = (mission.versions || []).map(function (item) { return '<button type="button" data-mission-back="' + escapeHtml(item.id) + '"><strong>v' + Number(item.version || 1) + '</strong><span>' + missionDisplayStatus(item.status) + '</span><small>' + escapeHtml(item.id) + '</small></button>'; }).join("");
    var history = versions ? '<section class="mission-version-history"><h3>Version history</h3><div>' + versions + '</div></section>' : "";
    var teamHeader = mission.team ? '<div class="detail-callout">' + svg("i-agents") + '<span><strong>' + escapeHtml(mission.team.name) + ' · v' + Number(mission.team.version) + '</strong><small>Validated team snapshot · ' + mission.team.stages.length + ' configured stages · ' + escapeHtml(mission.team.capability) + '</small></span></div>' : '';
    return '<div class="mission-detail-progress"><div><span>v' + Number(mission.version || 1) + ' · ' + escapeHtml(mission.id) + ' · ' + escapeHtml(mission.dateStart) + ' → ' + escapeHtml(mission.dateEnd) + '</span>' + missionStatus(mission.status) + '</div><span class="progress-track"><i style="width:' + Number(mission.progress || 0) + '%"></i></span></div>' + missionLifecycleMarkup(mission) + teamHeader + failure + reviewComment + history + '<div class="mission-detail-journey live-worker-journey">' + workerMarkup + '</div>' + resultMarkup;
  }

  function missionFooter(mission) {
    var controls = '<button class="secondary-button" type="button" data-mission-rerun="' + escapeHtml(mission.id) + '">Rerun with new dates</button>';
    if (mission.downloadUrl) controls += '<a class="secondary-button" href="' + escapeHtml(mission.downloadUrl) + '" target="_blank" rel="noopener">Open PDF</a>';
    if (mission.status === "DRAFT READY") controls += '<button class="primary-button" type="button" data-mission-submit-review="' + escapeHtml(mission.id) + '">Submit for review</button>';
    else if (mission.status === "REVISION REQUESTED") controls += '<button class="primary-button" type="button" data-mission-revise="' + escapeHtml(mission.id) + '">Create revision</button>';
    else if (mission.status === "AWAITING REVIEW") controls += '<button class="primary-button" type="button" data-page-target="verification">Open Verification Centre</button>';
    else if (mission.status === "APPROVED" && mission.publishedAsset) controls += '<button class="primary-button" type="button" data-page-target="exchange">Open in Exchange</button>';
    else if (mission.status === "APPROVED") controls += '<button class="primary-button" type="button" data-mission-publish="' + escapeHtml(mission.id) + '">Publish to Exchange</button>';
    return controls;
  }

  function openMission(id) {
    state.selectedMissionId = id;
    window.history.replaceState(null, "", "?page=workforce&mission=" + encodeURIComponent(id));
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

  function createMissionRevision(id, button) {
    button.disabled = true;
    button.textContent = "Creating revision…";
    apiJson("/api/missions/" + encodeURIComponent(id) + "/revise", { method: "POST", body: JSON.stringify({ requestedBy: "Lim Kim Hoong" }) }).then(function (payload) {
      closeExperience();
      state.liveMissions.unshift(payload.mission);
      state.page = "workforce";
      render();
      startMissionPolling(payload.mission.id, true);
      window.setTimeout(function () { openMission(payload.mission.id); }, 180);
      toast("Revision started", "Version " + payload.mission.version + " preserves the prior result and review history.");
    }).catch(function (error) {
      button.disabled = false;
      button.textContent = "Create revision";
      toast("Revision failed", error.message);
    });
  }

  function openInfoPanel(action, context) {
    if (action === "notifications") {
      var pending = state.liveMissions.filter(function (item) { return item.status === "AWAITING REVIEW"; });
      var waits = state.workflowRuns.filter(function (item) { return item.status === "WAITING_APPROVAL"; });
      var notificationRows = pending.map(function (item) { return '<button type="button" data-page-target="verification"><span><strong>' + escapeHtml(item.title) + '</strong><small>Mission awaiting review</small></span>' + svg("i-chevron") + '</button>'; }).concat(waits.map(function (item) { return '<button type="button" data-page-target="verification"><span><strong>' + escapeHtml(item.id) + '</strong><small>Workflow waiting for approval</small></span>' + svg("i-chevron") + '</button>'; }));
      openExperience({ title: "Notifications", subtitle: notificationRows.length ? notificationRows.length + " pending actions" : "You are all caught up", body: notificationRows.length ? '<div class="focus-list">' + notificationRows.join("") + '</div>' : '<div class="clean-empty"><strong>No notifications</strong><p>Approvals and mission updates will appear here.</p></div>', footer: '<button class="primary-button" type="button" data-experience-close>Close</button>' });
      return;
    }
    if (action === "apps") { navigate("connectors"); return; }
    if (action === "identity") {
      openExperience({ title: "Lim Kim Hoong", subtitle: "Product Development · Demo identity", body: '<div class="identity-profile"><span>KH</span><div><strong>Employee workspace</strong><small>Role-aware access inherited from Product Development.</small></div></div><div class="detail-grid"><article><small>Primary workspace</small><strong>' + escapeHtml(state.userSettings.defaultWorkspace || "Product Development") + '</strong></article><article><small>Approval role</small><strong>Mission owner</strong></article><article><small>Connector requests</small><strong>' + state.connectors.length + '</strong></article><article><small>Data class</small><strong>Synthetic demonstration</strong></article></div>', footer: '<button class="secondary-button" type="button" data-page-target="settings">Open settings</button><button class="primary-button" type="button" data-experience-close>Done</button>' });
      return;
    }
    if (action === "help") {
      openExperience({ title: "IQ Guide", subtitle: "A fast orientation to the AI workforce", body: '<div class="guide-steps"><article><b>1</b><span><strong>Ask or define an outcome</strong><small>Begin on Home or with the AI Assistant.</small></span></article><article><b>2</b><span><strong>Let BursaIQ assemble the work</strong><small>Agents, knowledge and approvals become one mission.</small></span></article><article><b>3</b><span><strong>Verify before impact</strong><small>Evidence and human accountability remain visible.</small></span></article><article><b>4</b><span><strong>Reuse what works</strong><small>Publish approved intelligence back to the Exchange.</small></span></article></div>', footer: '<button class="secondary-button" type="button" data-experience-close>Close</button><button class="primary-button" type="button" data-page-target="assistant">Ask BursaIQ</button>' });
      return;
    }
    if (action === "review" || action === "approve" || action === "request-changes") { navigate("verification"); return; }
    if (action === "agent") { openAgent(context || agents[0].name); return; }
    if (action === "canvas") { openExperience({ title: "Decision Canvas", subtitle: "A structured view of evidence, assumptions and next actions", body: '<div class="canvas-grid"><article><small>Decision</small><strong>Advance the product-readiness review</strong><p>Proceed once the remaining customer evidence and pricing assumption are verified.</p></article><article><small>Evidence</small><strong>12 governed sources</strong><p>Requirements, validation notes and accountable decision records.</p></article><article><small>Open assumptions</small><strong>2 items</strong><p>Customer evidence coverage and pricing baseline.</p></article><article><small>Recommended action</small><strong>Review the evidence</strong><p>Complete the two checks before the stakeholder review.</p></article></div>', footer: '<button class="secondary-button" type="button" data-dialog-action="canvas-copy">Copy summary</button><button class="primary-button" type="button" data-page-target="assistant">Return to Q&amp;A</button>' }); return; }
    if (action === "sources") { openExperience({ title: "Permitted source scope", subtitle: "What this assistant can use for the current request", body: '<div class="source-list"><article>' + miniIcon("i-folder", "blue") + '<span><strong>Product Development knowledge</strong><small>12 governed files · read access</small></span>' + status("Active") + '</article><article>' + miniIcon("i-book", "teal") + '<span><strong>Internal Knowledge Base</strong><small>Policies and approved guidance</small></span>' + status("Active") + '</article><article>' + miniIcon("i-shield", "violet") + '<span><strong>Verified market evidence</strong><small>3 permitted source groups</small></span>' + status("Active") + '</article></div>', footer: '<button class="primary-button" type="button" data-experience-close>Understood</button>' }); return; }
    if (action === "internal-sources") { openExperience({ title: "Ask Bursa source scope", subtitle: "Internal guidance available within your existing role", body: '<div class="source-list"><article>' + miniIcon("i-agents", "blue") + '<span><strong>Human Resources</strong><small>Employee services and workplace guidance</small></span>' + status("Active") + '</article><article>' + miniIcon("i-settings", "violet") + '<span><strong>Group Technology (GT)</strong><small>Services, access, devices, and security</small></span>' + status("Active") + '</article><article>' + miniIcon("i-shield", "teal") + '<span><strong>Regulations</strong><small>Controlled internal notices and guidance</small></span>' + status("Active") + '</article><article>' + miniIcon("i-exchange", "amber") + '<span><strong>Market Operations</strong><small>Operational processes and escalation paths</small></span>' + status("Active") + '</article></div>', footer: '<button class="primary-button" type="button" data-experience-close>Understood</button>' }); return; }
    var title = context || action.replace(/-/g, " ").replace(/^./, function (letter) { return letter.toUpperCase(); });
    openExperience({ title: title, subtitle: "No detailed operation is available", body: '<div class="detail-callout">' + svg("i-shield") + '<span><strong>No backend action was performed</strong><small>This summary is derived from the current persisted page data. Use the page-specific controls to change or inspect individual records.</small></span></div>', footer: '<button class="primary-button" type="button" data-experience-close>Done</button>' });
  }

  function render() {
    var html;
    if (state.page === "home") html = homePage();
    else if (state.page === "assistant") html = assistantPage();
    else if (state.page === "ask-bursa") html = askBursaPage();
    else if (state.page === "knowledge-admin") html = knowledgeAdministrationPage();
    else if (state.page === "workforce") html = workforcePage();
    else if (state.page === "agent-library") html = agentLibraryPage();
    else if (state.page === "agent-builder") html = agentBuilderPage();
    else if (state.page === "mission-teams") html = missionTeamsPage();
    else if (state.page === "mission-team-builder") html = missionTeamBuilderPage();
    else if (state.page === "capability-library") html = capabilityLibraryPage();
    else if (state.page === "exchange") html = exchangePage();
    else if (state.page === "automation") html = automationPage();
    else if (state.page === "workflow-builder") html = workflowBuilderPage();
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
      var active = button.dataset.page === state.page || state.page === "workflow-builder" && button.dataset.page === "automation" || ["agent-library", "agent-builder", "mission-teams", "mission-team-builder", "capability-library"].indexOf(state.page) !== -1 && button.dataset.page === "workforce";
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.title = (pages[state.page] ? pages[state.page][0] : "BursaIQ") + " — BursaIQ";
    updateActionBadge();
    bindPageEvents();
  }

  function navigate(page) {
    if (!pages[page]) return;
    state.page = page;
    window.history.replaceState(null, "", "?page=" + encodeURIComponent(page));
    render();
    if (page === "exchange") loadExchangeAssets();
    if (page === "verification") loadVerification();
    if (page === "automation") loadWorkflows();
    if (page === "agent-library") loadAgents();
    if (page === "mission-teams") loadMissionTeams();
    if (page === "capability-library") loadMissionCapabilities();
    if (["rooms", "workspace", "brief", "connectors", "action", "settings"].indexOf(page) !== -1) loadPlatform();
    closeMobileNav();
    document.getElementById("main-content").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (page === "workforce" || page === "verification") loadMissions(true);
  }

  function saveActiveWorkflow(notifyUser) {
    var workflow = state.activeWorkflow;
    if (!workflow) return Promise.reject(new Error("No workflow is open."));
    var nameField = document.getElementById("workflow-name");
    if (nameField) workflow.name = nameField.value.trim() || workflow.name;
    return apiJson("/api/workflows/" + encodeURIComponent(workflow.id), { method: "PATCH", body: JSON.stringify({ name: workflow.name, description: workflow.description, owner: workflow.owner, status: workflow.status, nodes: workflow.nodes, connections: workflow.connections }) }).then(function (saved) {
      state.activeWorkflow = saved;
      var existing = state.workflows.findIndex(function (item) { return item.id === saved.id; });
      if (existing === -1) state.workflows.unshift(saved); else state.workflows[existing] = saved;
      if (notifyUser) toast("Workflow saved", saved.name + " is persisted as a draft.");
      return saved;
    });
  }

  function executeWorkflowAction(action) {
    if (!state.activeWorkflow) return;
    if (action === "delete") {
      if (!window.confirm("Delete this workflow and its execution history?")) return;
      apiJson("/api/workflows/" + encodeURIComponent(state.activeWorkflow.id), { method: "DELETE" }).then(function () {
        state.activeWorkflow = null;
        navigate("automation");
        toast("Workflow deleted", "The draft and its run history were removed.");
        return loadPendingActionCount();
      }).catch(function (error) { toast("Delete failed", error.message); });
      return;
    }
    if (action === "duplicate") {
      apiJson("/api/workflows/" + encodeURIComponent(state.activeWorkflow.id) + "/duplicate", { method: "POST", body: "{}" }).then(function (copy) {
        state.workflows.unshift(copy);
        openWorkflowBuilder(copy.id);
        toast("Workflow duplicated", "The copy is open as a separate draft.");
      }).catch(function (error) { toast("Duplicate failed", error.message); });
      return;
    }
    saveActiveWorkflow(action === "save").then(function () {
      if (action === "save") { render(); return null; }
      return apiJson("/api/workflows/" + encodeURIComponent(state.activeWorkflow.id) + "/" + action, { method: "POST", body: "{}" });
    }).then(function (run) {
      if (!run) return;
      state.workflowRuns.unshift(run);
      return apiJson("/api/workflows/" + encodeURIComponent(state.activeWorkflow.id)).then(function (payload) {
        state.activeWorkflow = payload.workflow;
        state.workflowRuns = payload.runs || [];
        render();
        var detail = run.events.length ? run.events[run.events.length - 1].message : (run.validation.errors || []).join(" ");
        toast(action === "test" ? "Workflow test recorded" : "Workflow run recorded", run.status + (detail ? " · " + detail : ""));
        return loadPendingActionCount();
      });
    }).catch(function (error) { toast("Workflow action failed", error.message); });
  }

  function bindPageEvents() {
    root.querySelectorAll("[data-page-jump]").forEach(function (button) {
      button.addEventListener("click", function () { navigate(button.dataset.pageJump); });
    });
    var knowledgeUpload = document.getElementById("knowledge-upload-form");
    if (knowledgeUpload) knowledgeUpload.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(knowledgeUpload);
      var roles = data.getAll("allowedRoles");
      if (!roles.length) { toast("Permissions required", "Select at least one role allowed to retrieve this source."); return; }
      var requestData = new FormData();
      requestData.append("file", data.get("file"));
      requestData.append("metadata", JSON.stringify({ department: data.get("department"), owner: data.get("owner"), classification: data.get("classification"), version: data.get("version"), effectiveDate: data.get("effectiveDate"), expiryDate: data.get("expiryDate"), replacesDocumentId: data.get("replacesDocumentId"), allowedRoles: roles }));
      var submit = knowledgeUpload.querySelector('[type="submit"]');
      submit.disabled = true;
      apiForm("/api/knowledge-admin/documents", requestData).then(function (payload) { state.knowledgeAdmin = payload.administration; return Promise.all([loadAskBursaStatus(), loadAskBursaSuggestions()]).then(function () { return payload; }); }).then(function (payload) { render(); var failed = payload.ingestion.errors && payload.ingestion.errors.length; toast(failed ? "Upload stored; ingestion needs attention" : "Document indexed", failed ? "Open ingestion history to review the recorded failure." : "The source, metadata, permissions, and generated topics are now persisted."); }).catch(function (error) { submit.disabled = false; toast("Upload failed", error.message); });
    });
    root.querySelectorAll(".knowledge-metadata-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(form);
        var roles = data.getAll("allowedRoles");
        if (!roles.length) { toast("Permissions required", "Select at least one permitted role."); return; }
        var submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        apiJson("/api/knowledge-admin/documents/" + encodeURIComponent(form.dataset.documentId), { method: "PATCH", body: JSON.stringify({ owner: data.get("owner"), classification: data.get("classification"), version: data.get("version"), effectiveDate: data.get("effectiveDate"), expiryDate: data.get("expiryDate"), replacesDocumentId: data.get("replacesDocumentId"), allowedRoles: roles }) }).then(function (payload) { return Promise.all([loadKnowledgeAdmin(), loadAskBursaStatus(), loadAskBursaSuggestions()]).then(function () { return payload; }); }).then(function (payload) { var failed = payload.ingestion.errors && payload.ingestion.errors.length; toast(failed ? "Metadata saved; re-index needs attention" : "Metadata saved", failed ? "Review the recorded ingestion failure." : "Permissions and lifecycle metadata were re-indexed."); }).catch(function (error) { submit.disabled = false; toast("Metadata update failed", error.message); });
      });
    });
    root.querySelectorAll("[data-knowledge-reindex]").forEach(function (button) { button.addEventListener("click", function () { button.disabled = true; apiJson("/api/knowledge-admin/documents/" + encodeURIComponent(button.dataset.knowledgeReindex) + "/reindex", { method: "POST", body: "{}" }).then(function (payload) { return Promise.all([loadKnowledgeAdmin(), loadAskBursaStatus(), loadAskBursaSuggestions()]).then(function () { return payload; }); }).then(function (payload) { var failed = payload.ingestion.errors && payload.ingestion.errors.length; toast(failed ? "Re-index needs attention" : "Document re-indexed", failed ? "Review the failure in ingestion history." : "Content, embeddings, and suggested questions were rebuilt."); }).catch(function (error) { button.disabled = false; toast("Re-index failed", error.message); }); }); });
    root.querySelectorAll("[data-knowledge-remove]").forEach(function (button) { button.addEventListener("click", function () { if (!window.confirm("Remove this source, its passages, and its generated questions?")) return; button.disabled = true; apiJson("/api/knowledge-admin/documents/" + encodeURIComponent(button.dataset.knowledgeRemove), { method: "DELETE" }).then(function () { return Promise.all([loadKnowledgeAdmin(), loadAskBursaStatus(), loadAskBursaSuggestions()]); }).then(function () { toast("Source removed", "The document is no longer available to Ask Bursa."); }).catch(function (error) { button.disabled = false; toast("Removal failed", error.message); }); }); });
    root.querySelectorAll(".knowledge-suggestion-row").forEach(function (form) { form.addEventListener("submit", function (event) { event.preventDefault(); var data = new FormData(form); var submit = form.querySelector('[type="submit"]'); submit.disabled = true; apiJson("/api/knowledge-admin/suggestions/" + encodeURIComponent(form.dataset.suggestionId), { method: "PATCH", body: JSON.stringify({ question: data.get("question"), description: data.get("description"), status: data.get("status") }) }).then(function () { return Promise.all([loadKnowledgeAdmin(), loadAskBursaSuggestions()]); }).then(function () { toast("Suggested topic saved", "Ask Bursa visibility has been updated."); }).catch(function (error) { submit.disabled = false; toast("Suggestion update failed", error.message); }); }); });
    root.querySelectorAll("[data-knowledge-ingest]").forEach(function (button) { button.addEventListener("click", function () { button.disabled = true; apiJson("/api/knowledge-admin/ingest", { method: "POST", body: "{}" }).then(function (payload) { state.knowledgeAdmin = payload.administration; return Promise.all([loadAskBursaStatus(), loadAskBursaSuggestions()]).then(function () { return payload; }); }).then(function (payload) { render(); var failed = payload.ingestion.errors && payload.ingestion.errors.length; toast(failed ? "Ingestion completed with failures" : "Ingestion completed", failed ? "Review the failure details recorded below." : "The catalogue and ingestion history have been refreshed."); }).catch(function (error) { button.disabled = false; toast("Ingestion failed", error.message); }); }); });
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
    root.querySelectorAll("[data-bursa-sources]").forEach(function (button) {
      button.addEventListener("click", function () { openAskBursaSources(button.dataset.bursaSources); });
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
    root.querySelectorAll("[data-agent-id]").forEach(function (button) {
      button.addEventListener("click", function () { openAgentBuilder(button.dataset.agentId); });
    });
    root.querySelectorAll("[data-agent-new]").forEach(function (button) {
      button.addEventListener("click", function () { openAgentBuilder(); });
    });
    var agentSearch = document.getElementById("agent-search");
    if (agentSearch) agentSearch.addEventListener("input", function () { filterCurrentView(agentSearch.value, ".registry-agent-card", document.getElementById("agent-library-empty")); });
    var agentBuilderForm = document.getElementById("agent-builder-form");
    if (agentBuilderForm) agentBuilderForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(agentBuilderForm);
      var errorField = document.getElementById("agent-form-error");
      try {
        var list = function (name) { return String(data.get(name) || "").split(",").map(function (item) { return item.trim(); }).filter(Boolean); };
        var payload = { name: String(data.get("name") || "").trim(), description: String(data.get("description") || "").trim(), instructions: String(data.get("instructions") || "").trim(), owner: String(data.get("owner") || "").trim(), department: String(data.get("department") || "").trim(), provider: String(data.get("provider")), model: String(data.get("model") || "").trim(), generation: { temperature: Number(data.get("temperature")), maxTokens: Number(data.get("maxTokens")) }, knowledgeCollections: list("knowledgeCollections"), connectors: list("connectors"), tools: list("tools"), capabilities: list("capabilities"), roles: list("roles"), approvalPolicy: String(data.get("approvalPolicy")), status: String(data.get("status")), inputSchema: JSON.parse(String(data.get("inputSchema") || "{}")), outputSchema: JSON.parse(String(data.get("outputSchema") || "{}")) };
        var editing = Boolean(state.activeAgent.id);
        apiJson(editing ? "/api/agents/" + encodeURIComponent(state.activeAgent.id) : "/api/agents", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) }).then(function (saved) {
          state.activeAgent = saved;
          return loadAgents();
        }).then(function () { openAgentBuilder(state.activeAgent.id); toast(editing ? "Agent version saved" : "Agent created", state.activeAgent.name + " is stored in the Agent Registry."); }).catch(function (error) { if (errorField) { errorField.hidden = false; errorField.textContent = error.message; } });
      } catch (error) {
        if (errorField) { errorField.hidden = false; errorField.textContent = "Input and output schemas must contain valid JSON objects."; }
      }
    });
    root.querySelectorAll("[data-agent-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (!state.activeAgent || !state.activeAgent.id) return;
        var action = button.dataset.agentAction;
        apiJson("/api/agents/" + encodeURIComponent(state.activeAgent.id) + "/" + action, { method: "POST", body: JSON.stringify(action === "duplicate" ? { owner: "Lim Kim Hoong" } : {}) }).then(function (saved) { return loadAgents().then(function () { if (action === "duplicate") openAgentBuilder(saved.id); else { state.activeAgent = saved; state.agentExecutions = []; render(); } toast(action === "duplicate" ? "Agent duplicated" : "Agent archived", saved.name + " was updated in the registry."); }); }).catch(function (error) { toast("Agent action failed", error.message); });
      });
    });
    var agentTestForm = document.getElementById("agent-test-form");
    if (agentTestForm) agentTestForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var prompt = String(new FormData(agentTestForm).get("prompt") || "").trim();
      var submit = agentTestForm.querySelector('[type="submit"]');
      submit.disabled = true;
      apiJson("/api/agents/" + encodeURIComponent(state.activeAgent.id) + "/test", { method: "POST", body: JSON.stringify({ prompt: prompt, role: "employee" }) }).then(function (payload) {
        state.agentExecutions.unshift(payload.execution);
        render();
        toast("Agent test completed", "The live response and provider provenance were recorded.");
      }).catch(function (error) { openAgentBuilder(state.activeAgent.id); toast("Agent test failed", error.message); });
    });
    root.querySelectorAll("[data-team-id]").forEach(function (button) { button.addEventListener("click", function () { openMissionTeamBuilder(button.dataset.teamId); }); });
    root.querySelectorAll("[data-team-new]").forEach(function (button) { button.addEventListener("click", function () { openMissionTeamBuilder(); }); });
    var teamSearch = document.getElementById("team-search");
    if (teamSearch) teamSearch.addEventListener("input", function () { filterCurrentView(teamSearch.value, ".team-card", document.getElementById("team-empty")); });
    root.querySelectorAll("[data-team-stage]").forEach(function (button) { button.addEventListener("click", function (event) { if (event.target.closest("[data-team-stage-move]")) return; state.selectedTeamStageId = button.dataset.teamStage; render(); }); });
    root.querySelectorAll("[data-team-stage-move]").forEach(function (button) { button.addEventListener("click", function () { var stages = state.activeMissionTeam.stages; var index = stages.findIndex(function (stage) { return stage.id === button.dataset.stageId; }); var target = button.dataset.teamStageMove === "up" ? index - 1 : index + 1; if (index < 0 || target < 0 || target >= stages.length) return; var moved = stages.splice(index, 1)[0]; stages.splice(target, 0, moved); render(); }); });
    var teamStageAdd = root.querySelector("[data-team-stage-add]");
    if (teamStageAdd) teamStageAdd.addEventListener("click", function () { var previous = state.activeMissionTeam.stages[state.activeMissionTeam.stages.length - 1]; var firstAgent = state.registeredAgents.filter(function (agent) { return agent.status === "ACTIVE"; })[0]; var stage = { id: "stage-" + Date.now(), name: "New stage", stageType: "analysis", agentId: firstAgent ? firstAgent.id : "", responsibility: "", dependencies: previous ? [previous.id] : [] }; state.activeMissionTeam.stages.push(stage); state.selectedTeamStageId = stage.id; render(); });
    var teamStageForm = document.getElementById("team-stage-form");
    if (teamStageForm) teamStageForm.addEventListener("submit", function (event) { event.preventDefault(); var data = new FormData(teamStageForm); var stage = state.activeMissionTeam.stages.filter(function (item) { return item.id === data.get("id"); })[0]; if (!stage) return; stage.name = String(data.get("name") || "").trim(); stage.responsibility = String(data.get("responsibility") || "").trim(); stage.stageType = String(data.get("stageType")); stage.agentId = String(data.get("agentId")); stage.dependencies = Array.prototype.slice.call(teamStageForm.querySelectorAll('[name="dependency"]:checked')).map(function (input) { return input.value; }); render(); toast("Stage updated", "Save the team to persist its new configuration."); });
    var teamStageDelete = root.querySelector("[data-team-stage-delete]");
    if (teamStageDelete) teamStageDelete.addEventListener("click", function () { var id = teamStageDelete.dataset.teamStageDelete; state.activeMissionTeam.stages = state.activeMissionTeam.stages.filter(function (stage) { return stage.id !== id; }); state.activeMissionTeam.stages.forEach(function (stage) { stage.dependencies = (stage.dependencies || []).filter(function (dependency) { return dependency !== id; }); }); state.selectedTeamStageId = state.activeMissionTeam.stages.length ? state.activeMissionTeam.stages[0].id : null; render(); });
    root.querySelectorAll("[data-team-action]").forEach(function (button) { button.addEventListener("click", function () { var team = state.activeMissionTeam; if (!team) return; var action = button.dataset.teamAction; if (action === "duplicate") { apiJson("/api/mission-teams/" + encodeURIComponent(team.id) + "/duplicate", { method: "POST", body: JSON.stringify({ owner: "Lim Kim Hoong" }) }).then(function (copy) { return loadMissionTeams().then(function () { openMissionTeamBuilder(copy.id); toast("Mission team duplicated", "The reusable copy is ready to configure."); }); }).catch(function (error) { toast("Duplicate failed", error.message); }); return; } if (action === "validate") { apiJson("/api/mission-teams/" + encodeURIComponent(team.id) + "/validate", { method: "POST", body: "{}" }).then(function (result) { toast("Mission team validated", result.message); }).catch(function (error) { toast("Team validation failed", error.message); }); return; } var name = document.getElementById("team-name").value.trim(); var description = document.getElementById("team-description").value.trim(); var owner = document.getElementById("team-owner").value.trim(); var capabilityField = document.getElementById("team-capability"); var payload = { name: name, description: description, owner: owner, capability: capabilityField ? capabilityField.value : team.capability, status: team.status || "ACTIVE", stages: team.stages }; var errorField = document.getElementById("team-form-error"); apiJson(team.id ? "/api/mission-teams/" + encodeURIComponent(team.id) : "/api/mission-teams", { method: team.id ? "PATCH" : "POST", body: JSON.stringify(payload) }).then(function (saved) { state.activeMissionTeam = saved; return loadMissionTeams(); }).then(function () { openMissionTeamBuilder(state.activeMissionTeam.id); toast("Mission team saved", "The reusable team and its agent assignments are persisted."); }).catch(function (error) { if (errorField) { errorField.hidden = false; errorField.textContent = error.message; } }); }); });
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
        var nextStatus = item.status === "Active" ? "PAUSED" : "ACTIVE";
        apiJson("/api/platform/email-automation/" + encodeURIComponent(item.id), { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }).then(function () {
          return loadPlatform();
        }).then(function () { toast(nextStatus === "ACTIVE" ? "Email automation resumed" : "Email automation paused", "The persisted schedule is now " + nextStatus.toLowerCase() + "."); }).catch(function (error) { toast("Update failed", error.message); });
      });
    });

    bindMissionOpenButtons(root);
    var missionRefresh = root.querySelector("[data-mission-refresh]");
    if (missionRefresh) missionRefresh.addEventListener("click", function () { loadMissions(false); });
    root.querySelectorAll("[data-verification-mission]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedVerificationCaseId = null;
        state.selectedVerificationMissionId = button.dataset.verificationMission;
        window.history.replaceState(null, "", "?page=verification&mission=" + encodeURIComponent(state.selectedVerificationMissionId));
        render();
      });
    });
    root.querySelectorAll("[data-verification-case]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedVerificationMissionId = null;
        state.selectedVerificationCaseId = button.dataset.verificationCase;
        if (state.page !== "verification") navigate("verification"); else render();
      });
    });
    root.querySelectorAll("[data-mission-review]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.dataset.missionId;
        var commentField = document.getElementById("mission-review-comment");
        var comment = commentField ? commentField.value.trim() : "";
        if (button.dataset.missionReview === "Changes requested" && !comment) {
          toast("Reviewer comment required", "Explain what must change before this mission can be resubmitted.");
          if (commentField) commentField.focus();
          return;
        }
        button.disabled = true;
        apiJson("/api/verification/" + encodeURIComponent(missionById(id).verificationCaseId), { method: "PATCH", body: JSON.stringify({ role: "securities", status: button.dataset.missionReview, comment: comment }) }).then(function () {
          return Promise.all([loadMissions(true), loadVerification(), loadPendingActionCount()]);
        }).then(function () {
          render();
          toast(button.dataset.missionReview === "Approved" ? "Mission approved" : "Changes requested", "The human decision is persisted in the mission audit history.");
        }).catch(function (error) {
          button.disabled = false;
          toast("Review action failed", error.message);
        });
      });
    });
    root.querySelectorAll("[data-case-review]").forEach(function (button) {
      button.addEventListener("click", function () {
        var commentField = document.getElementById("case-review-comment");
        var comment = commentField ? commentField.value.trim() : "";
        if (["Rejected", "Changes requested"].indexOf(button.dataset.caseReview) !== -1 && !comment) {
          toast("Reviewer comment required", "Record why the workflow is rejected or what the owner must change.");
          if (commentField) commentField.focus();
          return;
        }
        button.disabled = true;
        apiJson("/api/verification/" + encodeURIComponent(button.dataset.caseId), { method: "PATCH", body: JSON.stringify({ role: "securities", status: button.dataset.caseReview, comment: comment }) }).then(function (payload) {
          return Promise.all([loadVerification(), loadWorkflows(), loadPendingActionCount()]).then(function () { render(); var run = payload.workflowRun; toast("Review decision recorded", run && run.status === "COMPLETED" ? "The approved workflow resumed and completed." : button.dataset.caseReview + " is recorded in the shared audit history."); });
        }).catch(function (error) { button.disabled = false; toast("Review action failed", error.message); });
      });
    });
    root.querySelectorAll("[data-mission-revise]").forEach(function (button) {
      button.addEventListener("click", function () { createMissionRevision(button.dataset.missionRevise, button); });
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
    root.querySelectorAll("[data-workflow-open]").forEach(function (button) {
      button.addEventListener("click", function () { openWorkflowBuilder(button.dataset.workflowOpen); });
    });
    root.querySelectorAll("[data-workflow-duplicate]").forEach(function (button) {
      button.addEventListener("click", function () {
        apiJson("/api/workflows/" + encodeURIComponent(button.dataset.workflowDuplicate) + "/duplicate", { method: "POST", body: "{}" }).then(function (copy) {
          state.workflows.unshift(copy);
          openWorkflowBuilder(copy.id);
          toast("Workflow duplicated", "The copy is ready to edit.");
        }).catch(function (error) { toast("Duplicate failed", error.message); });
      });
    });
    root.querySelectorAll("[data-workflow-node]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        if (event.target.closest("[data-node-move]")) return;
        state.selectedWorkflowNodeId = button.dataset.workflowNode;
        render();
      });
    });
    root.querySelectorAll("[data-node-move]").forEach(function (button) {
      button.addEventListener("click", function () {
        var nodes = state.activeWorkflow.nodes;
        var index = nodes.findIndex(function (node) { return node.id === button.dataset.nodeId; });
        var target = button.dataset.nodeMove === "up" ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= nodes.length) return;
        var moved = nodes.splice(index, 1)[0];
        nodes.splice(target, 0, moved);
        render();
      });
    });
    var nodeAdd = root.querySelector("[data-node-add]");
    if (nodeAdd) nodeAdd.addEventListener("click", function () {
      var type = document.getElementById("workflow-node-type").value;
      var label = document.getElementById("workflow-node-type").selectedOptions[0].textContent;
      var node = { id: "node-" + Date.now(), type: type, name: label, config: { agentId: "", capabilityId: "", inputs: "", outputs: "", expression: "", maxRetries: 0, approver: "", integration: "", missionId: "" } };
      var previous = state.activeWorkflow.nodes[state.activeWorkflow.nodes.length - 1];
      state.activeWorkflow.nodes.push(node);
      if (previous) state.activeWorkflow.connections.push({ source: previous.id, target: node.id });
      state.selectedWorkflowNodeId = node.id;
      render();
    });
    var nodeForm = document.getElementById("node-config-form");
    if (nodeForm) nodeForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(nodeForm);
      var node = state.activeWorkflow.nodes.filter(function (item) { return item.id === data.get("id"); })[0];
      if (!node) return;
      node.name = String(data.get("name") || "Step").trim();
      node.type = String(data.get("type"));
      node.config = { agentId: String(data.get("agentId") || ""), capabilityId: String(data.get("capabilityId") || ""), inputs: String(data.get("inputs") || ""), outputs: String(data.get("outputs") || ""), expression: String(data.get("expression") || ""), maxRetries: Number(data.get("maxRetries") || 0), approver: String(data.get("approver") || ""), integration: String(data.get("integration") || ""), missionId: String(data.get("missionId") || "") };
      state.activeWorkflow.connections = state.activeWorkflow.connections.filter(function (connection) { return connection.target !== node.id; });
      Array.prototype.slice.call(nodeForm.querySelectorAll('[name="dependency"]:checked')).forEach(function (input) { state.activeWorkflow.connections.push({ source: input.value, target: node.id }); });
      render();
      toast("Node configuration applied", "Save the draft to persist these changes.");
    });
    var nodeDelete = root.querySelector("[data-node-delete]");
    if (nodeDelete) nodeDelete.addEventListener("click", function () {
      var id = nodeDelete.dataset.nodeDelete;
      state.activeWorkflow.nodes = state.activeWorkflow.nodes.filter(function (node) { return node.id !== id; });
      state.activeWorkflow.connections = state.activeWorkflow.connections.filter(function (connection) { return connection.source !== id && connection.target !== id; });
      state.selectedWorkflowNodeId = state.activeWorkflow.nodes.length ? state.activeWorkflow.nodes[0].id : null;
      render();
    });
    root.querySelectorAll("[data-workflow-action]").forEach(function (button) {
      button.addEventListener("click", function () { executeWorkflowAction(button.dataset.workflowAction); });
    });
    root.querySelectorAll("[data-template-use]").forEach(function (button) {
      button.addEventListener("click", function () { openCreation("workflow"); var title = document.querySelector('#creation-form [name="title"]'); if (title) title.value = button.dataset.templateUse + " Workflow"; });
    });
    var automationSearch = document.getElementById("automation-search");
    if (automationSearch) automationSearch.addEventListener("input", function () { filterCurrentView(automationSearch.value, "[data-filter-text], .mission-table tbody tr", null); });
    root.querySelectorAll("[data-room-scope]").forEach(function (button) {
      button.addEventListener("click", function () { state.roomScope = button.dataset.roomScope; render(); });
    });
    root.querySelectorAll("[data-room-tab]").forEach(function (button) {
      button.addEventListener("click", function () { state.roomTab = button.dataset.roomTab; render(); });
    });
    root.querySelectorAll("[data-room-add]").forEach(function (button) {
      button.addEventListener("click", function () { openPlatformCreate(button.dataset.roomAdd, state.selectedRoom || rooms[0] && rooms[0].id); });
    });
    root.querySelectorAll("[data-platform-create]").forEach(function (button) {
      button.addEventListener("click", function () { openPlatformCreate(button.dataset.platformCreate, ""); });
    });
    root.querySelectorAll("[data-platform-open]").forEach(function (button) {
      button.addEventListener("click", function () { openPlatformItem(button.dataset.platformOpen); });
    });
    var accessBoundary = root.querySelector("[data-access-boundary]");
    if (accessBoundary) accessBoundary.addEventListener("click", function () { openExperience({ title: "Connector access boundary", subtitle: "Existing permissions and administrator approval", body: '<div class="detail-callout">' + svg("i-shield") + '<span><strong>No connector grants access by itself</strong><small>Each external system requires administrator configuration, role-scoped credentials, human approval for writes, and audit logging.</small></span></div>', footer: '<button class="primary-button" type="button" data-experience-close>Understood</button>' }); });
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
        if (button.dataset.verificationOpen || button.dataset.briefItem && button.dataset.briefItem.toLowerCase().indexOf("review") !== -1) navigate("verification");
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
        var on = button.getAttribute("aria-pressed") !== "true";
        var key = { "Start with Today's Brief": "startWithBrief", "Compact enterprise density": "compactDensity", "Reduce non-essential updates": "reducedUpdates" }[button.dataset.settingToggle];
        var saveState = document.getElementById("settings-save-state");
        if (saveState) saveState.textContent = "Saving…";
        var payload = {}; payload[key] = on;
        apiJson("/api/settings", { method: "PATCH", body: JSON.stringify(payload) }).then(function (settings) { state.userSettings = settings; state.reducedUpdates = settings.reducedUpdates === true; render(); toast("Settings saved", button.dataset.settingToggle + " was updated."); }).catch(function (error) { if (saveState) saveState.textContent = "Save failed"; toast("Settings update failed", error.message); });
      });
    });
    var defaultWorkspace = document.getElementById("default-workspace");
    if (defaultWorkspace) defaultWorkspace.addEventListener("change", function () { apiJson("/api/settings", { method: "PATCH", body: JSON.stringify({ defaultWorkspace: defaultWorkspace.value }) }).then(function (settings) { state.userSettings = settings; toast("Settings saved", "Default workspace updated."); }).catch(function (error) { toast("Settings update failed", error.message); }); });
    root.querySelectorAll("[data-settings-section]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.settingsSection = button.dataset.settingsSection;
        render();
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
    apiJson("/api/chat", { method: "POST", body: JSON.stringify({ question: text, workspace: "assistant", role: "gcmc", provider: state.routingProvider, conversationId: state.assistantConversationId }) }).then(function (payload) {
      state.assistantConversationId = payload.conversationId || state.assistantConversationId;
      state.assistantMessages[state.assistantMessages.length - 1] = { role: "assistant", question: text, answer: liveAssistantAnswer(payload, text) };
      render();
      scrollAssistant();
    }).catch(function (error) {
      state.assistantMessages[state.assistantMessages.length - 1] = { role: "assistant", question: text, answer: chatErrorAnswer(error) };
      render();
      scrollAssistant();
    });
  }

  function submitAskBursa(text) {
    state.askBursaMessages.push({ role: "user", text: text });
    state.askBursaMessages.push({ role: "assistant", pending: true });
    render();
    scrollAskBursa();
    apiJson("/api/ask-bursa", { method: "POST", body: JSON.stringify({ question: text, role: "gcmc", provider: state.routingProvider, conversationId: state.askBursaConversationId }) }).then(function (payload) {
      state.askBursaConversationId = payload.conversationId || state.askBursaConversationId;
      var provider = payload.provider === "copilot" ? "Microsoft Copilot Studio" : "Local Ollama model";
      state.askBursaMessages[state.askBursaMessages.length - 1] = { role: "assistant", question: text, answer: { department: payload.department || "Internal Knowledge", title: "Ask Bursa document answer", body: payload.answer, source: provider + " · " + (payload.narrativeMode || "retrieval"), citations: payload.citations || [] } };
      render();
      scrollAskBursa();
    }).catch(function (error) {
      state.askBursaMessages[state.askBursaMessages.length - 1] = { role: "assistant", question: text, answer: { department: "Connection error", title: "Live response unavailable", body: error.message, source: "Flask /api/chat", followup: "", isError: true } };
      render();
      scrollAskBursa();
    });
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
    if (state.savedDecisions.some(function (item) { return item.answerKey === answerKey; })) { toast("Decision already saved", "Open Action to review the existing record."); return; }
    createPlatformItem("decision", { title: answer.title, owner: "Lim Kim Hoong", status: "RECORDED", data: { answerKey: answerKey, question: assistantCurrentQuestion(), evidence: answer.sources || [], takeaway: answer.takeaway || "" } }).then(function () {
      render();
      toast("Saved to Decision Memory", "The question, rationale, owner, and evidence trail are persisted in Action.");
    }).catch(function (error) { toast("Decision save failed", error.message); });
  }

  function scheduleAssistantEmail() {
    var answer = assistantCurrentAnswer();
    if (!answer) return;
    var answerKey = assistantAnswerKey(answer);
    if (state.emailAutomations.some(function (item) { return item.answerKey === answerKey; })) { toast("Email automation already saved", "Open Action to review its availability."); return; }
    createPlatformItem("email-automation", { title: answer.title, owner: "Lim Kim Hoong", status: "UNAVAILABLE", data: { answerKey: answerKey, question: assistantCurrentQuestion(), schedule: "Every Monday · 8:00 AM", recipient: "My inbox", limitation: "No approved email connector is configured." } }).then(function () {
      render();
      toast("Email automation saved", "The schedule is persisted but unavailable until an approved email connector is configured.");
    }).catch(function (error) { toast("Automation save failed", error.message); });
  }

  function verifyAssistantAnswer() {
    var answer = assistantCurrentAnswer();
    if (!answer) return;
    apiJson("/api/verification", { method: "POST", body: JSON.stringify({ title: answer.title, workspace: "AI Assistant", requestedBy: "Lim Kim Hoong", details: { question: assistantCurrentQuestion(), answerTitle: answer.title, answerText: answer.body, sources: answer.sources || [] } }) }).then(function (verificationCase) {
      return Promise.all([loadVerification(), loadMissions(true), loadPendingActionCount()]).then(function () { toast("Verification requested", verificationCase.id + " is assigned to the Market Intelligence Lead."); navigate("verification"); });
    }).catch(function (error) { toast("Verification request failed", error.message); });
  }

  function createAssistantBriefing() {
    var answer = assistantCurrentAnswer();
    if (!answer) return;
    apiJson("/api/report", { method: "POST", body: JSON.stringify({ title: answer.title, question: assistantCurrentQuestion(), answer: { summary: answer.body || answer.takeaway || answer.title, context: answer.context || {}, method: answer.method || [], formula: answer.formula || "", sources: answer.sources || [] }, requestedBy: "Lim Kim Hoong", workspace: "AI Assistant", verification: "Draft" }) }).then(function (report) {
      openExperience({ title: "Briefing created", subtitle: report.filename, body: '<div class="detail-callout">' + svg("i-document") + '<span><strong>Verified PDF generated</strong><small>Fingerprint ' + escapeHtml(report.fingerprint) + '</small></span></div>', footer: '<a class="primary-button" href="' + escapeHtml(report.downloadUrl) + '" target="_blank" rel="noopener">Open PDF</a><button class="secondary-button" type="button" data-experience-close>Close</button>' });
    }).catch(function (error) { toast("Briefing failed", error.message); });
  }

  function scrollAssistant() {
    window.requestAnimationFrame(function () {
      var thread = document.getElementById("assistant-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  }

  function demoAction(action, context) {
    if (action === "attach") { chooseAttachments(); return; }
    if (action === "verify") { verifyAssistantAnswer(); return; }
    if (action === "briefing") { createAssistantBriefing(); return; }
    if (pages[action]) {
      navigate(action);
      return;
    }
    var panelActions = ["notifications", "apps", "identity", "help", "review", "approve", "agent", "canvas", "sources", "test-run", "run-now", "request-changes", "detail", "room-item", "access-boundary", "workspace-health", "participants", "activity", "files", "tasks", "missions", "verification", "featured", "all-assets", "recommendations", "contributors", "saved", "workflows", "runs", "approvals", "calendar", "verification-history", "audit-log", "upload", "new-decision", "room-add", "export-log", "manage-agents", "decisions", "use", "view", "open"];
    if (panelActions.indexOf(action) !== -1) {
      openInfoPanel(action, context);
      return;
    }
    openExperience({ title: context || action.replace(/-/g, " "), subtitle: "Integration unavailable", body: '<div class="detail-callout">' + svg("i-shield") + '<span><strong>This action has no configured backend integration</strong><small>BursaIQ did not perform or record the requested operation. Configure the required approved service before using it.</small></span></div>', footer: '<button class="primary-button" type="button" data-experience-close>Close</button>' });
  }

  function createAction(type) {
    createMenu.hidden = true;
    createButton.setAttribute("aria-expanded", "false");
    if (type === "agent") { openAgentBuilder(); return; }
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
    event.preventDefault();
    if (event.target.id === "creation-form") { completeCreation(event.target); return; }
    if (event.target.id === "platform-item-form") {
      var form = event.target;
      var data = new FormData(form);
      var kind = form.dataset.platformKind;
      var roomId = form.dataset.roomId;
      var apiType = kind === "decision" ? "decision" : "room-item";
      createPlatformItem(apiType, { title: String(data.get("title")), owner: "Lim Kim Hoong", status: String(data.get("status")), data: { kind: kind, roomId: roomId, description: String(data.get("description")) } }).then(function () { closeExperience(); render(); toast("Record saved", "The " + kind + " is persisted in BursaIQ."); }).catch(function (error) { toast("Save failed", error.message); });
    }
  });
  experienceOverlay.addEventListener("click", function (event) {
    var deleteControl = event.target.closest("[data-platform-delete]");
    if (deleteControl) {
      var reference = deleteControl.dataset.platformDelete.split(":");
      apiJson("/api/platform/" + encodeURIComponent(reference[0]) + "/" + encodeURIComponent(reference[1]), { method: "DELETE" }).then(function () { closeExperience(); return loadPlatform(); }).then(function () { toast("Record deleted", "The persisted record was removed."); }).catch(function (error) { toast("Delete failed", error.message); });
      return;
    }
    var target = event.target.closest("[data-dialog-action], [data-page-target], [data-mission-rerun], [data-mission-submit-review], [data-mission-revise], [data-mission-publish], [data-asset-reuse], [data-worker-evidence], [data-mission-back]");
    if (!target) return;
    if (target.dataset.missionRevise) { createMissionRevision(target.dataset.missionRevise, target); return; }
    if (target.dataset.missionPublish) {
      var publishId = target.dataset.missionPublish;
      target.disabled = true;
      target.textContent = "Publishing…";
      apiJson("/api/missions/" + encodeURIComponent(publishId) + "/publish", { method: "POST", body: JSON.stringify({ publishedBy: "Lim Kim Hoong" }) }).then(function (asset) {
        var publishedMission = missionById(publishId);
        if (publishedMission) publishedMission.publishedAsset = asset;
        assets = [asset].concat(assets.filter(function (item) { return item.id !== asset.id; }));
        if (publishedMission) refreshOpenMission(publishedMission);
        toast("Published to Intelligence Exchange", asset.version + " is now a reusable mission with its evidence and approval record.");
      }).catch(function (error) {
        target.disabled = false;
        target.textContent = "Publish to Exchange";
        toast("Publication failed", error.message);
      });
      return;
    }
    if (target.dataset.assetReuse) {
      var assetId = target.dataset.assetReuse;
      target.disabled = true;
      target.textContent = "Starting mission…";
      apiJson("/api/exchange/assets/" + encodeURIComponent(assetId) + "/reuse", { method: "POST", body: JSON.stringify({ requestedBy: "Lim Kim Hoong" }) }).then(function (payload) {
        closeExperience();
        state.liveMissions.unshift(payload.mission);
        state.page = "workforce";
        render();
        startMissionPolling(payload.mission.id, true);
        window.setTimeout(function () { openMission(payload.mission.id); }, 180);
        toast("Reusable mission started", "A fresh execution was created from " + payload.asset.version + ".");
      }).catch(function (error) {
        target.disabled = false;
        target.textContent = "Run reusable mission";
        toast("Reuse failed", error.message);
      });
      return;
    }
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
        Promise.all([loadMissions(true), loadPendingActionCount()]).then(function () { navigate("verification"); });
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
    if (action === "assign-agent") {
      var taskField = document.getElementById("agent-task");
      var task = taskField ? taskField.value.trim() : "";
      if (!task) { toast("Task required", "Describe the work before assigning this agent."); if (taskField) taskField.focus(); return; }
      closeExperience();
      state.assistantMessages = [];
      navigate("assistant");
      window.setTimeout(function () { submitAssistant("Act as the " + context + " for this governed task: " + task); }, 220);
      return;
    }
    if (action === "continue-mission") { closeExperience(); navigate("workforce"); return; }
    if (action === "request-connector") { closeExperience(); window.setTimeout(function () { openCreation("connector"); }, 200); return; }
    if (action === "manage-connector") { closeExperience(); navigate("settings"); return; }
    if (action === "approve-package" || action === "request-change") { closeExperience(); navigate("verification"); return; }
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
  loadMissions(false).then(function () {
    if (requestedMissionId && (state.page === "workforce" || state.page === "verification")) {
      if (state.page === "verification") { state.selectedVerificationMissionId = requestedMissionId; render(); }
      else openMission(requestedMissionId);
    }
  });
  loadVerification();
  loadPendingActionCount();
  loadExchangeAssets();
  loadModelProviders();
  loadAskBursaStatus();
  loadAskBursaSuggestions();
  loadKnowledgeAdmin();
  loadPlatform();
  loadAgents().then(function () {
    if (requestedPage === "agent-builder") openAgentBuilder(requestedAgentId);
  });
  loadMissionTeams().then(function () {
    if (requestedPage === "mission-team-builder") openMissionTeamBuilder(requestedTeamId);
  });
  loadMissionCapabilities();
  loadWorkflows().then(function () {
    if (requestedPage === "workflow-builder" && requestedWorkflowId) openWorkflowBuilder(requestedWorkflowId);
  });
})();
