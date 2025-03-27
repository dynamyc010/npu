const identifier = ["angular", "removeTodoBanner"];
const $ = window.jQuery;
const utils = require("../utils");

let cachedTodoList;

function getTodoList() {
  if (cachedTodoList) return cachedTodoList;
  const res = utils.sendApiRequest("api/Dashboard/GetNumberOfTasksByType");
  cachedTodoList = res.data;
  return res.data;
}

function shouldRemoveBanner() {
  const todo = getTodoList();

  return (
    !todo.hasActiveReclassificationTerm &&
    !todo.otpStatementForDiscount &&
    todo.numberOfImpositionStatement == 0 &&
    todo.numberOfPayments == 0 &&
    todo.numberOfQuestionnaires == 0 &&
    todo.numberOfSuggestedMark == 0 &&
    todo.numberOfUnregisteredSubjects == 0
  );
}

function removeBannerFromTop() {
  $("button#notification-button-close").click();
}

function init() {
  if (!shouldRemoveBanner()) return;

  // Remove banner if not needed
  removeBannerFromTop();
}

module.exports = {
  identifier: identifier.join("."),
  shouldActivate: () => {
    return utils.isLoggedIn() && ($("button#notification-button-close").length <= 0);
  },
  initialize: () => {
    init();
  },
  // Do actions before destroying
  destroy: () => {},
};
