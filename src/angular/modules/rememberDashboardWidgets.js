const identifier = ["angular", "rememberDashboardWidgets"];

const $ = window.jQuery;
const utils = require("../utils");
const storage = require("../../shared/storage");

function isOnDashboard() {
  const uri = utils.getCurrentPage().pathname.split("/");
  return uri[uri.length - 1] === "dashboard";
}

function getWidgets() {
  // Root elements of Upcoming events, Exams, Messages...
  const widgetRoots = $(".widget");

  // Areas of the widgets that
  // - are clickable
  // - have an ID that is hopefully stable
  // - have a class that indicates if it is open or closed (mat-expanded)
  return widgetRoots.find("mat-expansion-panel-header");
}

function loadWidgetStates() {
  const openWidgets = storage.getForUser("dashboardOpenWidgets");
  if (!openWidgets) {
    return;
  }

  const widgets = getWidgets();
  openWidgets.forEach(widgetTitle => {
    widgets.each(function() {
      const titleElement = $(this).find(".widget__title");
      if (titleElement.text().trim() === widgetTitle) {
        $(this).click();
      }
    });
  })

  console.debug("[rememberDashboardWidgets] loaded open widgets:", openWidgets)
}

function saveOpenWidgets() {
  const openWidgets = getWidgets()
    .filter(function() {
      return $(this).hasClass("mat-expanded");
    })
    .map(function() {
      // Use the widget's title as an identifier because the widget's ID is unreliable
      // As a downside remembered widgets will be forgotten when the user switches languages
      return $(this).find(".widget__title").text().trim();
    })
    .get();

  storage.setForUser("dashboardOpenWidgets", openWidgets);
  console.debug("[rememberDashboardWidgets] saved open widgets:", openWidgets)
}

function init() {
  loadWidgetStates()
  getWidgets().on("click", saveOpenWidgets);
}

function destroy() {
  getWidgets().off("click", saveOpenWidgets);
}

module.exports = {
  identifier: identifier.join("."),
  shouldActivate: isOnDashboard,
  shouldNotDestroy: isOnDashboard,
  initialize: init,
  // Do actions before destroying
  destroy,
}
