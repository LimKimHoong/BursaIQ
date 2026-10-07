window.BURSAIQ_DEMO = {
  meta: {
    asOf: "31 Jul 2026",
    datasetLabel: "Synthetic competition dataset",
    generatedAt: "2026-07-31T18:00:00+08:00",
    disclaimer: "All names, values and records in this prototype are invented for the Stage 02 demonstration."
  },
  identities: {
    gcmc: { initials: "NK", name: "Nadia Karim", role: "GCMC · Analyst", access: ["market", "learn"], reviewerFor: [] },
    hr: { initials: "FL", name: "Farah Lee", role: "HR · People Partner", access: ["market", "learn"], reviewerFor: [] },
    securities: { initials: "AR", name: "Arif Rahman", role: "Securities Market · Market Reviewer", access: ["market", "learn", "reg", "verification"], reviewerFor: ["Market Intelligence Lead"] },
    finance: { initials: "MT", name: "Mei Tan", role: "Finance · Business Partner", access: ["market", "learn"], reviewerFor: [] }
  },
  market: {
    headline: {
      fbmKLCI: 1638.2,
      klciMtdPct: 2.4,
      klciYtdPct: 5.8,
      marketCapBn: 2148.6,
      marketCapMtdPct: 2.1,
      adv30dBn: 3.42,
      advPrior30dBn: 3.08,
      velocityPct: 40.1,
      velocityPriorPct: 36.1,
      gainers: 612,
      losers: 438,
      unchanged: 486
    },
    monthly: [
      { month: "Jan", index: 1557.4, valueBn: 2.82, volumeBn: 3.31 },
      { month: "Feb", index: 1571.8, valueBn: 2.91, volumeBn: 3.42 },
      { month: "Mar", index: 1596.3, valueBn: 3.05, volumeBn: 3.62 },
      { month: "Apr", index: 1582.7, valueBn: 2.94, volumeBn: 3.44 },
      { month: "May", index: 1604.9, valueBn: 3.13, volumeBn: 3.71 },
      { month: "Jun", index: 1599.8, valueBn: 3.08, volumeBn: 3.65 },
      { month: "Jul", index: 1638.2, valueBn: 3.42, volumeBn: 4.08 }
    ],
    sectors: [
      { name: "Technology", mtdPct: 6.8, contributionPoints: 9.6, valueBn: 0.54 },
      { name: "Financial Services", mtdPct: 3.1, contributionPoints: 8.2, valueBn: 0.79 },
      { name: "Utilities", mtdPct: 4.4, contributionPoints: 5.1, valueBn: 0.23 },
      { name: "Plantation", mtdPct: 1.7, contributionPoints: 2.4, valueBn: 0.19 },
      { name: "Healthcare", mtdPct: -1.9, contributionPoints: -1.8, valueBn: 0.25 }
    ],
    counters: [
      { name: "Satria Bank", ticker: "SATRIA", contributionPoints: 5.4, pricePct: 4.7 },
      { name: "Maju Utilities", ticker: "MAJU", contributionPoints: 3.9, pricePct: 6.2 },
      { name: "Nusa Digital", ticker: "NUSA", contributionPoints: 3.1, pricePct: 8.8 },
      { name: "Sentral Holdings", ticker: "SNTRL", contributionPoints: 2.2, pricePct: 3.4 }
    ],
    participation: [
      { group: "Local institutions", netFlowMn: 486, sharePct: 39.4 },
      { group: "Foreign investors", netFlowMn: 218, sharePct: 24.8 },
      { group: "Local retail", netFlowMn: -704, sharePct: 35.8 }
    ],
    regional: [
      { market: "Malaysia · FBM KLCI", mtdPct: 2.4, ytdPct: 5.8, currency: "MYR" },
      { market: "Singapore · STI", mtdPct: 1.6, ytdPct: 7.1, currency: "SGD" },
      { market: "Indonesia · JCI", mtdPct: -0.8, ytdPct: 3.5, currency: "IDR" },
      { market: "Thailand · SET", mtdPct: 0.9, ytdPct: -2.2, currency: "THB" },
      { market: "United States · S&P 500", mtdPct: 1.9, ytdPct: 9.6, currency: "USD" }
    ]
  },
  intelligence: {
    generated: "1 Aug 2026 · 07:30 MYT",
    signals: [
      {
        id: "adv-momentum",
        severity: "attention",
        topic: "Market activity",
        title: "Trading activity accelerated into July",
        summary: "30-day ADV rose above the previous 30-day period while trading velocity improved by four percentage points.",
        metric: "RM3.42bn ADV",
        change: "+11.0%",
        sourceId: "gcmc-pulse",
        question: "How did 30-day ADV change?"
      },
      {
        id: "sector-concentration",
        severity: "watch",
        topic: "Index drivers",
        title: "Technology led July’s sector contribution",
        summary: "Technology contributed 9.6 index points, making it the largest positive sector driver in the prepared dataset.",
        metric: "+9.6 pts",
        change: "Top contributor",
        sourceId: "gcmc-pulse",
        question: "Which sectors drove the market?"
      },
      {
        id: "participation-breadth",
        severity: "stable",
        topic: "Investor participation",
        title: "Institutional and foreign buying offset retail selling",
        summary: "Local institutions and foreign investors recorded RM704m of combined net buying, matched by local retail net selling.",
        metric: "RM704m",
        change: "Net buying",
        sourceId: "gcmc-pulse",
        question: "Show investor participation"
      }
    ],
    alerts: [
      { id: "alert-adv", signalId: "adv-momentum", status: "New", time: "07:30 MYT", rule: "ADV change exceeds 8%", owner: "Nadia Karim" },
      { id: "alert-tech", signalId: "sector-concentration", status: "Watching", time: "31 Jul · 18:05", rule: "Single-sector contribution exceeds 8 pts", owner: "Market Intelligence" },
      { id: "alert-source", signalId: "source-freshness", status: "Review", time: "31 Jul · 17:40", rule: "Learning source exceeds freshness target", owner: "Learning & Development" }
    ],
    management: {
      headline: "Momentum improved, participation broadened, and source governance remains visible.",
      narrative: "July closed with the FBM KLCI up 2.4% month to date and 30-day ADV at RM3.42bn. Technology and Financial Services provided most of the positive index contribution. The immediate management focus is to validate whether the activity uplift is sustained and to keep the July market briefing inside the governed review path.",
      priorities: [
        { title: "Validate the activity uplift", owner: "Market Intelligence", due: "Next market cut", status: "In progress" },
        { title: "Complete July briefing verification", owner: "Market Intelligence Lead", due: "Before publication", status: "Pending review" },
        { title: "Refresh ageing learning content", owner: "Learning & Development", due: "5 Aug 2026", status: "Planned" }
      ]
    },
    decisions: [
      { id: "DEC-260731-01", title: "Use July activity uplift in the management market narrative", rationale: "ADV and velocity both improved in the prepared dataset.", owner: "Nadia Karim", workspace: "Market Intelligence", status: "Awaiting verification", created: "31 Jul 2026 · 18:16 MYT", question: "How did the market perform in July?" },
      { id: "DEC-260728-02", title: "Retain plain-language ADV definition for onboarding", rationale: "The approved primer supports the simplified explanation used in Learn Bursa.", owner: "Learning & Development", workspace: "Learn Bursa", status: "Recorded", created: "28 Jul 2026 · 10:05 MYT", question: "Explain ADV in plain language" }
    ]
  },
  documents: [
    {
      id: "gcmc-pulse",
      workspace: "market",
      title: "GCMC Market Pulse — July 2026",
      filename: "GCMC_Market_Pulse.xlsx",
      format: "XLSX",
      owner: "Group Corporate Marketing & Communications",
      updatedBy: "Nadia Karim",
      updated: "31 Jul 2026 · 18:00 MYT",
      health: "Healthy",
      qualityPct: 98,
      freshness: "Current",
      usage: "18 answers this week",
      nextReview: "1 Aug 2026 · 18:00 MYT",
      pages: "4 worksheets",
      status: "Loaded",
      excerpt: "Synthetic monthly index, trading, investor participation and regional benchmark observations for the competition demo."
    },
    {
      id: "market-primer",
      workspace: "learn",
      title: "Bursa Market Primer",
      filename: "Bursa_Market_Primer.pdf",
      format: "PDF",
      owner: "Learning & Development",
      updatedBy: "Farah Lee",
      updated: "28 Jul 2026 · 09:30 MYT",
      health: "Review soon",
      qualityPct: 91,
      freshness: "4 days old",
      usage: "11 answers this week",
      nextReview: "5 Aug 2026",
      pages: "6 pages",
      status: "Loaded",
      excerpt: "A beginner-friendly introduction to the exchange, market capitalisation, ADV, velocity and investor participation."
    },
    {
      id: "product-overview",
      workspace: "learn",
      title: "Bursa Products Overview",
      filename: "Bursa_Products_Overview.pdf",
      format: "PDF",
      owner: "Learning & Development",
      updatedBy: "Farah Lee",
      updated: "10 Sep 2026 · 14:30 MYT",
      health: "Healthy",
      qualityPct: 96,
      freshness: "Current",
      usage: "7 answers this week",
      nextReview: "17 Sep 2026",
      pages: "2 pages",
      status: "Loaded",
      excerpt: "A high-level guide to Bursa securities, derivatives, Islamic-market products, indices, LFX and Bursa Gold Dinar."
    },
    {
      id: "conduct-guide",
      workspace: "learn",
      title: "New Joiner Conduct Guide — Demo",
      filename: "New_Joiner_Conduct_Guide.pdf",
      format: "PDF",
      owner: "Governance & Sustainability",
      updatedBy: "Aisha Wong",
      updated: "20 Jul 2026 · 11:15 MYT",
      health: "Attention",
      qualityPct: 86,
      freshness: "12 days old",
      usage: "4 answers this week",
      nextReview: "2 Aug 2026",
      pages: "5 pages",
      status: "Loaded",
      excerpt: "Practical guidance on confidentiality, responsible data handling and escalation for new joiners."
    },
    {
      id: "regulatory-demo-guide",
      workspace: "reg",
      title: "Market Regulation Guide — Demo",
      filename: "Market_Regulation_Guide_Demo.json",
      format: "JSON",
      owner: "Regulatory Policy & Advisory",
      updatedBy: "Arif Rahman",
      updated: "15 Sep 2026 · 10:00 MYT",
      health: "Restricted",
      qualityPct: 99,
      freshness: "Current",
      usage: "3 governed answers",
      nextReview: "22 Sep 2026",
      pages: "4 demo topics",
      status: "Restricted",
      excerpt: "Synthetic guidance covering continuous disclosure, unusual market activity queries, suspected market misconduct escalation and continuing listing obligations."
    }
  ],
  glossary: [
    { term: "ADV", expansion: "Average Daily Value", explanation: "The average value of securities traded per trading day over a stated period." },
    { term: "Market capitalisation", expansion: "Market capitalisation", explanation: "The market value of listed securities, typically price multiplied by issued shares." },
    { term: "Trading velocity", expansion: "Annualised trading value / market capitalisation", explanation: "A measure of how actively the market changes hands relative to its size." },
    { term: "Index attribution", expansion: "Index contribution", explanation: "An estimate of how much each constituent or sector added to or detracted from an index move." },
    { term: "Net flow", expansion: "Purchases less sales", explanation: "The net amount bought or sold by an investor group over a period." }
  ],
  regulation: {
    topics: [
      {
        id: "continuous-disclosure",
        title: "Continuous disclosure",
        summary: "An issuer should assess whether information is material and follow the approved disclosure process without avoidable delay. Confidentiality must be protected while the assessment is underway.",
        actions: ["Escalate potentially material information to the authorised disclosure owner.", "Document the materiality assessment and decision.", "Use the approved announcement and review process before publication."]
      },
      {
        id: "unusual-market-activity",
        title: "Unusual market activity query",
        summary: "A designated issuer contact should coordinate a prompt fact check, confirm whether undisclosed material information exists and prepare a reviewed response through the approved channel.",
        actions: ["Notify the company secretary or designated disclosure owner.", "Check for undisclosed material developments with accountable business owners.", "Preserve the review record and obtain approval before responding."]
      },
      {
        id: "market-misconduct",
        title: "Suspected market misconduct",
        summary: "Potential manipulation, insider dealing or other suspicious conduct should be escalated through the approved surveillance or compliance channel. Staff should preserve information and avoid conducting an unauthorised investigation.",
        actions: ["Record the observation without altering source material.", "Escalate to Market Surveillance or Compliance.", "Restrict discussion to authorised personnel and follow the case owner's instructions."]
      },
      {
        id: "listing-obligations",
        title: "Continuing listing obligations",
        summary: "Listed issuers have ongoing obligations that may include announcements, periodic reporting, governance and transaction-related requirements. The current official rulebook and accountable regulatory owner remain authoritative.",
        actions: ["Identify the relevant obligation and effective rule version.", "Check current official guidance and any applicable practice note.", "Escalate interpretation questions to Regulatory Policy & Advisory."]
      }
    ],
    disclaimer: "Synthetic competition guidance only. It is not legal advice or an official interpretation of Bursa Malaysia rules."
  },
  verification: [
    {
      id: "VER-260731-01",
      title: "July market performance briefing",
      workspace: "GCMC",
      requestedBy: "Nadia Karim",
      reviewer: "Market Intelligence Lead",
      status: "Pending review",
      created: "31 Jul 2026 · 18:12 MYT",
      scope: "Answer narrative, calculations and source citations"
    }
  ]
};
