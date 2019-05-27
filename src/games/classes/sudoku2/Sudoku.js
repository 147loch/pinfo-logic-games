import Game from '../../Game';
import SudokuArray from './SudokuArray';
import SudokuConstants from './SudokuConstants';
import SudokuUtils from './SudokuUtils';
import SudokuHistory from './SudokuHistory';
import SudokuLogItem from './SudokuLogItem';

/*
 * TODO:
 * - The possibilities things should be moved to Utils with a .bind on calls.
 * - Same for shuffleArrays
 * - Convert la réponse de init en objet.
 */

/**
 * Sudoku Game generator and solver
 * @typedef {SudokuGame} SudokuGame
 * @extends {Game}
 */
export default class SudokuGame extends Game {
  constructor(app, id) {
    super(app, id, 'sudoku');

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
    symmetry = SudokuConstants.symmetryList.NONE;

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
        SudokuHistory.addHistoryItem(
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
            givenCount,
            singleCount,
            hiddenSingleCount,
            nakedPairCount,
            hiddenPairCount,
            pointingPairTripleCount,
            boxLineReductionCount,
            guessCount,
            backtrackCount,
            difficultyString,
          } = this.history;

          console.log(`Number of Givens: ${givenCount}`);
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
          console.log(`Difficulty: ${difficultyString}`);
        }

