const identifier = ["angular", "catchNetworkRequests"];

const $ = window.jQuery;
const utils = require("../utils");

let originalFetch;

function overrideFetch() {
  originalFetch = window.fetch;
  window.fetch = new Proxy(window.fetch, {
    apply: async (target, thisArg, args) => {
      let [url, options] = args;

      let apis = utils.getApisToCatch();

      if (apis.some(api => url.includes(api.url))) {
        console.debug("Intercepted Fetch:", url);

        // Modify request payload
        if (options && options.body) {
          let body = JSON.parse(options.body);
          apis
            .filter(api => url.includes(api.url))
            .forEach(api => {
              body = api.func(body, false);
            });

          options.body = JSON.stringify(body);
        }

        // Return a modified response using a Promise
        return new Promise((resolve, reject) => {
          GM.xmlhttpRequest({
            method: options?.method || "GET",
            url: url,
            headers: options?.headers || {},
            data: options?.body || null,
            responseType: "json",
            onload: response => {
              let json = JSON.parse(response);

              apis
                .filter(api => url.includes(api.url))
                .forEach(api => {
                  json = api.func(json, true);
                });

              response = JSON.stringify(json);
              //   console.debug("Modified Response:", response.responseText);

              // Modify response if needed
              //   let modifiedResponse = response.response;
              //   modifiedResponse.extraData = "injectedValue"; // Example modification

              // Convert the modified response back to a Response object
              resolve(
                new Response(JSON.stringify(modifiedResponse), {
                  status: response.status,
                  statusText: response.statusText,
                  headers: {
                    "Content-Type": "application/json",
                  },
                })
              );
            },
            onerror: error => reject(error),
          });
        });
      }

      return target.apply(thisArg, args);
    },
  });
}

function releaseFetch() {
  window.fetch = originalFetch;
}

const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;

let interceptedRequest = undefined;

function overrideXmlHttpRequest() {
  XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    console.debug(method, url, async, user, password)
    interceptedRequest = { method: method, url: url, async: async, user: user, password: password }; // Store URL for reference
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const url = interceptedRequest.url;

    let apis = utils.getApisToCatch();

    if (apis.some(api => url.includes(api.url))) {
      console.debug("Intercepted XHR Request:", interceptedRequest);

      // Modify request body (if JSON)
      if (typeof body === "string" && body.startsWith("{")) {
        let json = JSON.parse(body);
        apis
          .filter(api => url.includes(api.url))
          .forEach(api => {
            json = api.func(json, false);
          });
        body = JSON.stringify(json);
      }

      GM.xmlHttpRequest({
        method: interceptedRequest.method || "POST",
        url: url,
        headers: interceptedRequest.headers || {},
        data: body || null,
        onload: response => {
          console.debug("Modified Response:", response.responseText);

          if (response.status === 200) {
            let json = JSON.parse(response.responseText);
            apis
              .filter(api => url.includes(api.url))
              .forEach(api => {
                json = api.func(json, true);
              });
            response.responseText = JSON.stringify(json);
          }

          // Inject the modified response back into the page
          Object.defineProperty(this, "responseText", {
            get: () => response.responseText,
          });

          Object.defineProperty(this, "readyState", {
            get: () => 4, // Fake "done" state
          });

          Object.defineProperty(this, "status", {
            get: () => response.status,
          });

          if (this.onreadystatechange) {
            this.onreadystatechange();
          }

          if (this.onload) {
            this.onload();
          }
        },
      });

      // Block the original request
      return;
    }

    return originalSend.apply(this, arguments);
  };
}

function releaseXmlHttpRequest() {
  XMLHttpRequest.prototype.open = originalOpen;
  XMLHttpRequest.prototype.send = originalSend;
}

function init() {
  overrideFetch();
  overrideXmlHttpRequest();
}

module.exports = {
  identifier: identifier.join("."),
  isEarlyInit: true,
  shouldActivate: () => true,
  shouldNotDestroy: () => true,
  initialize: () => {
    init();
  },
  // Do actions before destroying
  destroy: () => {
    releaseFetch();
    releaseXmlHttpRequest();
  },
};
