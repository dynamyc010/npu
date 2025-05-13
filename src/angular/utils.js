const $ = window.jQuery;
const supportedLanguages = ["en", "hu", "de"];
const storage = require("../shared/storage");

const apiToCatch = [];

/**
 *
 * @param {String} url - The API URL to register
 * @param {Function} func - The function to register
 * @returns {Boolean} If the operation succeeded
 */
function registerApiToCatch(url, func) {
  apiToCatch[apiToCatch.length] = { url: url, func: func };
  return true;
}

/**
 *
 * @param {String} url - The API URL to unregister
 * @param {Function} func - The function to unregister
 * @returns {Boolean} If the API was found
 */
function unregisterApiFromCatch(url, func) {
  if (apiToCatch.some(api => api.url === url && api.func === func)) {
    apiToCatch.splice(apiToCatch.indexOf(api => api.url === url && api.func === func));
    return true;
  }
  return false;
}

function getApisToCatch() {
  return apiToCatch;
}

// Fallback to HU lang
const fallback = require("./langs/hu.json");
let currentLanguage = undefined;
let langStrings = undefined;

// Verify that we are indeed on a Neptun page
/**
 * @returns {Boolean} Whether or not we're on a Neptun page
 */
function isNeptunPage() {
  return document.title.toLowerCase().indexOf("neptun web") !== -1;
}

// Well that was easy.
function getAccessToken() {
  return unsafeWindow.sessionStorage.access_token;
}

function getRefreshToken() {
  return unsafeWindow.sessionStorage.refresh_token;
}

/**
 * @summary Makes an API request to the Neptun API
 *
 * @param {URL} url - The URL of the API you wish to target
 * @param {boolean} [authenticated=True] - Whether or not the request should be authenticated
 * @returns {JSON} The response of the JSON
 *
 * @throws If the request failed, and we couldn't reauthenticate.
 *
 * @example
 * - Authenticated
 * const res = sendApiRequest("api/Dashboard/GetNumberOfTasksByType");
 * console.log(res.data);
 *
 * - Unauthenticated
 * const res = sendApiRequest("api/Login/GetInstituteName?lcid=1038", false);
 * console.log(res.data)
 *
 */
function sendApiRequest(url, authenticated = true) {
  const res = $.ajax(url, {
    headers: {
      Authorization: authenticated ? `Bearer ${getAccessToken()}` : null,
    },
    async: false,
  });
  switch (res.status) {
    case 200:
      return res.responseJSON;
    case 403:
    case 401:
      // unauthorized
      console.error("[sendApiRequest] got unauthorized for request:", res);
      if (authenticated && refreshToken()) {
        console.debug("[sendApiRequest] trying again with token refreshed");
        return sendApiRequest(url, authenticated);
      }
      throw new Error({ failed: true, error: res.responseJSON.message });
    default:
      // Something went wrong... Let's just bail.
      console.error("[sendApiRequest] request failed with unknown reason:", res);
      throw new Error({ failed: true, error: res.responseJSON.message });
  }
}

/**
 * @summary Refreshes the Token for the current session.
 *
 * @returns {Boolean} Whether or not the operation was successful.
 */
function refreshToken() {
  const res = $.ajax("api/Account/GetNewTokens", {
    headers: {
      Authorization: `Bearer ${getRefreshToken()}`,
    },
    method: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      refreshToken: getRefreshToken(),
    }),
    async: false,
  });

  switch (res.status) {
    case 200: {
      const tokens = res.responseJSON;

      unsafeWindow.sessionStorage.access_token = tokens.accessToken;
      unsafeWindow.sessionStorage.refresh_token = tokens.refreshToken;
      return true;
    }
    case 403:
    case 401:
    default:
      console.error(`[refreshToken] failed token refresh:`, res);
      return refreshTokenWithAuthenticate();
  }
}

function refreshTokenWithAuthenticate() {
  const res = $.ajax("api/Account/Authenticate", {
    method: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      userName: getNeptunCode(),
      password: atob(storage.get("users", getDomain(), getNeptunCode(), "password")),
      captcha: "",
      captchaIdentifier: "",
      token: "",
      LCID: 1038,
    }),
    xhrFields: { withCredentials: true },
    async: false,
  });

  switch (res.status) {
    case 200: {
      const tokens = res.responseJSON.data;

      unsafeWindow.sessionStorage.access_token = tokens.accessToken;
      unsafeWindow.sessionStorage.refresh_token = tokens.refreshToken;
      return true;
    }
    case 403:
    case 401:
    default:
      console.error(`[refreshTokenWithAuthenticate] failed token refresh with auth:`, res);
      return false;
  }
}

/**
 * @summary Finds and returns the current site language.
 *
 * @returns {String} The current language.
 */
function getCurrentLanguage() {
  if (currentLanguage) return currentLanguage;
  const lang = $(".footer__language span.text-uppercase").text().toLowerCase();
  // return sane default if something goes wrong
  if (supportedLanguages.indexOf(lang) === -1) return "hu";
  return lang;
}

/**
 * @summary Finds a localized string from the NPU language files
 *
 * @param  {...any} args The identifier for the string
 * @returns {String} The localized string
 */

function getLocalizedString(...args) {
  let ids;
  if (Array.isArray(args[0])) {
    // this is for the identifier
    ids = args.shift();
    ids = ids.concat(args);
  } else {
    ids = args;
  }

  if (!currentLanguage) currentLanguage = getCurrentLanguage();
  if (!langStrings) langStrings = require(`./langs/${currentLanguage}.json`);
  const string = deepGetProp(langStrings, ids.slice(0));
  if (string === "" || string === undefined || !string) {
    console.warn("[getLocalizedString]", ids, "is unlocalized");
    return deepGetProp(fallback, ids.slice(0));
  }
  return string.toString();
}

