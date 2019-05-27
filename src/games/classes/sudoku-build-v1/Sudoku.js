import Game from '../../Game';
import SudokuArray from './SudokuArray';
import SudokuConstants from './SudokuConstants';
import SudokuUtils from './SudokuUtils';
import SudokuHistory from './SudokuHistory';
import SudokuLogItem from './SudokuLogItem';
import SudokuSolver from './SudokuSolver';
import SudokuSolverMethods from './SudokuSolverMethods';

/*
 * TODO:
 * - The possibilities things should be moved to Utils with a .bind on calls.
 * - Same for shuffleArrays
 * - Convert la réponse de init en objet.
 */

const aggregation = (baseClass, ...mixins) => {
  const copyProps = (target, source) => {
    // this function copies all properties and symbols, filtering out some special ones
    Object.getOwnPropertyNames(source)
      .concat(Object.getOwnPropertySymbols(source))
      .forEach(prop => {
        if (
          !prop.match(
            /^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/
          )
        )
          Object.defineProperty(
            target,
            prop,
            Object.getOwnPropertyDescriptor(source, prop)
          );
      });
  };
  class base extends baseClass {
    constructor(...args) {
      super(...args);
      mixins.forEach(Mixin => {
        copyProps(this, new Mixin());
      });
    }
  }
  mixins.forEach(mixin => {
    // outside contructor() to allow aggregation(A,B,C).staticFunction() to be called etc.
    copyProps(base.prototype, mixin.prototype);
    copyProps(base, mixin);
  });
  return base;
};

/**
 * Sudoku Game generator and solver
 * @typedef {SudokuGame} SudokuGame
 * @extends {Game}
 * @extends {SudokuSolver}
 * @extends {SudokuSolverMethods}
 */
