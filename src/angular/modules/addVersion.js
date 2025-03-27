const $ = window.jQuery;

function isAlreadyAdded() {
  return $("#npu_version").length !== 0;
}

function addVersionOnBottom() {
  const e = $("div.footer__version").clone(false);
  e.attr("id", "npu_version");
  e.text(`Neptun PowerUp! ${GM.info.script.version}`);
  e.css("cursor", "pointer");
  e.on("click", () => {
    window.open("https://github.com/dynamyc010/npu", "_blank").focus();
  });
  $("div.footer__version").after(e);
}

module.exports = {
  identifier: "angular.addversion",
  shouldActivate: () => !isAlreadyAdded(),
  initialize: () => {
    addVersionOnBottom();
  },
  // Do actions before destroying
  destroy: () => {},
};
