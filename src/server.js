import express from 'express';
import ServerCore from './ServerCore';

const app = express();
const Server = new ServerCore(app);

// Configuration of server
Server.setViewEngine();
Server.setupMiddleware();
Server.registerHelpers();
Server.setupStaticFiles();
Server.registerRoutes();
Server.registerHandlers();

// const Games = new GamesCore(Server.app); For the future.
// const Sudoku = new SudokuGame(Server.app, 1);

export default Server.app;
