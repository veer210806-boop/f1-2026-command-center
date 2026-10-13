// ============================================================
// oop/CarUpgrade.js — OOP: Handles car upgrade logic & budget
// ============================================================

class CarUpgrade {
  constructor(name, cost, perfPoints) {
    this.name       = name;
    this.cost       = cost;       // in dollars
    this.perfPoints = perfPoints; // abstract performance gain
    this.purchased  = false;
  }

  // Attempt to purchase this upgrade within the budget
  purchase(remainingBudget) {
    if (this.purchased) {
      return { success: false, message: `${this.name} is already purchased.` };
    }
    if (remainingBudget < this.cost) {
      return {
        success: false,
        message: `Insufficient budget. Need $${this.cost.toLocaleString()}, have $${remainingBudget.toLocaleString()}.`,
      };
    }
    this.purchased = true;
    return {
      success:         true,
      message:         `${this.name} purchased successfully!`,
      cost:            this.cost,
      perf_points:     this.perfPoints,
      new_balance:     remainingBudget - this.cost,
    };
  }

  // Get upgrade summary
  getInfo() {
    return {
      name:        this.name,
      cost:        this.cost,
      perf_points: this.perfPoints,
      purchased:   this.purchased,
      value_ratio: parseFloat((this.perfPoints / (this.cost / 1000000)).toFixed(2)), // points per $M
    };
  }
}

module.exports = CarUpgrade;
