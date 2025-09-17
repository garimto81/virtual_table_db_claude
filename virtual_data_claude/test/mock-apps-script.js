/**
 * 로컬 테스트용 Google Apps Script Mock 환경
 * Code_v62_InOut.gs의 함수들을 로컬에서 테스트할 수 있도록 모킹
 */

// ===== Mock Google Apps Script 환경 =====

// Mock SpreadsheetApp
const MockSpreadsheetApp = {
  openById: function(id) {
    console.log(`[Mock] SpreadsheetApp.openById(${id})`);
    return new MockSpreadsheet();
  }
};

// Mock ContentService
const MockContentService = {
  MimeType: {
    JSON: 'application/json'
  },
  createTextOutput: function(content) {
    return {
      setMimeType: function(type) {
        return {
          content: content,
          mimeType: type
        };
      }
    };
  }
};

// Mock Spreadsheet
class MockSpreadsheet {
  constructor() {
    this.sheets = new Map();
    // 테스트용 기본 데이터 초기화
    this.initTestData();
  }

  initTestData() {
    // Type 시트 초기화
    const typeSheet = new MockSheet('Type');
    typeSheet.data = [
      ['Camera Preset', 'Player', 'Table', 'Notable', 'Chips', 'UpdatedAt', 'Seat', 'Status'],
      ['', 'Player1', 'Table1', 'FALSE', 10000, new Date(), '1', 'IN'],
      ['', 'Player2', 'Table1', 'TRUE', 15000, new Date(), '2', 'IN'],
      ['', 'Player3', 'Table2', 'FALSE', 8000, new Date(), '1', 'IN'],
      ['', 'Player4', 'Table1', 'FALSE', 12000, new Date(), '', 'OUT'] // OUT 상태 플레이어
    ];
    this.sheets.set('Type', typeSheet);

    // Index 시트 초기화
    const indexSheet = new MockSheet('Index');
    indexSheet.data = [
      ['handNumber', 'startRow', 'endRow', 'handUpdatedAt', 'handEdit', 'handEditTime', 'label', 'table', 'tableUpdatedAt']
    ];
    this.sheets.set('Index', indexSheet);

    // Hand 시트 초기화
    const handSheet = new MockSheet('Hand');
    handSheet.data = [];
    this.sheets.set('Hand', handSheet);
  }

  getSheetByName(name) {
    console.log(`[Mock] getSheetByName(${name})`);
    return this.sheets.get(name) || null;
  }

  insertSheet(name) {
    console.log(`[Mock] insertSheet(${name})`);
    const sheet = new MockSheet(name);
    this.sheets.set(name, sheet);
    return sheet;
  }
}

// Mock Sheet
class MockSheet {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  getDataRange() {
    return {
      getValues: () => {
        console.log(`[Mock] ${this.name}.getDataRange().getValues() - ${this.data.length} rows`);
        return JSON.parse(JSON.stringify(this.data)); // 깊은 복사
      }
    };
  }

  getLastRow() {
    return this.data.length;
  }

  getLastColumn() {
    return this.data.length > 0 ? this.data[0].length : 0;
  }

  getRange(row, col, numRows = 1, numCols = 1) {
    console.log(`[Mock] ${this.name}.getRange(${row}, ${col}, ${numRows}, ${numCols})`);
    return new MockRange(this, row - 1, col - 1, numRows, numCols); // 0-based로 변환
  }

  appendRow(rowData) {
    console.log(`[Mock] ${this.name}.appendRow:`, rowData);
    this.data.push([...rowData]);
  }

  deleteRow(rowIndex) {
    console.log(`[Mock] ${this.name}.deleteRow(${rowIndex})`);
    if (rowIndex > 0 && rowIndex <= this.data.length) {
      this.data.splice(rowIndex - 1, 1); // 1-based에서 0-based로 변환
    }
  }

  sort(sortSpecs) {
    console.log(`[Mock] ${this.name}.sort:`, sortSpecs);
    // 간단한 정렬 구현 (헤더 제외)
    if (this.data.length <= 1) return;

    const headerRow = this.data[0];
    const dataRows = this.data.slice(1);

    dataRows.sort((a, b) => {
      for (const spec of sortSpecs) {
        const colIndex = spec.column - 1; // 1-based to 0-based
        const aVal = a[colIndex] || '';
        const bVal = b[colIndex] || '';

        let comparison;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return spec.ascending ? comparison : -comparison;
        }
      }
      return 0;
    });

    this.data = [headerRow, ...dataRows];
  }
}

