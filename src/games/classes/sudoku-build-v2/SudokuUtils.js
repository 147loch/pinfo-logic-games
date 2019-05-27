/* eslint-disable no-bitwise */
import SudokuConstants from './SudokuConstants';

export default class SudokuUtils {
  static cellToColumn(cell) {
    return cell % SudokuConstants.ROW_COL_SEC_SIZE;
  }

  static cellToRow(cell) {
    return ~~(cell / SudokuConstants.ROW_COL_SEC_SIZE);
  }

  static cellToSectionStartCell(cell) {
    return (
      ~~(cell / SudokuConstants.SEC_GROUP_SIZE) *
        SudokuConstants.SEC_GROUP_SIZE +
      ~~(SudokuUtils.cellToColumn(cell) / SudokuConstants.GRID_SIZE) *
        SudokuConstants.GRID_SIZE
    );
  }

  static cellToSection(cell) {
    return (
      ~~(cell / SudokuConstants.SEC_GROUP_SIZE) * SudokuConstants.GRID_SIZE +
      ~~(SudokuUtils.cellToColumn(cell) / SudokuConstants.GRID_SIZE)
    );
  }

  static rowToFirstCell(row) {
    return SudokuConstants.ROW_COL_SEC_SIZE * row;
  }

  static columnToFirstCell(column) {
    return column;
  }

  static sectionToFirstCell(section) {
    return (
      (section % SudokuConstants.GRID_SIZE) * SudokuConstants.GRID_SIZE +
      ~~(section / SudokuConstants.GRID_SIZE) +
      SudokuConstants.SEC_GROUP_SIZE
    );
  }

  static getPossibilityIndex(valueIndex, cell) {
    return valueIndex + SudokuConstants.ROW_COL_SEC_SIZE * cell;
  }

  static rowColumnToCell(row, column) {
    return row * SudokuConstants.ROW_COL_SEC_SIZE + column;
  }

  static sectionToCell(section, offset) {
    return (
      SudokuUtils.sectionToFirstCell(section) +
      ~~(offset / SudokuConstants.GRID_SIZE) *
        SudokuConstants.ROW_COL_SEC_SIZE +
      (offset % SudokuConstants.GRID_SIZE)
    );
  }

  static printLn(s) {
    console.log(s);
  }

  static printNoLn(s) {
    process.stdout.write(s);
  }

  /**
   * Prints a puzzle in the console
   * @param {import('./SudokuArray').SudokuArray} puz - Full board (length 81)
   */
  static print(puz) {
    SudokuUtils.printNoLn(SudokuUtils.toString(puz));
  }

  /**
   * Converts a puzzle to string
   * @param {import('./SudokuArray').SudokuArray} puz - Full board (length 81)
   */
  static toString(puz) {
    let s = '';
    for (let i = 0; i < SudokuConstants.BOARD_SIZE; i += 1) {
      s += ' ';
      if (puz[i] === 0) {
        s += '.';
      } else {
        s += puz[i];
      }
      if (i === SudokuConstants.BOARD_SIZE - 1) {
        s += '\n';
        s += '\n';
      } else if (
        i % SudokuConstants.ROW_COL_SEC_SIZE ===
        SudokuConstants.ROW_COL_SEC_SIZE - 1
      ) {
        s += '\n';
        if (
          i % SudokuConstants.SEC_GROUP_SIZE ===
          SudokuConstants.SEC_GROUP_SIZE - 1
        ) {
          s += '-------|-------|-------\n';
        }
      } else if (
        i % SudokuConstants.GRID_SIZE ===
        SudokuConstants.GRID_SIZE - 1
      ) {
        s += ' |';
      }
    }
    return s;
  }

  static get getMicroSeconds() {
    return new Date().getTime() * 1000;
  }
}
