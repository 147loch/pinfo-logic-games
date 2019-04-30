import SudokuUtils from './SudokuUtils';

export default class SudokuGenerator {
  constructor() {
    this.grid = null;
    this.solvedGrid = null;

    this.i = 1;
    this.amtKnown = 0;
  }

  reset() {
    this.grid = SudokuUtils.make2DArray(9);
    this.solvedGrid = SudokuUtils.make2DArray(9);
    this.amtKnown = SudokuUtils.getRandomInt(22, 32);

    this.createSeed();
    for (let i = 0; i < 9; i += 1) {
      for (let j = 0; j < 9; j += 1) {
        this.solvedGrid[i][j] = this.grid[i][j];
      }
    }
  }

  createSeed() {
    const [i, j] = SudokuUtils.findNullLocation(this.grid);

    if (i === false || j === false) return true;

    for (let k = 0; k < 9; k += 1) {
      if (SudokuUtils.isSafe(this.grid, i, j, k)) {
        this.grid[i][j] = k;
        if (this.createSeed()) return true;
        this.grid[i][j] = undefined;
      }
    }

    return false;
  }

  generateSimulatedAnnealing() {
    if (this.i === 1) {
      this.reset();
      this.i += 1;
      this.generateSimulatedAnnealing();
    } else {
      let toErase = SudokuUtils.getFilledGridPositions(this.grid);
      if (toErase.length === this.amtKnown) {
        return this.grid;
      }
      if (toErase.length < 27) {
        const p = toErase.length / (81 * 2);
        const x = Math.random();
        if (x <= p) {
          for (let i = 0; i < 2; i += 1) {
            toErase = SudokuUtils.getFilledGridPositions(this.grid);
            const posAddr = SudokuUtils.getRandomInt(0, toErase.length - 1);
            this.grid[toErase[posAddr][0]][
              toErase[posAddr][1]
            ] = this.solvedGrid[toErase[posAddr][0]][toErase[posAddr][1]];
          }
          toErase = SudokuUtils.getFilledGridPositions(this.grid);
        }
      }

      while (toErase.length > 0) {
        const temp = SudokuUtils.make2DArray(9);
        for (let i = 0; i < 9; i += 1) {
          for (let j = 0; j < 9; j += 1) {
            temp[i][j] = this.grid[i][j];
          }
        }

        const posAddr = SudokuUtils.getRandomInt(0, toErase.length - 1);
        temp[toErase[posAddr][0]][toErase[posAddr][1]] = 0;

        if (SudokuUtils.countSolutions(temp, 0) === 1) {
          SudokuUtils.printGrid(this.grid);
          const temp2 = this.generateSimulatedAnnealing();
          const temp2len = SudokuUtils.getFilledGridPositions(temp2).length;
          if (temp2len === this.amtKnown) {
            return temp2;
          }
        }

        toErase = SudokuUtils.getFilledGridPositions(this.grid);
      }

      return this.grid;
    }

    this.i = 1;
    return [this.grid, this.solvedGrid];
  }
}
