// src/data/statistics.ts

export interface DailyTelemetryMetric {
  date: string;
  dayLabel: string;
  pageVisits: number;
  downloads: number;
  developerClicks: number;
  extlabsClicks: number;
  totalClicks: number;
}

export interface DetailedCountryMetric {
  countryCode: string;
  countryName: string;
  flag: string;
  tier: string;
  downloads: number;
  downloadsPercentage: number;
  pageVisits: number;
  pageVisitsPercentage: number;
  developerClicks: number;
  developerPercentage: number;
  extlabsClicks: number;
  extlabsPercentage: number;
  avgEcpm: string;
}

export interface CategorySupplyDemandMetric {
  category: string;
  categorySlug: string;
  publishedCount: number;
  publishedPercentage: number;
  pageVisits: number;
  pageVisitsFormatted: string;
  pageVisitsPercentage: number;
  downloads: number;
  downloadsFormatted: string;
  downloadsPercentage: number;
  isMostPopular: boolean;
}

// 14-Day Daily Telemetry Timeline
export const DAILY_TELEMETRY_DATA: DailyTelemetryMetric[] = [
  { date: "2026-08-20", dayLabel: "Aug 20", pageVisits: 44200, downloads: 8900, developerClicks: 24500, extlabsClicks: 4900, totalClicks: 29400 },
  { date: "2026-08-21", dayLabel: "Aug 21", pageVisits: 47100, downloads: 9350, developerClicks: 26100, extlabsClicks: 5220, totalClicks: 31320 },
  { date: "2026-08-22", dayLabel: "Aug 22", pageVisits: 51800, downloads: 10400, developerClicks: 28400, extlabsClicks: 5680, totalClicks: 34080 },
  { date: "2026-08-23", dayLabel: "Aug 23", pageVisits: 54300, downloads: 10950, developerClicks: 29800, extlabsClicks: 5960, totalClicks: 35760 },
  { date: "2026-08-24", dayLabel: "Aug 24", pageVisits: 56900, downloads: 11400, developerClicks: 31200, extlabsClicks: 6240, totalClicks: 37440 },
  { date: "2026-08-25", dayLabel: "Aug 25", pageVisits: 49800, downloads: 9800, developerClicks: 27900, extlabsClicks: 5580, totalClicks: 33480 },
  { date: "2026-08-26", dayLabel: "Aug 26", pageVisits: 52400, downloads: 10300, developerClicks: 29100, extlabsClicks: 5820, totalClicks: 34920 },
  { date: "2026-08-27", dayLabel: "Aug 27", pageVisits: 58100, downloads: 11800, developerClicks: 32400, extlabsClicks: 6480, totalClicks: 38880 },
  { date: "2026-08-28", dayLabel: "Aug 28", pageVisits: 55600, downloads: 11100, developerClicks: 30800, extlabsClicks: 6160, totalClicks: 36960 },
  { date: "2026-08-29", dayLabel: "Aug 29", pageVisits: 60200, downloads: 12200, developerClicks: 33600, extlabsClicks: 6720, totalClicks: 40320 },
  { date: "2026-08-30", dayLabel: "Aug 30", pageVisits: 63400, downloads: 12850, developerClicks: 35200, extlabsClicks: 7040, totalClicks: 42240 },
  { date: "2026-08-31", dayLabel: "Aug 31", pageVisits: 61500, downloads: 12400, developerClicks: 34100, extlabsClicks: 6820, totalClicks: 40920 },
  { date: "2026-09-01", dayLabel: "Sep 01", pageVisits: 66800, downloads: 13500, developerClicks: 36900, extlabsClicks: 7380, totalClicks: 44280 },
  { date: "2026-09-02", dayLabel: "Sep 02", pageVisits: 69900, downloads: 14200, developerClicks: 38700, extlabsClicks: 7740, totalClicks: 46440 }
];