// Mock Range
class MockRange {
  constructor(sheet, startRow, startCol, numRows, numCols) {
    this.sheet = sheet;
    this.startRow = startRow;
    this.startCol = startCol;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  setValue(value) {
    console.log(`[Mock] Range.setValue(${value}) at [${this.startRow + 1}, ${this.startCol + 1}]`);
    // 필요한 경우 행/열 확장
    while (this.sheet.data.length <= this.startRow) {
      this.sheet.data.push([]);
    }
    while (this.sheet.data[this.startRow].length <= this.startCol) {
      this.sheet.data[this.startRow].push('');
    }

    this.sheet.data[this.startRow][this.startCol] = value;
    return this;
  }

  setValues(values) {
    console.log(`[Mock] Range.setValues() at [${this.startRow + 1}, ${this.startCol + 1}] - ${values.length}x${values[0]?.length || 0}`);
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        const row = this.startRow + i;
        const col = this.startCol + j;

        // 필요한 경우 행/열 확장
        while (this.sheet.data.length <= row) {
          this.sheet.data.push([]);
        }
        while (this.sheet.data[row].length <= col) {
          this.sheet.data[row].push('');
        }

        this.sheet.data[row][col] = values[i][j];
      }
    }
    return this;
  }

  sort(sortSpecs) {
    console.log(`[Mock] Range.sort:`, sortSpecs);

    // 범위 내 데이터 추출
    const rangeData = [];
    for (let i = 0; i < this.numRows; i++) {
      const row = [];
      for (let j = 0; j < this.numCols; j++) {
        const dataRow = this.startRow + i;
        const dataCol = this.startCol + j;
        row.push(this.sheet.data[dataRow]?.[dataCol] || '');
      }
      rangeData.push(row);
    }

    // 정렬
    rangeData.sort((a, b) => {
      for (const spec of sortSpecs) {
        const colIndex = spec.column - 1; // 1-based to 0-based (range 내에서)
        const aVal = a[colIndex] || '';
        const bVal = b[colIndex] || '';

        let comparison;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return spec.ascending ? comparison : -comparison;
        }
      }
      return 0;
    });

    // 정렬된 데이터를 다시 시트에 적용
    for (let i = 0; i < rangeData.length; i++) {
      for (let j = 0; j < rangeData[i].length; j++) {
        const row = this.startRow + i;
        const col = this.startCol + j;
        this.sheet.data[row][col] = rangeData[i][j];
      }
    }

    return this;
  }
}

// ===== Mock 환경 전역 설정 =====
if (typeof window !== 'undefined') {
  // 브라우저 환경
  window.SpreadsheetApp = MockSpreadsheetApp;
  window.ContentService = MockContentService;
  window.console = console;
} else if (typeof global !== 'undefined') {
  // Node.js 환경
  global.SpreadsheetApp = MockSpreadsheetApp;
  global.ContentService = MockContentService;
  global.console = console;
}

// 현재 스프레드시트 인스턴스 (테스트용)
const mockSpreadsheet = new MockSpreadsheet();

// 헬퍼 함수: 현재 시트 데이터 출력
function printSheetData(sheetName) {
  const sheet = mockSpreadsheet.getSheetByName(sheetName);
  if (sheet) {
    console.log(`\n=== ${sheetName} 시트 데이터 ===`);
    sheet.data.forEach((row, index) => {
      console.log(`[${index + 1}]`, row);
    });
    console.log('========================\n');
  } else {
    console.log(`${sheetName} 시트를 찾을 수 없습니다.`);
  }
}

// 테스트용 유틸리티 함수
const TestUtils = {
  printSheetData,
  getSheetData: (sheetName) => mockSpreadsheet.getSheetByName(sheetName)?.data || [],
  resetTestData: () => mockSpreadsheet.initTestData(),

  // 특정 테이블의 플레이어 데이터 확인
  getTablePlayers: (tableName) => {
    const typeSheet = mockSpreadsheet.getSheetByName('Type');
    if (!typeSheet) return [];

    const data = typeSheet.data;
    const players = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] === tableName) { // C열: Table
        players.push({
          player: row[1],   // B열: Player
          table: row[2],    // C열: Table
          chips: row[4],    // E열: Chips
          seat: row[6],     // G열: Seat
          status: row[7]    // H열: Status
        });
      }
    }

    return players;
  }
};

console.log('Mock Google Apps Script 환경이 준비되었습니다.');
console.log('사용 가능한 테스트 유틸리티:', Object.keys(TestUtils));