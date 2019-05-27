/* eslint-disable no-bitwise */

export default class SudokuUtils {
  static make2DArray(n) {
    const array = Array(n);
    for (let i = 0; i < array.length; i += 1) {
      array[i] = Array(n);
    }
    return array;
  }

  static printGrid(grid) {
    console.log('-------------------');
    for (let i = 0; i < 9; i += 1) {
      let text = '|';
      for (let j = 0; j < 9; j += 1) {
        if (grid[i][j] === undefined) text += ' ';
        else text += `${grid[i][j]}`;

        if ((j + 1) % 3 === 0) text += '|';
        else text += ' ';
      }
      console.log(text);
      if ((i + 1) % 3 === 0) console.log('-------------------');
    }
  }

  static shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = ~~(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  static getRandomInt(min, max) {
    const _min = Math.ceil(min);
    const _max = Math.floor(max);
    return ~~(Math.random() * (_max - _min + 1)) + _min;
  }

  static findNullLocation(grid) {
    for (let i = 0; i < 9; i += 1) {
      for (let j = 0; j < 9; j += 1) {
        if (grid[i][j] === undefined) {
          return [i, j];
        }
      }
    }

    return [false, false];
  }

  static usedInRow(grid, i, num) {
    for (let j = 0; j < 9; j += 1) {
      if (grid[i][j] === num) return true;
    }
    return false;
  }

  static usedInCol(grid, j, num) {
    for (let i = 0; i < 9; i += 1) {
      if (grid[i][j] === num) return true;
    }
    return false;
  }

  static usedInBox(grid, boxI, boxJ, num) {
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        if (grid[i + boxI][j + boxJ] === num) return true;
      }
    }

    return false;
  }

  static isSafe(grid, i, j, num) {
    return (
      !SudokuUtils.usedInRow(grid, i, num) &&
      !SudokuUtils.usedInCol(grid, j, num) &&
      !SudokuUtils.usedInBox(grid, i - (i % 3), j - (j % 3), num)
    );
  }

  static getFilledGridPositions(grid) {
    const pos = [];
    for (let i = 0; i < grid.length; i += 1) {
      for (let j = 0; j < grid[i].length; j += 1) {
        if (grid[i][j] !== undefined) {
          pos.push([i, j]);
        }
      }
    }
    return pos;
  }

  static countSolutions(grid, count) {
    const [i, j] = SudokuUtils.findNullLocation(grid);
    if (i === false || j === false) {
      return count + 1;
    }

    for (let c = 0; c < 9 && count < 2; c += 1) {
      if (SudokuUtils.isSafe(grid, i, j, c + 1)) {
        grid[i][j] = c + 1;
        SudokuUtils.countSolutions(grid, count + 1);
      }

      grid[i][j] = undefined;
    }
  }
}
