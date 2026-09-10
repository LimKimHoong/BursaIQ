window.BURSAIQ_DEMO = {
  meta: {
    asOf: "31 Jul 2026",
    datasetLabel: "Synthetic competition dataset",
    generatedAt: "2026-07-31T18:00:00+08:00",
    disclaimer: "All names, values and records in this prototype are invented for the Stage 02 demonstration."
  },
  identities: {
    gcmc: { initials: "NK", name: "Nadia Karim", role: "GCMC · Analyst", access: ["market", "learn", "reports", "sources"], reviewerFor: [] },
    hr: { initials: "FL", name: "Farah Lee", role: "HR · People Partner & Reviewer", access: ["market", "hr", "learn", "reports", "verification", "sources"], reviewerFor: ["HR Policy Owner"] },
    securities: { initials: "AR", name: "Arif Rahman", role: "Securities Market · Market Reviewer", access: ["market", "learn", "reports", "verification", "sources"], reviewerFor: ["Market Intelligence Lead"] },
    finance: { initials: "MT", name: "Mei Tan", role: "Finance · Business Partner", access: ["market", "learn", "reports", "sources"], reviewerFor: [] }
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
  documents: [
    {
      id: "gcmc-pulse",
      workspace: "market",
      title: "GCMC Market Pulse — July 2026",
      filename: "GCMC_Market_Pulse.xlsx",
      format: "XLSX",
      owner: "Group Corporate Marketing & Communications",
      updated: "31 Jul 2026 · 18:00 MYT",
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
      updated: "28 Jul 2026 · 09:30 MYT",
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
      updated: "10 Sep 2026 · 14:30 MYT",
      pages: "2 pages",
      status: "Loaded",
      excerpt: "A high-level guide to Bursa securities, derivatives, Islamic-market products, indices, LFX and Bursa Gold Dinar."
    },
    {
      id: "hr-procedure",
      workspace: "hr",
      title: "Talent Acquisition Procedure — Demo",
      filename: "Hiring_Procedure_Demo.pdf",
      format: "PDF",
      owner: "Human Resources",
      updated: "24 Jul 2026 · 15:10 MYT",
      pages: "4 pages",
      status: "Restricted",
      excerpt: "Synthetic hiring stages, service-level targets and escalation rules used for the People Services scenario."
    },
    {
      id: "hr-applications",
      workspace: "hr",
      title: "Applicant Tracker — Demo",
      filename: "HR_Applications_Demo.xlsx",
      format: "XLSX",
      owner: "Human Resources",
      updated: "30 Jul 2026 · 17:40 MYT",
      pages: "12 fictional records",
      status: "Restricted",
      excerpt: "Fictional applicant records created solely to demonstrate role-based access and status retrieval."
    },
    {
      id: "conduct-guide",
      workspace: "learn",
      title: "New Joiner Conduct Guide — Demo",
      filename: "New_Joiner_Conduct_Guide.pdf",
      format: "PDF",
      owner: "Governance & Sustainability",
      updated: "20 Jul 2026 · 11:15 MYT",
      pages: "5 pages",
      status: "Loaded",
      excerpt: "Practical guidance on confidentiality, responsible data handling and escalation for new joiners."
    }
  ],
  glossary: [
    { term: "ADV", expansion: "Average Daily Value", explanation: "The average value of securities traded per trading day over a stated period." },
    { term: "Market capitalisation", expansion: "Market capitalisation", explanation: "The market value of listed securities, typically price multiplied by issued shares." },
    { term: "Trading velocity", expansion: "Annualised trading value / market capitalisation", explanation: "A measure of how actively the market changes hands relative to its size." },
    { term: "Index attribution", expansion: "Index contribution", explanation: "An estimate of how much each constituent or sector added to or detracted from an index move." },
    { term: "Net flow", expansion: "Purchases less sales", explanation: "The net amount bought or sold by an investor group over a period." }
  ],
  hr: {
    procedure: [
      { step: 1, name: "Requisition approval", owner: "Hiring manager & Finance", targetDays: 2 },
      { step: 2, name: "Sourcing and screening", owner: "Talent Acquisition", targetDays: 8 },
      { step: 3, name: "Panel assessment", owner: "Hiring panel", targetDays: 5 },
      { step: 4, name: "Pre-employment checks", owner: "Talent Acquisition", targetDays: 4 },
      { step: 5, name: "Offer approval and issue", owner: "HR approver", targetDays: 3 }
    ],
    applications: [
      { applicant: "Alya Rahman", ref: "DEM-26031", position: "Market Insights Analyst", stage: "Panel assessment", nextAction: "Second interview · 5 Aug 2026", owner: "N. Hassan" },
      { applicant: "Daniel Lim", ref: "DEM-26032", position: "Market Insights Analyst", stage: "Sourcing and screening", nextAction: "Hiring manager review · 2 Aug 2026", owner: "N. Hassan" },
      { applicant: "Siti Hajar", ref: "DEM-26018", position: "People Analytics Executive", stage: "Pre-employment checks", nextAction: "Reference check in progress", owner: "F. Lee" },
      { applicant: "Kavin Raj", ref: "DEM-26011", position: "Cybersecurity Specialist", stage: "Offer approval and issue", nextAction: "Approval due · 1 Aug 2026", owner: "M. Wong" }
    ]
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
