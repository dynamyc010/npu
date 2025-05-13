const identifier = ["angular", "infiniteSession"];
const { isLoggedIn, refreshToken } = require("../utils");

let sessionRefreshTimeout;
const timeout = 280;

function keepAlive() {
  const timer = timeout * 1000 - 40000 + Math.floor(Math.random() * 40000);
  console.debug("[infiniteSession] next token refresh in", timer / 1000, "s");
  sessionRefreshTimeout = setTimeout(() => {
    if(!refreshToken()) {
      // Bail completely if refreshing token failed. 
      // (We're probably way past due already, and it's just the easiest way of handling it.)
      location.reload();
    }
    document.querySelector("body").dispatchEvent(new Event("mousedown", { bubbles: true }));
    document.querySelector("body").dispatchEvent(new Event("mouseup", { bubbles: true }));
    keepAlive();
  }, timer);
}

function createListener() {
  document.addEventListener("visibilitychange", overrideVisibility, true);
}

function removeListener() {
  document.removeEventListener("visibilitychange", overrideVisibility, true);
}

function overrideVisibility() {
  {
    // Spoof Visibility API to always act like the page is visible.
    // console.debug("[infinitySession] document.hidden spoofed");
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
    });
    Object.defineProperty(document, "hidden", { value: false, writable: true });
  }
}

function init() {
  createListener();
  keepAlive();
}

module.exports = {
  identifier: identifier.join("."),
  shouldActivate: () => isLoggedIn(),
  shouldNotDestroy: () => isLoggedIn(),
  initialize: () => {
    init();
  },
  // Do actions before destroying
  destroy: () => {
    clearTimeout(sessionRefreshTimeout);
    removeListener();
  },
};
