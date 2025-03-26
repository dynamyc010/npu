const $ = window.jQuery

// Verify that we are indeed on a Neptun page
function isNeptunPage() {
  return document.title.toLowerCase().indexOf("neptun web") !== -1;
}

// returns the current URL of the page we're on (as a URL object)
function getCurrentPage(){
  url = new URL(location.href);
  url.search = '';
  url.hash = '';
  return url;
}

// Returns whether we are on the login page
function isLoginPage(){
  return $("div.login").length > 0;
}

// Returns whether we are authenticated
function isLoggedIn() {
  return !!getNeptunCode();
}

// Parses and returns the Neptun code of the current user
function getNeptunCode() {
  if($(".user-menu__code").size() > 0){
    return $(".user-menu__code").text().split('  ').reverse()[0].substring(1,7);
  }
}

// Parses and returns the first-level domain of the site
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

// Parses and returns the sanitized name of the current training
function getTraining() {
  if($(".user-menu__training").size() > 0){
    return $(".user-menu__training").text().split('  ')[0].substr(1)
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

// // Reads the value at the provided path in a deeply nested object
// function deepGetProp(o, s) {
//   let c = o;
//   while (s.length) {
//     const n = s.shift();
//     if (!(c instanceof Object && n in c)) {
//       return;
//     }
//     c = c[n];
//   }
//   return c;
// }

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

// https://gist.github.com/jherax/968ad4ff8eaa9ceb9159
function getEventHandlers(element, eventns) {
  const $ = window.jQuery;
  const i = (eventns || '').indexOf('.'),
    event = i > -1 ? eventns.substr(0, i) : eventns,
    namespace = i > -1 ? eventns.substr(i + 1) : void(0),
    handlers = Object.create(null);
  element = $(element);
  if (!element.length) return handlers;
  // gets the events associated to a DOM element
  const listeners = $._data(element.get(0), "events") || handlers;
  const events = event ? [event] : Object.keys(listeners);
  if (!eventns) return listeners; // Object with all event types
  events.forEach((type) => {
    // gets event-handlers by event-type or namespace
    (listeners[type] || []).forEach(getHandlers, type);
  });
  // eslint-disable-next-line
  function getHandlers(e) {
    const type = this.toString();
    const eNamespace = e.namespace || (e.data && e.data.handler);
    // gets event-handlers by event-type or namespace
    if ((event === type && !namespace) ||
        (eNamespace === namespace && !event) ||
        (eNamespace === namespace && event === type)) {
      handlers[type] = handlers[type] || [];
      handlers[type].push(e);
    }
  }
  return handlers;
}




module.exports = {
  isNeptunPage,
  getDomain,
  getCurrentPage,
  isLoginPage,
  isLoggedIn,
  getNeptunCode,
  getTraining,
  injectCss,
  isPassingGrade,
  isFailingGrade,
  getEventHandlers,

}