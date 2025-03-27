const identifier = ["angular", "autologin"];

const $ = window.jQuery;
const utils = require("../utils");
const storage = require("../../shared/storage");

// Returns users with stored credentials
function getLoginUsers() {
  const users = [];
  const list = storage.get("users", utils.getDomain());
  if (!list) {
    return users;
  }
  Object.keys(list).forEach(user => {
    if (typeof list[user].password === "string" && list[user].password !== "") {
      users.push(user);
    }
  });
  return users;
}

function getLocalizedString(...args) {
  return utils.getLocalizedString(identifier, args);
}

function simulateTyping(selector, value) {
  const e = $(selector);
  if (e.length) {
    e.focus(); // Focus on the field
    e.val(value); // Set value and trigger event
    document.querySelector(selector).dispatchEvent(new Event("input", { bubbles: true }));
    e.trigger($.Event("keyup", { key: "a" })); // Simulate keypress
    e.blur(); // Trigger validation
  }
}

let isAutologin = false;

function initUserSelect() {
  const users = getLoginUsers();

  // TODO: Make it pretty (copy lang dropdown?)
  // const selectButton = $('<button id="npu-autologin" class="mat-mdc-menu-trigger menu-trigger language-dropdown--has-globe-icon no-box-shadow flat lightgrey small-padding" type="button" aria-haspopup="menu" aria-expanded="false">').hide();

  const selectField = $(
    '<select id="user_sel" class="mat-mdc-text-field-wrapper mdc-text-field ng-tns-c36-3 mdc-text-field--filled mat-mdc-form-field flat lgihtgrey small-padding" name="user_sel"></select>'
  ).hide();

  users.forEach(user => {
    $('<option class="neptun_kod"></option>').attr("id", user).attr("value", user).text(user).appendTo(selectField);
  });
  selectField.append('<option disabled="disabled" class="user_separator">&nbsp;</option>');
  selectField.append(`<option id="other_user" value="__OTHER__">${getLocalizedString("otherUser")}</option>`);
  selectField.append(`<option id="edit_list" value="__DELETE__">${getLocalizedString("deleteUser")}</option>`);

  $("td", selectField).css("position", "relative");
  selectField
    // .css("font-weight", "bold")
    .css("font-family", "900 21px/1.2 Source Sans Pro,sans-serif")
    .css("font-size", "1.0em");
  $("option[class!=neptun_kod]", selectField)
    .css("font-size", "0.8em")
    .css("font-family", "900 21px/1.2 Source Sans Pro,sans-serif")
    .css("font-weight", "normal")
    .css("color", "#666")
    .css("font-style", "italic");
  $("option.user_separator", selectField).css("font-size", "0.5em");

  selectField.bind("mousedown focus change", function () {
    abortLogin();
  });
  $("input[type='password']").bind("mousedown focus change", function () {
    abortLogin();
  });

  $(".login-right__user-name .mdc-text-field").parent().prepend(selectField);

  selectField.bind("change", function () {
    clearLogin();

    if ($(this).val() === "__OTHER__") {
      hideSelect();
      return false;
    }

    if ($(this).val() === "__DELETE__") {
      $("#user_sel").val(users[0]).trigger("change");
      const itemToDelete = unsafeWindow.prompt(
        getLocalizedString("deletePopup") + getLocalizedString("deleteAllKeyword"),
        [getLocalizedString("deleteAllKeyword"), ...users].join("   /   ")
      );
      if (!itemToDelete) {
        return false;
      }

      let deleted = false;
      users.forEach(user => {
        if (
          user === itemToDelete.toUpperCase() ||
          itemToDelete.toUpperCase() === getLocalizedString("deleteAllKeyword")
        ) {
          storage.set("users", utils.getDomain(), user, "password", null);
          deleted = true;
        }
      });

      if (!deleted) {
        if (confirm(getLocalizedString("deleteUserNotFound"))) {
          $("#user_sel").val("__DELETE__").trigger("change");
        }
        return false;
      }

      if (itemToDelete.toUpperCase() === getLocalizedString("deleteAllKeyword")) {
        alert(getLocalizedString("deleteAllSuccess"));
        window.location.reload();
        return false;
      }

      alert(getLocalizedString("deleteSuccess").replace("$1", itemToDelete));
      window.location.reload();
      return false;
    }

    simulateTyping("input#userName", users[$(this).get(0).selectedIndex]);
    simulateTyping(
      "input[type='password']",
      atob(storage.get("users", utils.getDomain(), users[$(this).get(0).selectedIndex], "password"))
    );
  });

  $("#login-button")
    .attr("type", "")
    .bind("click", function () {
      if (isAutologin) return;

      if ($("#user_sel").val() === "__OTHER__") {
        if ($("input#userName").val().trim() === "" || $("input[type='password']").val().trim() === "") {
          return;
        }

        const foundUser = users.find(user => user === $("input#userName").val().toUpperCase());
        if (!foundUser) {
          if (confirm(getLocalizedString("confirmSaveDialog"))) {
            storage.set(
              "users",
              utils.getDomain(),
              $("input#userName").val().toUpperCase(),
              "password",
              btoa($("input[type='password']").val())
            );
          }
          return;
        } else {
          $("#user_sel").val(foundUser);
        }
      }

      if ($("#user_sel").val() === "__DELETE__") {
        return;
      }

      if (
        $("input[type='password']").val() !==
        atob(storage.get("users", utils.getDomain(), users[$("#user_sel").get(0).selectedIndex], "password"))
      ) {
        if (
          //
          confirm(getLocalizedString("confirmChangeDialog").replace("$1", $("input#userName").val().toUpperCase()))
        ) {
          storage.set(
            "users",
            utils.getDomain(),
            users[$("#user_sel").get(0).selectedIndex],
            "password",
            btoa($("input[type='password']").val())
          );
        }
      }
    });

  showSelect();
  selectField.trigger("change");
}

