const identifier = ["angular", "rememberDashboardWidgets"];

const $ = window.jQuery;
const utils = require("../utils");
const storage = require("../../shared/storage");

function isOnDashboard() {
  const uri = utils.getCurrentPage().pathname.split("/");
  return uri[uri.length - 1] === "dashboard";
}

async function getWidgets() {
  return new Promise((resolve, reject) => {
    function checkWidgets(attempts = 0) {
      // Root elements of Upcoming events, Exams, Messages...
      const widgetRoots = $(".widget");

      // Areas of the widgets that
      // - are clickable
      // - have an ID that is hopefully stable
      // - have a class that indicates if it is open or closed (mat-expanded)
      const widgets = widgetRoots.find("mat-expansion-panel-header");

      // In case the widgets were not loaded yet, try again later
      if (widgets.length === 0) {
        const maxAttempts = 100;
        if (attempts === maxAttempts) {
          reject(new Error("[rememberDashboardWidgets] failed to find widgets"));
        }
        setTimeout(() => checkWidgets(attempts + 1), 50);
        return
      }

      resolve(widgets);
    }

    checkWidgets();
  });
}

async function loadWidgetStates() {
  const openWidgets = storage.getForUser("dashboardOpenWidgets");
  if (!openWidgets) {
    return;
  }

  const widgets = await getWidgets();
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

async function saveOpenWidgets() {
  const widgets = await getWidgets();
  const openWidgets = widgets
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

async function init() {
  await loadWidgetStates();
  const widgets = await getWidgets();
  widgets.on("click", saveOpenWidgets);
}

async function destroy() {
  const widgets = await getWidgets();
  widgets.off("click", saveOpenWidgets);
}

module.exports = {
  identifier: identifier.join("."),
  shouldActivate: isOnDashboard,
  shouldNotDestroy: isOnDashboard,
  initialize: init,
  // Do actions before destroying
  destroy,
}