// Country Geographic Breakdown across all 4 requested dimensions:
// 1. Downloads by Country
// 2. Developer Ad Clicks by Country
// 3. ExtLabs Ad Clicks by Country
// 4. Page Visits by Country
export const DETAILED_COUNTRY_METRICS: DetailedCountryMetric[] = [
  {
    countryCode: "US",
    countryName: "United States",
    flag: "🇺🇸",
    tier: "Tier 1",
    downloads: 54200,
    downloadsPercentage: 38.0,
    pageVisits: 298400,
    pageVisitsPercentage: 37.6,
    developerClicks: 154800,
    developerPercentage: 37.5,
    extlabsClicks: 34680,
    extlabsPercentage: 42.0,
    avgEcpm: "$4.85"
  },
  {
    countryCode: "DE",
    countryName: "Germany",
    flag: "🇩🇪",
    tier: "Tier 1",
    downloads: 24300,
    downloadsPercentage: 17.0,
    pageVisits: 138100,
    pageVisitsPercentage: 17.4,
    developerClicks: 72200,
    developerPercentage: 17.5,
    extlabsClicks: 13210,
    extlabsPercentage: 16.0,
    avgEcpm: "$3.92"
  },
  {
    countryCode: "GB",
    countryName: "United Kingdom",
    flag: "🇬🇧",
    tier: "Tier 1",
    downloads: 20000,
    downloadsPercentage: 14.0,
    pageVisits: 111800,
    pageVisitsPercentage: 14.1,
    developerClicks: 57800,
    developerPercentage: 14.0,
    extlabsClicks: 12380,
    extlabsPercentage: 15.0,
    avgEcpm: "$3.70"
  },
  {
    countryCode: "IN",
    countryName: "India",
    flag: "🇮🇳",
    tier: "Tier 3",
    downloads: 18500,
    downloadsPercentage: 13.0,
    pageVisits: 104700,
    pageVisitsPercentage: 13.2,
    developerClicks: 49500,
    developerPercentage: 12.0,
    extlabsClicks: 9080,
    extlabsPercentage: 11.0,
    avgEcpm: "$1.15"
  },
  {
    countryCode: "FR",
    countryName: "France",
    flag: "🇫🇷",
    tier: "Tier 2",
    downloads: 11400,
    downloadsPercentage: 8.0,
    pageVisits: 63500,
    pageVisitsPercentage: 8.0,
    developerClicks: 33000,
    developerPercentage: 8.0,
    extlabsClicks: 5780,
    extlabsPercentage: 7.0,
    avgEcpm: "$2.90"
  },
  {
    countryCode: "JP",
    countryName: "Japan",
    flag: "🇯🇵",
    tier: "Tier 1",
    downloads: 8500,
    downloadsPercentage: 6.0,
    pageVisits: 47600,
    pageVisitsPercentage: 6.0,
    developerClicks: 24750,
    developerPercentage: 6.0,
    extlabsClicks: 4950,
    extlabsPercentage: 6.0,
    avgEcpm: "$4.10"
  },
  {
    countryCode: "OTHER",
    countryName: "Rest of World",
    flag: "🌐",
    tier: "Global",
    downloads: 5900,
    downloadsPercentage: 4.0,
    pageVisits: 29900,
    pageVisitsPercentage: 3.7,
    developerClicks: 20800,
    developerPercentage: 5.0,
    extlabsClicks: 2490,
    extlabsPercentage: 3.0,
    avgEcpm: "$1.85"
  }
];

// Categories: Published Count (Supply) vs User Traffic / Page Visits (Demand)
export const CATEGORY_SUPPLY_DEMAND: CategorySupplyDemandMetric[] = [
  {
    category: "Developer Tools",
    categorySlug: "dev",
    publishedCount: 5,
    publishedPercentage: 33.3,
    pageVisits: 308400,
    pageVisitsFormatted: "308.4K",
    pageVisitsPercentage: 38.8,
    downloads: 54200,
    downloadsFormatted: "54.2K",
    downloadsPercentage: 38.0,
    isMostPopular: true // User's requested: "යූසර්ලා වැඩිපුරම එන කැටගරි එක"
  },
  {
    category: "AI & Machine Learning",
    categorySlug: "ai",
    publishedCount: 3,
    publishedPercentage: 20.0,
    pageVisits: 204900,
    pageVisitsFormatted: "204.9K",
    pageVisitsPercentage: 25.8,
    downloads: 34300,
    downloadsFormatted: "34.3K",
    downloadsPercentage: 24.0,
    isMostPopular: false
  },
  {
    category: "Privacy & Security",
    categorySlug: "privacy",
    publishedCount: 3,
    publishedPercentage: 20.0,
    pageVisits: 139800,
    pageVisitsFormatted: "139.8K",
    pageVisitsPercentage: 17.6,
    downloads: 25700,
    downloadsFormatted: "25.7K",
    downloadsPercentage: 18.0,
    isMostPopular: false
  },
  {
    category: "Productivity",
    categorySlug: "productivity",
    publishedCount: 2,
    publishedPercentage: 13.3,
    pageVisits: 89700,
    pageVisitsFormatted: "89.7K",
    pageVisitsPercentage: 11.3,
    downloads: 17100,
    downloadsFormatted: "17.1K",
    downloadsPercentage: 12.0,
    isMostPopular: false
  },
  {
    category: "Workflow & Utilities",
    categorySlug: "utilities",
    publishedCount: 2,
    publishedPercentage: 13.4,
    pageVisits: 51200,
    pageVisitsFormatted: "51.2K",
    pageVisitsPercentage: 6.5,
    downloads: 11500,
    downloadsFormatted: "11.5K",
    downloadsPercentage: 8.0,
    isMostPopular: false
  }
];

// Totals across 14-day sample
export const TOTAL_PAGE_VISITS = 794000;
export const TOTAL_DOWNLOADS = 142800;
export const TOTAL_DEVELOPER_CLICKS = 412850;
export const TOTAL_EXTLABS_CLICKS = 82570;
export const TOTAL_ALL_CLICKS = TOTAL_DEVELOPER_CLICKS + TOTAL_EXTLABS_CLICKS;
export const DEVELOPER_SHARE = 83.3; // 5 out of 6 (5:1 ratio)
export const EXTLABS_SHARE = 16.7;   // 1 out of 6 (5:1 ratio)
export const MOST_POPULAR_CATEGORY = "Developer Tools";
