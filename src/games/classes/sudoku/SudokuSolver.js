import SudokuSolverMethods from './SudokuSolverMethods';
import SudokuLogItem from './SudokuLogItem';
import SudokuConstants from './SudokuConstants';
import SudokuUtils from './SudokuUtils';

/**
 * SudokuSolver class
 * @extends SudokuSolverMethods
 */
export default class SudokuSolver extends SudokuSolverMethods {
  solve(round) {
    if (!round || round <= 1) {
      this.self.reset();
      this.self.shuffleRandomArrays();
      return this.solve(2);
    }

    this.self.lastSolveRound = round;

    console.log('puzzle');
    SudokuUtils.print(this.self.puzzle);
    console.log('solution');
    SudokuUtils.print(this.self.solution);

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
    if (!round || round <= 1) {
      this.self.history.enabled = false;

      this.self.reset();
      const solutionCount = this.countSolutions(2, false);

      this.self.history.enabled = false;

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
      if (this.self.solution[i] === 0) {
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
    this.self.history.addHistoryItem(
      new SudokuLogItem(round, SudokuConstants.debugLogTypesList.ROLLBACK)
    );
    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      if (this.self.solutionRound[i] === round) {
        this.self.solutionRound[i] = 0;
        this.self.solution[i] = 0;
      }
    }
    for (let i = 0; i < SudokuConstants.POSSIBILITY_SIZE; i += 1) {
      if (this.self.possibilities[i] === round) {
        this.self.possibilities[i] = 0;
      }
    }
    this.self.history.solveInstructions.popTo(round);
  }

  rollbackNonGuesses() {
    for (let i = 2; i <= this.self.lastSolveRound; i += 2) {
      SudokuSolver.rollbackRound(i);
    }
  }

  get givenCount() {
    let count = 0;
    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      if (this.self.puzzle[i] !== 0) count += 1;
    }
    return count;
  }
}
