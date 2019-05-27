/* eslint-disable no-param-reassign */
export const Sudoku = function() {
  const cellToColumn = cell => cell % Sudoku.ROW_COL_SEC_SIZE;
  const cellToRow = cell => Math.floor(cell / Sudoku.ROW_COL_SEC_SIZE);
  const cellToSectionStartCell = cell =>
    Math.floor(cell / Sudoku.SEC_GROUP_SIZE) * Sudoku.SEC_GROUP_SIZE +
    Math.floor(cellToColumn(cell) / Sudoku.GRID_SIZE) * Sudoku.GRID_SIZE;
  const cellToSection = cell =>
    Math.floor(cell / Sudoku.SEC_GROUP_SIZE) * Sudoku.GRID_SIZE +
    Math.floor(cellToColumn(cell) / Sudoku.GRID_SIZE);
  const rowToFirstCell = row => Sudoku.ROW_COL_SEC_SIZE * row;
  const columnToFirstCell = column => column;
  const sectionToFirstCell = section =>
    (section % Sudoku.GRID_SIZE) * Sudoku.GRID_SIZE +
    Math.floor(section / Sudoku.GRID_SIZE) * Sudoku.SEC_GROUP_SIZE;
  const getPossibilityIndex = (valueIndex, cell) =>
    valueIndex + Sudoku.ROW_COL_SEC_SIZE * cell;
  const rowColumnToCell = (row, column) =>
    row * Sudoku.ROW_COL_SEC_SIZE + column;
  const sectionToCell = (section, offset) =>
    sectionToFirstCell(section) +
    Math.floor(offset / Sudoku.GRID_SIZE) * Sudoku.ROW_COL_SEC_SIZE +
    (offset % Sudoku.GRID_SIZE);

  const println = s => {
    if (typeof console !== 'undefined' && console.log) console.log(s);
  };
  const printnoln = s => {
    if (
      typeof process !== 'undefined' &&
      process.stdout &&
      process.stdout.write
    )
      process.stdout.write(s);
    else println(s);
  };

  const puzzle = new Array(Sudoku.BOARD_SIZE);
  const solution = new Array(Sudoku.BOARD_SIZE);
  const solutionRound = new Array(Sudoku.BOARD_SIZE);
  const possibilities = new Array(Sudoku.POSSIBILITY_SIZE);
  const randomBoardArray = new Array(Sudoku.BOARD_SIZE);

  for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
    randomBoardArray[i] = i;
  }

  const randomPossibilityArray = new Array(Sudoku.ROW_COL_SEC_SIZE);

  for (let i = 0; i < Sudoku.ROW_COL_SEC_SIZE; i += 1) {
    randomPossibilityArray[i] = i;
  }

  let recordHistory = false;
  let logHistory = false;
  let solveHistory = [];
  let solveInstructions = [];
  let printStyle = Sudoku.PrintStyle.READABLE;
  let lastSolveRound = 0;

  const mark = (position, round, value) => {
    if (solution[position] !== 0)
      throw new Error('Marking position that already has been marked.');
    if (solutionRound[position] !== 0)
      throw new Error('Marking position that was marked another round.');
    const valIndex = value - 1;
    solution[position] = value;

    const possInd = getPossibilityIndex(valIndex, position);
    if (possibilities[possInd] !== 0)
      throw new Error('Marking impossible position.');

    solutionRound[position] = round;
    const rowStart = cellToRow(position) * Sudoku.ROW_COL_SEC_SIZE;
    for (let col = 0; col < Sudoku.ROW_COL_SEC_SIZE; col += 1) {
      const rowVal = rowStart + col;
      const valPos = getPossibilityIndex(valIndex, rowVal);
      if (possibilities[valPos] === 0) {
        possibilities[valPos] = round;
      }
    }

    const colStart = cellToColumn(position);
    for (let i = 0; i < Sudoku.ROW_COL_SEC_SIZE; i += 1) {
      const colVal = colStart + Sudoku.ROW_COL_SEC_SIZE * i;
      const valPos = getPossibilityIndex(valIndex, colVal);
      if (possibilities[valPos] === 0) {
        possibilities[valPos] = round;
      }
    }

    const secStart = cellToSectionStartCell(position);
    for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
      for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
        const secVal = secStart + i + Sudoku.ROW_COL_SEC_SIZE * j;
        const valPos = getPossibilityIndex(valIndex, secVal);
        if (possibilities[valPos] === 0) {
          possibilities[valPos] = round;
        }
      }
    }

    for (
      let _valIndex = 0;
      _valIndex < Sudoku.ROW_COL_SEC_SIZE;
      _valIndex += 1
    ) {
      const valPos = getPossibilityIndex(_valIndex, position);
      if (possibilities[valPos] === 0) {
        possibilities[valPos] = round;
      }
    }
  };

  const addHistoryItem = l => {
    if (logHistory) l.print();
    if (recordHistory) {
      solveHistory.push(l);
      solveInstructions.push(l);
    }
  };

  const reset = function() {
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      solution[i] = 0;
    }
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      solutionRound[i] = 0;
    }
    for (let i = 0; i < Sudoku.POSSIBILITY_SIZE; i += 1) {
      possibilities[i] = 0;
    }
    solveHistory = [];
    solveInstructions = [];

    const round = 1;
    for (let position = 0; position < Sudoku.BOARD_SIZE; position += 1) {
      if (puzzle[position] > 0) {
        const valIndex = puzzle[position] - 1;
        const valPos = getPossibilityIndex(valIndex, position);
        const value = puzzle[position];
        if (possibilities[valPos] !== 0) return false;
        mark.call(this, position, round, value);
        if (logHistory || recordHistory)
          addHistoryItem.call(
            this,
            new this.LogItem(round, Sudoku.LogType.GIVEN, value, position)
          );
      }
    }
    return true;
  };

  const onlyPossibilityForCell = round => {
    for (let position = 0; position < Sudoku.BOARD_SIZE; position += 1) {
      if (solution[position] === 0) {
        let count = 0;
        let lastValue = 0;
        for (
          let valIndex = 0;
          valIndex < Sudoku.ROW_COL_SEC_SIZE;
          valIndex += 1
        ) {
          const valPos = getPossibilityIndex(valIndex, position);
          if (possibilities[valPos] === 0) {
            count += 1;
            lastValue = valIndex + 1;
          }
        }
        if (count === 1) {
          mark.call(this, position, round, lastValue);
          if (logHistory || recordHistory)
            addHistoryItem.call(
              this,
              new this.LogItem(
                round,
                Sudoku.LogType.SINGLE,
                lastValue,
                position
              )
            );
          return true;
        }
      }
    }
    return false;
  };

  const onlyValueInRow = round => {
    for (let row = 0; row < Sudoku.ROW_COL_SEC_SIZE; row += 1) {
      for (
        let valIndex = 0;
        valIndex < Sudoku.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let count = 0;
        let lastPosition = 0;
        for (let col = 0; col < Sudoku.ROW_COL_SEC_SIZE; col += 1) {
          const position = row * Sudoku.ROW_COL_SEC_SIZE + col;
          const valPos = getPossibilityIndex(valIndex, position);
          if (possibilities[valPos] === 0) {
            count += 1;
            lastPosition = position;
          }
        }
        if (count === 1) {
          const value = valIndex + 1;
          if (logHistory || recordHistory)
            addHistoryItem.call(
              this,
              new this.LogItem(
                round,
                Sudoku.LogType.HIDDEN_SINGLE_ROW,
                value,
                lastPosition
              )
            );
          mark.call(this, lastPosition, round, value);
          return true;
        }
      }
    }
    return false;
  };

  const onlyValueInColumn = round => {
    for (let col = 0; col < Sudoku.ROW_COL_SEC_SIZE; col += 1) {
      for (
        let valIndex = 0;
        valIndex < Sudoku.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let count = 0;
        let lastPosition = 0;
        for (let row = 0; row < Sudoku.ROW_COL_SEC_SIZE; row += 1) {
          const position = rowColumnToCell(row, col);
          const valPos = getPossibilityIndex(valIndex, position);
          if (possibilities[valPos] === 0) {
            count += 1;
            lastPosition = position;
          }
        }
        if (count === 1) {
          const value = valIndex + 1;
          if (logHistory || recordHistory)
            addHistoryItem.call(
              this,
              new this.LogItem(
                round,
                Sudoku.LogType.HIDDEN_SINGLE_COLUMN,
                value,
                lastPosition
              )
            );
          mark.call(this, lastPosition, round, value);
          return true;
        }
      }
    }
    return false;
  };

  const onlyValueInSection = round => {
    for (let sec = 0; sec < Sudoku.ROW_COL_SEC_SIZE; sec += 1) {
      const secPos = sectionToFirstCell(sec);
      for (
        let valIndex = 0;
        valIndex < Sudoku.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let count = 0;
        let lastPosition = 0;
        for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
          for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
            const position = secPos + i + Sudoku.ROW_COL_SEC_SIZE * j;
            const valPos = getPossibilityIndex(valIndex, position);
            if (possibilities[valPos] === 0) {
              count += 1;
              lastPosition = position;
            }
          }
        }
        if (count === 1) {
          const value = valIndex + 1;
          if (logHistory || recordHistory)
            addHistoryItem.call(
              this,
              new this.LogItem(
                round,
                Sudoku.LogType.HIDDEN_SINGLE_SECTION,
                value,
                lastPosition
              )
            );
          mark.call(this, lastPosition, round, value);
          return true;
        }
      }
    }
    return false;
  };

  const findPositionWithFewestPossibilities = function() {
    let minPossibilities = 10;
    let bestPosition = 0;
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      const position = randomBoardArray[i];
      if (solution[position] === 0) {
        let count = 0;
        for (
          let valIndex = 0;
          valIndex < Sudoku.ROW_COL_SEC_SIZE;
          valIndex += 1
        ) {
          const valPos = getPossibilityIndex(valIndex, position);
          if (possibilities[valPos] === 0) count += 1;
        }
        if (count < minPossibilities) {
          minPossibilities = count;
          bestPosition = position;
        }
      }
    }
    return bestPosition;
  };

  const countPossibilities = position => {
    let count = 0;
    for (let valIndex = 0; valIndex < Sudoku.ROW_COL_SEC_SIZE; valIndex += 1) {
      const valPos = getPossibilityIndex(valIndex, position);
      if (possibilities[valPos] === 0) count += 1;
    }
    return count;
  };

  const arePossibilitiesSame = (position1, position2) => {
    for (let valIndex = 0; valIndex < Sudoku.ROW_COL_SEC_SIZE; valIndex += 1) {
      const valPos1 = getPossibilityIndex(valIndex, position1);
      const valPos2 = getPossibilityIndex(valIndex, position2);
      if (
        (possibilities[valPos1] === 0 || possibilities[valPos2] === 0) &&
        (possibilities[valPos1] !== 0 || possibilities[valPos2] !== 0)
      ) {
        return false;
      }
    }
    return true;
  };

  const guess = (round, guessNumber) => {
    let localGuessCount = 0;
    const position = findPositionWithFewestPossibilities.call(this);
    for (let i = 0; i < Sudoku.ROW_COL_SEC_SIZE; i += 1) {
      const valIndex = randomPossibilityArray[i];
      const valPos = getPossibilityIndex(valIndex, position);
      if (possibilities[valPos] === 0) {
        if (localGuessCount === guessNumber) {
          const value = valIndex + 1;
          if (logHistory || recordHistory)
            addHistoryItem.call(
              this,
              new this.LogItem(round, Sudoku.LogType.GUESS, value, position)
            );
          mark.call(this, position, round, value);
          return true;
        }
        localGuessCount += 1;
      }
    }
    return false;
  };

  const isImpossible = function() {
    for (let position = 0; position < Sudoku.BOARD_SIZE; position += 1) {
      if (solution[position] === 0) {
        let count = 0;
        for (
          let valIndex = 0;
          valIndex < Sudoku.ROW_COL_SEC_SIZE;
          valIndex += 1
        ) {
          const valPos = getPossibilityIndex(valIndex, position);
          if (possibilities[valPos] === 0) count += 1;
        }
        if (count === 0) {
          return true;
        }
      }
    }
    return false;
  };

  const rollbackRound = round => {
    if (logHistory || recordHistory)
      addHistoryItem.call(
        this,
        new this.LogItem(round, Sudoku.LogType.ROLLBACK)
      );
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      if (solutionRound[i] === round) {
        solutionRound[i] = 0;
        solution[i] = 0;
      }
    }
    for (let i = 0; i < Sudoku.POSSIBILITY_SIZE; i += 1) {
      if (possibilities[i] === round) {
        possibilities[i] = 0;
      }
    }

    while (
      solveInstructions.length > 0 &&
      solveInstructions[solveInstructions.length - 1] === round
    ) {
      solveInstructions.pop();
    }
  };

  const pointingRowReduction = round => {
    for (let valIndex = 0; valIndex < Sudoku.ROW_COL_SEC_SIZE; valIndex += 1) {
      for (let section = 0; section < Sudoku.ROW_COL_SEC_SIZE; section += 1) {
        const secStart = sectionToFirstCell(section);
        let inOneRow = true;
        let boxRow = -1;
        for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
          for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
            const secVal = secStart + i + Sudoku.ROW_COL_SEC_SIZE * j;
            const valPos = getPossibilityIndex(valIndex, secVal);
            if (possibilities[valPos] === 0) {
              if (boxRow === -1 || boxRow === j) {
                boxRow = j;
              } else {
                inOneRow = false;
              }
            }
          }
        }
        if (inOneRow && boxRow !== -1) {
          let doneSomething = false;
          const row = cellToRow(secStart) + boxRow;
          const rowStart = rowToFirstCell(row);

          for (let i = 0; i < Sudoku.ROW_COL_SEC_SIZE; i += 1) {
            const position = rowStart + i;
            const section2 = cellToSection(position);
            const valPos = getPossibilityIndex(valIndex, position);
            if (section !== section2 && possibilities[valPos] === 0) {
              possibilities[valPos] = round;
              doneSomething = true;
            }
          }
          if (doneSomething) {
            if (logHistory || recordHistory)
              addHistoryItem.call(
                this,
                new this.LogItem(
                  round,
                  Sudoku.LogType.POINTING_PAIR_TRIPLE_ROW,
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
  };

  const rowBoxReduction = round => {
    for (let valIndex = 0; valIndex < Sudoku.ROW_COL_SEC_SIZE; valIndex += 1) {
      for (let row = 0; row < Sudoku.ROW_COL_SEC_SIZE; row += 1) {
        const rowStart = rowToFirstCell(row);
        let inOneBox = true;
        let rowBox = -1;
        for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
          for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
            const column = i * Sudoku.GRID_SIZE + j;
            const position = rowColumnToCell(row, column);
            const valPos = getPossibilityIndex(valIndex, position);
            if (possibilities[valPos] === 0) {
              if (rowBox === -1 || rowBox === i) {
                rowBox = i;
              } else {
                inOneBox = false;
              }
            }
          }
        }
        if (inOneBox && rowBox !== -1) {
          let doneSomething = false;
          const column = Sudoku.GRID_SIZE * rowBox;
          const secStart = cellToSectionStartCell(rowColumnToCell(row, column));
          const secStartRow = cellToRow(secStart);
          const secStartCol = cellToColumn(secStart);
          for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
            for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
              const row2 = secStartRow + i;
              const col2 = secStartCol + j;
              const position = rowColumnToCell(row2, col2);
              const valPos = getPossibilityIndex(valIndex, position);
              if (row !== row2 && possibilities[valPos] === 0) {
                possibilities[valPos] = round;
                doneSomething = true;
              }
            }
          }
          if (doneSomething) {
            if (logHistory || recordHistory)
              addHistoryItem.call(
                this,
                new this.LogItem(
                  round,
                  Sudoku.LogType.ROW_BOX,
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
  };

  const colBoxReduction = round => {
    for (let valIndex = 0; valIndex < Sudoku.ROW_COL_SEC_SIZE; valIndex += 1) {
      for (let row = 0; row < Sudoku.ROW_COL_SEC_SIZE; row += 1) {
        const rowStart = rowToFirstCell(row);
        let inOneBox = true;
        let rowBox = -1;
        for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
          for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
            const column = i * Sudoku.GRID_SIZE + j;
            const position = rowColumnToCell(row, column);
            const valPos = getPossibilityIndex(valIndex, position);
            if (possibilities[valPos] === 0) {
              if (rowBox === -1 || rowBox === i) {
                rowBox = i;
              } else {
                inOneBox = false;
              }
            }
          }
        }
        if (inOneBox && rowBox !== -1) {
          let doneSomething = false;
          const column = Sudoku.GRID_SIZE * rowBox;
          const secStart = cellToSectionStartCell(rowColumnToCell(row, column));
          const secStartRow = cellToRow(secStart);
          const secStartCol = cellToColumn(secStart);
          for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
            for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
              const row2 = secStartRow + i;
              const col2 = secStartCol + j;
              const position = rowColumnToCell(row2, col2);
              const valPos = getPossibilityIndex(valIndex, position);
              if (row !== row2 && possibilities[valPos] === 0) {
                possibilities[valPos] = round;
                doneSomething = true;
              }
            }
          }
          if (doneSomething) {
            if (logHistory || recordHistory)
              addHistoryItem.call(
                this,
                new this.LogItem(
                  round,
                  Sudoku.LogType.ROW_BOX,
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
  };

  const pointingColumnReduction = round => {
    for (let valIndex = 0; valIndex < Sudoku.ROW_COL_SEC_SIZE; valIndex += 1) {
      for (let section = 0; section < Sudoku.ROW_COL_SEC_SIZE; section += 1) {
        const secStart = sectionToFirstCell(section);
        let inOneCol = true;
        let boxCol = -1;
        for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
          for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
            const secVal = secStart + i + Sudoku.ROW_COL_SEC_SIZE * j;
            const valPos = getPossibilityIndex(valIndex, secVal);
            if (possibilities[valPos] === 0) {
              if (boxCol === -1 || boxCol === i) {
                boxCol = i;
              } else {
                inOneCol = false;
              }
            }
          }
        }
        if (inOneCol && boxCol !== -1) {
          let doneSomething = false;
          const col = cellToColumn(secStart) + boxCol;
          const colStart = columnToFirstCell(col);

          for (let i = 0; i < Sudoku.ROW_COL_SEC_SIZE; i += 1) {
            const position = colStart + Sudoku.ROW_COL_SEC_SIZE * i;
            const section2 = cellToSection(position);
            const valPos = getPossibilityIndex(valIndex, position);
            if (section !== section2 && possibilities[valPos] === 0) {
              possibilities[valPos] = round;
              doneSomething = true;
            }
          }
          if (doneSomething) {
            if (logHistory || recordHistory)
              addHistoryItem.call(
                this,
                new this.LogItem(
                  round,
                  Sudoku.LogType.POINTING_PAIR_TRIPLE_COLUMN,
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
  };

  const hiddenPairInRow = round => {
    for (let row = 0; row < Sudoku.ROW_COL_SEC_SIZE; row += 1) {
      for (
        let valIndex = 0;
        valIndex < Sudoku.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let c1 = -1;
        let c2 = -1;
        let valCount = 0;
        for (let column = 0; column < Sudoku.ROW_COL_SEC_SIZE; column += 1) {
          const position = rowColumnToCell(row, column);
          const valPos = getPossibilityIndex(valIndex, position);
          if (possibilities[valPos] === 0) {
            if (c1 === -1 || c1 === column) {
              c1 = column;
            } else if (c2 === -1 || c2 === column) {
              c2 = column;
            }
            valCount += 1;
          }
        }
        if (valCount === 2) {
          for (
            let valIndex2 = valIndex + 1;
            valIndex2 < Sudoku.ROW_COL_SEC_SIZE;
            valIndex2 += 1
          ) {
            let c3 = -1;
            let c4 = -1;
            let valCount2 = 0;
            for (
              let column = 0;
              column < Sudoku.ROW_COL_SEC_SIZE;
              column += 1
            ) {
              const position = rowColumnToCell(row, column);
              const valPos = getPossibilityIndex(valIndex2, position);
              if (possibilities[valPos] === 0) {
                if (c3 === -1 || c3 === column) {
                  c3 = column;
                } else if (c4 === -1 || c4 === column) {
                  c4 = column;
                }
                valCount2 += 1;
              }
            }
            if (valCount2 === 2 && c1 === c3 && c2 === c4) {
              let doneSomething = false;
              for (
                let valIndex3 = 0;
                valIndex3 < Sudoku.ROW_COL_SEC_SIZE;
                valIndex3 += 1
              ) {
                if (valIndex3 !== valIndex && valIndex3 !== valIndex2) {
                  const position1 = rowColumnToCell(row, c1);
                  const position2 = rowColumnToCell(row, c2);
                  const valPos1 = getPossibilityIndex(valIndex3, position1);
                  const valPos2 = getPossibilityIndex(valIndex3, position2);
                  if (possibilities[valPos1] === 0) {
                    possibilities[valPos1] = round;
                    doneSomething = true;
                  }
                  if (possibilities[valPos2] === 0) {
                    possibilities[valPos2] = round;
                    doneSomething = true;
                  }
                }
              }
              if (doneSomething) {
                if (logHistory || recordHistory)
                  addHistoryItem.call(
                    this,
                    new this.LogItem(
                      round,
                      Sudoku.LogType.HIDDEN_PAIR_ROW,
                      valIndex + 1,
                      rowColumnToCell(row, c1)
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
  };

  const hiddenPairInColumn = round => {
    for (let column = 0; column < Sudoku.ROW_COL_SEC_SIZE; column += 1) {
      for (
        let valIndex = 0;
        valIndex < Sudoku.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let r1 = -1;
        let r2 = -1;
        let valCount = 0;
        for (let row = 0; row < Sudoku.ROW_COL_SEC_SIZE; row += 1) {
          const position = rowColumnToCell(row, column);
          const valPos = getPossibilityIndex(valIndex, position);
          if (possibilities[valPos] === 0) {
            if (r1 === -1 || r1 === row) {
              r1 = row;
            } else if (r2 === -1 || r2 === row) {
              r2 = row;
            }
            valCount += 1;
          }
        }
        if (valCount === 2) {
          for (
            let valIndex2 = valIndex + 1;
            valIndex2 < Sudoku.ROW_COL_SEC_SIZE;
            valIndex2 += 1
          ) {
            let r3 = -1;
            let r4 = -1;
            let valCount2 = 0;
            for (let row = 0; row < Sudoku.ROW_COL_SEC_SIZE; row += 1) {
              const position = rowColumnToCell(row, column);
              const valPos = getPossibilityIndex(valIndex2, position);
              if (possibilities[valPos] === 0) {
                if (r3 === -1 || r3 === row) {
                  r3 = row;
                } else if (r4 === -1 || r4 === row) {
                  r4 = row;
                }
                valCount2 += 1;
              }
            }
            if (valCount2 === 2 && r1 === r3 && r2 === r4) {
              let doneSomething = false;
              for (
                let valIndex3 = 0;
                valIndex3 < Sudoku.ROW_COL_SEC_SIZE;
                valIndex3 += 1
              ) {
                if (valIndex3 !== valIndex && valIndex3 !== valIndex2) {
                  const position1 = rowColumnToCell(r1, column);
                  const position2 = rowColumnToCell(r2, column);
                  const valPos1 = getPossibilityIndex(valIndex3, position1);
                  const valPos2 = getPossibilityIndex(valIndex3, position2);
                  if (possibilities[valPos1] === 0) {
                    possibilities[valPos1] = round;
                    doneSomething = true;
                  }
                  if (possibilities[valPos2] === 0) {
                    possibilities[valPos2] = round;
                    doneSomething = true;
                  }
                }
              }
              if (doneSomething) {
                if (logHistory || recordHistory)
                  addHistoryItem.call(
                    this,
                    new this.LogItem(
                      round,
                      Sudoku.LogType.HIDDEN_PAIR_COLUMN,
                      valIndex + 1,
                      rowColumnToCell(r1, column)
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
  };

  const hiddenPairInSection = round => {
    for (let section = 0; section < Sudoku.ROW_COL_SEC_SIZE; section += 1) {
      for (
        let valIndex = 0;
        valIndex < Sudoku.ROW_COL_SEC_SIZE;
        valIndex += 1
      ) {
        let si1 = -1;
        let si2 = -1;
        let valCount = 0;
        for (let secInd = 0; secInd < Sudoku.ROW_COL_SEC_SIZE; secInd += 1) {
          const position = sectionToCell(section, secInd);
          const valPos = getPossibilityIndex(valIndex, position);
          if (possibilities[valPos] === 0) {
            if (si1 === -1 || si1 === secInd) {
              si1 = secInd;
            } else if (si2 === -1 || si2 === secInd) {
              si2 = secInd;
            }
            valCount += 1;
          }
        }
        if (valCount === 2) {
          for (
            let valIndex2 = valIndex + 1;
            valIndex2 < Sudoku.ROW_COL_SEC_SIZE;
            valIndex2 += 1
          ) {
            let si3 = -1;
            let si4 = -1;
            let valCount2 = 0;
            for (
              let secInd = 0;
              secInd < Sudoku.ROW_COL_SEC_SIZE;
              secInd += 1
            ) {
              const position = sectionToCell(section, secInd);
              const valPos = getPossibilityIndex(valIndex2, position);
              if (possibilities[valPos] === 0) {
                if (si3 === -1 || si3 === secInd) {
                  si3 = secInd;
                } else if (si4 === -1 || si4 === secInd) {
                  si4 = secInd;
                }
                valCount2 += 1;
              }
            }
            if (valCount2 === 2 && si1 === si3 && si2 === si4) {
              let doneSomething = false;
              for (
                let valIndex3 = 0;
                valIndex3 < Sudoku.ROW_COL_SEC_SIZE;
                valIndex3 += 1
              ) {
                if (valIndex3 !== valIndex && valIndex3 !== valIndex2) {
                  const position1 = sectionToCell(section, si1);
                  const position2 = sectionToCell(section, si2);
                  const valPos1 = getPossibilityIndex(valIndex3, position1);
                  const valPos2 = getPossibilityIndex(valIndex3, position2);
                  if (possibilities[valPos1] === 0) {
                    possibilities[valPos1] = round;
                    doneSomething = true;
                  }
                  if (possibilities[valPos2] === 0) {
                    possibilities[valPos2] = round;
                    doneSomething = true;
                  }
                }
              }
              if (doneSomething) {
                if (logHistory || recordHistory)
                  addHistoryItem.call(
                    this,
                    new this.LogItem(
                      round,
                      Sudoku.LogType.HIDDEN_PAIR_SECTION,
                      valIndex + 1,
                      sectionToCell(section, si1)
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
  };

  const removePossibilitiesInOneFromTwo = (position1, position2, round) => {
    let doneSomething = false;
    for (let valIndex = 0; valIndex < Sudoku.ROW_COL_SEC_SIZE; valIndex += 1) {
      const valPos1 = getPossibilityIndex(valIndex, position1);
      const valPos2 = getPossibilityIndex(valIndex, position2);
      if (possibilities[valPos1] === 0 && possibilities[valPos2] === 0) {
        possibilities[valPos2] = round;
        doneSomething = true;
      }
    }
    return doneSomething;
  };

  const handleNakedPairs = round => {
    for (let position = 0; position < Sudoku.BOARD_SIZE; position += 1) {
      const _possibilities = countPossibilities(position);
      if (_possibilities === 2) {
        const row = cellToRow(position);
        const column = cellToColumn(position);
        const section = cellToSectionStartCell(position);
        for (
          let position2 = position;
          position2 < Sudoku.BOARD_SIZE;
          position2 += 1
        ) {
          if (position !== position2) {
            const possibilities2 = countPossibilities(position2);
            if (
              possibilities2 === 2 &&
              arePossibilitiesSame(position, position2)
            ) {
              if (row === cellToRow(position2)) {
                let doneSomething = false;
                for (
                  let column2 = 0;
                  column2 < Sudoku.ROW_COL_SEC_SIZE;
                  column2 += 1
                ) {
                  const position3 = rowColumnToCell(row, column2);
                  if (
                    position3 !== position &&
                    position3 !== position2 &&
                    removePossibilitiesInOneFromTwo(position, position3, round)
                  ) {
                    doneSomething = true;
                  }
                }
                if (doneSomething) {
                  if (logHistory || recordHistory)
                    addHistoryItem.call(
                      this,
                      new this.LogItem(
                        round,
                        Sudoku.LogType.NAKED_PAIR_ROW,
                        0,
                        position
                      )
                    );
                  return true;
                }
              }
              if (column === cellToColumn(position2)) {
                let doneSomething = false;
                for (let row2 = 0; row2 < Sudoku.ROW_COL_SEC_SIZE; row2 += 1) {
                  const position3 = rowColumnToCell(row2, column);
                  if (
                    position3 !== position &&
                    position3 !== position2 &&
                    removePossibilitiesInOneFromTwo(position, position3, round)
                  ) {
                    doneSomething = true;
                  }
                }
                if (doneSomething) {
                  if (logHistory || recordHistory)
                    addHistoryItem.call(
                      this,
                      new this.LogItem(
                        round,
                        Sudoku.LogType.NAKED_PAIR_COLUMN,
                        0,
                        position
                      )
                    );
                  return true;
                }
              }
              if (section === cellToSectionStartCell(position2)) {
                let doneSomething = false;
                const secStart = cellToSectionStartCell(position);
                for (let i = 0; i < Sudoku.GRID_SIZE; i += 1) {
                  for (let j = 0; j < Sudoku.GRID_SIZE; j += 1) {
                    const position3 =
                      secStart + i + Sudoku.ROW_COL_SEC_SIZE * j;
                    if (
                      position3 !== position &&
                      position3 !== position2 &&
                      removePossibilitiesInOneFromTwo(
                        position,
                        position3,
                        round
                      )
                    ) {
                      doneSomething = true;
                    }
                  }
                }
                if (doneSomething) {
                  if (logHistory || recordHistory)
                    addHistoryItem.call(
                      this,
                      new this.LogItem(
                        round,
                        Sudoku.LogType.NAKED_PAIR_SECTION,
                        0,
                        position
                      )
                    );
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
  };

  const singleSolveMove = round => {
    if (onlyPossibilityForCell.call(this, round)) return true;
    if (onlyValueInSection.call(this, round)) return true;
    if (onlyValueInRow.call(this, round)) return true;
    if (onlyValueInColumn.call(this, round)) return true;
    if (handleNakedPairs.call(this, round)) return true;
    if (pointingRowReduction.call(this, round)) return true;
    if (pointingColumnReduction.call(this, round)) return true;
    if (rowBoxReduction.call(this, round)) return true;
    if (colBoxReduction.call(this, round)) return true;
    if (hiddenPairInRow.call(this, round)) return true;
    if (hiddenPairInColumn.call(this, round)) return true;
    if (hiddenPairInSection.call(this, round)) return true;
    return false;
  };

  const shuffleArray = (array, size) => {
    for (let i = 0; i < size; i += 1) {
      const tailSize = size - i;
      const randTailPos = Math.floor(Math.random() * tailSize) + i;
      const temp = array[i];
      array[i] = array[randTailPos];
      array[randTailPos] = temp;
    }
  };

  const shuffleRandomArrays = function() {
    shuffleArray(randomBoardArray, Sudoku.BOARD_SIZE);
    shuffleArray(randomPossibilityArray, Sudoku.ROW_COL_SEC_SIZE);
  };

  const sudokuToString = puz => {
    let s = '';
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      if (printStyle === Sudoku.PrintStyle.READABLE) {
        s += ' ';
      }
      if (puz[i] === 0) {
        s += '.';
      } else {
        s += puz[i];
      }
      if (i === Sudoku.BOARD_SIZE - 1) {
        if (printStyle === Sudoku.PrintStyle.CSV) {
          s += ',';
        } else {
          s += '\n';
        }
        if (
          printStyle === Sudoku.PrintStyle.READABLE ||
          printStyle === Sudoku.PrintStyle.COMPACT
        ) {
          s += '\n';
        }
      } else if (i % Sudoku.ROW_COL_SEC_SIZE === Sudoku.ROW_COL_SEC_SIZE - 1) {
        if (
          printStyle === Sudoku.PrintStyle.READABLE ||
          printStyle === Sudoku.PrintStyle.COMPACT
        ) {
          s += '\n';
        }
        if (i % Sudoku.SEC_GROUP_SIZE === Sudoku.SEC_GROUP_SIZE - 1) {
          if (printStyle === Sudoku.PrintStyle.READABLE) {
            s += '-------|-------|-------\n';
          }
        }
      } else if (i % Sudoku.GRID_SIZE === Sudoku.GRID_SIZE - 1) {
        if (printStyle === Sudoku.PrintStyle.READABLE) {
          s += ' |';
        }
      }
    }
    return s;
  };

  const print = puz => {
    printnoln(sudokuToString.call(this, puz));
  };

  const rollbackNonGuesses = function() {
    for (let i = 2; i <= lastSolveRound; i += 2) {
      rollbackRound.call(this, i);
    }
  };

  const clearPuzzle = function() {
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      puzzle[i] = 0;
    }
    reset.call(this);
  };

  const getHistoryString = v => {
    let s = '';
    if (!recordHistory) {
      s += 'History was not recorded.';
      if (printStyle === Sudoku.PrintStyle.CSV) {
        s += ' -- ';
      } else {
        s += '\n';
      }
    }
    for (let i = 0; i < v.length; i += 1) {
      s += `${i + 1}. ${v[i].toString()}`;
      if (printStyle === Sudoku.PrintStyle.CSV) {
        s += ' -- ';
      } else {
        s += '\n';
      }
    }
    if (printStyle === Sudoku.PrintStyle.CSV) {
      s += ',';
    } else {
      s += '\n';
    }
    return s;
  };

  const printHistory = v => {
    printnoln(getHistoryString(v));
  };

  const getRandomSymmetry = function() {
    const rand = Math.floor(Math.random() * 4);
    switch (rand) {
      case 0:
        return Sudoku.Symmetry.ROTATE90;
      case 1:
        return Sudoku.Symmetry.ROTATE180;
      case 2:
        return Sudoku.Symmetry.MIRROR;
      case 3:
        return Sudoku.Symmetry.FLIP;
      default:
        break;
    }
    throw new Error(`Unexpected random value: ${rand}`);
  };

  const getLogCount = (v, type) => {
    let count = 0;
    for (let i = 0; i < v.length; i += 1) {
      if (v[i].getType() === type) count += 1;
    }
    return count;
  };
  this.LogItem = function(r, t, v, p) {
    const round = r;

    const type = t;

    const value = v;

    const position = p;

    this.getRound = function() {
      return round;
    };

    this.print = function() {
      println(this.toString());
    };

    this.getType = function() {
      return type;
    };

    this.getColumn = function() {
      if (position === -1) return -1;
      return cellToColumn(position);
    };

    this.getRow = function() {
      if (position === -1) return -1;
      return cellToRow(position);
    };

    this.getPosition = function() {
      return position;
    };

    this.getValue = function() {
      return value;
    };

    this.getDescription = function() {
      switch (this.getType()) {
        case Sudoku.LogType.GIVEN:
          return 'Mark given';
        case Sudoku.LogType.ROLLBACK:
          return 'Roll back round';
        case Sudoku.LogType.GUESS:
          return 'Mark guess (start round)';
        case Sudoku.LogType.HIDDEN_SINGLE_ROW:
          return 'Mark single possibility for value in row';
        case Sudoku.LogType.HIDDEN_SINGLE_COLUMN:
          return 'Mark single possibility for value in column';
        case Sudoku.LogType.HIDDEN_SINGLE_SECTION:
          return 'Mark single possibility for value in section';
        case Sudoku.LogType.SINGLE:
          return 'Mark only possibility for cell';
        case Sudoku.LogType.NAKED_PAIR_ROW:
          return 'Remove possibilities for naked pair in row';
        case Sudoku.LogType.NAKED_PAIR_COLUMN:
          return 'Remove possibilities for naked pair in column';
        case Sudoku.LogType.NAKED_PAIR_SECTION:
          return 'Remove possibilities for naked pair in section';
        case Sudoku.LogType.POINTING_PAIR_TRIPLE_ROW:
          return 'Remove possibilities for row because all values are in one section';
        case Sudoku.LogType.POINTING_PAIR_TRIPLE_COLUMN:
          return 'Remove possibilities for column because all values are in one section';
        case Sudoku.LogType.ROW_BOX:
          return 'Remove possibilities for section because all values are in one row';
        case Sudoku.LogType.COLUMN_BOX:
          return 'Remove possibilities for section because all values are in one column';
        case Sudoku.LogType.HIDDEN_PAIR_ROW:
          return 'Remove possibilities from hidden pair in row';
        case Sudoku.LogType.HIDDEN_PAIR_COLUMN:
          return 'Remove possibilities from hidden pair in column';
        case Sudoku.LogType.HIDDEN_PAIR_SECTION:
          return 'Remove possibilities from hidden pair in section';
        default:
          return '!!! Performed unknown optimization !!!';
      }
    };

    this.toString = function() {
      let s = `Round: ${this.getRound()} - `;
      s += this.getDescription();
      if (value > 0 || position > -1) {
        s += ' (';
        let printed = false;
        if (position > -1) {
          if (printed) s += ' - ';
          s += `Row: ${cellToRow(position) + 1} - Column: ${cellToColumn(
            position
          ) + 1}`;
          printed = true;
        }
        if (value > 0) {
          if (printed) s += ' - ';
          s += `Value: ${value}`;
          printed = true;
        }
        s += ')';
      }
      return s;
    };
  };

  this.setPuzzle = initPuzzle => {
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      puzzle[i] = initPuzzle[i];
    }
    return reset.call(this);
  };

  this.printPuzzle = function() {
    print.call(this, puzzle);
  };

  this.getPuzzleString = function() {
    return sudokuToString.call(this, puzzle);
  };

  this.printSolution = function() {
    print.call(this, solution);
  };

  this.getSolutionString = function() {
    return sudokuToString.call(this, solution);
  };

  this.solve = round => {
    if (!round || round <= 1) {
      reset.call(this);
      shuffleRandomArrays();
      return this.solve(2);
    }

    lastSolveRound = round;

    while (singleSolveMove.call(this, round)) {
      if (this.isSolved()) return true;
      if (isImpossible.call(this)) return false;
    }

    const nextGuessRound = round + 1;
    const nextRound = round + 2;
    for (
      let guessNumber = 0;
      guess.call(this, nextGuessRound, guessNumber);
      guessNumber += 1
    ) {
      if (isImpossible.call(this) || !this.solve(nextRound)) {
        rollbackRound.call(this, nextRound);
        rollbackRound.call(this, nextGuessRound);
      } else {
        return true;
      }
    }
    return false;
  };

  this.countSolutions = (round, limitToTwo) => {
    if (!round || round <= 1) {
      const recHistory = recordHistory;
      this.setRecordHistory(false);
      const lHistory = logHistory;
      this.setLogHistory(false);

      reset.call(this);
      const solutionCount = this.countSolutions(2, false);

      this.setRecordHistory(recHistory);
      this.setLogHistory(lHistory);

      return solutionCount;
    }
    while (singleSolveMove.call(this, round)) {
      if (this.isSolved()) {
        rollbackRound.call(this, round);
        return 1;
      }
      if (isImpossible.call(this)) {
        rollbackRound.call(this, round);
        return 0;
      }
    }

    let solutions = 0;
    const nextRound = round + 1;
    for (
      let guessNumber = 0;
      guess.call(this, nextRound, guessNumber);
      guessNumber += 1
    ) {
      solutions += this.countSolutions(nextRound, limitToTwo);
      if (limitToTwo && solutions >= 2) {
        rollbackRound.call(this, round);
        return solutions;
      }
    }
    rollbackRound.call(this, round);
    return solutions;
  };

  this.isSolved = function() {
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      if (solution[i] === 0) {
        return false;
      }
    }
    return true;
  };

  this.getSolveHistory = function() {
    if (this.isSolved()) {
      return solveHistory;
    }
    return 'No solve history - Puzzle is not possible to solve.';
  };

  this.getSolveHistoryString = function() {
    if (this.isSolved()) {
      return getHistoryString.call(this, solveHistory);
    }
    return 'No solve history - Puzzle is not possible to solve.';
  };

  this.printSolveHistory = function() {
    if (this.isSolved()) {
      printHistory(solveHistory);
    } else {
      println('No solve history - Puzzle is not possible to solve.');
    }
  };

  this.setRecordHistory = recHistory => {
    recordHistory = recHistory;
  };

  this.setLogHistory = logHist => {
    logHistory = logHist;
  };

  this.setPrintStyle = ps => {
    printStyle = ps;
  };

  this.generatePuzzle = function() {
    return this.generatePuzzleSymmetry(Sudoku.Symmetry.NONE);
  };

  this.generatePuzzleSymmetry = symmetry => {
    if (symmetry === Sudoku.Symmetry.RANDOM)
      symmetry = getRandomSymmetry.call(this);

    const recHistory = recordHistory;
    this.setRecordHistory(false);
    const lHistory = logHistory;
    this.setLogHistory(false);

    clearPuzzle.call(this);

    shuffleRandomArrays.call(this);

    this.solve();

    if (symmetry === Sudoku.Symmetry.NONE) {
      rollbackNonGuesses.call(this);
    }

    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      puzzle[i] = solution[i];
    }

    shuffleRandomArrays.call(this);

    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      const position = randomBoardArray[i];
      if (puzzle[position] > 0) {
        let positionsym1 = -1;
        let positionsym2 = -1;
        let positionsym3 = -1;
        switch (symmetry) {
          case Sudoku.Symmetry.ROTATE90:
            positionsym2 = rowColumnToCell(
              Sudoku.ROW_COL_SEC_SIZE - 1 - cellToColumn(position),
              cellToRow(position)
            );
            positionsym3 = rowColumnToCell(
              cellToColumn(position),
              Sudoku.ROW_COL_SEC_SIZE - 1 - cellToRow(position)
            );
            break;
          case Sudoku.Symmetry.ROTATE180:
            positionsym1 = rowColumnToCell(
              Sudoku.ROW_COL_SEC_SIZE - 1 - cellToRow(position),
              Sudoku.ROW_COL_SEC_SIZE - 1 - cellToColumn(position)
            );
            break;
          case Sudoku.Symmetry.MIRROR:
            positionsym1 = rowColumnToCell(
              cellToRow(position),
              Sudoku.ROW_COL_SEC_SIZE - 1 - cellToColumn(position)
            );
            break;
          case Sudoku.Symmetry.FLIP:
            positionsym1 = rowColumnToCell(
              Sudoku.ROW_COL_SEC_SIZE - 1 - cellToRow(position),
              cellToColumn(position)
            );
            break;
          default:
            break;
        }

        const savedValue = puzzle[position];
        puzzle[position] = 0;
        let savedSym1 = 0;
        if (positionsym1 >= 0) {
          savedSym1 = puzzle[positionsym1];
          puzzle[positionsym1] = 0;
        }
        let savedSym2 = 0;
        if (positionsym2 >= 0) {
          savedSym2 = puzzle[positionsym2];
          puzzle[positionsym2] = 0;
        }
        let savedSym3 = 0;
        if (positionsym3 >= 0) {
          savedSym3 = puzzle[positionsym3];
          puzzle[positionsym3] = 0;
        }
        reset.call(this);
        if (this.countSolutions(2, true) > 1) {
          puzzle[position] = savedValue;
          if (positionsym1 >= 0 && savedSym1 !== 0)
            puzzle[positionsym1] = savedSym1;
          if (positionsym2 >= 0 && savedSym2 !== 0)
            puzzle[positionsym2] = savedSym2;
          if (positionsym3 >= 0 && savedSym3 !== 0)
            puzzle[positionsym3] = savedSym3;
        }
      }
    }

    reset.call(this);

    this.setRecordHistory(recHistory);
    this.setLogHistory(lHistory);

    return true;
  };

  this.getGivenCount = function() {
    let count = 0;
    for (let i = 0; i < Sudoku.BOARD_SIZE; i += 1) {
      if (puzzle[i] !== 0) count += 1;
    }
    return count;
  };

  this.getSingleCount = function() {
    getLogCount.call(this, solveInstructions, Sudoku.LogType.SINGLE);
  };
  this.getHiddenSingleCount = function() {
    return (
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.HIDDEN_SINGLE_ROW
      ) +
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.HIDDEN_SINGLE_COLUMN
      ) +
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.HIDDEN_SINGLE_SECTION
      )
    );
  };

  this.getNakedPairCount = function() {
    return (
      getLogCount.call(this, solveInstructions, Sudoku.LogType.NAKED_PAIR_ROW) +
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.NAKED_PAIR_COLUMN
      ) +
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.NAKED_PAIR_SECTION
      )
    );
  };

  this.getHiddenPairCount = function() {
    return (
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.HIDDEN_PAIR_ROW
      ) +
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.HIDDEN_PAIR_COLUMN
      ) +
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.HIDDEN_PAIR_SECTION
      )
    );
  };

  this.getBoxLineReductionCount = function() {
    return (
      getLogCount.call(this, solveInstructions, Sudoku.LogType.ROW_BOX) +
      getLogCount.call(this, solveInstructions, Sudoku.LogType.COLUMN_BOX)
    );
  };

  this.getPointingPairTripleCount = function() {
    return (
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.POINTING_PAIR_TRIPLE_ROW
      ) +
      getLogCount.call(
        this,
        solveInstructions,
        Sudoku.LogType.POINTING_PAIR_TRIPLE_COLUMN
      )
    );
  };

  this.getGuessCount = function() {
    return getLogCount.call(this, solveInstructions, Sudoku.LogType.GUESS);
  };
  this.getBacktrackCount = function() {
    return getLogCount.call(this, solveHistory, Sudoku.LogType.ROLLBACK);
  };
  this.getSolveInstructions = function() {
    return this.isSolved()
      ? solveInstructions
      : 'No solve instructions - Puzzle is not possible to solve.';
  };
  this.getSolveInstructionsString = function() {
    return this.isSolved()
      ? getHistoryString.call(this, solveInstructions)
      : 'No solve instructions - Puzzle is not possible to solve.';
  };

  this.printSolveInstructions = function() {
    if (this.isSolved()) printHistory(solveInstructions);
    else println('No solve instructions - Puzzle is not possible to solve.');
  };

  this.getDifficulty = function() {
    if (this.getGuessCount() > 0) return Sudoku.Difficulty.EXPERT;
    if (this.getBoxLineReductionCount() > 0)
      return Sudoku.Difficulty.INTERMEDIATE;
    if (this.getPointingPairTripleCount() > 0)
      return Sudoku.Difficulty.INTERMEDIATE;
    if (this.getHiddenPairCount() > 0) return Sudoku.Difficulty.INTERMEDIATE;
    if (this.getNakedPairCount() > 0) return Sudoku.Difficulty.INTERMEDIATE;
    if (this.getHiddenSingleCount() > 0) return Sudoku.Difficulty.EASY;
    if (this.getSingleCount() > 0) return Sudoku.Difficulty.SIMPLE;
    return Sudoku.Difficulty.UNKNOWN;
  };

  this.getDifficultyAsString = function() {
    const difficulty = this.getDifficulty();
    switch (difficulty) {
      case Sudoku.Difficulty.EXPERT:
        return 'Expert';
      case Sudoku.Difficulty.INTERMEDIATE:
        return 'Intermediate';
      case Sudoku.Difficulty.EASY:
        return 'Easy';
      case Sudoku.Difficulty.SIMPLE:
        return 'Simple';
      default:
        return 'Unknown';
    }
  };
};

Sudoku.PrintStyle = {
  ONE_LINE: 0,
  COMPACT: 1,
  READABLE: 2,
  CSV: 3,
};

Sudoku.Difficulty = {
  UNKNOWN: 0,
  SIMPLE: 1,
  EASY: 2,
  INTERMEDIATE: 3,
  EXPERT: 4,
};

Sudoku.Symmetry = {
  NONE: 0,
  ROTATE90: 1,
  ROTATE180: 2,
  MIRROR: 3,
  FLIP: 4,
  RANDOM: 5,
};

Sudoku.LogType = {
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

Sudoku.GRID_SIZE = 3;
Sudoku.ROW_COL_SEC_SIZE = Sudoku.GRID_SIZE * Sudoku.GRID_SIZE;
Sudoku.SEC_GROUP_SIZE = Sudoku.ROW_COL_SEC_SIZE * Sudoku.GRID_SIZE;
Sudoku.BOARD_SIZE = Sudoku.ROW_COL_SEC_SIZE * Sudoku.ROW_COL_SEC_SIZE;
Sudoku.POSSIBILITY_SIZE = Sudoku.BOARD_SIZE * Sudoku.ROW_COL_SEC_SIZE;
