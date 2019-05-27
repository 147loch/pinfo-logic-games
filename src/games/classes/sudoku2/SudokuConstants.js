const GRID_SIZE = 3;

export default class SudokuConstants {
  static get GRID_SIZE() {
    return GRID_SIZE;
  }

  static get ROW_COL_SEC_SIZE() {
    return SudokuConstants.GRID_SIZE * SudokuConstants.GRID_SIZE;
  }

  static get SEC_GROUP_SIZE() {
    return SudokuConstants.ROW_COL_SEC_SIZE * SudokuConstants.GRID_SIZE;
  }

  static get BOARD_SIZE() {
    return SudokuConstants.ROW_COL_SEC_SIZE * SudokuConstants.ROW_COL_SEC_SIZE;
  }

  static get POSSIBILITY_SIZE() {
    return SudokuConstants.BOARD_SIZE * SudokuConstants.ROW_COL_SEC_SIZE;
  }

  static get difficultyList() {
    return {
      UNKOWN: 0,
      SIMPLE: 1,
      EASY: 2,
      INTERMEDIATE: 3,
      EXPERT: 4,
    };
  }

  static get randomSymmetry() {
    const rand = ~~(Math.random() * 4); // eslint-disable-line no-bitwise
    switch (rand) {
      case 0:
        return this.symmetryList.ROTATE90;
      case 1:
        return this.symmetryList.ROTATE180;
      case 2:
        return this.symmetryList.MIRROR;
      case 3:
        return this.symmetryList.FLIP;
      default:
        return this.symmetryList.NONE;
    }
  }

  static get symmetryList() {
    return {
      NONE: 0,
      ROTATE90: 1,
      ROTATE180: 2,
      MIRROR: 3,
      FLIP: 4,
      RANDOM: 5,
    };
  }

  static get debugLogTypesList() {
    return {
      GIVEN: 0,
      SINGLE: 1,
      HIDDEN_SINGLE_ROW: 2,
      HIDDEN_SINGLE_COLUMN: 3,
      HIDDEN_SINGLE_SECTION: 4,
      GUESS: 5,
      ROLLBACK: 6,
      NAKED_PAIR_ROW: 7,
      NAKED_PAIR_COLUMN: 8,
      NAKED_PAIR_SECTION: 9,
      POINTING_PAIR_TRIPLE_ROW: 10,
      POINTING_PAIR_TRIPLE_COLUMN: 11,
      ROW_BOX: 12,
      COLUMN_BOX: 13,
      HIDDEN_PAIR_ROW: 14,
      HIDDEN_PAIR_COLUMN: 15,
      HIDDEN_PAIR_SECTION: 16,
    };
  }
}
