// Rainbow Six Siege seasons follow a predictable pattern:
// 4 seasons per year, each ~3 months
// Y1 started in Dec 2015 (Y1S1 = Black Ice, Feb 2016)
// Season releases roughly: March (S1), June (S2), September (S3), December (S4)
//
// This auto-calculates the current season based on today's date

export function getCurrentSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed

  // R6 Year = calendar year - 2015
  // e.g., 2026 = Y11, but Siege uses different numbering since Y1 started late 2015
  // Y1=2016, Y2=2017, ... Y9=2024, Y10=2025, Y11=2026
  const siegeYear = year - 2015

  // Determine season based on month
  // S1: March-May, S2: June-August, S3: September-November, S4: December-February
  let season
  if (month >= 2 && month <= 4) {
    season = 1
  } else if (month >= 5 && month <= 7) {
    season = 2
  } else if (month >= 8 && month <= 10) {
    season = 3
  } else {
    // Dec (11), Jan (0), Feb (1)
    season = 4
    // Jan/Feb belong to the previous year's S4
    if (month <= 1) {
      return `Y${siegeYear - 1}S4`
    }
  }

  return `Y${siegeYear}S${season}`
}
