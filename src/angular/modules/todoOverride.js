const identifier = ["angular", "todoOverride"];
const $ = window.jQuery;
const utils = require("../utils");

function voidRequestFormNumber(response, isResponse) {
  if (!isResponse) return response;
  response.numberOfRequestForms = 0;
  return response;
}

function init() {
  // register tasks API
  utils.registerApiToCatch("api/Dashboard/GetNumberOfTasksByType", voidRequestFormNumber);
}

module.exports = {
  identifier: identifier.join("."),
  isEarlyInit: true,
  shouldActivate: () => true,
  shouldNotDestroy: () => true,
  initialize: init,
  // Do actions before destroying
  destroy: () => {},
};
