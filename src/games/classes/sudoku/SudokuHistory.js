import SudokuArray from './SudokuArray';
import SudokuLogItem from './SudokuLogItem'; // eslint-disable-line no-unused-vars
import SudokuUtils from './SudokuUtils';
import SudokuConstants from './SudokuConstants';

/**
 * History class for log collection
 */
export default class SudokuHistory {
  /**
   * Create new history collector
   * @param {Object} options
   * @param {boolean} options.recordHistory - Whether or not to record history in an array
   * @param {boolean} options.logHistory - Whether or not to log the history directly
   */
  constructor(options, solvedFunc) {
    this.recordHistory = options.recordHistory || true;
    this.logHistory = options.recordHistory || true;

    this._solveHistory = new SudokuArray();
    this._solveInstructions = new SudokuArray();

    this.isSolved = solvedFunc;

    this.enabled = true;
  }

  switch() {
    if (this.enabled) this.enabled = false;
    else this.enabled = true;
  }

  /**
   * @type {SudokuArray}
   */
  get solveHistory() {
    if (this.isSolved) return this._solveHistory;
    return 'No solve history - Puzzle is not possible to solve.';
  }

  /**
   * @type {SudokuArray}
   */
  get solveInstructions() {
    if (this.isSolved) return this._solveInstructions;
    return 'No solve instructions - Puzzle is not possible to solve.';
  }

  /**
   * @type {string}
   */
  get solveHistoryString() {
    if (this.isSolved) {
      return this.toString('solveHistory');
    }
    return 'No solve history - Puzzle is not possible to solve.';
  }

  /**
   * @type {string}
   */
  get solveInstructionsString() {
    if (this.isSolved) {
      return this.toString('solveHistory');
    }
    return 'No solve instructions - Puzzle is not possible to solve.';
  }

  /**
   * Get the amount of one operation type in the history
   * @param {HistoryLogTypes} history
   * @param {number} type
   */
  getLogCount(history, type) {
    let count = 0;
    for (let i = 0; i < this[history].length; i += 1) {
      if (this[history][i].type === type) count += 1;
    }
    return count;
  }

  /**
   * Converts the history into a single line string.
   * @param {HistoryLogTypes} type Log type to convert.
   * @returns {string} The solve history as a string.
   */
  toString(type) {
    let s = '';
    if (!this.recordHistory) {
      s += 'History was not recorded.\n';
    }
    for (let i = 0; i < this[type].length; i += 1) {
      s += `${i + 1}. ${this[type][i].string}\n`;
    }
    s += '\n';
    return s;
  }

  /**
   * Prints the history
   */
  printSolveHistory() {
    if (this.isSolved) {
      SudokuUtils.printNoLn(this.solveHistoryString);
    } else {
      SudokuUtils.printLn(
        'No solve history - Puzzle is not possible to solve.'
      );
    }
  }

  /**
   * Prints the history
   */
  printSolveInstructions() {
    if (this.isSolved) {
      SudokuUtils.printNoLn(this.solveInstructionsString);
    } else {
      SudokuUtils.printLn(
        'No solve instructions - Puzzle is not possible to solve.'
      );
    }
  }

  /**
   * Reset the history
   */
  reset() {
    this._solveHistory.empty();
    this._solveInstructions.empty();
  }

  /**
   * Store an item in the history.
   * @param {SudokuLogItem} item - The LogItem with all of the information.
   */
  addHistoryItem(item) {
    if (!this.logHistory && !this.recordHistory && this.enabled) return;

    if (this.logHistory) item.print();
    else {
      this._solveHistory.push(item);
      this._solveInstructions.push(item);
    }
  }

  get singleCount() {
    return this.getLogCount(
      'solveInstructions',
      SudokuConstants.debugLogTypesList.SINGLE
    );
  }

  get hiddenSingleCount() {
    return (
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_ROW
      ) +
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_COLUMN
      ) +
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_SECTION
      )
    );
  }

  get nakedPairCount() {
    return (
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.NAKED_PAIR_ROW
      ) +
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.NAKED_PAIR_COLUMN
      ) +
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.NAKED_PAIR_SECTION
      )
    );
  }

  get hiddenPairCount() {
    return (
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.HIDDEN_PAIR_ROW
      ) +
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.HIDDEN_PAIR_COLUMN
      ) +
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.HIDDEN_PAIR_SECTION
      )
    );
  }

  get boxLineReductionCount() {
    return (
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.ROW_BOX
      ) +
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.COLUMN_BOX
      )
    );
  }

  get pointingPairTripleCount() {
    return (
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.POINTING_PAIR_TRIPLE_ROW
      ) +
      this.getLogCount(
        'solveInstructions',
        SudokuConstants.debugLogTypesList.POINTING_PAIR_TRIPLE_COLUMN
      )
    );
  }

  get guessCount() {
    return this.getLogCount(
      'solveInstructions',
      SudokuConstants.debugLogTypesList.GUESS
    );
  }

  get backtrackCount() {
    return this.getLogCount(
      'solveHistory',
      SudokuConstants.debugLogTypesList.ROLLBACK
    );
  }
}

/**
 * Typedef for history types.
 * @typedef {'solveHistory' | 'solveInstructions'} HistoryLogTypes
 */
