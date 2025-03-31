const identifier = ["angular", "changeDefaultOrder"];
// const $ = window.jQuery;
// const utils = require("../utils");
// const storage = require("../../shared/storage");

module.exports = {
  identifier: identifier.join("."),
  shouldActivate: () => false,
  shouldNotDestroy: () => false,
  initialize: () => {},
  // Do actions before destroying
  destroy: () => {},
};
