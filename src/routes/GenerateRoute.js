import Route from './Route';
import { qqwing as Sudoku } from '../games/classes/Sudoku';

function getMicroseconds() {
  return new Date().getTime() * 1000;
}

let puzzleStartTime;
let _output;
let success;

function stats(data) {
  let s = '';
  const givenCount = data.sudoku.getGivenCount();
  const singleCount = data.sudoku.getSingleCount();
  const hiddenSingleCount = data.sudoku.getHiddenSingleCount();
  const nakedPairCount = data.sudoku.getNakedPairCount();
  const hiddenPairCount = data.sudoku.getHiddenPairCount();
  const pointingPairTripleCount = data.sudoku.getPointingPairTripleCount();
  const boxReductionCount = data.sudoku.getBoxLineReductionCount();
  const guessCount = data.sudoku.getGuessCount();
  const backtrackCount = data.sudoku.getBacktrackCount();
  const difficultyString = data.sudoku.getDifficultyAsString();
  if (data.printStyle === Sudoku.PrintStyle.CSV) {
    s += `${givenCount},${singleCount},${hiddenSingleCount},${nakedPairCount},${hiddenPairCount},${pointingPairTripleCount},${boxReductionCount},${guessCount},${backtrackCount},${difficultyString},`;
  } else {
    s += `Number of Givens: ${givenCount}\n`;
    s += `Number of Singles: ${singleCount}\n`;
    s += `Number of Hidden Singles: ${hiddenSingleCount}\n`;
    s += `Number of Naked Pairs: ${nakedPairCount}\n`;
    s += `Number of Hidden Pairs: ${hiddenPairCount}\n`;
    s += `Number of Pointing Pairs/Triples: ${pointingPairTripleCount}\n`;
    s += `Number of Box/Line Intersections: ${boxReductionCount}\n`;
    s += `Number of Guesses: ${guessCount}\n`;
    s += `Number of Backtracks: ${backtrackCount}\n`;
    s += `Difficulty: ${difficultyString}\n`;
  }
  return s;
}

function generateNum(data, num) {
  if (num > 0) {
    let _num = num;
    data.sudoku.setRecordHistory(
      data.printHistory ||
        data.printInstructions ||
        data.printStats ||
        data.difficulty !== Sudoku.Difficulty.UNKNOWN
    );
    data.sudoku.setPrintStyle(data.printStyle);
    data.sudoku.generatePuzzleSymmetry(data.symmetry);
    if (
      data.printSolution ||
      data.printHistory ||
      data.printStats ||
      data.printInstructions ||
      data.difficulty !== Sudoku.Difficulty.UNKNOWN
    )
      data.sudoku.solve();
    if (
      data.difficulty === Sudoku.Difficulty.UNKNOWN ||
      data.difficulty === data.sudoku.getDifficulty()
    ) {
      data.doneCount += 1;
      let output = data.sudoku.getPuzzleString();
      if (data.printSolution) output += data.sudoku.getSolutionString();
      if (data.printHistory) output += data.sudoku.getSolveHistoryString();
      if (data.printInstructions)
        output += data.sudoku.getSolveInstructionsString();
      const puzzleDoneTime = getMicroseconds();
      if (data.timer) {
        const t = (puzzleDoneTime - puzzleStartTime) / 1000.0;
        if (data.printStyle === Sudoku.PrintStyle.CSV) {
          output += `${t},`;
        } else {
          output += `Time: ${t} milliseconds\n`;
        }
        puzzleStartTime = puzzleDoneTime;
      }
      if (data.printStats) output += stats(data);
      output += '\n';
      _output += output;
      _num -= 1;
    }
    setTimeout(function() {
      generateNum(data, _num);
    }, 0);
  } else {
    const applicationDoneTime = getMicroseconds();
    if (data.timer) {
      const t = (applicationDoneTime - data.applicationStartTime) / 1000000.0;
      _output += `${data.doneCount} puzzle${
        data.doneCount === 1 ? '' : 's'
      } generated in ${t} seconds.`;
    }
    return true;
  }
}

export default class IndexRoute extends Route {
  constructor(app) {
    super(app, '/generate', ['get']);
    this.id = 'generate';
    this.title = "Generate Sudokus - Loïc's Sudoku Website";
  }

  get(req, res) {
    if (req.query) {
      console.log(req.query);
      const data = {
        printSolution:
          req.query.opts && req.query.opts.includes('printsolution'),
        printPuzzle: req.query.opts && req.query.opts.includes('printpuzzle'),
        printHistory: req.query.opts && req.query.opts.includes('printhistory'),
        printInstructions:
          req.query.opts && req.query.opts.includes('printinstructions'),
        timer: req.query.opts && req.query.opts.includes('timer'),
        countSolutions:
          req.query.opts && req.query.opts.includes('countsolutions'),
        printStyle: 2,
        printStats: req.query.opts && req.query.opts.includes('printstats'),
        difficulty: req.query.difficultyselect ? req.query.difficultyselect : 0,
        symmetry: req.query.symmetryselect ? req.query.symmetryselect : 0,
        applicationStartTime: getMicroseconds(),
        sudoku: new Sudoku(),
        doneCount: 0,
      };

      console.log(data);

      puzzleStartTime = getMicroseconds();
      _output = '';
      success = true;
      generateNum(data, req.query.generatenumber);
    }

    res.render(this.id, {
      title: this.title,
      query: req.query,
      result: {
        success,
        output: _output,
      },
    });
  }
}
