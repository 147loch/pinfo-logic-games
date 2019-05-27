import express from 'express';
import createError from 'http-errors';
import { join } from 'path';

import logger from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import browserSync from 'browser-sync';
import connectBrowserSync from 'connect-browser-sync';
import slashes from 'connect-slashes';
import lodash from 'lodash';

import RouteClass from './routes/Route';
import routes from './routes';

export default class ServerCore {
  constructor(app) {
    this.app = app;

    this.routes = new Map();
  }

  setViewEngine() {
    this.app.set('views', join(__dirname, '/views'));
    this.app.set('view engine', 'pug');
  }

  setupMiddleware() {
    this.app.use(logger('dev'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(compression());
    this.app.use(helmet());
    this.app.use(slashes(false));

    process.env.NODE_ENV = 'development';

    if (process.env.NODE_ENV === 'development') {
      const bs = browserSync({
        port: 3030,
        logSnippet: false,
        lofLevel: 'silent',
        files: [
          join(__dirname, './**/*.pug'),
          join(__dirname, './**/*.html'),
          join(__dirname, './public/**/*'),
        ],
      });

      this.app.use(connectBrowserSync(bs));
    }
  }

  registerHelpers() {
    this.app.locals._ = lodash;
  }

  setupStaticFiles() {
    this.app.use(express.static(join(__dirname, 'public')));
    // Semantic UI + jQuery
    this.app.use(
      '/libraries/jquery',
      express.static(join(__dirname, '../node_modules/jquery/dist'))
    );
    this.app.use(
      '/libraries/semantic',
      express.static(join(__dirname, './semantic'))
    );
  }

  registerRoutes() {
    Object.keys(routes).forEach(k => {
      let Route;

      if (
        typeof routes[k] === 'function' &&
        !lodash.isEqual(RouteClass, routes[k])
      ) {
        Route = new routes[k](this.app); // eslint-disable-line new-cap
      } else if (
        typeof routes[k].default === 'function' &&
        !lodash.isEqual(RouteClass, routes[k].default)
      ) {
        Route = new routes[k].default(this.app); // eslint-disable-line new-cap
      } else {
        return;
      }

      Route.register();
      this.routes.set(Route.id, Route);
    });
  }

  registerHandlers() {
    // catch 404 and forward to error handler
    this.app.use((req, res, next) => {
      next(createError(404));
    });

    // error handler
    this.app.use((err, req, res, next) => {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });
  }
}