// returns the current URL of the page we're on (as a URL object)
/**
 *
 * @returns {URL} The current web URL without any parameters
 */
function getCurrentPage() {
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  return url;
}

/**
 *
 * @returns {Boolean} Whether or not we're currently on the Login Screen.
 */
function isLoginPage() {
  return $("div.login").length > 0;
}

/**
 *
 * @returns {Boolean} Whether or not we have a session right now
 */
function isLoggedIn() {
  return !!getNeptunCode();
}

/**
 * @summary Parses and returns the Neptun code of the current user
 *
 * @returns {String} The Neptun Code for the current user
 */
function getNeptunCode() {
  if ($(".user-menu__code").size() > 0) {
    return $(".user-menu__code").text().split("  ").reverse()[0].substring(1, 7);
  }
}

/**
 * @summary Parses and returns the first-level domain of the site
 *
 * @returns {String} The first-level domain of the current site
 */
function getDomain() {
  const host = location.host.split(".");
  const tlds = "at co com edu eu gov hu hr info int mil net org ro rs sk si ua uk".split(" ");
  let domain = "";
  for (let i = host.length - 1; i >= 0; i--) {
    domain = `${host[i]}.${domain}`;
    if (!tlds.includes(host[i])) {
      return domain.substr(0, domain.length - 1);
    }
  }
}

/**
 * @summary Parses and returns the sanitized name of the current training
 *
 * @returns {String} Name of Current Training
 */
function getTraining() {
  if ($(".user-menu__training").size() > 0) {
    return $(".user-menu__training").text().split("  ")[0].substr(1);
  }
}

// // Returns the ID of the current page
// function getPageId() {
//   const result = /ctrl=([a-zA-Z0-9_]+)/g.exec(window.location.href);
//   return result ? result[1] : null;
// }

// // Returns whether the specified ID is the current page
// function isPageId(...ctrls) {
//   return ctrls.includes(getPageId());
// }

// // Get the current AJAX grid instance
// function getAjaxInstance(element) {
//   const instanceId = getAjaxInstanceId(element);
//   return instanceId && unsafeWindow[getAjaxInstanceId(element)];
// }

// function getAjaxInstanceId(element) {
//   const ajaxGrid = $(element).closest("div[type=ajaxgrid]");
//   return ajaxGrid.size() > 0 && ajaxGrid.first().attr("instanceid");
// }

// // Runs a function asynchronously to fix problems in certain cases
// function runAsync(func) {
//   window.setTimeout(func, 0);
// }

// // Evaluates code in the page context
// function runEval(source) {
//   const value = typeof source === "function" ? `(${source})();` : source;
//   const script = document.createElement("script");
//   script.setAttribute("type", "application/javascript");
//   script.textContent = value;
//   document.body.appendChild(script);
//   document.body.removeChild(script);
// }

//

/**
 * @summary Reads the value at the provided path in a deeply nested object
 *
 * @param {*} o - Original
 * @param {*} s -
 *
 * @returns
 */
function deepGetProp(o, s) {
  let c = o;
  while (s.length) {
    const n = s.shift();
    if (!(c instanceof Object && n in c)) {
      return;
    }
    c = c[n];
  }
  return c;
}

// // Sets a value at the provided path in a deeply nested object
// function deepSetProp(o, s, v) {
//   let c = o;
//   while (s.length) {
//     const n = s.shift();
//     if (s.length === 0) {
//       if (v === null) {
//         delete c[n];
//       } else {
//         c[n] = v;
//       }
//       return;
//     }
//     if (!(typeof c === "object" && n in c)) {
//       c[n] = new Object();
//     }
//     c = c[n];
//   }
// }

// // Injects a style tag into the page
function injectCss(css) {
  $("<style></style>").html(css).appendTo("head");
}

// // Parses a subject code that is in parentheses at the end of a string
// function parseSubjectCode(source) {
//   const str = source.trim();
//   if (str.charAt(str.length - 1) === ")") {
//     let depth = 0;
//     for (let i = str.length - 2; i >= 0; i--) {
//       const c = str.charAt(i);
//       if (depth === 0 && c === "(") {
//         return str.substring(i + 1, str.length - 1);
//       }
//       depth = c === ")" ? depth + 1 : depth;
//       depth = c === "(" && depth > 0 ? depth - 1 : depth;
//     }
//   }
//   return null;
// }

// Returns if the given string stands for a passing grade
function isPassingGrade(str) {
  return [
    "jeles",
    "excellent",
    "jó",
    "good",
    "közepes",
    "satisfactory",
    "elégséges",
    "pass",
    "kiválóan megfelelt",
    "excellent",
    "megfelelt",
    "average",
  ].some(function (item) {
    return str.toLowerCase().indexOf(item) !== -1;
  });
}

// Returns if the given string stands for a failing grade
function isFailingGrade(str) {
  return [
    "elégtelen",
    "fail",
    "nem felelt meg",
    "unsatisfactory",
    "nem jelent meg",
    "did not attend",
    "nem vizsgázott",
    "did not attend",
  ].some(function (item) {
    return str.toLowerCase().indexOf(item) !== -1;
  });
}

module.exports = {
  isNeptunPage,
  getDomain,
  getCurrentPage,
  getLocalizedString,
  getAccessToken,
  getRefreshToken,
  refreshToken,
  sendApiRequest,
  isLoginPage,
  isLoggedIn,
  getNeptunCode,
  getTraining,
  injectCss,
  isPassingGrade,
  isFailingGrade,
  getApisToCatch,
  registerApiToCatch,
  unregisterApiFromCatch,
};
