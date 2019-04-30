/* eslint-disable no-bitwise */
import Game from '../Game';
import SudokuUtils from './SudokuUtils';
import SudokuGenerator from './SudokuGenerator';

const Generator = new SudokuGenerator();

/**
 * TODO:
 *  - Plus de réglages par rapport à la difficulté
 *  - Sauvegarde des paramètres et capacité de restaurer depuis la sauvegarde
 *
 *  - faire une Promise avec les générateurs
 */

export default class SudokuGame extends Game {
  constructor(app, id) {
    super(app, id, 'sudoku');

    this.grid = null;
    this.solvedGrid = null;
    this.symmetricGrid = null;
    this.guessNum = null;
    this.gridPos = null;
    this.difficultyLevel = 0;

    this.solCount = 0;
  }

  init() {
    this.grid = SudokuUtils.make2DArray(9);
    this.solvedGrid = SudokuUtils.make2DArray(9);

    this.guessNum = Array(9);
    this.gridPos = Array(81);

    for (let i = 0; i < 81; i += 1) {
      this.gridPos[i] = i;
    }
    SudokuUtils.shuffleArray(this.gridPos);

    for (let i = 0; i < 9; i += 1) {
      this.guessNum[i] = i + 1;
    }
    SudokuUtils.shuffleArray(this.guessNum);
  }

  generate() {
    // this.createSeed();
    // this.genPuzzle();
    SudokuUtils.printGrid(Generator.generateSimulatedAnnealing());
    // SudokuUtils.printGrid(this.grid);
    // SudokuUtils.printGrid(this.solvedGrid);

    this.calculateDifficulty();
    console.log(this.difficultyLevel);
  }

  solveGrid() {
    const [i, j] = SudokuUtils.findNullLocation(this.grid);

    // If following, we're done.
    if (i === false || j === false) return true;

    for (let k = 0; k < 9; k += 1) {
      if (SudokuUtils.isSafe(this.grid, i, j, this.guessNum[k])) {
        this.grid[i][j] = this.guessNum[k];

        if (this.solveGrid()) return true;

        this.grid[i][j] = undefined;
      }
    }

    return false;
  }

  countSolutions(grid) {
    const [i, j] = SudokuUtils.findNullLocation(grid);
    if (i === false || j === false) {
      this.solCount += 1;
      return this.solCount;
    }

    for (let c = 0; c < 9 && this.solCount < 2; c += 1) {
      if (SudokuUtils.isSafe(grid, i, j, this.guessNum[c])) {
        grid[i][j] = this.guessNum[c];
        this.countSolutions(grid);
      }

      grid[i][j] = undefined;
    }
  }

  genPuzzle() {
    for (let k = 0; k < 81; k += 1) {
      const x = ~~(this.gridPos[k] / 9);
      const y = this.gridPos[k] % 9;
      const temp = this.grid[x][y];

      this.grid[x][y] = undefined;
      this.solCount = 0;
      this.countSolutions(this.grid);

      if (this.solCount !== 1) {
        this.grid[x][y] = temp;
      }
    }
  }

  branchDifficultyScore() {
    let emptyPositions = -1;
    let sum = 0;

    const tempGrid = SudokuUtils.make2DArray(9);
    for (let i = 0; i < 9; i += 1) {
      for (let j = 0; j < 9; j += 1) {
        tempGrid[i][j] = this.grid[i][j];
      }
    }

    while (emptyPositions !== 0) {
      const branchList = [];

      for (let i = 0; i < 81; i += 1) {
        if (tempGrid[~~(i / 9)][i % 9] === undefined) {
          const list = [];
          list.push(i);

          for (let k = 1; k <= 9; k += 1) {
            if (SudokuUtils.isSafe(tempGrid, ~~(i / 9), i % 9, k)) {
              list.push(k);
            }
          }

          branchList.push(list);
        }
      }

      if (branchList.length === 0) {
        return sum;
      }

      let minIndex = 0;
      for (let i = 0; i < branchList.length; i += 1) {
        if (branchList[i].length < branchList[minIndex].length) minIndex = i;
      }

      const branchFactor = branchList[minIndex].length;
      const x = ~~(branchList[minIndex][0] / 9);
      const y = branchList[minIndex][0] % 9;

      tempGrid[x][y] = this.solvedGrid[x][y];
      sum += (branchFactor - 2) * (branchFactor - 2);

      emptyPositions = branchList.length - 1;
    }

    return sum;
  }

  calculateDifficulty() {
    const b = this.branchDifficultyScore();
    let emptyCellsCount = 0;

    for (let i = 0; i < 9; i += 1) {
      for (let j = 0; j < 9; j += 1) {
        if (this.grid[i][j] === undefined) emptyCellsCount += 1;
      }
    }

    this.difficultyLevel = b * 100 + emptyCellsCount;
  }

  createSeed() {
    this.init();
    this.solveGrid();

    for (let i = 0; i < 9; i += 1) {
      for (let j = 0; j < 9; j += 1) {
        this.solvedGrid[i][j] = this.grid[i][j];
      }
    }
  }
}
