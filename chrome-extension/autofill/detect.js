// Works out which application platform the current page belongs to, so the run
// can pick a hand-written adapter over the generic pass.
//
// Platform order here follows what a Singapore applicant actually meets: the
// public service, the banks and the GLCs run Workday and SAP SuccessFactors,
// with Greenhouse/Lever/Ashby showing up mainly at foreign tech offices.

(() => {
  const ns = (globalThis.__jackerAutofill ??= {});
  if (ns.detect) return;

  const HOST_RULES = [
    { platform: "workday", test: /\.myworkdayjobs\.com$|\.workday\.com$/i },
    { platform: "successfactors", test: /successfactors\.(com|eu)$|rmkcdn\.successfactors\.com$/i },
    { platform: "mycareersfuture", test: /mycareersfuture\.gov\.sg$/i },
    { platform: "greenhouse", test: /(^|\.)greenhouse\.io$/i },
    { platform: "lever", test: /(^|\.)lever\.co$/i },
    { platform: "ashby", test: /ashbyhq\.com$/i },
    { platform: "smartrecruiters", test: /smartrecruiters\.com$/i },
    { platform: "workable", test: /workable\.com$/i },
    { platform: "recruitee", test: /recruitee\.com$/i },
    { platform: "teamtailor", test: /teamtailor\.com$/i },
    { platform: "taleo", test: /taleo\.net$/i },
    { platform: "icims", test: /icims\.com$/i },
    { platform: "linkedin", test: /(^|\.)linkedin\.com$/i },
  ];

  // Careers pages often embed the real form, so the host alone can be the
  // employer's own domain while the markup is the ATS's.
  const DOM_RULES = [
    {
      platform: "workday",
      test: () => document.querySelectorAll("[data-automation-id]").length > 5,
    },
    {
      platform: "successfactors",
      test: () =>
        Boolean(document.querySelector('[src*="rmkcdn.successfactors.com"], [href*="successfactors"]')),
    },
    {
      platform: "greenhouse",
      test: () => Boolean(document.querySelector("#grnhse_app, #grnhse_iframe, [action*='greenhouse']")),
    },
  ];

  function detectPlatform() {
    const host = location.hostname;

    for (const rule of HOST_RULES) {
      if (rule.test.test(host)) return { platform: rule.platform, via: "host" };
    }

    for (const rule of DOM_RULES) {
      try {
        if (rule.test()) return { platform: rule.platform, via: "dom" };
      } catch {
        // A fingerprint that throws on an unusual document is just a miss.
      }
    }

    return { platform: "generic", via: "fallback" };
  }

  // A page can be a job posting rather than the application itself; filling
  // only makes sense once there are controls to fill.
  function looksLikeApplicationForm() {
    const controls = ns.matcher.collectControls();
    return controls.length >= 3;
  }

  ns.detect = { detectPlatform, looksLikeApplicationForm };
})();
