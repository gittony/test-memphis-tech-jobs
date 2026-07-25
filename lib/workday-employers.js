// Config table of every employer running on Workday, confirmed by visiting
// each one's live careers site (Phase 9). `key` is a short stable slug used
// in data/scraper-health.json and as the CLI arg to run one employer alone;
// `company` is the display name stored on every normalized job record.

export const WORKDAY_EMPLOYERS = [
  {
    key: "medtronic",
    company: "Medtronic",
    host: "medtronic.wd1.myworkdayjobs.com",
    tenant: "medtronic",
    site: "MedtronicCareers",
  },
  {
    key: "stjude",
    company: "St. Jude Children's Research Hospital",
    host: "stjude.wd1.myworkdayjobs.com",
    tenant: "stjude",
    site: "stjude",
  },
  {
    key: "alsac",
    company: "ALSAC",
    host: "alsacstjude.wd1.myworkdayjobs.com",
    tenant: "alsacstjude",
    site: "careersalsacstjude",
  },
  {
    key: "sedgwick",
    company: "Sedgwick",
    host: "sedgwick.wd1.myworkdayjobs.com",
    tenant: "sedgwick",
    site: "Sedgwick",
  },
  {
    key: "stryker",
    company: "Stryker",
    host: "stryker.wd1.myworkdayjobs.com",
    tenant: "stryker",
    site: "StrykerCareers",
  },
  {
    key: "evernorth",
    company: "Evernorth (Cigna)",
    host: "cigna.wd5.myworkdayjobs.com",
    tenant: "cigna",
    site: "cignacareers",
  },
  {
    key: "maa",
    company: "Mid-America Apartment Communities",
    host: "maa.wd1.myworkdayjobs.com",
    tenant: "maa",
    site: "MAA",
  },
  {
    key: "terminix",
    company: "Rentokil Terminix",
    host: "terminix.wd1.myworkdayjobs.com",
    tenant: "terminix",
    site: "RentokilNorthAmerica",
  },
  {
    key: "raymondjames",
    company: "Raymond James",
    host: "raymondjames.wd1.myworkdayjobs.com",
    tenant: "raymondjames",
    site: "RaymondJamesCareers",
  },
  {
    key: "methodist",
    company: "Methodist Le Bonheur Healthcare",
    host: "methodisthealth.wd5.myworkdayjobs.com",
    tenant: "methodisthealth",
    site: "MLH",
  },
  {
    key: "smithnephew",
    company: "Smith & Nephew",
    host: "smithnephew.wd5.myworkdayjobs.com",
    tenant: "smithnephew",
    site: "External",
  },
];
