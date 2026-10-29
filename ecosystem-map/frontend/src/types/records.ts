// The app's five record types, as pages see them: one Notion row flattened by
// normalizePage() (each property label camelCased into a key — see
// lib/normalize.ts), then cross-linked by dataStore's resolveRelations().
//
// Field names and Notion types were taken from the live /api/notion output,
// i.e. after backend/api/notion.js's PUBLIC_FIELDS allow-list. A field added
// there needs adding here too. Value types follow from the Notion property
// type:
//   title → string · rich_text → string | null (null when empty-ish or a
//   mock/placeholder marker) · number → number | null · select →
//   string | null · multi_select → string[] · checkbox → boolean · url →
//   string | null · date → DateValue | null · relation → the related
//   records, once resolved.

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface DateValue {
  start: string;
  end: string | null;
}

interface BaseRecord {
  id: string;
  /** The row's title property, whatever it's called in Notion. */
  name: string;
  lastEditedTime: string;
}

export interface Country extends BaseRecord {
  region: string | null;
  tier: string | null;
  platformPriority: string | null;
  publish: boolean;
  capitalCity: string | null;
  analysisPage: string | null;
  lastUpdated: DateValue | null;
  marketMaturity: string | null;
  marketNarrative: string | null;
  contextNotes: string | null;
  keyUseCases: string | null;

  numberOfActiveCompanies: number | null;
  populationM: number | null;
  urbanisationRate: number | null;
  medianAge: number | null;
  mobileMoneyPenetration: number | null;
  vehiclesPer1000: number | null;

  eVPenetration: number | null;
  eVFleetSizeEst: number | null;
  dominantVehicleCategory: string | null;
  eVPolicyStatus: string | null;
  policyTrend: string | null;
  eVIncentives: string | null;
  eVTargets: string | null;
  importDutyStatus: string | null;

  chargingPoints: number | null;
  chargingStandards: string | null;
  swapStations: number | null;
  knownSwapStationCount: number | null;
  interoperabilityStandards: number | null;
  gridReliability: string | null;

  petrolPrice: number | null;
  fuelPriceUSDL: number | null;
  electricityPrice: number | null;
  energyPriceUSDKWh: number | null;

  activeOEMs: string | null;
  activeAccelerators: string | null;
  eMobilityAssociations: string | null;

  // Resolved by dataStore
  companies: Company[];
  economics: Economics | null;
}

export interface Company extends BaseRecord {
  publish: boolean;
  website: string | null;
  businessSummary: string | null;
  founded: number | null;
  status: string | null;
  stage: string | null;
  vertical: string[];
  subVerticalTags: string[];
  eVAssetTags: string[];
  fundingTag: string[];
  currentlyFundraising: boolean;
  totalFundingRaisedM: number | null;
  rankingOrder: number | null;

  averageScore: number | null;
  avgBusinessStrength: number | null;
  avgInnovation: number | null;
  avgImpactSustainability: number | null;

  networkType: string | null;
  stationType: string[];
  estimatedStationCount: number | null;

  /** Raw "Location" relation; `country` is its first entry. */
  location: Country[];

  // Resolved by dataStore
  country: Country | null;
  /** Allocators active in this company's market (see dataStore). */
  marketAllocators: Allocator[];
}

export interface Allocator extends BaseRecord {
  organisationName: string;
  publish: boolean;
  website: string | null;
  organisationSummary: string | null;
  typeOfInvestor: string | null;
  geo: string[];
  focusAreas: string[];
  investmentInstrument: string[];
  mobilitySubVertical: string[];
  typicalInvestmentSizeUSD: number | null;
  aMINMember: boolean;
  joinAfricanMobilityInvestmentSyndication: boolean;
  africanMarketsActive: Country[];

  // Resolved by dataStore
  markets: Country[];
  deals: Deal[];
  /** Companies this allocator has a tracked deal with. */
  portfolio: Company[];
  /** Companies in any market this allocator is active in. */
  marketCompanies: Company[];
  /** portfolio ∪ marketCompanies, de-duplicated. */
  connectedCompanies: Company[];
}

export interface Deal extends BaseRecord {
  dealName: string;
  dealType: string | null;
  /** Stored in millions (618 = $618m) — format with formatUSDM, never divide. */
  amountM: number | null;
  date: DateValue | null;
  companyName: Company[];
  investorMobilityXCapitalStack: Allocator[];

  // Resolved by dataStore
  company: Company | null;
  allocators: Allocator[];
}

/** One market's EV vs. ICE two-wheeler cost model. All money in USD unless the name says KES. */
export interface Economics extends BaseRecord {
  source: string | null;
  countryLink: Country[];
  /**
   * Notion's title column is also called "Country" (a plain string, which
   * `name` keeps); dataStore replaces this key with the linked record.
   */
  country: Country | null;

  fuelPriceUSDL: number | null;
  fuelPriceKESL: number | null;
  electricityPriceUSDKWh: number | null;
  electricityPriceKESKWh: number | null;
  iCEBikePriceUSD: number | null;
  eVBikePurchasePriceExclBatteryUSD: number | null;
  fullTankRangeKm: number | null;
  litresPer100km: number | null;
  kWhPer100km: number | null;
  fuelCostPerKmICEUSD: number | null;
  costPerKmEVUSD: number | null;

  dailyFuelCostICEUSD: number | null;
  monthlyFuelCostICEUSD: number | null;
  annualFuelCostICEUSD: number | null;
  dailyElectricityCostUSD: number | null;
  monthlyElectricityCostUSD: number | null;
  annualElectricityCostUSD: number | null;

  annualInsuranceICEUSD: number | null;
  annualMaintenanceICEUSD: number | null;
  annualInsuranceEVUSD: number | null;
  monthlyInsuranceEVUSD: number | null;
  monthlyMaintenanceEVUSD: number | null;
  annualMaintenanceEVUSD: number | null;

  costPerSwapUSD: number | null;
  monthlyBatterySwapCostUSD: number | null;
  yearlyBatterySwapCostEVUSD: number | null;

  totalMonthlyOpexEVUSD: number | null;
  totalYearlyOpexEVUSD: number | null;
  totalYearlyOpexICEUSD: number | null;

  depositUSD: number | null;
  loanPrincipalUSD: number | null;
  refinancingPeriodMonths: number | null;
  monthlyInterestRate: number | null;
  impliedAnnualInterestRate: number | null;
  effectiveAnnualRate: number | null;
  dailyLoanRefinancingCostUSD: number | null;
  monthlyLoanRefinancingCostUSD: number | null;
  totalEVLoanFinancingCostUSD: number | null;
  financingPremiumUSD: number | null;
  totalEVBikePurchasePriceFinancedUSD: number | null;
  totalOpexOverFinancingPeriodUSD: number | null;
  totalTCOOverFinancingPeriodUSD: number | null;

  year1TCOICEUSD: number | null;
  year2TCOICEUSD: number | null;
  year3TCOICEUSD: number | null;
  annualSavingsEVVsICEUSD: number | null;
}

export interface Records {
  countries: Country[];
  companies: Company[];
  allocators: Allocator[];
  deals: Deal[];
  economics: Economics[];
}

export type EntityType = keyof Records;
