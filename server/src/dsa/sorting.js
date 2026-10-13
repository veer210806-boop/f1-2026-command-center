// ============================================================
// dsa/sorting.js — DSA: Sorting algorithms for F1 data
// ============================================================

/**
 * Merge Sort: Sort drivers by lap time (ascending).
 * Used for updating the timing tower every lap.
 * Time complexity: O(N log N)
 * @param {Array} arr - Array of driver objects with lap_time field
 * @returns {Array} Sorted array
 */
function mergeSortByLapTime(arr) {
  if (arr.length <= 1) return arr;

  const mid   = Math.floor(arr.length / 2);
  const left  = mergeSortByLapTime(arr.slice(0, mid));
  const right = mergeSortByLapTime(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i].lap_time <= right[j].lap_time) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  while (i < left.length)  result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);
  return result;
}

/**
 * Selection Sort: Sort upgrades by performance-to-cost ratio (descending).
 * Used by the budget knapsack optimizer.
 * Time complexity: O(N²) — acceptable for small upgrade lists (<20 items)
 * @param {Array} upgrades - Array of { name, cost, perf_points }
 * @returns {Array} Sorted array (best value first)
 */
function selectionSortByValueRatio(upgrades) {
  const arr = [...upgrades];
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    let bestIdx = i;
    for (let j = i + 1; j < n; j++) {
      const ratioJ    = arr[j].perf_points    / arr[j].cost;
      const ratioBest = arr[bestIdx].perf_points / arr[bestIdx].cost;
      if (ratioJ > ratioBest) bestIdx = j;
    }
    // Swap
    [arr[i], arr[bestIdx]] = [arr[bestIdx], arr[i]];
  }

  return arr;
}

/**
 * Knapsack (Greedy): Pick best upgrades within remaining budget.
 * @param {Array} upgrades - Array of { name, cost, perf_points }
 * @param {number} budget  - Remaining budget in dollars
 * @returns {object}       - Selected upgrades, total cost, total perf
 */
function budgetKnapsack(upgrades, budget) {
  const sorted    = selectionSortByValueRatio(upgrades);
  const selected  = [];
  let totalCost   = 0;
  let totalPerf   = 0;

  for (const upgrade of sorted) {
    if (totalCost + upgrade.cost <= budget) {
      selected.push(upgrade);
      totalCost += upgrade.cost;
      totalPerf += upgrade.perf_points;
    }
  }

  return {
    selected_upgrades: selected,
    total_cost:        totalCost,
    total_perf_points: totalPerf,
    budget_remaining:  budget - totalCost,
  };
}

/**
 * Min-Heap: Track top 3 fastest lap times efficiently.
 * Simplified using an array with manual heap logic.
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].lap_time > this.heap[idx].lap_time) {
        [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
        idx = parent;
      } else break;
    }
  }

  _sinkDown(idx) {
    const n = this.heap.length;
    while (true) {
      let smallest = idx;
      const left   = 2 * idx + 1;
      const right  = 2 * idx + 2;
      if (left < n  && this.heap[left].lap_time  < this.heap[smallest].lap_time) smallest = left;
      if (right < n && this.heap[right].lap_time < this.heap[smallest].lap_time) smallest = right;
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }

  size() { return this.heap.length; }
  peek() { return this.heap[0] || null; }
}

/**
 * Get top N fastest laps from a full lap array using MinHeap.
 * @param {Array} laps - Array of { lap_number, driver_code, lap_time }
 * @param {number} n   - Number of fastest laps to return
 */
function getTopFastestLaps(laps, n = 3) {
  const heap = new MinHeap();
  for (const lap of laps) heap.push(lap);

  const results = [];
  for (let i = 0; i < n && heap.size() > 0; i++) {
    results.push(heap.pop());
  }
  return results;
}

module.exports = { mergeSortByLapTime, selectionSortByValueRatio, budgetKnapsack, MinHeap, getTopFastestLaps };