export default class SudokuGame extends aggregation(
  Game,
  SudokuSolverMethods,
  SudokuSolver
) {
  constructor() {
    super();

    // this.settings = new SudokuSettings(this.app, this.id);

    this.puzzle = new SudokuArray(SudokuConstants.BOARD_SIZE);
    this.solution = new SudokuArray(SudokuConstants.BOARD_SIZE);
    this.solutionRound = new SudokuArray(SudokuConstants.BOARD_SIZE);
    this.possibilities = new SudokuArray(SudokuConstants.POSSIBILITY_SIZE);
    this.randomBoardArray = SudokuArray.range(SudokuConstants.BOARD_SIZE);
    this.randomPossibilityArray = SudokuArray.range(
      SudokuConstants.ROW_COL_SEC_SIZE
    );

    // debug history
    this.history = new SudokuHistory(
      {
        recordHistory: true,
        logHistory: true,
      },
      this.isSolved
    );

    this.lastSolveRound = 0;
  }

  get givenCount() {
    let count = 0;
    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      if (this.puzzle[i] !== 0) count += 1;
    }
    return count;
  }

  // get puzzle() {
  //   return this.puzzle;
  // }

  get puzzleString() {
    return SudokuUtils.toString(this.puzzle);
  }

  get solutionString() {
    return SudokuUtils.toString(this.solution);
  }

  // set puzzle(initPuzzle) {
  //   for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
  //     this.puzzle[i] = initPuzzle[i];
  //   }
  //   return this.reset();
  // }

  generatePuzzle() {
    return this.generatePuzzleSymmetry(SudokuConstants.symmetryList.NONE);
  }

  generatePuzzleSymmetry(_symmetry) {
    let symmetry;
    if (symmetry === SudokuConstants.symmetryList.RANDOM)
      symmetry = SudokuConstants.randomSymmetry;
    else symmetry = _symmetry;
    // symmetry = SudokuConstants.symmetryList.NONE;

    this.history.enabled = false;

    this.clearPuzzle();

    this.shuffleRandomArrays();

    this.solve();

    if (symmetry === SudokuConstants.symmetryList.NONE)
      this.rollbackNonGuesses();

    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      this.puzzle[i] = this.solution[i];
    }

    this.shuffleRandomArrays();

    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      const pos = this.randomBoardArray[i];
      if (this.puzzle[pos] > 0) {
        let posSym1 = -1;
        let posSym2 = -1;
        let posSym3 = -1;
        switch (symmetry) {
          case SudokuConstants.symmetryList.ROTATE90:
            posSym2 = SudokuUtils.rowColumnToCell(
              SudokuConstants.ROW_COL_SEC_SIZE -
                1 -
                SudokuUtils.cellToColumn(pos),
              SudokuUtils.cellToRow(pos)
            );
            posSym3 = SudokuUtils.rowColumnToCell(
              SudokuUtils.cellToColumn(pos),
              SudokuConstants.ROW_COL_SEC_SIZE - 1 - SudokuUtils.cellToRow(pos)
            );
            break;
          case SudokuConstants.symmetryList.ROTATE180:
            posSym1 = SudokuUtils.rowColumnToCell(
              SudokuConstants.ROW_COL_SEC_SIZE - 1 - SudokuUtils.cellToRow(pos),
              SudokuConstants.ROW_COL_SEC_SIZE -
                1 -
                SudokuUtils.cellToColumn(pos)
            );
            break;
          case SudokuConstants.symmetryList.MIRROR:
            posSym1 = SudokuUtils.rowColumnToCell(
              SudokuUtils.cellToRow(pos),
              SudokuConstants.ROW_COL_SEC_SIZE -
                1 -
                SudokuUtils.cellToColumn(pos)
            );
            break;
          case SudokuConstants.symmetryList.FLIP:
            posSym1 = SudokuUtils.rowColumnToCell(
              SudokuConstants.ROW_COL_SEC_SIZE - 1 - SudokuUtils.cellToRow(pos),
              SudokuUtils.cellToColumn(pos)
            );
            break;
          default:
            break;
        }

        const savedValue = this.puzzle[pos];
        this.puzzle[pos] = 0;
        let savedSym1 = 0;
        if (posSym1 >= 0) {
          savedSym1 = this.puzzle[posSym1];
          this.puzzle[posSym1] = 0;
        }
        let savedSym2 = 0;
        if (posSym2 >= 0) {
          savedSym2 = this.puzzle[posSym2];
          this.puzzle[posSym2] = 0;
        }
        let savedSym3 = 0;
        if (posSym3 >= 0) {
          savedSym3 = this.puzzle[posSym3];
          this.puzzle[posSym3] = 0;
        }

        this.reset();
        if (this.countSolutions(2, true) > 1) {
          this.puzzle[pos] = savedValue;
          if (posSym1 >= 0 && savedSym1 !== 0) this.puzzle[posSym1] = savedSym1;
          if (posSym2 >= 0 && savedSym2 !== 0) this.puzzle[posSym2] = savedSym2;
          if (posSym3 >= 0 && savedSym3 !== 0) this.puzzle[posSym3] = savedSym3;
        }
      }
    }

    this.reset();

    this.history.enabled = true;

    return true;
  }

  get difficulty() {
    if (this.history.guessCount > 0)
      return SudokuConstants.difficultyList.EXPERT;
    if (this.history.boxLineReductionCount > 0)
      return SudokuConstants.difficultyList.INTERMEDIATE;
    if (this.history.pointingPairTripleCount > 0)
      return SudokuConstants.difficultyList.INTERMEDIATE;
    if (this.history.hiddenPairCount > 0)
      return SudokuConstants.difficultyList.INTERMEDIATE;
    if (this.history.nakedPairCount > 0)
      return SudokuConstants.difficultyList.INTERMEDIATE;
    if (this.history.hiddenSingleCount > 0)
      return SudokuConstants.difficultyList.EASY;
    if (this.history.singleCount > 0)
      return SudokuConstants.difficultyList.SIMPLE;
    return SudokuConstants.difficultyList.UNKNOWN;
  }

  get difficultyString() {
    switch (this.difficulty) {
      case SudokuConstants.difficultyList.EXPERT:
        return 'Expert';
      case SudokuConstants.difficultyList.INTERMEDIATE:
        return 'Intermediate';
      case SudokuConstants.difficultyList.EASY:
        return 'Easy';
      case SudokuConstants.difficultyList.SIMPLE:
        return 'Simple';
      default:
        return 'Unknown';
    }
  }

  printPuzzle() {
    return SudokuUtils.print(this.puzzle);
  }

  printSolution() {
    return SudokuUtils.print(this.solution);
  }

  reset() {
    this.solution.reset();
    this.solutionRound.reset();
    this.possibilities.reset();
    this.history.reset();

    const round = 1;
    for (let pos = 0; pos < SudokuConstants.BOARD_SIZE; pos += 1) {
      if (this.puzzle[pos] > 0) {
        const valIndex = this.puzzle[pos] - 1;
        const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
        const val = this.puzzle[pos];

        if (this.possibilities[valPos] !== 0) return false;
        this.mark(pos, round, val);
        this.history.addHistoryItem(
          new SudokuLogItem(
            round,
            SudokuConstants.debugLogTypesList.GIVEN,
            val,
            pos
          )
        );
      }
    }

    return true;
  }

  clearPuzzle() {
    this.puzzle.reset();
    this.reset();
  }

  shuffleRandomArrays() {
    this.randomBoardArray.shuffle();
    this.randomPossibilityArray.shuffle();
  }

  mark(pos, round, value) {
    if (this.solution[pos] !== 0) return false;
    if (this.solutionRound[pos] !== 0) return false;
    const valIndex = value - 1;
    this.solution[pos] = value;

    const possInd = SudokuUtils.getPossibilityIndex(valIndex, pos);
    if (this.possibilities[possInd] !== 0) return false;

    // Take the value out of the possibilities for the entire row
    this.solutionRound[pos] = round;
    const rowStart =
      SudokuUtils.cellToRow(pos) * SudokuConstants.ROW_COL_SEC_SIZE;
    for (let col = 0; col < SudokuConstants.ROW_COL_SEC_SIZE; col += 1) {
      const rowVal = rowStart + col;
      const valPos = SudokuUtils.getPossibilityIndex(valIndex, rowVal);
      if (this.possibilities[valPos] === 0) this.possibilities[valPos] = round;
    }

    // Column
    const colStart = SudokuUtils.cellToColumn(pos);
    for (let row = 0; row < SudokuConstants.ROW_COL_SEC_SIZE; row += 1) {
      const colVal = colStart + SudokuConstants.ROW_COL_SEC_SIZE * row;
      const valPos = SudokuUtils.getPossibilityIndex(valIndex, colVal);
      if (this.possibilities[valPos] === 0) this.possibilities[valPos] = round;
    }

    // Section
    const secStart = SudokuUtils.cellToSectionStartCell(pos);
    for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
      for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
        const secVal = secStart + i + SudokuConstants.ROW_COL_SEC_SIZE * j;
        const valPos = SudokuUtils.getPossibilityIndex(valIndex, secVal);
        if (this.possibilities[valPos] === 0)
          this.possibilities[valPos] = round;
      }
    }

    // The pos itself
    for (
      let _valIndex = 0;
      _valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
      _valIndex += 1
    ) {
      const valPos = SudokuUtils.getPossibilityIndex(_valIndex, pos);
      if (this.possibilities[valPos] === 0) this.possibilities[valPos] = round;
    }
  }

  countPossibilities(pos) {
    let count = 0;
    for (
      let valIndex = 0;
      valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
      valIndex += 1
    ) {
      const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
      if (this.possibilities[valPos] === 0) count += 1;
    }
    return count;
  }

  arePossibilitiesSame(pos1, pos2) {
    for (
      let valIndex = 0;
      valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
      valIndex += 1
    ) {
      const valPos1 = SudokuUtils.getPossibilityIndex(valIndex, pos1);
      const valPos2 = SudokuUtils.getPossibilityIndex(valIndex, pos2);
      if (
        (this.possibilities[valPos1] === 0 ||
          this.possibilities[valPos2] === 0) &&
        (this.possibilities[valPos1] !== 0 || this.possibilities[valPos2] !== 0)
      )
        return false;
    }
    return true;
  }

  removePossibilitiesInOneFromTwo(pos1, pos2, round) {
    let doneSomething = false;
    for (
      let valIndex = 0;
      valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
      valIndex += 1
    ) {
      const valPos1 = SudokuUtils.getPossibilityIndex(valIndex, pos1);
      const valPos2 = SudokuUtils.getPossibilityIndex(valIndex, pos2);
      if (
        this.possibilities[valPos1] === 0 &&
        this.possibilities[valPos2] === 0
      ) {
        this.possibilities[valPos2] = round;
        doneSomething = true;
      }
    }
    return doneSomething;
  }

  /**
   * Main function to generate a new Sudoku.
   * @param {Object} [settings] - All of the settings
   * @param {boolean} [settings.printPuzzle=false] - Whether or not to console.log the puzzle (DEBUG)
   * @param {boolean} [settings.printSolution=false] - Whether or not to console.log the solution (DEBUG)
   * @param {boolean} [settings.printHistory=false] - Whether or not to console.log the history (DEBUG)
   * @param {boolean} [settings.printInstructions=false] - Whether or not to console.log the solve instructions (DEBUG)
   * @param {boolean} [settings.timer=true] - Get the time it took
   * @param {boolean} [settings.countSolutions=true] - Check the amount of solutions (should be 1)
   * @param {'GENERATE' | 'SOLVE'} [settings.action='GENERATE'] - Whether or not to generate or solve a puzzle.
   * @param {number} [settings.numberToGenerate=1] - The amount of puzzles to generate
   * @param {boolean} [settings.printStats=false] - Print the stats of the puzzle (DEBUG)
   * @param {number} [settings.difficulty=3] - The difficulty the puzzle should have
   * @param {number} [settings.symmetry=2] - The symmetry the puzzle should have
   */
  init(settings) {
    const applicationStartTime = SudokuUtils.getMicroSeconds;
    let puzzleCount = 0;

    // Settings
    const printPuzzle = settings.printPuzzle || false;
    const printSolution = settings.printSolution || false;
    const printHistory = settings.printHistory || false;
    const printInstructions = settings.printInstructions || false;
    const timer = settings.timer || true;
    const countSolutions = settings.countSolutions || true;
    const action = settings.action || 'GENERATE';
    const numberToGenerate = settings.numberToGenerate || 1;
    const printStats = settings.printStats || false;
    const difficulty =
      settings.difficulty || SudokuConstants.difficultyList.INTERMEDIATE;
    const symmetry =
      settings.symmetry || SudokuConstants.symmetryList.ROTATE180;

    this.history.recordHistory =
      printHistory ||
      printInstructions ||
      printStats ||
      difficulty !== SudokuConstants.difficultyList.UNKOWN;
    this.history.logHistory = false;

    let done = false;
    let numberGenerated = 0;
    while (!done) {
      const puzzleStartTime = SudokuUtils.getMicroSeconds;

      let havePuzzle = false;
      if (action === 'GENERATE') {
        havePuzzle = this.generatePuzzleSymmetry(symmetry);
        if (!havePuzzle && printPuzzle)
          throw new Error('Could not generate puzzle.');
      } else {
        throw new Error('Solve not implemented');
      }

      let solutions = 0;

      if (havePuzzle) {
        if (countSolutions) solutions = this.countSolutions();

        if (
          printHistory ||
          printInstructions ||
          printStats ||
          difficulty !== SudokuConstants.difficultyList.UNKOWN
        )
          this.solve();

        if (action === 'GENERATE') {
          if (
            difficulty !== SudokuConstants.difficultyList.UNKOWN &&
            difficulty !== this.difficulty
          ) {
            havePuzzle = false;
          } else {
            numberGenerated += 1;
            if (numberGenerated >= numberToGenerate) done = true;
          }
        }
      }

      if (havePuzzle) {
        const puzzleDoneTime = SudokuUtils.getMicroSeconds;

        if (printPuzzle) this.printPuzzle();

        if (printSolution) this.printSolution();

        if (printHistory) this.history.printSolveHistory();
        if (printInstructions) this.history.printSolveInstructions();

        if (countSolutions) {
          if (solutions === 0)
            console.log('There are no solutions to the puzzle.');
          else if (solutions === 1)
            console.log('The solution to the puzzle is unique.');
          else console.log(`There are ${solutions} solutions to the puzzle.`);
        }

        if (timer) {
          const t = (puzzleDoneTime - puzzleStartTime) / 1000;
          console.log(`Time: ${t}ms`);
        }

        if (printStats) {
          const {
            singleCount,
            hiddenSingleCount,
            nakedPairCount,
            hiddenPairCount,
            pointingPairTripleCount,
            boxLineReductionCount,
            guessCount,
            backtrackCount,
          } = this.history;

          console.log(`Number of Givens: ${this.givenCount}`);
          console.log(`Number of Singles: ${singleCount}`);
          console.log(`Number of Hidden Singles: ${hiddenSingleCount}`);
          console.log(`Number of Naked Pairs: ${nakedPairCount}`);
          console.log(`Number of Hidden Pairs: ${hiddenPairCount}`);
          console.log(
            `Number of Pointing Pairs/Triples: ${pointingPairTripleCount}`
          );
          console.log(
            `Number of Box/Line Intersections: ${boxLineReductionCount}`
          );
          console.log(`Number of Guesses: ${guessCount}`);
          console.log(`Number of Backtracks: ${backtrackCount}`);
          console.log(`Difficulty: ${this.difficultyString}`);
        }

        puzzleCount += 1;
      }
    }

    const applicationDoneTime = SudokuUtils.getMicroSeconds;
    if (timer) {
      const t = (applicationDoneTime - applicationStartTime) / 1000000;
      console.log(
        `${puzzleCount} puzzle${puzzleCount === 1 ? '' : 's'} ${
          action === 'GENERATE' ? 'generated' : 'solved'
        } in ${t} seconds`
      );
    }
  }
}

// const deepMethods = x =>
//   x &&
//   x !== Object.prototype &&
//   Object.getOwnPropertyNames(x)
//     .filter(
//       name =>
//         !!(Object.getOwnPropertyDescriptor(x, name) || {}).get ||
//         typeof x[name] === 'function'
//     )
//     .concat(deepMethods(Object.getPrototypeOf(x)) || []);
// const classMethods = x =>
//   Array.from(new Set(deepMethods(x))).filter(
//     name => name !== 'constructor' && !~name.indexOf('__') // eslint-disable-line no-bitwise
//   );

// const solver = new SudokuSolver();
// SudokuGame.prototype.solver = {};
// classMethods(solver).forEach(k =>
//   (Object.getOwnPropertyDescriptor(solver, k) || {}).get
//     ? (SudokuGame.prototype.solver[k] = solver[k])
//     : ''
// );

// console.log(classMethods(solver));
