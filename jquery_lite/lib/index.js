const DomNodeCollection = require("./dom_node_collection");

const _docReadyCallbacks = [];
let _docReady = false;

const $l = arg => {
  switch (typeof arg) {
    case "function":
      return registerDocReadyCallback(arg);
    case "string":
      return getNodesFromDom(arg);
    case "object":
      if (arg instanceof HTMLElement) {
        return new DomNodeCollection([arg]);
      }
  }
};

$l.extend = (base, ...otherObjs) => {
  // eslint-disable-line flowtype/no-weak-types
  otherObjs.forEach(obj => {
    for (const prop in obj) {
      base[prop] = obj[prop];
    }
  });
  return base;
};

const METHODS_ENUM = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
};

$l.ajax = options => {
  const request = new XMLHttpRequest();
  const defaults = {
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    method: "GET",
    url: "",
    success: () => {},
    error: () => {},
    data: {}
  };
  const ajaxOptions = $l.extend(defaults, options);

  if (ajaxOptions.method === "GET") {
    // data is query string for get
    ajaxOptions.url += `?${toQueryString(ajaxOptions.data)}`;
  }

  request.open(ajaxOptions.method.toUpperCase(), ajaxOptions.url, true);
  request.onload = e => {
    // NB: Triggered when request.readyState === XMLHttpRequest.DONE ===  4
    if (request.status === 200) {
      ajaxOptions.success(request.response);
    } else {
      ajaxOptions.error(request.response);
    }
  };

  request.send(JSON.stringify(ajaxOptions.data));
};

// helper methods


const toQueryString = obj => {
  let result = "";
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      result += `${prop}=${obj[prop]}&`;
    }
  }
  return result.substring(0, result.length - 1);
};

const registerDocReadyCallback = func => {
  if (!_docReady) {
    _docReadyCallbacks.push(func);
  } else {
    func();
  }
};

const getNodesFromDom = selector => {
  const nodes = document.querySelectorAll(selector);
  const nodesArray = Array.from(nodes);
  return new DomNodeCollection(nodesArray);
};

window.$l = $l;

document.addEventListener('DOMContentLoaded', () => {
  _docReady = true;
  _docReadyCallbacks.forEach(func => func());
});