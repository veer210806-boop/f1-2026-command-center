// ============================================================
// oop/StrategyAdvisor.js — OOP: Evaluates pit stop strategy
// ============================================================
const TireModel = require("./TireModel");

class StrategyAdvisor {
  constructor(circuitPitLossGreen = 22.0, circuitPitLossSC = 12.0) {
    this.pitLossGreen = circuitPitLossGreen;
    this.pitLossSC    = circuitPitLossSC;
    this.pitLossVSC   = (circuitPitLossGreen + circuitPitLossSC) / 2;
  }

  // Returns pit stop time loss based on flag condition
  getPitLoss(condition) {
    if (condition === "SC")  return this.pitLossSC;
    if (condition === "VSC") return this.pitLossVSC;
    return this.pitLossGreen;
  }

  // Evaluate undercut / overcut feasibility
  evaluateUndercut(params) {
    const {
      gapToCarAhead,
      driverTireAge,
      rivalTireAge,
      driverCompound,
      rivalCompound,
      pitCondition = "GREEN",
    } = params;

    const pitLoss       = this.getPitLoss(pitCondition);
    const driverTire    = new TireModel(driverCompound);
    const rivalTire     = new TireModel(rivalCompound);
    const rivalRemLife  = rivalTire.baseLife - rivalTireAge;
    const paceAdvPerLap = (rivalTireAge * rivalTire.degRate) - (1 * driverTire.degRate);
    const lapsToRecover = paceAdvPerLap > 0
      ? parseFloat((pitLoss / paceAdvPerLap).toFixed(1))
      : 999;

    let recommendation, reason;

    if (pitCondition === "SC" || pitCondition === "VSC") {
      recommendation = "BOX NOW";
      reason = `Cheap pit stop under ${pitCondition}! Only lose ${pitLoss}s.`;
    } else if (gapToCarAhead <= 1.0) {
      recommendation = "BOX NOW";
      reason = `Gap is ${gapToCarAhead}s. Undercut feasible — recover pit loss in ~${lapsToRecover} laps.`;
    } else if (gapToCarAhead <= 3.0 && rivalRemLife <= 5) {
      recommendation = "BOX NOW";
      reason = `Rival tires nearly done (${rivalRemLife} laps left). Undercut to gain track position.`;
    } else if (gapToCarAhead > 3.0 && rivalRemLife > 8) {
      recommendation = "STAY OUT";
      reason = `Gap too large (${gapToCarAhead}s). Rival has ${rivalRemLife} laps left. Consider overcut.`;
    } else {
      recommendation = "MONITOR";
      reason = "Unclear situation. Watch tire temps and rival strategy.";
    }

    return {
      recommendation,
      reason,
      pit_loss_seconds:  pitLoss,
      pace_adv_per_lap:  parseFloat(paceAdvPerLap.toFixed(3)),
      laps_to_recover:   lapsToRecover,
    };
  }

  // Compare two 1-stop vs 2-stop strategies and return total race times
  compareStrategies(basePace, strategy1, strategy2, totalLaps) {
    const calcTotal = (strategy) => {
      let total = 0;
      const stops = strategy.length - 1;
      total += stops * this.pitLossGreen;
      for (const stint of strategy) {
        const tire = new TireModel(stint.compound);
        for (let lap = 1; lap <= stint.laps; lap++) {
          total += tire.getLapTime(basePace, lap);
        }
      }
      return parseFloat(total.toFixed(3));
    };

    const time1 = calcTotal(strategy1);
    const time2 = calcTotal(strategy2);

    return {
      strategy1_time: time1,
      strategy2_time: time2,
      delta:          parseFloat((time2 - time1).toFixed(3)),
      recommended:    time1 <= time2 ? "Strategy 1" : "Strategy 2",
    };
  }
}

module.exports = StrategyAdvisor;