let loginTimer;
let loginButtonText;

function initAutoLogin() {
  const users = getLoginUsers();

  if (users.length < 1) {
    return;
  }

  const submit = $("#login-button .neptun-button__body .neptun-button__label");

  let loginCount = 3;
  loginButtonText = submit.text();
  submit.text(`${loginButtonText} (${loginCount})`);

  const clone = $("#forgotten-password-button").clone(false);
  clone.attr("id", "abort-button");
  clone.children().children().text(getLocalizedString("abortLogin"));

  $("#login-button").parent().append(clone);
  $("#abort-button .neptun-button__body .neptun-button__label").text(getLocalizedString("abortLogin"));
  $("#abort-button").click(function (e) {
    e.preventDefault();
    abortLogin();
  });

  loginTimer = window.setInterval(() => {
    loginCount--;
    submit.text(`${loginButtonText} (${loginCount})`);

    if (loginCount <= 0) {
      isAutologin = true;
      submitLogin();
      abortLogin();
      submit.text(`${loginButtonText}...`);
    }
  }, 1000);
}

function showSelect() {
  $(".login-right__user-name .mdc-text-field").hide();
  $("#user_sel").show();
}

function hideSelect() {
  $(".login-right__user-name .mdc-text-field").show().focus();
  $("#user_sel").hide();
}

function abortLogin() {
  window.clearInterval(loginTimer);
  $("#login-button .neptun-button__body .neptun-button__label").text(loginButtonText);
  $("#abort-button").remove();
}

function clearLogin() {
  $("input#userName").val("").trigger("input");
  $("input[type='password']").val("").trigger("input");
}

function submitLogin() {
  $("#login-button").click();
}

module.exports = {
  identifier: identifier.join("."),
  shouldActivate: () => utils.isLoginPage(),
  initialize: () => {
    initUserSelect();
    initAutoLogin();
  },
  // Do actions before destroying
  destroy: () => {
    abortLogin();
  },
};
