/**
 * Custom Array type made for the sudoku with specific helper functions
 * @extends {Array}
 * @typedef {SudokuArray} SudokuArray
 */
export default class SudokuArray extends Array {
  /**
   * Gives an array of n items being their position in the array
   * @param {number} n - Amount of items in the final array
   * @returns {SudokuArray} The range array
   */
  static range(n) {
    const array = new SudokuArray(n);
    for (let i = 0; i < array.length; i += 1) {
      array[i] = i;
    }
    return array;
  }

  /**
   * Empties the array
   */
  empty() {
    this.length = 0;
  }

  /**
   * Sets every element in the array to 0
   */
  reset() {
    for (let i = 0; i < this.length; i += 1) {
      this[i] = 0;
    }
  }

  /**
   * Removes every element up to a value in an array. (Mainly used by the Sudoku Solver)
   * @param {number|string} n The value at which to stop.
   */
  popTo(n) {
    while (this.length > 0 && this[this.length - 1] === n) {
      this.pop();
    }
  }

  /**
   * Shuffles an array randomly.
   */
  shuffle() {
    for (let i = 0; i < this.length; i += 1) {
      const tailLength = this.length - i;
      const randTailPos = ~~(Math.random() * tailLength) + i; // eslint-disable-line no-bitwise
      const temp = this[i];
      this[i] = this[randTailPos];
      this[randTailPos] = temp;
    }
  }
}
