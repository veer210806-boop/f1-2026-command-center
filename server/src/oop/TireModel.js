// ============================================================
// oop/TireModel.js — OOP: Encapsulates tire compound behavior
// ============================================================

class TireModel {
  constructor(compound) {
    const TIRE_DATA = {
      SOFT:         { base_life: 20, deg_rate: 0.18, code: "S", color: "#ff4444" },
      MEDIUM:       { base_life: 30, deg_rate: 0.10, code: "M", color: "#ffdd00" },
      HARD:         { base_life: 45, deg_rate: 0.05, code: "H", color: "#ffffff" },
      INTERMEDIATE: { base_life: 35, deg_rate: 0.08, code: "I", color: "#00cc44" },
      WET:          { base_life: 40, deg_rate: 0.06, code: "W", color: "#0088ff" },
    };

    this.compound = compound.toUpperCase();
    const data = TIRE_DATA[this.compound] || TIRE_DATA["MEDIUM"];
    this.baseLife   = data.base_life;
    this.degRate    = data.deg_rate;
    this.code       = data.code;
    this.color      = data.color;
  }

  // Calculate lap time at a given tire age
  getLapTime(baseLapTime, tireAge) {
    const timeLoss = tireAge * this.degRate;
    return parseFloat((baseLapTime + timeLoss).toFixed(3));
  }

  // Calculate wear percentage
  getWearPercent(tireAge) {
    const wear = (tireAge / this.baseLife) * 100;
    return Math.min(parseFloat(wear.toFixed(1)), 100.0);
  }

  // Is the tire past the cliff (>90% wear)?
  isCliff(tireAge) {
    return this.getWearPercent(tireAge) >= 90;
  }

  // Simulate a full stint
  simulateStint(baseLapTime, stintLength) {
    const laps = [];
    for (let lap = 1; lap <= stintLength; lap++) {
      laps.push({
        lap_in_stint:  lap,
        compound:      this.compound,
        lap_time:      this.getLapTime(baseLapTime, lap),
        wear_percent:  this.getWearPercent(lap),
        is_cliff:      this.isCliff(lap),
      });
    }
    return laps;
  }

  // Get compound summary info
  getInfo() {
    return {
      compound: this.compound,
      code:     this.code,
      color:    this.color,
      base_life: this.baseLife,
      deg_rate:  this.degRate,
    };
  }
}

module.exports = TireModel;
