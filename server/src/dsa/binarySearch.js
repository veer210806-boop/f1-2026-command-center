// ============================================================
// dsa/binarySearch.js — DSA: Binary search on sorted arrays
// ============================================================

/**
 * Binary Search: Find a telemetry value at a given track distance.
 * The telemetry array must be sorted by distance_m (ascending).
 * Time complexity: O(log N)
 * @param {Array} telemetryArray - Sorted array of { distance_m, speed, ... }
 * @param {number} targetDistance - Track distance in meters to search for
 * @returns {object|null} Closest matching telemetry point
 */
function binarySearchTelemetry(telemetryArray, targetDistance) {
  let left  = 0;
  let right = telemetryArray.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midDist = telemetryArray[mid].distance_m;

    if (midDist === targetDistance) {
      return telemetryArray[mid]; // Exact match found
    } else if (midDist < targetDistance) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // No exact match — return the closest point
  if (right < 0) return telemetryArray[0];
  if (left >= telemetryArray.length) return telemetryArray[telemetryArray.length - 1];

  const distLeft  = Math.abs(telemetryArray[left].distance_m  - targetDistance);
  const distRight = Math.abs(telemetryArray[right].distance_m - targetDistance);
  return distLeft <= distRight ? telemetryArray[left] : telemetryArray[right];
}

/**
 * Binary Search: Find a lap entry by lap number in a sorted lap array.
 * @param {Array} laps - Sorted array of { lap_number, ... }
 * @param {number} targetLap - Lap number to find
 * @returns {object|null}
 */
function binarySearchLap(laps, targetLap) {
  let left  = 0;
  let right = laps.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (laps[mid].lap_number === targetLap) return laps[mid];
    else if (laps[mid].lap_number < targetLap) left = mid + 1;
    else right = mid - 1;
  }

  return null; // Not found
}

module.exports = { binarySearchTelemetry, binarySearchLap };
