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

function simulateTyping(selector, value) {
  let $el = $(selector);
  if ($el.length) {
      $el.focus(); // Focus on the field
      $el.val(value).trigger($.Event('input', { bubbles: true })); // Set value and trigger event
      $el.trigger($.Event('keyup', { key: 'a' })); // Simulate keypress
      $el.blur(); // Trigger validation
  }
}

/* 
<mat-form-field _ngcontent-muy-c336="" floatlabel="auto" class="mat-mdc-form-field login-right__user-name ng-tns-c36-3 mat-mdc-form-field-type-mat-input mat-mdc-form-field-has-icon-prefix mat-form-field-appearance-fill mat-form-field-hide-placeholder mat-primary ng-untouched ng-pristine ng-star-inserted ng-invalid"><!----><div class="mat-mdc-text-field-wrapper mdc-text-field ng-tns-c36-3 mdc-text-field--filled"><div class="mat-mdc-form-field-focus-overlay ng-tns-c36-3 ng-star-inserted"></div><!----><div class="mat-mdc-form-field-flex ng-tns-c36-3"><!----><div class="mat-mdc-form-field-icon-prefix ng-tns-c36-3 ng-star-inserted"><i _ngcontent-muy-c336="" matprefix="" class="icon-user ng-tns-c36-3"></i></div><!----><!----><div class="mat-mdc-form-field-infix ng-tns-c36-3"><label matformfieldfloatinglabel="" class="mdc-floating-label mat-mdc-floating-label ng-tns-c36-3 ng-star-inserted" id="mat-mdc-form-field-label-0" for="userName" aria-owns="userName"><mat-label _ngcontent-muy-c336="" class="ng-tns-c36-3">Azonosító</mat-label><span aria-hidden="true" class="mat-mdc-form-field-required-marker mdc-floating-label--required ng-tns-c36-3 ng-star-inserted"></span><!----></label><!----><!----><!----><input _ngcontent-muy-c336="" matinput="" placeholder="ABC123" type="text" autocomplete="off" name="userName" id="userName" class="mat-mdc-input-element ng-tns-c36-3 ng-untouched ng-pristine mat-mdc-form-field-input-control mdc-text-field__input cdk-text-field-autofill-monitored ng-invalid" required="" aria-required="true"></div><!----><!----></div><div matformfieldlineripple="" class="mdc-line-ripple ng-tns-c36-3 mdc-line-ripple--deactivating ng-star-inserted"></div><!----></div><div class="mat-mdc-form-field-subscript-wrapper mat-mdc-form-field-bottom-align ng-tns-c36-3"><!----><div class="mat-mdc-form-field-hint-wrapper ng-tns-c36-3 ng-trigger ng-trigger-transitionMessages ng-star-inserted" style="opacity: 1; transform: translateY(0%);"><!----><div class="mat-mdc-form-field-hint-spacer ng-tns-c36-3"></div></div><!----></div><button id="npu-autologin" class="mat-mdc-menu-trigger menu-trigger language-dropdown--has-globe-icon no-box-shadow flat lightgrey small-padding" type="button" aria-haspopup="menu" aria-expanded="false" style=""></button></mat-form-field>
*/

/*
<neptun-language-dropdown _ngcontent-hda-c336="" _nghost-hda-c174="" class="neptun-language-dropdown"><button _ngcontent-hda-c174="" id="19915f11-1b97-46b8-9378-a48706cfebe3" neptun-button="" color="lightgrey" accent="flat" class="mat-mdc-menu-trigger menu-trigger language-dropdown--has-globe-icon no-box-shadow flat lightgrey small-padding" _nghost-hda-c69="" type="button" aria-haspopup="menu" aria-expanded="false" style="width:370px"><span _ngcontent-hda-c69="" class="neptun-button__body"><!----><span _ngcontent-hda-c69="" class="neptun-button__label"><i _ngcontent-hda-c174="" class="globe-icon icon-globe"></i><span _ngcontent-hda-c174="" class="text-uppercase">hu</span><i _ngcontent-hda-c174="" class="icon-open-indicator icon-chevron-bottom"></i></span><!----></span></button><!----><mat-menu _ngcontent-hda-c174="" xposition="before" class="ng-tns-c102-2 ng-star-inserted"><!----></mat-menu></neptun-language-dropdown>
*/

let isAutologin = false;

