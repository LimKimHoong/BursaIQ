(function () {
  "use strict";

  const data = window.BURSAIQ_DEMO;
  const market = data.market;

  const format = {
    number(value, digits = 1) {
      return Number(value).toLocaleString("en-MY", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    },
    signed(value, suffix = "%") {
      const n = Number(value);
      return `${n >= 0 ? "+" : ""}${format.number(n, 1)}${suffix}`;
    },
    moneyBn(value) {
      return `RM${format.number(value, 2)}bn`;
    },
    moneyMn(value) {
      const n = Number(value);
      return `${n >= 0 ? "+" : "−"}RM${format.number(Math.abs(n), 0)}m`;
    }
  };

  function source(id, detail) {
    const doc = data.documents.find((item) => item.id === id);
    return doc ? { ...doc, detail } : null;
  }

  function answer(title, html, options = {}) {
    return {
      title,
      html,
      confidence: options.confidence || 96,
      sources: (options.sources || []).filter(Boolean),
      method: options.method || [
        ["1", "Interpret", "Identify the requested metric and reporting period."],
        ["2", "Retrieve", "Read only approved local demo files available to this workspace."],
        ["3", "Calculate", "Apply deterministic formulas outside the language model."],
        ["4", "Explain", "Compose the narrative and attach traceable evidence."]
      ],
      formula: options.formula || "No derived calculation required.",
      context: options.context || {},
      status: options.status || "Grounded",
      followups: options.followups || []
    };
  }

  function ordinal(value) {
    const remainder = value % 100;
    if (remainder >= 11 && remainder <= 13) return `${value}th`;
    return `${value}${value % 10 === 1 ? "st" : value % 10 === 2 ? "nd" : value % 10 === 3 ? "rd" : "th"}`;
  }

  function marketPerformance() {
    const h = market.headline;
    const breadthTotal = h.gainers + h.losers + h.unchanged;
    return answer(
      "The market advanced in July, with broad but selective support",
      `<p>The synthetic FBM KLCI closed at <strong>${format.number(h.fbmKLCI, 1)}</strong>, up <strong>${format.signed(h.klciMtdPct)}</strong> month to date and ${format.signed(h.klciYtdPct)} year to date. Market capitalisation reached <strong>${format.moneyBn(h.marketCapBn)}</strong>.</p>
       <div class="answer-callout">
         <div class="answer-stat"><small>FBM KLCI</small><strong>${format.number(h.fbmKLCI, 1)}</strong></div>
         <div class="answer-stat"><small>MTD change</small><strong>${format.signed(h.klciMtdPct)}</strong></div>
         <div class="answer-stat"><small>Market cap</small><strong>${format.moneyBn(h.marketCapBn)}</strong></div>
       </div>
       <p><strong>What moved:</strong> Technology and Financial Services contributed 17.8 index points together. Breadth was positive: ${h.gainers} gainers versus ${h.losers} losers across ${breadthTotal.toLocaleString("en-MY")} observed counters.</p>
       <p><strong>Management read:</strong> momentum improved alongside higher trading value, although gains were concentrated in two leading sectors.</p>`,
      {
        sources: [
          source("gcmc-pulse", "Index Summary · July close and month-to-date change"),
          source("gcmc-pulse", "Sector Attribution · contribution points"),
          source("gcmc-pulse", "Market Breadth · gainers, losers and unchanged")
        ],
        formula: "MTD return = (1,638.2 ÷ 1,599.8 − 1) × 100 = 2.40%",
        context: { "Reporting period": "1–31 Jul 2026", "Previous close": "1,599.8", "Currency": "MYR", "Data class": "Synthetic demo" },
        followups: ["Which sectors drove the move?", "Compare Malaysia with regional peers", "How did ADV change?"]
      }
    );
  }

  function advPerformance() {
    const h = market.headline;
    const change = (h.adv30dBn / h.advPrior30dBn - 1) * 100;
    const top = [...market.participation].sort((a, b) => b.sharePct - a.sharePct)[0];
    return answer(
      "Trading activity strengthened over the latest 30-day window",
      `<p>Average Daily Value was <strong>${format.moneyBn(h.adv30dBn)}</strong>, up <strong>${format.signed(change)}</strong> from ${format.moneyBn(h.advPrior30dBn)} in the preceding 30-day window.</p>
       <div class="answer-callout">
         <div class="answer-stat"><small>Latest 30D ADV</small><strong>${format.moneyBn(h.adv30dBn)}</strong></div>
         <div class="answer-stat"><small>Prior 30D ADV</small><strong>${format.moneyBn(h.advPrior30dBn)}</strong></div>
         <div class="answer-stat"><small>Change</small><strong>${format.signed(change)}</strong></div>
       </div>
       <p><strong>Participation:</strong> ${top.group} remained the largest participant group at ${format.number(top.sharePct, 1)}% of traded value. Foreign investors recorded a ${format.moneyMn(218)} net flow, while local institutions recorded ${format.moneyMn(486)}.</p>
       <p><strong>Management read:</strong> the increase in value traded supports the stronger headline market performance; participation was not dependent on retail activity alone.</p>`,
      {
        sources: [
          source("gcmc-pulse", "Trading Activity · latest and prior 30-day daily value"),
          source("gcmc-pulse", "Investor Participation · share and net flow")
        ],
        formula: "30D ADV change = (RM3.42bn ÷ RM3.08bn − 1) × 100 = 11.04%",
        context: { "Latest window": "18 Jun–31 Jul 2026", "Prior window": "6 May–17 Jun 2026", "Trading days": "30 per window", "Scope": "On-market value" },
        followups: ["Show investor participation", "What is trading velocity?", "Create a management briefing"]
      }
    );
  }

  function marketDrivers() {
    const sectors = market.sectors.slice(0, 4);
    const stocks = market.counters.slice(0, 3);
    return answer(
      "Technology and Financial Services were the principal index drivers",
      `<p>The two leading sectors added <strong>${format.number(sectors[0].contributionPoints + sectors[1].contributionPoints, 1)} points</strong> to the synthetic FBM KLCI during July.</p>
       <ul>${sectors.map((item) => `<li><strong>${item.name}</strong>: ${format.signed(item.mtdPct)} MTD; ${format.signed(item.contributionPoints, " pts")} contribution.</li>`).join("")}</ul>
       <p>At constituent level, the largest positive contributions came from ${stocks.map((item) => `<strong>${item.name}</strong> (${format.signed(item.contributionPoints, " pts")})`).join(", ")}.</p>
       <p><strong>Watch item:</strong> Healthcare detracted 1.8 points, making it the only negative sector in the prepared attribution set.</p>`,
      {
        sources: [
          source("gcmc-pulse", "Sector Attribution · sorted by index contribution"),
          source("gcmc-pulse", "Constituent Attribution · top positive contributors")
        ],
        formula: "Sector contribution = Σ(constituent weight × constituent price return), expressed as index points.",
        context: { "Attribution basis": "Synthetic constituent weights", "Period": "July 2026 MTD", "Rounding": "0.1 index point", "Coverage": "Prepared demo universe" },
        followups: ["Give me the market overview", "Compare regional markets", "Prepare a briefing"]
      }
    );
  }

  function regionalComparison() {
    const rows = [...market.regional].sort((a, b) => b.mtdPct - a.mtdPct);
    const malaysiaRank = rows.findIndex((item) => item.market.startsWith("Malaysia")) + 1;
    return answer(
      `Malaysia ranked ${ordinal(malaysiaRank)} in the prepared regional set for July`,
      `<p>The synthetic FBM KLCI gained <strong>${format.signed(2.4)}</strong> MTD, ahead of Singapore, Thailand and Indonesia, but the United States comparison is not directly equivalent because market composition and currency differ.</p>
       <ul>${rows.map((item, index) => `<li><strong>${index + 1}. ${item.market}</strong> — ${format.signed(item.mtdPct)} MTD; ${format.signed(item.ytdPct)} YTD (${item.currency}).</li>`).join("")}</ul>
       <p><strong>Use with care:</strong> this is a directional index-return comparison. It is not currency-adjusted and does not compare market volatility or total return.</p>`,
      {
        sources: [source("gcmc-pulse", "Regional Benchmarks · prepared closing-index returns")],
        formula: "Ranking = descending local-currency price return for 1–31 Jul 2026.",
        context: { "Return type": "Price return", "FX adjusted": "No", "Dividend adjusted": "No", "Cut-off": "31 Jul 2026 local close" },
        confidence: 93,
        followups: ["How did trading activity change?", "Which sectors led Malaysia?", "Explain this for a new joiner"]
      }
    );
  }

  function marketSizeAndVelocity() {
    const h = market.headline;
    const velocityChange = h.velocityPct - h.velocityPriorPct;
    return answer(
      "Market value and trading velocity both improved",
      `<p>Synthetic market capitalisation was <strong>${format.moneyBn(h.marketCapBn)}</strong>, ${format.signed(h.marketCapMtdPct)} month to date. Annualised trading velocity reached <strong>${format.number(h.velocityPct, 1)}%</strong>, an increase of ${format.signed(velocityChange, " percentage points")} from the prior measure.</p>
       <div class="answer-callout">
         <div class="answer-stat"><small>Market cap</small><strong>${format.moneyBn(h.marketCapBn)}</strong></div>
         <div class="answer-stat"><small>Velocity</small><strong>${format.number(h.velocityPct, 1)}%</strong></div>
         <div class="answer-stat"><small>Velocity change</small><strong>${format.signed(velocityChange, " pp")}</strong></div>
       </div>
       <p>Higher velocity means more value changed hands relative to the size of the market. It signals greater activity, but it does not by itself indicate better liquidity quality.</p>`,
      {
        sources: [source("gcmc-pulse", "Market Summary and Trading Activity worksheets")],
        formula: "Trading velocity = (30D ADV × 252 trading days ÷ market capitalisation) × 100.",
        context: { "Annualisation factor": "252 trading days", "Market cap date": "31 Jul 2026", "ADV window": "Latest 30 trading days", "Interpretation": "Activity, not liquidity quality" },
        followups: ["Explain ADV in plain language", "Show market performance", "Create a briefing"]
      }
    );
  }

  function participation() {
    const rows = market.participation;
    return answer(
      "Institutional participation supported the July advance",
      `<p>Local institutions accounted for <strong>${format.number(rows[0].sharePct, 1)}%</strong> of traded value and were net buyers of ${format.moneyMn(rows[0].netFlowMn)}. Foreign investors contributed ${format.number(rows[1].sharePct, 1)}% and were net buyers of ${format.moneyMn(rows[1].netFlowMn)}.</p>
       <ul>${rows.map((item) => `<li><strong>${item.group}</strong>: ${format.number(item.sharePct, 1)}% participation; ${format.moneyMn(item.netFlowMn)} net flow.</li>`).join("")}</ul>
       <p>The three net-flow figures reconcile to RM0 because this closed synthetic market view treats one group’s net purchase as another group’s net sale.</p>`,
      {
        sources: [source("gcmc-pulse", "Investor Participation · July 2026")],
        formula: "Net flow = gross purchase value − gross sale value. Closed-market check: Σ net flow = RM0.",
        context: { "Investor groups": "Mutually exclusive demo categories", "Scope": "Prepared on-market trades", "Reconciliation": "RM0", "Privacy": "Aggregated; no investor identity" },
        followups: ["How did ADV change?", "Which sectors drove the move?", "Create a briefing"]
      }
    );
  }

  function learnAnswer(question) {
    const q = question.toLowerCase();
    if (/(product|products|instrument|instruments|asset class|option|options)/.test(q)) {
      return answer(
        "Bursa products span securities, derivatives and specialist markets",
        `<p>The high-level product map includes <strong>securities</strong> such as shares, structured products, ETFs, REITs, bonds and sukuk, plus <strong>commodity, equity and financial derivatives</strong> such as futures and options.</p>
         <p>It also covers Shariah-compliant participation through Bursa Malaysia-i and Bursa Suq Al-Sila', together with indices, the Labuan International Financial Exchange and Bursa Gold Dinar.</p>
         <p><strong>Important:</strong> this is an introductory map, not investment advice. Current eligibility, risks, fees and contract specifications should be checked on the relevant official product page.</p>`,
        {
          sources: [source("product-overview", "Product map at a glance and product-market categories")],
          method: [
            ["1", "Classify", "Recognise a product-discovery question and route it to Learn Bursa."],
            ["2", "Retrieve", "Open the approved local Bursa Products Overview."],
            ["3", "Group", "Present the retrieved categories without asking the language model to rebuild the catalogue."],
            ["4", "Cite", "Attach the source and remind the reader to confirm current specifications."]
          ],
          formula: "No calculation. Categories are retrieved from the approved learning source.",
          context: { "Audience mode": "New joiner", "Scope": "High-level product categories", "Advice status": "Not investment advice", "Freshness check": "Confirm current specifications on official pages" },
          followups: ["Which securities products are listed?", "What derivatives are available?", "Explain Bursa Malaysia-i"]
        }
      );
    }
    let item = data.glossary.find((entry) => q.includes(entry.term.toLowerCase()) || q.includes(entry.expansion.toLowerCase()));
    if (!item && (q.includes("volume") || q.includes("trading value"))) item = data.glossary[0];
    if (!item) item = data.glossary[1];
    const example = item.term === "ADV"
      ? "If RM68.4bn trades over 20 trading days, ADV is RM3.42bn."
      : item.term === "Trading velocity"
        ? "At RM3.42bn ADV, 252 days and RM2,148.6bn market capitalisation, annualised velocity is about 40.1%."
        : "A company with 1 billion issued shares priced at RM4 has RM4 billion in market capitalisation.";
    return answer(
      `${item.term} explained`,
      `<p><strong>${item.expansion}</strong> — ${item.explanation}</p>
       <p><strong>Simple example:</strong> ${example}</p>
       <p><strong>Why colleagues use it:</strong> it creates a consistent basis for comparing activity or market size across periods. Always check the measurement window and scope before comparing two figures.</p>`,
      {
        sources: [
          source("market-primer", `Glossary · ${item.term}`),
          source("gcmc-pulse", "Synthetic worked example")
        ],
        formula: item.term === "ADV" ? "ADV = total traded value ÷ number of trading days" : "Definition and example retrieved from the market primer.",
        context: { "Audience mode": "New joiner", "Reading level": "Plain language", "Knowledge boundary": "Approved learning sources", "Example data": "Synthetic" },
        followups: ["What is trading velocity?", "How is market cap calculated?", "Give me a quick market overview"]
      }
    );
  }

  function hrAnswer(question) {
    const q = question.toLowerCase();
    const applicant = data.hr.applications.find((item) => q.includes(item.applicant.toLowerCase()) || q.includes(item.ref.toLowerCase()));
    if (applicant || q.includes("application") || q.includes("candidate") || q.includes("status")) {
      const person = applicant || data.hr.applications[0];
      return answer(
        `${person.applicant} is at ${person.stage.toLowerCase()}`,
        `<p>Application <strong>${person.ref}</strong> for <strong>${person.position}</strong> is currently at <strong>${person.stage}</strong>.</p>
         <div class="answer-callout">
           <div class="answer-stat"><small>Reference</small><strong>${person.ref}</strong></div>
           <div class="answer-stat"><small>Current stage</small><strong>${person.stage}</strong></div>
           <div class="answer-stat"><small>Case owner</small><strong>${person.owner}</strong></div>
         </div>
         <p><strong>Next action:</strong> ${person.nextAction}. This fictional record is visible because the active demo identity belongs to HR.</p>`,
        {
          sources: [source("hr-applications", `Applicant reference ${person.ref}`), source("hr-procedure", `Procedure stage · ${person.stage}`)],
          formula: "Exact reference/name match → retrieve permitted row → join with procedure stage.",
          context: { "Record class": "Fictional applicant", "Workspace": "HR restricted", "Data minimisation": "Only status fields shown", "Purpose": "Competition demonstration" },
          followups: ["What is the hiring procedure?", "What happens after panel assessment?", "Create a status briefing"]
        }
      );
    }
    const totalDays = data.hr.procedure.reduce((sum, item) => sum + item.targetDays, 0);
    return answer(
      "The demo hiring procedure has five governed stages",
      `<p>The standard path runs from requisition approval to offer issue, with a combined service target of <strong>${totalDays} working days</strong> when stages proceed sequentially.</p>
       <ul>${data.hr.procedure.map((item) => `<li><strong>${item.step}. ${item.name}</strong> — ${item.owner}; target ${item.targetDays} working day${item.targetDays === 1 ? "" : "s"}.</li>`).join("")}</ul>
       <p>Exceptions and overdue actions should be escalated to the named stage owner. The exact clock may pause when candidate action is pending.</p>`,
      {
        sources: [source("hr-procedure", "Sections 2–4 · workflow, owners and service targets")],
        formula: `Sequential target = ${data.hr.procedure.map((item) => item.targetDays).join(" + ")} = ${totalDays} working days`,
        context: { "Document status": "Demo procedure", "Calendar": "Working days", "Candidate wait time": "Excluded", "Records": "No personal data used" },
        followups: ["What happens after panel assessment?", "Show Alya Rahman's application", "Summarise the procedure"]
      }
    );
  }

  function regAnswer(question) {
    const q = question.toLowerCase();
    const topics = data.regulation?.topics || [];
    let topic = topics.find((item) => item.id === "listing-obligations") || topics[0];
    if (/(continuous|material information|disclosure)/.test(q)) topic = topics.find((item) => item.id === "continuous-disclosure") || topic;
    else if (/(unusual|uma|market activity query)/.test(q)) topic = topics.find((item) => item.id === "unusual-market-activity") || topic;
    else if (/(misconduct|manipulation|insider|suspicious|surveillance)/.test(q)) topic = topics.find((item) => item.id === "market-misconduct") || topic;
    return answer(
      `${topic.title}: a controlled first view`,
      `<p>${topic.summary}</p>
       <ul>${topic.actions.map((action) => `<li>${action}</li>`).join("")}</ul>
       <p><strong>Boundary:</strong> ${data.regulation.disclaimer} Confirm the current official rule text and seek the accountable Data Owner’s interpretation before acting.</p>`,
      {
        sources: [source("regulatory-demo-guide", `${topic.title} · synthetic workflow guidance`)],
        method: [
          ["1", "Classify", "Identify the regulation topic and the decision the user is trying to make."],
          ["2", "Retrieve", "Read only the permitted Ask Reg demo source."],
          ["3", "Bound", "Separate general workflow guidance from an official rule interpretation."],
          ["4", "Escalate", "Direct the user to the current rule text and accountable regulatory owner."]
        ],
        formula: "No calculation. Guidance is retrieved from the controlled synthetic regulation source.",
        context: { "Information class": "Synthetic demo guidance", "Authority": "Not an official rule interpretation", "Owner": "Regulatory Policy & Advisory", "Action boundary": "Confirm before acting" },
        status: "Controlled guidance",
        followups: ["What is continuous disclosure?", "How should suspected market misconduct be escalated?", "What should happen after an unusual market activity query?"]
      }
    );
  }

  function respond(workspace, question) {
    const q = question.toLowerCase();
    if (workspace === "learn") return learnAnswer(question);
    if (workspace === "hr") return hrAnswer(question);
    if (workspace === "reg") return regAnswer(question);
    if (q.includes("adv") || q.includes("daily value") || q.includes("trading activity")) return advPerformance();
    if (q.includes("sector") || q.includes("driver") || q.includes("stock") || q.includes("counter") || q.includes("attribution")) return marketDrivers();
    if (q.includes("regional") || q.includes("international") || q.includes("peer") || q.includes("singapore") || q.includes("thailand") || q.includes("indonesia") || q.includes("s&p")) return regionalComparison();
    if (q.includes("velocity") || q.includes("market cap") || q.includes("market value") || q.includes("capitalisation")) return marketSizeAndVelocity();
    if (q.includes("investor") || q.includes("flow") || q.includes("participation") || q.includes("foreign")) return participation();
    return marketPerformance();
  }

  window.BursaIQEngine = { respond, format, marketPerformance, advPerformance, marketDrivers, regionalComparison, marketSizeAndVelocity, participation, learnAnswer, hrAnswer, regAnswer };
})();
