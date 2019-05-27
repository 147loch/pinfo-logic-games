import express from 'express';
import ServerCore from './ServerCore';
import SudokuGame from './games/classes/sudoku/Sudoku';

const app = express();
const Server = new ServerCore(app);

// Configuration of server
Server.setViewEngine();
Server.setupMiddleware();
Server.registerHelpers();
Server.setupStaticFiles();
Server.registerRoutes();
Server.registerHandlers();

// const Games = new GamesCore(Server.app);
const Sudoku = new SudokuGame(Server.app, 1);
Sudoku.init({
  printPuzzle: true,
  printSolution: true,
  printHistory: false,
  printInstructions: false,
  printStats: true,
  timer: true,
  countSolutions: true,
  action: 'GENERATE',
  numberToGenerate: 1,
});

export default Server.app;
