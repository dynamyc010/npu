const $ = window.jQuery;
const { getCurrentPage, isNeptunPage } = require("./utils");
const storage = require("../shared/storage");

const modules = [
  require("./modules/removeTodoBanner"),
  require("./modules/catchNetworkRequests"),
  require("./modules/infiniteSession"),
  require("./modules/autoLogin"),
  require("./modules/addVersion"),
  require("./modules/todoOverride"),
];

let loadedModules = [];

function init() {
  function isLoadingShown() {
    return $("neptun-loading-template").length > 0;
  }
  function isLoadingGone() {
    return $("neptun-loading-template").length <= 0;
  }
  function isFooterShown() {
    return $("div.footer__content").length > 0;
  }

  console.debug("[npu-init] started loading...");

  earlyInitModules();

  const stage1 = setInterval(() => {
    if (isLoadingShown() || isFooterShown()) {
      clearInterval(stage1);
      const stage2 = setInterval(() => {
        if (isLoadingGone() || isFooterShown()) {
          console.debug("[npu-init] loading finished");
          clearInterval(stage2);
          setTimeout(() => {
            continueInit();
          }, 300);
        }
      }, 300);
    }
  }, 300);
}

async function earlyInitModules() {
  modules
    .filter(m => m.isEarlyInit && m.shouldActivate())
    .forEach(m => {
      // console.debug("[module-loader]", m.identifier, m.shouldActivate());
      if (isNeptunPage() || m.runOutsideNeptun) {
        console.debug("[module-loader] loading", m.identifier);
        m.initialize();
        loadedModules[loadedModules.length] = m;
      }
    });
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
    console.debug("[the-observer] switching to", url.toString());
    currentUrl = url;
    changeActiveModule();
  }
  return;
}

async function changeActiveModule() {
  // Loop through loaded modules, and destroy the ones we don't need.
  // modules.filter((m) => loadedModules.indexOf(m.identifier) !== -1).forEach(m => {
  const newModules = [];
  loadedModules.forEach(m => {
    // Let's just destroy and reload everything as needed for now.
    if (m.shouldNotDestroy()) {
      console.debug("[module-destroyer] skipping", m.identifier);
      newModules[newModules.length] = m;
      return;
    }
    console.debug("[module-destroyer] destroying", m.identifier);
    m.destroy();
    // loadedModules.splice(loadedModules.indexOf(m))
  });

  loadedModules = newModules;

  modules.forEach(m => {
    if (loadedModules.some(loaded => loaded.identifier === m.identifier)) return;
    console.debug("[module-loader]", m.identifier, m.shouldActivate());
    if (m.shouldActivate() && (isNeptunPage() || m.runOutsideNeptun)) {
      console.debug("[module-loader] loading", m.identifier);
      m.initialize();
      loadedModules[loadedModules.length] = m;
    }
  });
  console.debug("[module-loader] loaded modules:", loadedModules);
}

module.exports = {
  init,
};
