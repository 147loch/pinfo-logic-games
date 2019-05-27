import SudokuConstants from './SudokuConstants';
import SudokuUtils from './SudokuUtils';
import SudokuLogItem from './SudokuLogItem';

export default class SudokuSolverMethods {
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
