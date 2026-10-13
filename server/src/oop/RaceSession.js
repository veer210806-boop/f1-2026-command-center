// ============================================================
// oop/RaceSession.js — OOP: Manages race state as a state machine
// ============================================================

class RaceSession {
  constructor(totalLaps, circuitName) {
    this.totalLaps    = totalLaps;
    this.circuitName  = circuitName;
    this.currentLap   = 0;
    this.flag         = "GREEN";   // GREEN | YELLOW | SC | VSC | RED | CHEQUERED
    this.incidents    = [];
    this.radioLog     = [];
  }

  // Advance the race by one lap
  nextLap() {
    if (this.currentLap < this.totalLaps) {
      this.currentLap++;
      return { lap: this.currentLap, flag: this.flag };
    }
    this.flag = "CHEQUERED";
    return { lap: this.currentLap, flag: "CHEQUERED" };
  }

  // Set the race flag condition
  setFlag(newFlag) {
    const validFlags = ["GREEN", "YELLOW", "SC", "VSC", "RED", "CHEQUERED"];
    if (validFlags.includes(newFlag)) {
      this.flag = newFlag;
      this.incidents.push({
        lap:   this.currentLap,
        flag:  newFlag,
        time:  new Date().toISOString(),
      });
    }
  }

  // Add a radio message to the log
  addRadioMessage(driverCode, message) {
    this.radioLog.push({
      lap:     this.currentLap,
      driver:  driverCode,
      message: message,
    });
  }

  // Check if race is still running
  isRaceActive() {
    return this.flag !== "RED" && this.flag !== "CHEQUERED" && this.currentLap < this.totalLaps;
  }

  // Get the current session state
  getState() {
    return {
      circuit:      this.circuitName,
      current_lap:  this.currentLap,
      total_laps:   this.totalLaps,
      flag:         this.flag,
      is_active:    this.isRaceActive(),
      incidents:    this.incidents,
      radio_log:    this.radioLog,
    };
  }
}

module.exports = RaceSession;
