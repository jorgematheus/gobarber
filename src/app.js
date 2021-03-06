import 'dotenv/config';
import 'express-async-errors';
import Youch from 'youch';
import express from 'express';
import path from 'path';
import * as Sentry from '@sentry/node';
import routes from './routes';
import configSentry from './config/sentry';

import './database';

class App {
  constructor() {
    this.server = express();
    Sentry.init(configSentry);
    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  // middleware para capturar todos os erros da aplicação
  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        // Youch = formata os erros para json
        const errors = await new Youch(err, req).toJSON();

        return res.status(500).json(errors);
      }

      return res.status(500).json({ error: 'Internal server error.' });
    });
  }
}

export default new App().server;
