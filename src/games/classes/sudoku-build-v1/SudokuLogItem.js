import SudokuUtils from './SudokuUtils';
import SudokuConstants from './SudokuConstants';

export default class SudokuLogItem {
  constructor(round, type, value, pos) {
    this.round = round;
    this.type = type;
    this.value = value;
    this.pos = pos;
  }

  get column() {
    if (this.pos === -1) return -1;
    return SudokuUtils.cellToColumn(this.pos);
  }

  get row() {
    if (this.pos === -1) return -1;
    return SudokuUtils.cellToRow(this.pos);
  }

  get position() {
    return this.pos;
  }

  get description() {
    switch (this.type) {
      case SudokuConstants.debugLogTypesList.GIVEN:
        return 'Mark given';
      case SudokuConstants.debugLogTypesList.ROLLBACK:
        return 'Roll back round';
      case SudokuConstants.debugLogTypesList.GUESS:
        return 'Mark guess (start round)';
      case SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_ROW:
        return 'Mark single possibility for value in row';
      case SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_COLUMN:
        return 'Mark single possibility for value in column';
      case SudokuConstants.debugLogTypesList.HIDDEN_SINGLE_SECTION:
        return 'Mark single possibility for value in section';
      case SudokuConstants.debugLogTypesList.SINGLE:
        return 'Mark only possibility for cell';
      case SudokuConstants.debugLogTypesList.NAKED_PAIR_ROW:
        return 'Remove possibilities for naked pair in row';
      case SudokuConstants.debugLogTypesList.NAKED_PAIR_COLUMN:
        return 'Remove possibilities for naked pair in column';
      case SudokuConstants.debugLogTypesList.NAKED_PAIR_SECTION:
        return 'Remove possibilities for naked pair in section';
      case SudokuConstants.debugLogTypesList.POINTING_PAIR_TRIPLE_ROW:
        return 'Remove possibilities for row because all values are in one section';
      case SudokuConstants.debugLogTypesList.POINTING_PAIR_TRIPLE_COLUMN:
        return 'Remove possibilities for column because all values are in one section';
      case SudokuConstants.debugLogTypesList.ROW_BOX:
        return 'Remove possibilities for section because all values are in one row';
      case SudokuConstants.debugLogTypesList.COLUMN_BOX:
        return 'Remove possibilities for section because all values are in one column';
      case SudokuConstants.debugLogTypesList.HIDDEN_PAIR_ROW:
        return 'Remove possibilities from hidden pair in row';
      case SudokuConstants.debugLogTypesList.HIDDEN_PAIR_COLUMN:
        return 'Remove possibilities from hidden pair in column';
      case SudokuConstants.debugLogTypesList.HIDDEN_PAIR_SECTION:
        return 'Remove possibilities from hidden pair in section';
      default:
        return '!!! Performed unknown optimization !!!';
    }
  }

  print() {
    SudokuUtils.printLn(this.string);
  }

  get string() {
    let s = `Round ${this.round} - ${this.description}`;
    if (this.value > 0 || this.position > -1) {
      s += ' (';
      let printed = false;
      if (this.position > -1) {
        if (printed) s += ' - ';
        s += `Row: ${SudokuUtils.cellToRow(this.position) +
          1} - Column: ${SudokuUtils.cellToColumn(this.position) + 1}`;
        printed = true;
      }
      if (this.value > 0) {
        if (printed) s += ' - ';
        s += `Value: ${this.value}`;
        printed = true;
      }
      s += ')';
    }
    return s;
  }
}
