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
    todo.numberOfImpositionStatement === 0 &&
    todo.numberOfPayments === 0 &&
    todo.numberOfQuestionnaires === 0 &&
    todo.numberOfSuggestedMark === 0 &&
    todo.numberOfUnregisteredSubjects === 0
  );
}

function removeBannerFromTop() {
  try {
    $("button#notification-button-close").click();
  } catch (e) {
    return;
  }
}

function init() {
  if (!shouldRemoveBanner()) return;

  // Remove banner if not needed
  removeBannerFromTop();
}

module.exports = {
  identifier: identifier.join("."),
  shouldActivate: () => utils.isLoggedIn(),
  shouldNotDestroy: () => false,
  initialize: () => {
    init();
  },
  // Do actions before destroying
  destroy: () => {},
};
