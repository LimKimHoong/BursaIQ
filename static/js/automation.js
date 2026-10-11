/* Automation direction: a role-scoped schedule ledger and inline editor in BursaIQ's
   incumbent glass world. Demo only: no mail transport, model calls or background jobs. */
(() => {
  "use strict";
  const KEY = "bursaiq_email_automations_v1";
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const ZONES = { "Asia/Kuala_Lumpur": "Malaysia · UTC+8", UTC: "UTC · UTC+0" };
  const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  function draft(seed = {}) {
    return { id: "", title: "Market intelligence email", question: "How did the market perform in July?", workspace: "home", recipients: "", instructions: "", frequency: "daily", days: [1, 2, 3, 4, 5], time: "08:30", timezone: "Asia/Kuala_Lumpur", enabled: true, includes: { link: true, dashboard: false, report: false }, ...seed };
  }
  function recipients(value) {
    return [...new Set(String(value).split(/[,;\n]/).map((item) => item.trim().toLowerCase()).filter(Boolean))];
  }
  function validate(value) {
    const errors = {};
    const emails = recipients(value.recipients);
    if (!value.title.trim() || value.title.length > 120) errors.title = "Add an email subject, up to 120 characters.";
    if (!value.question.trim() || value.question.length > 1000) errors.question = "Add a question, up to 1,000 characters.";
    if (!emails.length || emails.length > 10 || emails.some((email) => !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))) errors.recipients = "Add 1–10 valid email addresses, separated by commas or new lines.";
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.time)) errors.time = "Choose a valid send time.";
    if (!Object.hasOwn(ZONES, value.timezone)) errors.timezone = "Choose Malaysia time or UTC.";
    if (!["daily", "weekly"].includes(value.frequency)) errors.frequency = "Choose a repeat pattern.";
    if (value.frequency === "weekly" && !value.days.some((day) => Number.isInteger(day) && day >= 0 && day <= 6)) errors.days = "Select at least one day.";
    if (value.instructions.length > 1200) errors.instructions = "Keep instructions within 1,200 characters.";
    return errors;
  }
  function load(storage, role) {
    try {
      const all = JSON.parse(storage.getItem(KEY) || "{}");
      const rows = Object.hasOwn(all, role) && Array.isArray(all[role]) ? all[role] : [];
      return rows.filter((row) => row && typeof row.id === "string" && typeof row.title === "string" && typeof row.question === "string" && typeof row.recipients === "string" && typeof row.instructions === "string" && Array.isArray(row.days) && !Object.keys(validate(row)).length).slice(0, 100).map((row) => ({ ...row, includes: { link: Boolean(row.includes?.link), dashboard: Boolean(row.includes?.dashboard), report: Boolean(row.includes?.report) }, enabled: Boolean(row.enabled) }));
    } catch { return []; }
  }
  function save(storage, role, value) {
    const errors = validate(value);
    if (Object.keys(errors).length) return { errors };
    const rows = load(storage, role);
    if (!value.id && rows.length >= 100) return { error: "This device has 100 schedules. Edit an existing schedule instead." };
    const item = { ...value, title: value.title.trim(), question: value.question.trim(), recipients: recipients(value.recipients).join(", "), id: value.id || `email-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, updatedAt: new Date().toISOString() };
    const index = rows.findIndex((row) => row.id === item.id);
    if (index === -1) rows.unshift(item); else rows[index] = item;
    try {
      let all;
      try { all = JSON.parse(storage.getItem(KEY) || "{}"); } catch { all = {}; }
      if (!all || Array.isArray(all) || typeof all !== "object") all = {};
      storage.setItem(KEY, JSON.stringify({ ...all, [role]: rows }));
      return { item };
    } catch { return { error: "Your browser could not save this schedule. Allow local storage or free some space, then try again." }; }
  }
  function nextRun(value, now = new Date()) {
    if (!value.enabled || Object.keys(validate(value)).length) return null;
    // The two supported zones are fixed offsets; no ambiguous DST wall-clock times.
    const offset = value.timezone === "UTC" ? 0 : 8 * 60 * 60 * 1000;
    const wall = new Date(now.getTime() + offset);
    const [hour, minute] = value.time.split(":").map(Number);
    for (let day = 0; day <= 7; day++) {
      const candidateWall = new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + day, hour, minute));
      const candidate = new Date(candidateWall.getTime() - offset);
      if (candidate > now && (value.frequency === "daily" || value.days.includes(candidateWall.getUTCDay()))) return candidate;
    }
    return null;
  }
  function planned(value) {
    if (!value.enabled) return "Paused";
    const date = nextRun(value);
    return date ? new Intl.DateTimeFormat("en-MY", { timeZone: value.timezone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date) : "Complete the schedule to calculate its next run";
  }
  function pattern(value) {
    return `${value.frequency === "daily" ? "Every day" : value.days.map((day) => DAYS[day]).join(", ")} · ${value.time} · ${value.timezone === "UTC" ? "UTC" : "MYT"}`;
  }
  function read(form, previous) {
    const data = new FormData(form);
    return draft({ ...previous, title: String(data.get("title") || ""), question: String(data.get("question") || ""), recipients: String(data.get("recipients") || ""), instructions: String(data.get("instructions") || ""), frequency: String(data.get("frequency") || "daily"), time: String(data.get("time") || ""), timezone: String(data.get("timezone") || "Asia/Kuala_Lumpur"), days: data.getAll("days").map(Number), enabled: data.has("enabled"), includes: { link: data.has("link"), dashboard: data.has("dashboard"), report: data.has("report") } });
  }
  function field(name, label, value, errors, options = {}) {
    const attrs = `id="automation-${name}" name="${name}" ${options.required ? "required" : ""} maxlength="${options.max || 120}" ${errors[name] ? 'aria-invalid="true"' : ""} aria-describedby="automation-${name}-help"`;
    return `<label class="automation-field" for="automation-${name}"><span>${label}</span>${options.multiline ? `<textarea ${attrs} rows="${options.rows || 2}" placeholder="${esc(options.placeholder || "")}">${esc(value)}</textarea>` : `<input ${attrs} value="${esc(value)}">`}<small id="automation-${name}-help"${errors[name] ? ' class="automation-error"' : ""}>${esc(errors[name] || options.help || "")}</small></label>`;
  }
  function page({ rows, editor, errors = {}, message = "", preview = "" }) {
    const v = editor;
    return `<div class="automation-page">
      <div class="automation-intro"><div><h2>Intelligence, on your schedule</h2><p>Choose the question once. Plan a recurring email with a fresh source snapshot.</p></div><button class="button secondary" type="button" data-automation-new>New automation</button></div>
      <p class="automation-boundary">Demo only · schedules are saved on this device. No emails or background runs occur. Previews re-read prepared data, not live market feeds.</p>
      <div class="automation-layout"><aside class="automation-ledger" aria-label="Saved email schedules"><h3>Your schedules <span>${rows.length}</span></h3>
      ${rows.length ? rows.map((row) => `<article class="automation-row${row.id === v.id ? " is-selected" : ""}"><button type="button" class="automation-open" data-automation-edit="${esc(row.id)}" ${row.id === v.id ? 'aria-current="true"' : ""}><strong>${esc(row.title)}</strong><small>${esc(pattern(row))}</small><small>${recipients(row.recipients).length} recipient${recipients(row.recipients).length === 1 ? "" : "s"} · ${row.enabled ? "On (demo)" : "Paused"}</small></button><label class="automation-toggle"><span class="sr-only">${row.enabled ? "Pause" : "Enable"} ${esc(row.title)}</span><span class="switch-control"><input type="checkbox" data-automation-toggle="${esc(row.id)}" ${row.enabled ? "checked" : ""}><i></i></span></label></article>`).join("") : `<div class="automation-empty"><p>No schedules yet.</p><p>Start with a daily market brief, or use “Automate by email” in the Assistant’s Decision Canvas.</p><button type="button" class="button ghost" data-automation-template>Use market brief</button></div>`}
      <p class="automation-ledger-note">Private to the active demo identity on this browser. This is not secure account storage; use demo email addresses.</p></aside>
      <section class="automation-editor" aria-label="Email automation editor"><h3>${v.id ? "Edit automation" : "Create automation"}</h3>
      ${message ? `<p class="automation-message" role="status">${esc(message)}</p>` : ""}
      ${Object.keys(errors).length ? `<p class="automation-error" role="alert">Check the highlighted fields before continuing.</p>` : ""}
      <form data-automation-form novalidate>
      <fieldset><legend>What should BursaIQ cover?</legend>${field("title", "Email subject", v.title, errors, { required: true })}${field("question", "Question to repeat", v.question, errors, { multiline: true, required: true, max: 1000, help: "The question is repeated against available sources, rather than copying the original answer." })}${field("instructions", "Instructions for the briefing", v.instructions, errors, { multiline: true, rows: 3, max: 1200, placeholder: "Focus on trading activity. Keep it concise and highlight source limitations.", help: "Saved for a future connected model. The demo displays this brief but does not execute arbitrary instructions." })}</fieldset>
      <fieldset><legend>Who receives it?</legend>${field("recipients", "Email recipients", v.recipients, errors, { multiline: true, required: true, max: 1000, placeholder: "analyst@example.test, team@example.test", help: "Include your address and any additional recipients. Separate up to 10 addresses with commas or new lines." })}</fieldset>
      <fieldset><legend>When should it repeat?</legend><div class="automation-timing"><label class="automation-field"><span>Repeat</span><select name="frequency" id="automation-frequency"><option value="daily"${v.frequency === "daily" ? " selected" : ""}>Every day</option><option value="weekly"${v.frequency === "weekly" ? " selected" : ""}>Selected days</option></select></label><label class="automation-field"><span>Send time</span><input type="time" name="time" id="automation-time" value="${esc(v.time)}" required ${errors.time ? 'aria-invalid="true"' : ""}>${errors.time ? `<small class="automation-error">${esc(errors.time)}</small>` : ""}</label><label class="automation-field"><span>Time zone</span><select name="timezone">${Object.entries(ZONES).map(([key, label]) => `<option value="${key}"${v.timezone === key ? " selected" : ""}>${label}</option>`).join("")}</select></label></div>
      <fieldset class="automation-days" id="automation-days" ${v.frequency === "daily" ? "hidden disabled" : ""}><legend>Receive on</legend><div>${[1, 2, 3, 4, 5, 6, 0].map((day) => `<label><input type="checkbox" name="days" value="${day}"${v.days.includes(day) ? " checked" : ""}><span>${DAYS[day]}</span></label>`).join("")}</div>${errors.days ? `<p class="automation-error" role="alert">${esc(errors.days)}</p>` : ""}</fieldset>
      <label class="automation-check"><input type="checkbox" name="enabled"${v.enabled ? " checked" : ""}><span><strong>Schedule on</strong><small>Demo state only. Turn off to pause this schedule.</small></span></label></fieldset>
      <fieldset><legend>Include in the email</legend><div class="automation-includes">${[["link", "Link", "Return to Ask BursaIQ"], ["dashboard", "Dashboard", "Relevant evidence snapshot"], ["report", "Report", "Inline briefing summary"]].map(([key, label, help]) => `<label class="automation-check"><input type="checkbox" name="${key}"${v.includes[key] ? " checked" : ""}><span><strong>${label}</strong><small>${help}</small></span></label>`).join("")}</div></fieldset>
      <div class="automation-form-actions"><button class="button primary" type="submit" name="action" value="save">${v.id ? "Save changes" : "Save automation"}</button><button class="button secondary" type="submit" name="action" value="preview">Refresh email preview</button></div>
      </form><p class="automation-next">Next planned run (demo): <strong>${esc(planned(v))}</strong></p>
      <section class="automation-preview" aria-label="Email preview" tabindex="-1" id="automation-preview"><h3>Email preview <span>Not sent</span></h3>${preview || '<p>Check your subject, recipients and schedule, then refresh the preview. Previewing does not save your schedule. No demo action sends email.</p>'}</section></section></div></div>`;
  }
  function preview(value, { answer, error, asOf, generatedAt, url }) {
    return `<div class="automation-envelope"><dl><div><dt>To</dt><dd>${esc(recipients(value.recipients).join(", "))}</dd></div><div><dt>Subject</dt><dd>${esc(value.title)}</dd></div><div><dt>Planned</dt><dd>${esc(pattern(value))}</dd></div></dl><p class="automation-preview-date">Preview refreshed ${esc(generatedAt)} · prepared data as of ${esc(asOf)}</p></div>
      <div class="automation-email-body"><p><strong>Question:</strong> ${esc(value.question)}</p>${error ? `<p role="status">${esc(error)}</p>` : `<h4>${esc(answer.title)}</h4><div>${answer.html}</div>`}
      ${value.instructions ? `<div class="automation-brief"><h4>Your briefing instructions</h4><p>${esc(value.instructions).replaceAll("\n", "<br>")}</p><small>Instruction execution requires a connected model; this preview uses prepared answers.</small></div>` : ""}
      ${value.includes.link ? `<h4>Link</h4><p><a href="${esc(url)}" target="_blank" rel="noopener">Open BursaIQ</a> · ask the question above to revisit its evidence.</p>` : ""}
      ${value.includes.dashboard ? `<h4>Dashboard snapshot</h4>${answer && Object.keys(answer.context || {}).length ? `<dl class="automation-snapshot">${Object.entries(answer.context).map(([key, val]) => `<div><dt>${esc(key)}</dt><dd>${esc(val)}</dd></div>`).join("")}</dl>` : "<p>No dashboard is available for this question in the prepared demo.</p>"}<small>Evidence snapshot only; no dashboard attachment is sent.</small>` : ""}
      ${value.includes.report ? `<h4>Report summary</h4><p>${answer ? esc(answer.formula || "Prepared narrative and its source trail are included above.") : "No report summary is available for this question."}</p><small>Inline summary in this demo, not a PDF attachment.</small>` : ""}
      ${answer?.sources?.length ? `<h4>Source trail</h4><ul>${answer.sources.map((source) => `<li>${esc(source.title || source.name || "Prepared source")} ${source.detail ? `— ${esc(source.detail)}` : ""}${source.updated ? ` · updated ${esc(source.updated)}` : ""}</li>`).join("")}</ul>` : ""}
      <p class="automation-email-footer">Synthetic competition data · not investment advice · not independently verified · demo email, not sent.</p></div>`;
  }
  window.BursaIQAutomation = { draft, recipients, validate, load, save, nextRun, planned, pattern, read, page, preview };
})();
