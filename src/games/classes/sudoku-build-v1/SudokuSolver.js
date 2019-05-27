import SudokuSolverMethods from './SudokuSolverMethods';
import SudokuLogItem from './SudokuLogItem';
import SudokuConstants from './SudokuConstants';
// import SudokuUtils from './SudokuUtils';

/**
 * SudokuSolver class
 * @extends SudokuSolverMethods
 */
export default class SudokuSolver extends SudokuSolverMethods {
  solve(round) {
    // console.log('solve', round);
    // this.printSolution();
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

      this.reset();
      // SudokuUtils.print(this.solution);
      // process.exit(0);
      const solutionCount = this.countSolutions(2, false);

      this.history.enabled = true;

      return solutionCount;
    }
    while (this.singleSolveMove(round)) {
      if (this.isSolved) {
        console.log('solved');
        this.printPuzzle()
        this.printSolution()
        this.rollbackRound(round);
        return 1;
      }
      if (this.isImpossible) {
        console.log('impossible');
        this.printPuzzle()
        this.printSolution()
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
}
