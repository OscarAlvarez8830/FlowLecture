// @flow
type Callback = (event?: Event) => void;

class DomNodeCollection {
  nodes: HTMLElement[]
  constructor(nodes: HTMLElement[]) {
    // The nodes passed in must always be an Array. NodeList has no
    // #forEach method, so we need to be able to count on the type of
    // `nodes` so that we can prevent TypeErrors later on. We therefore
    // must ensure we only pass the `DomNodeCollection` constructor
    // Arrays in our core function.

    this.nodes = nodes;
  }

  each(cb: (HTMLElement, ?number) => void) {
    // Our each passes in the node and index in traditional 'forEach' order,
    // jquery passes in index first and binds the call to the element.
    this.nodes.forEach(cb);
  }

  on(eventName: string, callback: Callback) {
    this.each((node) => {
      node.addEventListener(eventName, callback);
      const eventKey = `jqliteEvents-${eventName}`;
      if (typeof node[eventKey] === "undefined") {
        node[eventKey] = [];
      }
      node[eventKey].push(callback);
    });
  }

  off(eventName: string) {
    this.each((node) => {
      const eventKey = `jqliteEvents-${eventName}`;
      if (node[eventKey]) {
        node[eventKey].forEach((callback) => {
          node.removeEventListener(eventName, callback);
        });
      }
      node[eventKey] = [];
    });
  }

  html(html: string): ?string {
    if (html === undefined) {
      if (this.nodes.length > 0) {
        return this.nodes[0].innerHTML;
      }
      return null;
    }
    if (typeof html === "string") {
      this.each((node) => {
        node.innerHTML = html;
      });
    } 
  }

  empty() {
    this.html('');
  }

  append(children: Object | string) { // eslint-disable-line flowtype/no-weak-types
    if (this.nodes.length === 0) return;

    if (typeof children === 'object' &&
        !(children instanceof DomNodeCollection)) {
      // ensure argument is coerced into DomNodeCollection
      children = window.$l(children);
    }

    if (typeof children === "string") {
      this.each((node) => {
        if (node) node.innerHTML += children;
      });
    } else {
      // You can't append the same child node to multiple parents,
      // so we must duplicate the child nodes here.
      this.each((node) => {
        // The argument to cloneNode indicates whether or not
        // all children should be cloned.
        children instanceof DomNodeCollection && children.each((childNode) => {
          node.appendChild(childNode.cloneNode(true));
        });
      });
    }
  }

  remove() {
    this.each(node => {
      node.parentNode && node.parentNode.removeChild(node)
    });
  }

  attr(key: string, val: string): ?string {
    if (typeof val === "string") {
      this.each(node => {
        node && node.setAttribute(key, val)
      });
    } else if (this.nodes[0]) {
      return this.nodes[0].getAttribute(key);
    }
  }

  addClass(newClass: string) {
    this.each((node) => node.classList.add(newClass));
  }

  removeClass(oldClass: string) {
    this.each(node => node.classList.remove(oldClass));
  }

  toggleClass(toggleClass: string) {
    this.each(node => {
      node.classList.toggle(toggleClass);
    });
  }

  find(selector: string): DomNodeCollection {
    let foundNodes = [];
    this.each((node) => {
      const nodeList = node.querySelectorAll(selector);
      foundNodes = foundNodes.concat(Array.from(nodeList));
    });
    return new DomNodeCollection(foundNodes);
  }

  children(): DomNodeCollection {
    let childNodes = [];
    this.each((node) => {
      const childNodeList = node.children;
      childNodes = childNodes.concat(Array.from(childNodeList));
    });
    return new DomNodeCollection(childNodes);
  }

  parent(): DomNodeCollection {
    const parentNodes: HTMLElement[] = [];
    this.each(({ parentNode }) => {
      // we apply 'visited' property to prevent adding duplicate parents
      if (parentNode && !parentNode.visited) {
        parentNodes.push(parentNode);
        parentNode.visited = true;
      }
    });

    parentNodes.forEach((node) => {
      node.visited = false;
    });
    return new DomNodeCollection(parentNodes);
  }
}

module.exports = DomNodeCollection;
