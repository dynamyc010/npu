const identifier = ["angular", "infiniteSession"];
const $ = window.jQuery;
const utils = require("../utils");

let sessionRefreshTimeout;
let timeout = 180;

function keepAlive() {
  const timer = timeout * 1000 - 40000 - Math.floor(Math.random() * 40000);
  console.log("[infiniteSession] next token refresh in", timer);
  sessionRefreshTimeout = setTimeout(() => {
    utils.refreshToken();
    keepAlive();
  }, timer);
}

function init() {
  keepAlive();
}

module.exports = {
  identifier: identifier.join("."),
  shouldActivate: () => utils.isLoggedIn(),
  shouldNotDestroy: () => utils.isLoggedIn(),
  initialize: () => {
    init();
  },
  // Do actions before destroying
  destroy: () => {
    clearTimeout(sessionRefreshTimeout);
  },
};
