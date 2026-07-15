const VALID_DURATIONS = [30, 45, 60];
const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

module.exports = {
  VALID_DURATIONS,
  VALID_DAYS,
  TIME_RE,
};
