const $ = window.jQuery;
const { getCurrentPage, isNeptunPage } = require("./utils");
const storage = require("../shared/storage");

const modules = [
  require("./modules/autoLogin"),
  require("./modules/addVersion"),
  require("./modules/removeTodoBanner"),
];

let loadedModules = [];

function init() {
  function isLoadingShown() {
    return $("neptun-loading-template").length > 0;
  }
  function isLoadingGone() {
    return $("neptun-loading-template").length <= 0;
  }

  console.log("started loading...");

  const stage1 = setInterval(() => {
    if (isLoadingShown()) {
      clearInterval(stage1);
      const stage2 = setInterval(() => {
        if (isLoadingGone()) {
          console.log("loading finished");
          clearInterval(stage2);
          setTimeout(() => {
            continueInit();
          }, 300);
        }
      }, 300);
    }
  }, 300);
}

async function continueInit() {
  await storage.initialize();

  await onPageChange();

  const observer = new MutationObserver(() => onPageChange());

  observer.observe(document.body, { childList: true, subtree: true });
}

let currentUrl = "";

async function onPageChange() {
  const url = getCurrentPage();

  if (url.toString() !== currentUrl.toString()) {
    console.log("switching to", url.toString());
    currentUrl = url;
    changeActiveModule();
  }
  return;
}

async function changeActiveModule() {
  // Loop through loaded modules, and destroy the ones we don't need.
  // modules.filter((m) => loadedModules.indexOf(m.identifier) !== -1).forEach(m => {
  loadedModules.forEach(m => {
    // Let's just destroy and reload everything as needed for now.
    console.log("destroying", m.identifier);
    m.destroy();
    // loadedModules.splice(loadedModules.indexOf(m))
  });

  loadedModules = [];

  modules.forEach(m => {
    console.log("module", m.identifier, m.shouldActivate());
    if (m.shouldActivate() && (isNeptunPage() || m.runOutsideNeptun)) {
      console.log("loading", m.identifier);
      m.initialize();
      loadedModules[loadedModules.length] = m;
    }
  });
  console.log("loaded modules:", loadedModules);
}

module.exports = {
  init,
};