        puzzleCount += 1;
      }
    }

    const applicationDoneTime = SudokuUtils.getMicroSeconds();
    if (timer) {
      const t = (applicationDoneTime - applicationStartTime) / 1000000;
      console.log(
        `${puzzleCount} puzzle${puzzleCount === 1 ? '' : 's'} ${
          action === 'GENERATE' ? 'generated' : 'solved'
        } in ${t} seconds`
      );
    }
  }

  solve(round) {
    console.log('solve', round);
    this.printSolution();
    if (!round || round <= 1) {
      this.reset();
      this.shuffleRandomArrays();
      return this.solve(2);
    }

    this.lastSolveRound = round;

    // console.log('puzzle');
    // SudokuUtils.print(this.puzzle);
    // console.log('solution');
    // SudokuUtils.print(this.solution);

    while (this.singleSolveMove(round)) {
      if (this.isSolved) return true;
      if (this.isImpossible) return false;
    }

    const nextGuessRound = round + 1;
    const nextRound = round + 2;
    for (
      let guessNumber = 0;
      this.guess(nextGuessRound, guessNumber);
      guessNumber += 1
    ) {
      if (this.isImpossible || !this.solve(nextRound)) {
        this.rollbackRound(nextRound);
        this.rollbackRound(nextGuessRound);
      } else {
        return true;
      }
    }
    return false;
  }

  countSolutions(round, limitToTwo) {
    console.log('countSolutions', round, limitToTwo);
    if (!round || round <= 1) {
      this.history.enabled = false;
      this.history.addHistoryItem(new SudokuLogItem('696969', 0));
      console.log(this.history);
      this.printPuzzle();
      this.printSolution();
      process.exit(0)

      this.reset();
      // SudokuUtils.print(this.solution);
      // process.exit(0);
      const solutionCount = this.countSolutions(2, false);

      this.history.enabled = false;

      return solutionCount;
    }
    while (this.singleSolveMove(round)) {
      if (this.isSolved) {
        this.rollbackRound(round);
        return 1;
      }
      if (this.isImpossible) {
        this.rollbackRound(round);
        return 0;
      }
    }

    let solutions = 0;
    const nextRound = round + 1;
    for (
      let guessNumber = 0;
      this.guess(nextRound, guessNumber);
      guessNumber += 1
    ) {
      solutions += this.countSolutions(nextRound, limitToTwo);
      if (limitToTwo && solutions >= 2) {
        this.rollbackRound(round);
        return solutions;
      }
    }
    this.rollbackRound(round);
    return solutions;
  }

  get isSolved() {
    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      if (this.solution[i] === 0) {
        return false;
      }
    }
    return true;
  }

  singleSolveMove(round) {
    if (this.onlyPossibilityForCell(round)) return true;
    if (this.onlyValueInSection(round)) return true;
    if (this.onlyValueInRow(round)) return true;
    if (this.onlyValueInColumn(round)) return true;
    if (this.handleNakedPairs(round)) return true;
    if (this.pointingRowReduction(round)) return true;
    if (this.pointingColumnReduction(round)) return true;
    if (this.rowBoxReduction(round)) return true;
    if (this.columnBoxReduction(round)) return true;
    if (this.hiddenPairInRow(round)) return true;
    if (this.hiddenPairInColumn(round)) return true;
    if (this.hiddenPairInSection(round)) return true;
    return false;
  }

  rollbackRound(round) {
    this.history.addHistoryItem(
      new SudokuLogItem(round, SudokuConstants.debugLogTypesList.ROLLBACK)
    );
    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      if (this.solutionRound[i] === round) {
        this.solutionRound[i] = 0;
        this.solution[i] = 0;
      }
    }
    for (let i = 0; i < SudokuConstants.POSSIBILITY_SIZE; i += 1) {
      if (this.possibilities[i] === round) {
        this.possibilities[i] = 0;
      }
    }
    this.history.solveInstructions.popTo(round);
  }

  rollbackNonGuesses() {
    for (let i = 2; i <= this.lastSolveRound; i += 2) {
      this.rollbackRound(i);
    }
  }

  get givenCount() {
    let count = 0;
    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      if (this.puzzle[i] !== 0) count += 1;
    }
    return count;
  }

  findPositionWithFewestPossibilities() {
    let minPoss = 10;
    let bestPos = 0;
    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      const pos = this.randomBoardArray[i];
      if (this.solution[pos] === 0) {
        let count = 0;
        for (
          let valIndex = 0;
          valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
          valIndex += 1
        ) {
          const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
          if (this.possibilities[valPos] === 0) count += 1;
        }
        if (count < minPoss) {
          minPoss = count;
          bestPos = pos;
        }
      }
    }
    return bestPos;
  }

  onlyPossibilityForCell(round) {
    for (let pos = 0; pos < SudokuConstants.BOARD_SIZE; pos += 1) {
      if (this.solution[pos] === 0) {
        let count = 0;
        let lastValue = 0;
        for (
          let valIndex = 0;
          valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
          valIndex += 1
        ) {
          const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
          if (this.possibilities[valPos] === 0) {
            count += 1;
            lastValue = valIndex + 1;
          }
        }
        if (count === 1) {
          this.mark(pos, round, lastValue);
          this.history.addHistoryItem(
            new SudokuLogItem(
              round,
              SudokuConstants.debugLogTypesList.SINGLE,
              lastValue,
              pos
            )
          );
          return true;
        }
      }
    }
    return false;
  }

  onlyValueInRow(round) {
    for (let row = 0; row < SudokuConstants.ROW_COL_SEC_SIZE; row += 1) {
      for (
        let valIndex = 0;
        valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let count = 0;
        let lastPos = 0;
        for (let col = 0; col < SudokuConstants.ROW_COL_SEC_SIZE; col += 1) {
          const pos = row * SudokuConstants.ROW_COL_SEC_SIZE + col;
          const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
          if (this.possibilities[valPos] === 0) {
            count += 1;
            lastPos = pos;
          }
        }
        if (count === 1) {
          const value = valIndex + 1;
          this.history.addHistoryItem(
            new SudokuLogItem(
              round,
              SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_ROW,
              value,
              lastPos
            )
          );
          this.mark(lastPos, round, value);
          return true;
        }
      }
    }
    return false;
  }

  onlyValueInColumn(round) {
    for (let col = 0; col < SudokuConstants.ROW_COL_SEC_SIZE; col += 1) {
      for (
        let valIndex = 0;
        valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let count = 0;
        let lastPos = 0;
        for (let row = 0; row < SudokuConstants.ROW_COL_SEC_SIZE; row += 1) {
          const pos = SudokuUtils.rowColumnToCell(row, col);
          const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
          if (this.possibilities[valPos] === 0) {
            count += 1;
            lastPos = pos;
          }
        }
        if (count === 1) {
          const value = valIndex + 1;
          this.history.addHistoryItem(
            new SudokuLogItem(
              round,
              SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_COLUMN,
              value,
              lastPos
            )
          );
          this.mark(lastPos, round, value);
          return true;
        }
      }
    }
    return false;
  }

  onlyValueInSection(round) {
    for (let sec = 0; sec < SudokuConstants.ROW_COL_SEC_SIZE; sec += 1) {
      const secPos = SudokuUtils.sectionToFirstCell(sec);
      for (
        let valIndex = 0;
        valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let count = 0;
        let lastPos = 0;
        for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
          for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
            const pos = secPos + i + SudokuConstants.ROW_COL_SEC_SIZE;
            const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
            if (this.possibilities[valPos] === 0) {
              count += 1;
              lastPos = pos;
            }
          }
        }
        if (count === 1) {
          const value = valIndex + 1;
          this.history.addHistoryItem(
            new SudokuLogItem(
              round,
              SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_SECTION,
              value,
              lastPos
            )
          );
          this.mark(lastPos, round, value);
          return true;
        }
      }
    }
    return false;
  }

  guess(round, guessNumber) {
    let localGuessCount = 0;
    const pos = this.findPositionWithFewestPossibilities();
    for (let i = 0; i < SudokuConstants.ROW_COL_SEC_SIZE; i += 1) {
      const valIndex = this.randomPossibilityArray[i];
      const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
      if (this.possibilities[valPos] === 0) {
        if (localGuessCount === guessNumber) {
          const value = valIndex + 1;
          this.history.addHistoryItem(
            new SudokuLogItem(
              round,
              SudokuConstants.debugLogTypesList.GUESS,
              value,
              pos
            )
          );
          this.mark(pos, round, value);
          return true;
        }
        localGuessCount += 1;
      }
    }
    return false;
  }

  get isImpossible() {
    for (let pos = 0; pos < SudokuConstants.BOARD_SIZE; pos += 1) {
      if (this.solution[pos] === 0) {
        let count = 0;
        for (
          let valIndex = 0;
          valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
          valIndex += 1
        ) {
          const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
          if (this.possibilities[valPos] === 0) count += 1;
        }
        if (count === 0) {
          return true;
        }
      }
    }
    return false;
  }

  pointingRowReduction(round) {
    for (
      let valIndex = 0;
      valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
      valIndex += 1
    ) {
      for (
        let section = 0;
        section < SudokuConstants.ROW_COL_SEC_SIZE;
        section += 1
      ) {
        const secStart = SudokuUtils.sectionToFirstCell(section);
        let inOneRow = true;
        let boxRow = -1;

        for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
          for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
            const secVal = secStart + i + SudokuConstants.ROW_COL_SEC_SIZE * j;
            const valPos = SudokuUtils.getPossibilityIndex(valIndex, secVal);
            if (this.possibilities[valPos] === 0) {
              if (boxRow === -1 || boxRow === j) boxRow = j;
              else inOneRow = false;
            }
          }
        }

        if (inOneRow && boxRow !== -1) {
          let doneSomething = false;
          const row = SudokuUtils.cellToRow(secStart) + boxRow;
          const rowStart = SudokuUtils.rowToFirstCell(row);

          for (let i = 0; i < SudokuConstants.ROW_COL_SEC_SIZE; i += 1) {
            const pos = rowStart + 1;
            const section2 = SudokuUtils.cellToSection(pos);
            const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
            if (section !== section2 && this.possibilities[valPos] === 0) {
              this.possibilities[valPos] = round;
              doneSomething = true;
            }
          }
          if (doneSomething) {
            this.history.addHistoryItem(
              new SudokuLogItem(
                round,
                SudokuConstants.debugLogTypesList.POINTING_PAIR_TRIPLE_ROW,
                valIndex + 1,
                rowStart
              )
            );
            return true;
          }
        }
      }
    }
    return false;
  }

  pointingColumnReduction(round) {
    for (
      let valIndex = 0;
      valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
      valIndex += 1
    ) {
      for (
        let section = 0;
        section < SudokuConstants.ROW_COL_SEC_SIZE;
        section += 1
      ) {
        const secStart = SudokuUtils.sectionToFirstCell(section);
        let inOneCol = true;
        let boxCol = -1;

        for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
          for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
            const secVal = secStart + i + SudokuConstants.ROW_COL_SEC_SIZE * j;
            const valPos = SudokuUtils.getPossibilityIndex(valIndex, secVal);
            if (this.possibilities[valPos] === 0) {
              if (boxCol === -1 || boxCol === j) boxCol = j;
              else inOneCol = false;
            }
          }
        }

        if (inOneCol && boxCol !== -1) {
          let doneSomething = false;
          const col = SudokuUtils.cellToColumn(secStart) + boxCol;
          const colStart = SudokuUtils.columnToFirstCell(col);

          for (let i = 0; i < SudokuConstants.ROW_COL_SEC_SIZE; i += 1) {
            const pos = colStart + 1;
            const section2 = SudokuUtils.cellToSection(pos);
            const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
            if (section !== section2 && this.possibilities[valPos] === 0) {
              this.possibilities[valPos] = round;
              doneSomething = true;
            }
          }
          if (doneSomething) {
            this.history.addHistoryItem(
              new SudokuLogItem(
                round,
                SudokuConstants.debugLogTypesList.POINTING_PAIR_TRIPLE_COLUMN,
                valIndex + 1,
                colStart
              )
            );
            return true;
          }
        }
      }
    }
    return false;
  }

  rowBoxReduction(round) {
    for (
      let valIndex = 0;
      valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
      valIndex += 1
    ) {
      for (let row = 0; row < SudokuConstants.ROW_COL_SEC_SIZE; row += 1) {
        const rowStart = SudokuUtils.rowToFirstCell(row);
        let inOneBox = true;
        let rowBox = -1;
        for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
          for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
            const col = i * SudokuConstants.GRID_SIZE + j;
            const pos = SudokuUtils.rowColumnToCell(row, col);
            const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
            if (this.possibilities[valPos] === 0) {
              if (rowBox === -1 || rowBox === i) rowBox = i;
              else inOneBox = false;
            }
          }
        }
        if (inOneBox && rowBox !== -1) {
          let doneSomething = false;
          const col = SudokuConstants.GRID_SIZE * rowBox;
          const secStart = SudokuUtils.cellToSectionStartCell(
            SudokuUtils.rowColumnToCell(row, col)
          );
          const secStartRow = SudokuUtils.cellToRow(secStart);
          const secStartCol = SudokuUtils.cellToColumn(secStart);
          for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
            for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
              const row2 = secStartRow + i;
              const col2 = secStartCol + j;
              const pos = SudokuUtils.rowColumnToCell(row2, col2);
              const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
              if (row !== row2 && this.possibilities[valPos] === 0) {
                this.possibilities[valPos] = round;
                doneSomething = true;
              }
            }
          }
          if (doneSomething) {
            this.history.addHistoryItem(
              new SudokuLogItem(
                round,
                SudokuConstants.debugLogTypesList.ROW_BOX,
                valIndex + 1,
                rowStart
              )
            );
            return true;
          }
        }
      }
    }
    return false;
  }

  columnBoxReduction(round) {
    for (
      let valIndex = 0;
      valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
      valIndex += 1
    ) {
      for (let col = 0; col < SudokuConstants.ROW_COL_SEC_SIZE; col += 1) {
        const colStart = SudokuUtils.columnToFirstCell(col);
        let inOneBox = true;
        let colBox = -1;
        for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
          for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
            const row = i * SudokuConstants.GRID_SIZE + j;
            const pos = SudokuUtils.rowColumnToCell(row, col);
            const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
            if (this.possibilities[valPos] === 0) {
              if (colBox === -1 || colBox === i) colBox = i;
              else inOneBox = false;
            }
          }
        }
        if (inOneBox && colBox !== -1) {
          let doneSomething = false;
          const row = SudokuConstants.GRID_SIZE * colBox;
          const secStart = SudokuUtils.cellToSectionStartCell(
            SudokuUtils.rowColumnToCell(row, col)
          );
          const secStartRow = SudokuUtils.cellToRow(secStart);
          const secStartCol = SudokuUtils.cellToColumn(secStart);
          for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
            for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
              const row2 = secStartRow + i;
              const col2 = secStartCol + j;
              const pos = SudokuUtils.rowColumnToCell(row2, col2);
              const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
              if (col !== col2 && this.possibilities[valPos] === 0) {
                this.possibilities[valPos] = round;
                doneSomething = true;
              }
            }
          }
          if (doneSomething) {
            this.history.addHistoryItem(
              new SudokuLogItem(
                round,
                SudokuConstants.debugLogTypesList.COLUMN_BOX,
                valIndex + 1,
                colStart
              )
            );
            return true;
          }
        }
      }
    }
    return false;
  }

  hiddenPairInRow(round) {
    for (let row = 0; row < SudokuConstants.ROW_COL_SEC_SIZE; row += 1) {
      for (
        let valIndex = 0;
        valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let c1 = -1;
        let c2 = -1;
        let valCount = 0;
        for (let col = 0; col < SudokuConstants.ROW_COL_SEC_SIZE; col += 1) {
          const pos = SudokuUtils.rowColumnToCell(row, col);
          const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
          if (this.possibilities[valPos] === 0) {
            if (c1 === -1 || c1 === col) c1 = col;
            else if (c2 === -1 || c2 === col) c2 = col;
            valCount += 1;
          }
        }
        if (valCount === 2) {
          for (
            let valIndex2 = valIndex + 1;
            valIndex2 < SudokuConstants.ROW_COL_SEC_SIZE;
            valIndex2 += 1
          ) {
            let c3 = -1;
            let c4 = -1;
            let valCount2 = 0;
            for (
              let col = 0;
              col < SudokuConstants.ROW_COL_SEC_SIZE;
              col += 1
            ) {
              const pos = SudokuUtils.rowColumnToCell(row, col);
              const valPos = SudokuUtils.getPossibilityIndex(valIndex2, pos);
              if (this.possibilities[valPos] === 0) {
                if (c3 === -1 || c3 === col) c3 = col;
                else if (c4 === -1 || c4 === col) c4 = col;
                valCount2 += 1;
              }
            }
            if (valCount2 === 2 && c1 === c3 && c2 === c4) {
              let doneSomething = false;
              for (
                let valIndex3 = 0;
                valIndex3 < SudokuConstants.ROW_COL_SEC_SIZE;
                valIndex3 += 1
              ) {
                if (valIndex3 !== valIndex && valIndex3 !== valIndex2) {
                  const pos1 = SudokuUtils.rowColumnToCell(row, c1);
                  const pos2 = SudokuUtils.rowColumnToCell(row, c2);
                  const valPos1 = SudokuUtils.getPossibilityIndex(
                    valIndex3,
                    pos1
                  );
                  const valPos2 = SudokuUtils.getPossibilityIndex(
                    valIndex3,
                    pos2
                  );
                  if (this.possibilities[valPos1] === 0) {
                    this.possibilities[valPos1] = round;
                    doneSomething = true;
                  }
                  if (this.possibilities[valPos2] === 0) {
                    this.possibilities[valPos2] = round;
                    doneSomething = true;
                  }
                }
              }
              if (doneSomething) {
                this.history.addHistoryItem(
                  new SudokuLogItem(
                    round,
                    SudokuConstants.debugLogTypesList.HIDDEN_PAIR_ROW,
                    valIndex + 1,
                    SudokuUtils.rowColumnToCell(row, c1)
                  )
                );
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  hiddenPairInColumn(round) {
    for (let col = 0; col < SudokuConstants.ROW_COL_SEC_SIZE; col += 1) {
      for (
        let valIndex = 0;
        valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let r1 = -1;
        let r2 = -1;
        let valCount = 0;
        for (let row = 0; row < SudokuConstants.ROW_COL_SEC_SIZE; row += 1) {
          const pos = SudokuUtils.rowColumnToCell(row, col);
          const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
          if (this.possibilities[valPos] === 0) {
            if (r1 === -1 || r1 === row) r1 = row;
            else if (r2 === -1 || r2 === row) r2 = row;
            valCount += 1;
          }
        }
        if (valCount === 2) {
          for (
            let valIndex2 = valIndex + 1;
            valIndex2 < SudokuConstants.ROW_COL_SEC_SIZE;
            valIndex2 += 1
          ) {
            let r3 = -1;
            let r4 = -1;
            let valCount2 = 0;
            for (
              let row = 0;
              row < SudokuConstants.ROW_COL_SEC_SIZE;
              row += 1
            ) {
              const pos = SudokuUtils.rowColumnToCell(row, col);
              const valPos = SudokuUtils.getPossibilityIndex(valIndex2, pos);
              if (this.possibilities[valPos] === 0) {
                if (r3 === -1 || r3 === row) r3 = row;
                else if (r4 === -1 || r4 === row) r4 = row;
                valCount2 += 1;
              }
            }
            if (valCount2 === 2 && r1 === r3 && r2 === r4) {
              let doneSomething = false;
              for (
                let valIndex3 = 0;
                valIndex3 < SudokuConstants.ROW_COL_SEC_SIZE;
                valIndex3 += 1
              ) {
                if (valIndex3 !== valIndex && valIndex3 !== valIndex2) {
                  const pos1 = SudokuUtils.rowColumnToCell(r1, col);
                  const pos2 = SudokuUtils.rowColumnToCell(r2, col);
                  const valPos1 = SudokuUtils.getPossibilityIndex(
                    valIndex3,
                    pos1
                  );
                  const valPos2 = SudokuUtils.getPossibilityIndex(
                    valIndex3,
                    pos2
                  );
                  if (this.possibilities[valPos1] === 0) {
                    this.possibilities[valPos1] = round;
                    doneSomething = true;
                  }
                  if (this.possibilities[valPos2] === 0) {
                    this.possibilities[valPos2] = round;
                    doneSomething = true;
                  }
                }
              }
              if (doneSomething) {
                this.history.addHistoryItem(
                  new SudokuLogItem(
                    round,
                    SudokuConstants.debugLogTypesList.HIDDEN_PAIR_COLUMN,
                    valIndex + 1,
                    SudokuUtils.rowColumnToCell(r1, col)
                  )
                );
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  hiddenPairInSection(round) {
    for (let sec = 0; sec < SudokuConstants.ROW_COL_SEC_SIZE; sec += 1) {
      for (
        let valIndex = 0;
        valIndex < SudokuConstants.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let si1 = -1;
        let si2 = -1;
        let valCount = 0;
        for (
          let secInd = 0;
          secInd < SudokuConstants.ROW_COL_SEC_SIZE;
          secInd += 1
        ) {
          const pos = SudokuUtils.sectionToCell(sec, secInd);
          const valPos = SudokuUtils.getPossibilityIndex(valIndex, pos);
          if (this.possibilities[valPos] === 0) {
            if (si1 === -1 || si1 === secInd) si1 = secInd;
            else if (si2 === -1 || si2 === secInd) si2 = secInd;
            valCount += 1;
          }
        }
        if (valCount === 2) {
          for (
            let valIndex2 = valIndex + 1;
            valIndex2 < SudokuConstants.ROW_COL_SEC_SIZE;
            valIndex2 += 1
          ) {
            let si3 = -1;
            let si4 = -1;
            let valCount2 = 0;
            for (
              let secInd = 0;
              secInd < SudokuConstants.ROW_COL_SEC_SIZE;
              secInd += 1
            ) {
              const pos = SudokuUtils.sectionToCell(sec, secInd);
              const valPos = SudokuUtils.getPossibilityIndex(valIndex2, pos);
              if (this.possibilities[valPos] === 0) {
                if (si3 === -1 || si3 === secInd) si3 = secInd;
                else if (si4 === -1 || si4 === secInd) si4 = secInd;
                valCount2 += 1;
              }
            }
            if (valCount2 === 2 && si1 === si3 && si2 === si4) {
              let doneSomething = false;
              for (
                let valIndex3 = 0;
                valIndex3 < SudokuConstants.ROW_COL_SEC_SIZE;
                valIndex3 += 1
              ) {
                if (valIndex3 !== valIndex && valIndex3 !== valIndex2) {
                  const pos1 = SudokuUtils.sectionToCell(sec, si1);
                  const pos2 = SudokuUtils.sectionToCell(sec, si2);
                  const valPos1 = SudokuUtils.getPossibilityIndex(
                    valIndex3,
                    pos1
                  );
                  const valPos2 = SudokuUtils.getPossibilityIndex(
                    valIndex3,
                    pos2
                  );
                  if (this.possibilities[valPos1] === 0) {
                    this.possibilities[valPos1] = round;
                    doneSomething = true;
                  }
                  if (this.possibilities[valPos2] === 0) {
                    this.possibilities[valPos2] = round;
                    doneSomething = true;
                  }
                }
              }
              if (doneSomething) {
                this.history.addHistoryItem(
                  new SudokuLogItem(
                    round,
                    SudokuConstants.debugLogTypesList.HIDDEN_PAIR_SECTION,
                    valIndex + 1,
                    SudokuUtils.sectionToCell(sec, si1)
                  )
                );
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  handleNakedPairs(round) {
    for (let pos = 0; pos < SudokuConstants.BOARD_SIZE; pos += 1) {
      const possibilities = this.countPossibilities(pos);
      if (possibilities === 2) {
        const row = SudokuUtils.cellToRow(pos);
        const col = SudokuUtils.cellToColumn(pos);
        const sec = SudokuUtils.cellToSectionStartCell(pos);
        for (let pos2 = pos; pos2 < SudokuConstants.BOARD_SIZE; pos2 += 1) {
          if (pos !== pos2) {
            const possibilities2 = this.countPossibilities(pos2);
            if (possibilities2 === 2 && this.arePossibilitiesSame(pos, pos2)) {
              if (row === SudokuUtils.cellToRow(pos2)) {
                let doneSomething = false;
                for (
                  let col2 = 0;
                  col2 < SudokuConstants.ROW_COL_SEC_SIZE;
                  col2 += 1
                ) {
                  const pos3 = SudokuUtils.rowColumnToCell(row, col2);
                  if (
                    pos3 !== pos &&
                    pos3 !== pos2 &&
                    this.removePossibilitiesInOneFromTwo(pos, pos3, round)
                  ) {
                    doneSomething = true;
                  }
                }
                if (doneSomething) {
                  this.history.addHistoryItem(
                    new SudokuLogItem(
                      round,
                      SudokuConstants.debugLogTypesList.NAKED_PAIR_ROW,
                      0,
                      pos
                    )
                  );
                }
              }
              if (col === SudokuUtils.cellToColumn(pos2)) {
                let doneSomething = false;
                for (
                  let row2 = 0;
                  row2 < SudokuConstants.ROW_COL_SEC_SIZE;
                  row2 += 1
                ) {
                  const pos3 = SudokuUtils.rowColumnToCell(row2, col);
                  if (
                    pos3 !== pos &&
                    pos3 !== pos2 &&
                    this.removePossibilitiesInOneFromTwo(pos, pos3, round)
                  ) {
                    doneSomething = true;
                  }
                }
                if (doneSomething) {
                  this.history.addHistoryItem(
                    new SudokuLogItem(
                      round,
                      SudokuConstants.debugLogTypesList.NAKED_PAIR_COLUMN,
                      0,
                      pos
                    )
                  );
                }
              }
              if (sec === SudokuUtils.cellToSectionStartCell(pos2)) {
                let doneSomething = false;
                const secStart = SudokuUtils.cellToSectionStartCell(pos2);
                for (let i = 0; i < SudokuConstants.GRID_SIZE; i += 1) {
                  for (let j = 0; j < SudokuConstants.GRID_SIZE; j += 1) {
                    const pos3 =
                      secStart + i + SudokuConstants.ROW_COL_SEC_SIZE * j;
                    if (
                      pos3 !== pos &&
                      pos3 !== pos2 &&
                      this.removePossibilitiesInOneFromTwo(pos, pos3, round)
                    ) {
                      doneSomething = true;
                    }
                  }
                }
                if (doneSomething) {
                  this.history.addHistoryItem(
                    new SudokuLogItem(
                      round,
                      SudokuConstants.debugLogTypesList.NAKED_PAIR_SECTION,
                      0,
                      pos
                    )
                  );
                }
              }
            }
          }
        }
      }
    }
    return false;
  }
}
