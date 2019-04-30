import { Router } from 'express';

export default class Route {
  constructor(app, addr, methods) {
    this.app = app;
    this.addr = addr;
    this.methods = methods;

    this.router = Router();
  }

  registerRouter() {
    this.app.use('/', this.router);
  }

  registerMethods() {
    for (const method of this.methods) {
      if (typeof this[method] === 'function')
        this.router[method](this.addr, this[method].bind(this));
      else if (typeof this.constructor[method] === 'function')
        this.router[method](this.addr, this.constructor[method].bind(this));
    }
  }

  register() {
    this.registerMethods();
    this.registerRouter();
  }
}
