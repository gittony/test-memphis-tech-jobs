// Config table for employers scraped via lib/ultipro.js.
export const ULTIPRO_EMPLOYERS = [
  {
    key: "firsthorizon",
    company: "First Horizon",
    host: "recruiting.ultipro.com",
    companyCode: "FIR1007FTN",
    boardId: "c005ef3e-175a-49c4-ba29-9f431f673944",
  },
  {
    key: "microport",
    company: "MicroPort Orthopedics",
    host: "recruiting.ultipro.com",
    companyCode: "MIC1008MICPT",
    boardId: "9f087488-7494-c18e-5713-c97b9f3d8219",
  },
  {
    // Phase 0 triaged this as iCIMS (`jobs-orgill.icims.com`) — that domain
    // now 404s. Orgill has since moved to UKG Pro's newer "Recruiting"
    // product, hosted on a different subdomain style (rec.pro.ukg.net
    // instead of recruiting.ultipro.com) but the exact same
    // LoadSearchResults JSON API underneath, confirmed live.
    key: "orgill",
    company: "Orgill",
    host: "hrdwr.rec.pro.ukg.net",
    companyCode: "ORG1002ORLL",
    boardId: "7541eed6-5ed4-4547-8679-d2c397736dce",
  },
];
