const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'static/js/workforce.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'static/css/workforce.css'), 'utf8');
const designDocs = fs.readFileSync(path.join(root, 'DESIGN.md'), 'utf8');
const designLibrary = fs.readFileSync(path.join(root, '.impeccable/design.json'), 'utf8');

test('the complete platform modules have dedicated renderers', () => {
  for (const name of ['workspacePage', 'briefPage', 'verificationPage', 'connectorsPage', 'settingsPage']) {
    assert.match(js, new RegExp(`function ${name}\\(`));
  }
  assert.doesNotMatch(js, /else html = placeholderPage/);
});

test('every major action family has an interaction handler', () => {
  for (const hook of [
    'data-demo-action', 'data-create', 'data-asset-open', 'data-agent-open',
    'data-mission', 'data-automation-tab', 'data-room-tab', 'data-workspace-view',
    'data-connector', 'data-setting-toggle'
  ]) {
    assert.match(js, new RegExp(`\\[${hook}\\]`));
  }
});

test('creation and detail work use an accessible synthetic-demo sheet', () => {
  assert.match(html, /id="experience-overlay"[^>]*hidden/);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(js, /Synthetic demo only\. No external system will be changed\./);
  assert.match(css, /\.experience-overlay/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('mobile create control keeps an accessible name when its text is hidden', () => {
  assert.match(html, /id="create-button"[^>]*aria-label="Create"/);
  const createMenu = html.slice(html.indexOf('id="create-menu"'), html.indexOf('</div>', html.indexOf('id="create-menu"')));
  assert.doesNotMatch(createMenu, /New room|data-create="room"/);
});

test('AI Assistant is a governed question-and-answer workspace', () => {
  assert.match(js, /What would you like to <span>understand\?<\/span>/);
  assert.match(js, /Ask a question about Bursa, markets, policy, or approved knowledge/);
  assert.match(js, /function liveAssistantAnswer\(/);
  assert.match(js, /apiJson\("\/api\/chat"/);
  assert.match(js, /provider: state\.routingProvider/);
  assert.match(js, /no static answer was substituted/i);
  assert.doesNotMatch(js, /Delegate as mission<\/button>/);
  assert.match(js, /payload\.analytics && payload\.analytics\.result/);
  assert.match(js, /selectedChartId/);
  assert.match(js, /plotType/);
  assert.match(js, /function assistantBarChart\(/);
  assert.match(js, /function assistantLineChart\(/);
  assert.match(js, /tabindex="0" role="img"/);
  assert.doesNotMatch(js, /Values are normalised for the visual/);
  assert.match(css, /@keyframes assistant-bar-in/);
  assert.match(css, /\.chart-datum:hover/);
});

test('home commands use live semantic routing without a keyword fallback', () => {
  assert.match(js, /apiJson\("\/api\/intent-route"/);
  assert.match(js, /decision\.route === "mission"/);
  assert.match(js, /No keyword fallback was used/);
  assert.match(js, /Local model · Ollama/);
  assert.match(js, /Microsoft Copilot Studio/);
  assert.match(js, /provider: state\.routingProvider/);
  assert.match(js, /bursaiq-routing-provider/);
});

test('New AI Mission uses a general model-routed intake', () => {
  assert.match(js, /title: "Create AI mission"/);
  assert.match(js, /What should the AI workforce accomplish\?/);
  assert.match(js, /Preferred output/);
  assert.match(js, /AI-planned, capability-governed/);
  assert.match(js, /Plan and run mission/);
  assert.match(js, /form\.dataset\.routed === "true"/);
  assert.match(js, /apiJson\("\/api\/intent-route"/);
  assert.doesNotMatch(js, /Configure ADV mission/);
  assert.doesNotMatch(js, /Market-board scope/);
  assert.doesNotMatch(js, /<strong>Execution plan<\/strong>/);
});

test('My Workforce and shared page UI remain mission-neutral', () => {
  const workforcePageSource = js.slice(js.indexOf('function workforcePage()'), js.indexOf('function metric('));
  assert.match(workforcePageSource, /Create, run, and monitor governed AI missions/);
  assert.match(workforcePageSource, /data-create="mission"/);
  assert.match(workforcePageSource, /Mission governance/);
  assert.doesNotMatch(workforcePageSource, /Malaysia Equity Market|prepared ADV|Period ADV|Calculation contract|mission-inline-form/);
  assert.doesNotMatch(js, /function assistantAnswer\(/);
  assert.doesNotMatch(js, /Monthly ADV|immutable ADV draft|Calculates ADV/);
});

test('Agent Library is persistent and Workflow Builder assigns registry agents', () => {
  assert.match(js, /function agentLibraryPage\(\)/);
  assert.match(js, /function agentBuilderPage\(\)/);
  assert.match(js, /apiJson\("\/api\/agents\?role=employee&includeArchived=true"/);
  assert.match(js, /\/api\/agents\/" \+ encodeURIComponent\(state\.activeAgent\.id\) \+ "\/test"/);
  assert.match(js, /data-agent-action="duplicate"/);
  assert.match(js, /data-agent-action="archive"/);
  assert.match(js, /name="agentId"/);
  assert.match(js, /Select a registered agent/);
  assert.doesNotMatch(js, /var agents = \[\s*\{/);
  assert.doesNotMatch(js, /var missionAgents = \[/);
});

test('Configurable Mission Teams persist and are validated before mission execution', () => {
  assert.match(js, /function missionTeamsPage\(\)/);
  assert.match(js, /function missionTeamBuilderPage\(\)/);
  assert.match(js, /apiJson\("\/api\/mission-teams\?includeArchived=true"/);
  assert.match(js, /data-team-stage-add/);
  assert.match(js, /data-team-stage-delete/);
  assert.match(js, /data-team-stage-move/);
  assert.match(js, /name="dependency"/);
  assert.match(js, /teamId: String\(data\.get\("teamId"\)/);
  assert.match(js, /Validated team snapshot/);
  assert.doesNotMatch(js, /var missionAgents = \[/);
});

test('mission results render from capability-neutral schema sections', () => {
  assert.match(js, /function missionResultSections\(rawResult\)/);
  assert.match(js, /result\.summaryMetrics\.map/);
  assert.match(js, /result\.tables\.map/);
  assert.match(js, /result\.charts\.map\(missionChart\)/);
  assert.match(js, /result\.qualityChecks\.map/);
  assert.match(js, /result\.evidence\.map/);
  assert.match(js, /result\.interpretationBoundaries\.map/);
  assert.match(js, /result\.downloadableOutputs\.map/);
  assert.doesNotMatch(js, /periodAdvBn|totalTradedValueMyr|marketRowsEligible|\.advBn/);
});

test('mission lifecycle appears only after opening a clickable mission', () => {
  const workforcePageSource = js.slice(js.indexOf('function workforcePage()'), js.indexOf('function metric('));
  const missionPollingSource = js.slice(js.indexOf('function startMissionPolling('), js.indexOf('function createMissionRevision('));
  assert.doesNotMatch(workforcePageSource, /journey-wrap|mission-journey/);
  assert.doesNotMatch(missionPollingSource, /\brender\(\)/);
  assert.match(missionPollingSource, /refreshMissionRow\(mission\)/);
  assert.match(js, /class="mission-title mission-title-button"[^>]*data-mission=/);
  assert.match(js, /function missionLifecycleMarkup\(mission\)/);
  assert.match(js, /missionLifecycleMarkup\(mission\) \+ teamHeader \+ failure/);
  assert.match(css, /\.experience-body\.is-live-refresh/);
  assert.match(js, /data-mission-publish=/);
  assert.match(js, /Publish to Exchange/);
  assert.match(js, /data-asset-reuse=/);
  assert.match(js, /Run reusable mission/);
  assert.match(js, /\/api\/exchange\/assets/);
  assert.match(js, /data-mission-revise=/);
  assert.match(js, /Create revision/);
  assert.match(js, /mission-review-comment/);
  assert.match(js, /\/api\/missions\/" \+ encodeURIComponent\(id\) \+ "\/revise/);
});

test('a new login starts without fabricated work or notification counts', () => {
  assert.match(js, /savedDecisions: \[\]/);
  assert.match(js, /emailAutomations: \[\]/);
  assert.match(js, /notificationCount: 0/);
  assert.match(js, /var missions = \[\]/);
  assert.match(js, /var assets = \[\]/);
  assert.match(js, /var rooms = \[\]/);
  assert.match(js, /Nothing needs your attention/);
  assert.match(js, /No work in progress/);
  assert.match(js, /No connectors configured/);
  assert.doesNotMatch(html, /class="top-icon has-badge"/);
  assert.doesNotMatch(html, /data-page="(?:workforce|verification)"[^>]*>[\s\S]{0,160}<b>[1-9]/);
});

test('Decision Canvas exposes plot, analysis, source, and action views', () => {
  assert.match(js, /var tabs = \["plot", "analysis", "source", "action"\]/);
  assert.match(js, /data-assistant-canvas-tab/);
  assert.match(js, /data-canvas-action="memory"/);
  assert.match(js, /data-canvas-action="email"/);
  assert.match(js, /role="tablist" aria-label="Decision Canvas views"/);
  assert.match(css, /\.decision-canvas/);
  assert.match(css, /\.assistant-chart/);
});

test('sidebar reflects the focused navigation model', () => {
  assert.match(html, /Intelligence &amp; Execution[\s\S]*data-page="home"[\s\S]*data-page="assistant"[\s\S]*data-page="ask-bursa"/);
  assert.match(html, /data-page="workforce"[\s\S]*data-page="rooms"[\s\S]*data-page="automation"[\s\S]*data-page="exchange"/);
  assert.match(html, /Governance &amp; Follow-through[\s\S]*data-page="action"[\s\S]*data-page="verification"/);
  assert.match(html, /Administration &amp; Platform[\s\S]*data-page="knowledge-admin"[\s\S]*data-page="connectors"[\s\S]*data-page="settings"/);
  assert.match(html, /data-page="rooms"[^>]*>[\s\S]{0,180}<strong>Collaborative Rooms<\/strong>/);
  assert.doesNotMatch(html, /Projects &amp; Workspace|Help &amp; Support|data-demo-action="help"/);
  assert.doesNotMatch(html, /data-page="workspace"/);
  assert.doesNotMatch(html, /data-page="brief"/);
});

test('Ask Bursa is internal question-and-answer without a Decision Canvas', () => {
  assert.match(js, /function askBursaPage\(/);
  assert.match(js, /HR, Group Technology, Regulations, or Market Operations/);
  assert.match(js, /Document-grounded Q&amp;A/);
  assert.match(js, /function submitAskBursa\(/);
  const askSubmission = js.slice(js.indexOf('function submitAskBursa('), js.indexOf('function scrollAskBursa('));
  assert.match(askSubmission, /apiJson\("\/api\/ask-bursa"/);
  assert.doesNotMatch(askSubmission, /askBursaAnswer\(/);
  assert.doesNotMatch(js, /class="bursa-scope"/);
  assert.doesNotMatch(css, /\.bursa-scope/);
  assert.match(css, /\.ask-bursa-thread, \.ask-bursa-composer-wrap \{ width: 100%; max-width: none;/);
  assert.match(css, /\.ask-bursa-composer-wrap \.assistant-composer textarea \{ min-height: 82px;/);
  assert.match(js, /apiJson\("\/api\/ask-bursa"/);
  assert.match(js, /apiJson\("\/api\/ask-bursa\/status"/);
  assert.match(js, /apiJson\("\/api\/ask-bursa\/suggestions\?role=gcmc"/);
  assert.match(js, /state\.askBursaSuggestions\.map/);
  assert.match(js, /No suggested topics yet/);
  assert.doesNotMatch(js, /How do I submit a leave request\?/);
  assert.doesNotMatch(js, /How do I report a suspected phishing email\?/);
  assert.match(js, /answer\.citations/);
  assert.match(js, /class="bursa-citation"/);
  assert.match(js, /data-bursa-sources/);
  assert.match(js, /function openAskBursaSources\(/);
  assert.match(js, /Ask Bursa source scope/);
  const messageMarkup = js.slice(js.indexOf('function bursaMessageHtml('), js.indexOf('function openAskBursaSources('));
  assert.doesNotMatch(messageMarkup, /class="bursa-source-note"/);
  assert.doesNotMatch(messageMarkup, /class="bursa-citation"/);
  for (const source of [js, designDocs, designLibrary]) {
    assert.doesNotMatch(source, /Your role and permissions are applied/);
    assert.doesNotMatch(source, /Ask Bursa Permission Scope/);
  }
});

test('Knowledge Administration manages the persisted Ask Bursa document lifecycle', () => {
  assert.match(html, /data-page="knowledge-admin"/);
  assert.match(js, /function knowledgeAdministrationPage/);
  assert.match(js, /\/api\/knowledge-admin\/documents/);
  assert.match(js, /data-knowledge-ingest/);
  assert.match(js, /data-knowledge-reindex/);
  assert.match(js, /data-knowledge-remove/);
  assert.match(js, /data-knowledge-source-remove/);
  assert.match(js, /uploaded source · not indexed/);
  assert.match(js, /knowledge-suggestion-row/);
  assert.match(js, /allowedRoles/);
  assert.match(js, /replacesDocumentId/);
  assert.match(css, /\.knowledge-admin-page/);
  assert.match(js, /function openMetricPanel/);
  assert.match(js, /context === "Uploaded sources"/);
  assert.match(js, /context === "Searchable passages"/);
  assert.match(js, /context === "Generated topics"/);
  assert.match(js, /context === "Needs attention"/);
  assert.doesNotMatch(js, /No detailed operation is available/);
});

test('live backend state survives page refresh routes', () => {
  assert.match(js, /apiJson\("\/api\/missions"/);
  assert.match(js, /apiJson\("\/api\/verification\?role=securities"/);
  assert.match(js, /apiJson\("\/api\/exchange\/assets"/);
  assert.match(js, /window\.history\.replaceState\(null, "", "\?page="/);
  assert.match(js, /requestedMissionId/);
  assert.match(js, /homeMissionItem\(latestMission\)/);
});

test('Action workspace manages decision memory and email schedules', () => {
  assert.match(js, /function actionPage\(/);
  assert.match(js, /function assistantAnswerKey\(/);
  assert.match(js, /Saved to Decision Memory/);
  assert.match(js, /Automate by Email/);
  assert.match(js, /data-email-toggle/);
});

test('Action sidebar badge reflects pending backend assignments and hides zero', () => {
  assert.match(html, /id="action-nav-count"[^>]*hidden/);
  assert.doesNotMatch(html, /id="action-nav-count"[^>]*>\s*[0-9]+\s*</);
  assert.match(js, /apiJson\("\/api\/actions\/pending-count\?role=securities"\)/);
  assert.match(js, /state\.pendingActionCount = Math\.max\(0, Number\(payload\.count\) \|\| 0\)/);
  assert.match(js, /state\.pendingActions = payload\.actions \|\| \[\]/);
  assert.match(js, /Needs your attention/);
  assert.match(js, /The same persisted review and approval queue shown by the sidebar badge/);
  assert.match(js, /badge\.hidden = !\(count > 0\)/);
  assert.match(js, /badge\.textContent = count > 0 \? String\(count\) : ""/);
  assert.doesNotMatch(js, /actionCount\.textContent = String\(state\.savedDecisions\.length/);
  assert.doesNotMatch(js, /pendingReviewCount/);
  assert.match(css, /\.nav-link b\[hidden\] \{ display: none; \}/);
});

test('Automation Studio uses a persistent visual Workflow Builder', () => {
  assert.match(js, /function workflowBuilderPage\(/);
  assert.match(js, /apiJson\("\/api\/workflows"/);
  assert.match(js, /data-workflow-open/);
  assert.match(js, /data-node-add/);
  assert.match(js, /data-node-move/);
  assert.match(js, /name="dependency"/);
  assert.match(js, /data-node-delete/);
  assert.match(js, /data-workflow-action="save"/);
  assert.match(js, /data-workflow-action="test"/);
  assert.match(js, /data-workflow-action="run"/);
  assert.match(js, /data-workflow-action="duplicate"/);
  assert.match(js, /data-workflow-action="delete"/);
  assert.match(js, /\?page=workflow-builder&workflow=/);
  assert.match(css, /\.builder-canvas/);
  assert.match(css, /\.builder-properties/);
  assert.doesNotMatch(js, /function openRunPanel\(name\)[\s\S]{0,700}Trigger validated/);
});

test('Workflow Builder uses registries and supports persisted approval resume', () => {
  assert.match(js, /assignableAgents = state\.registeredAgents/);
  assert.match(js, /capabilityOptions = state\.missionCapabilities/);
  assert.match(js, /name="agentId"/);
  assert.match(js, /name="capabilityId"/);
  assert.match(js, /name="maxRetries"/);
  assert.match(js, /Review in Verification Centre/);
  assert.match(js, /data-case-review="Approved"/);
  assert.match(js, /data-case-review="Rejected"/);
  assert.match(js, /data-case-review="Changes requested"/);
  assert.match(js, /\/api\/verification\//);
  assert.doesNotMatch(js, /data-workflow-decision=/);
  assert.match(js, /Inputs, outputs, errors, retries, and approval transitions/);
});

test('Create Workflow waits for form submission before calling the backend', () => {
  const openCreationBody = js.slice(js.indexOf('function openCreation(type)'), js.indexOf('function openPlatformCreate'));
  const completionBody = js.slice(js.indexOf('function completeCreation(form)'), js.indexOf('function configuredTitle'));
  assert.doesNotMatch(openCreationBody, /apiJson\("\/api\/workflows"/);
  assert.match(completionBody, /if \(type === "workflow"\)/);
  assert.match(completionBody, /apiJson\("\/api\/workflows", \{ method: "POST"/);
  assert.doesNotMatch(js, /toast\("Approval recorded"/);
  assert.doesNotMatch(js, /toast\("Mission resumed"/);
});

test('employee workspace modules load and mutate persistent backend state', () => {
  assert.match(js, /apiJson\("\/api\/platform"/);
  assert.match(js, /apiJson\("\/api\/platform\/" \+ encodeURIComponent\(type\)/);
  assert.match(js, /apiJson\("\/api\/settings"/);
  assert.match(js, /createPlatformItem\("decision"/);
  assert.match(js, /createPlatformItem\("email-automation"/);
  assert.match(js, /data-platform-open/);
  assert.match(js, /data-room-add/);
  assert.match(js, /data-room-add="decision"/);
  assert.match(js, /var apiType = roomId \? "room-item"/);
  assert.match(js, /function chooseAttachments\(/);
  assert.match(js, /\/api\/local-analysis\/upload/);
  assert.match(js, /function verifyAssistantAnswer\(/);
  assert.match(js, /function createAssistantBriefing\(/);
  assert.doesNotMatch(js, /Demo interaction/);
  assert.doesNotMatch(js, /Interactive front-end demonstration/);
  assert.doesNotMatch(js, /function openRunPanel\(/);
});
