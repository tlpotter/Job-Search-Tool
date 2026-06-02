const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const US_INDICATORS = [
  "united states", "usa", "u.s.a", "u.s.", "america",
  ...US_STATES.map((s) => `, ${s.toLowerCase()}`),
  ...US_STATES.map((s) => ` ${s.toLowerCase()} `),
];

const FOREIGN_INDICATORS = [
  "canada", "uk", "united kingdom", "england", "london", "germany", "berlin",
  "france", "paris", "spain", "madrid", "barcelona", "australia", "sydney",
  "melbourne", "india", "bangalore", "amsterdam", "netherlands", "sweden",
  "stockholm", "ireland", "dublin", "portugal", "lisbon", "brazil", "mexico",
  "singapore", "japan", "tokyo", "poland", "warsaw", "romania", "ukraine",
  "israel", "tel aviv", "argentina", "colombia", "chile", "latam", "emea", "apac",
  "south africa", "kenya", "nigeria", "philippines", "manila", "vietnam",
  "thailand", "bangkok", "indonesia", "jakarta", "hong kong", "taiwan",
  "korea", "seoul", "denmark", "copenhagen", "norway", "oslo", "finland",
  "helsinki", "switzerland", "zurich", "italy", "rome", "milan", "austria",
  "vienna", "belgium", "brussels", "czechia", "prague", "hungary", "budapest",
];

/**
 * True if the listing is US-based or remote.
 * - Remote: always pass.
 * - Empty location: pass (better to include than miss).
 * - Foreign indicator: reject.
 * - US indicator: pass.
 * - Ambiguous: pass.
 */
export function isUSOrRemote(location: string, isRemote: boolean): boolean {
  if (isRemote) return true;
  if (!location || location.trim() === "") return true;

  const loc = ` ${location.toLowerCase()} `;

  if (FOREIGN_INDICATORS.some((f) => loc.includes(f))) return false;
  if (US_INDICATORS.some((u) => loc.includes(u))) return true;

  return true;
}