function initUserSelect() {
  const users = getLoginUsers();
  console.log("users:", users);

  // $(".login-right__username .mdc-text-field");

  // TODO: Make it pretty (copy lang dropdown?)
  // const selectButton = $('<button id="npu-autologin" class="mat-mdc-menu-trigger menu-trigger language-dropdown--has-globe-icon no-box-shadow flat lightgrey small-padding" type="button" aria-haspopup="menu" aria-expanded="false">').hide();

  const selectField = $(
    '<select id="user_sel" class="mat-mdc-text-field-wrapper mdc-text-field ng-tns-c36-3 mdc-text-field--filled mat-mdc-form-field flat lgihtgrey small-padding" name="user_sel"></select>'
  ).hide();

  users.forEach(user => {
    $('<option class="neptun_kod"></option>').attr("id", user).attr("value", user).text(user).appendTo(selectField);
  });
  selectField.append('<option disabled="disabled" class="user_separator">&nbsp;</option>');
  selectField.append('<option id="other_user" value="__OTHER__">Más felhasználó...</option>');
  selectField.append('<option id="edit_list" value="__DELETE__">Tárolt kód törlése...</option>');

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
  $("input#mat-input-1 ").bind("mousedown focus change", function () {
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
        "Írd be a törlendő neptun kódot. Az összes törléséhez írd be: MINDEGYIKET",
        ["mindegyiket", ...users].join("   /   ")
      );
      if (!itemToDelete) {
        return false;
      }

      let deleted = false;
      users.forEach(user => {
        if (user === itemToDelete.toUpperCase() || itemToDelete.toUpperCase() === "MINDEGYIKET") {
          storage.set("users", utils.getDomain(), user, "password", null);
          deleted = true;
        }
      });

      if (!deleted) {
        if (confirm("A megadott neptun kód nincs benne a tárolt listában. Megpróbálod újra?")) {
          $("#user_sel").val("__DELETE__").trigger("change");
        }
        return false;
      }

      if (itemToDelete.toUpperCase() === "MINDEGYIKET") {
        alert("Az összes tárolt neptun kód törölve lett a bejelentkezési listából.");
        window.location.reload();
        return false;
      }

      alert(`A(z) ${itemToDelete} felhasználó törölve lett a bejelentkezési listából.`);
      window.location.reload();
      return false;
    }

    // $(".login-right__user-name").trigger("click");

    // $("mat-form-field.password-input div.mdc-text-field").trigger("click");

    simulateTyping('input#userName', users[$(this).get(0).selectedIndex]);
    simulateTyping('neptun-form-password input', atob(storage.get("users", utils.getDomain(), users[$(this).get(0).selectedIndex], "password")));

    document.querySelector("input[type='password']").dispatchEvent(new Event('input', {bubbles: true}))
    document.querySelector("input#userName").dispatchEvent(new Event('input', {bubbles: true}))

    // $("input#userName").val(users[$(this).get(0).selectedIndex]).attr('aria-invalid', 'false').trigger("input").trigger("click").trigger("blur");
    // $("neptun-form-password input").val(
    //   atob(storage.get("users", utils.getDomain(), users[$(this).get(0).selectedIndex], "password"))
    // ).trigger("input").trigger("click").trigger("blur").trigger($.Event('keyup', { keyCode: 8 }));
  });

  console.log(utils.getEventHandlers("#login-button", "click"))

  $("#login-button")
    .attr("type", "")
    .bind("click", function (e) {
      //buttonEvent = e;
      // console.log(typeof(e.originalEvent), e.originalEvent);
      // e.preventDefault();

      if(isAutologin) return;

      if ($("#user_sel").val() === "__OTHER__") {
        if ($("input#userName").val().trim() === "" || $("input#mat-input-1").val().trim() === "") {
          return;
        }

        const foundUser = users.find(user => user === $("input#userName").val().toUpperCase());
        if (!foundUser) {
          if (
            confirm(
              "Szeretnéd menteni a beírt adatokat, hogy később egy kattintással be tudj lépni erről a számítógépről?"
            )
          ) {
            storage.set("users", utils.getDomain(), $("input#userName").val().toUpperCase(), "password", btoa($("input#mat-input-1").val()));
          }
          submitLogin();
          return;
        } else {
          $("#user_sel").val(foundUser);
        }
      }

      if ($("#user_sel").val() === "__DELETE__") {
        return;
      }

      if (
        $("input#mat-input-1").val() !==
        atob(storage.get("users", utils.getDomain(), users[$("#user_sel").get(0).selectedIndex], "password"))
      ) {
        if (
          confirm(
            `Szeretnéd megváltoztatni a(z) ${$("input#userName")
              .val()
              .toUpperCase()} felhasználó tárolt jelszavát a most beírt jelszóra?`
          )
        ) {
          storage.set(
            "users",
            utils.getDomain(),
            users[$("#user_sel").get(0).selectedIndex],
            "password",
            btoa($("input#mat-input-1").val())
          );
        }
      }

      // submitLogin();
      // dispatchEvent(e.originalEvent);
      return;
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
  clone.children().children().text("Megszakít");

  $("#login-button").parent().append(clone);
  $("#abort-button .neptun-button__body .neptun-button__label").text("Megszakít");
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

// function createFakeLoginButton(){
//   const login_button = $("#login-button").clone(false).attr('id', 'login-button-2');
//   $("#login-button").prepend(login_button);

//   // Hide real button
//   $("#login-button").hide().attr('id', 'base-login-button');
//   $('#login-button-2').attr('id', 'login-button');
// }

function showSelect() {
  // $(".login-right__user-name .mdc-text-field").hide();
  $("#user_sel").show();
  // utils.runEval(' Page_Validators[0].controltovalidate = "user_sel" ');
}

function hideSelect() {
  $(".login-right__user-name .mdc-text-field").show().focus();
  $("#user_sel").hide();
  // utils.runEval(' Page_Validators[0].controltovalidate = "user" ');
}

function abortLogin() {
  console.log("aborting");
  window.clearInterval(loginTimer);
  $("#login-button .neptun-button__body .neptun-button__label").text(loginButtonText);
  $("#abort-button").remove();
}

function clearLogin() {
  $("input#userName").val("").trigger("input");
  $("input#mat-input-1").val("").trigger("input");
}

function submitLogin() {
  $("#login-button").click();
  // $('input#userName').trigger($.Event('keyup', { keyCode: 13 }));

}

module.exports = {
  identifier: "angular.autologin",
  shouldActivate: () => utils.isLoginPage(),
  initialize: () => {
    // createFakeLoginButton();
    console.log(utils.getDomain());
    initUserSelect();
    initAutoLogin();
  },
  // Do actions before destroying
  destroy: () => {
    abortLogin();
  },
};
