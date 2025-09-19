/****************************************************
 * Virtual Table DB - Apps Script v3.0 (통합 버전)
 * 기존 액션(updateSheet, updateSheetV2 등) 완전 호환 유지
 * 새 액션(batchVerify, getHandStatus) 추가
 * 로직 충돌 방지 및 안정성 확보
 ****************************************************/

const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/* -------------------------------------------------------------------------- */
/* 유틸리티 함수들 (기존 유지)                                                 */
/* -------------------------------------------------------------------------- */
function createCorsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _parseRequestBody(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      console.error('JSON 파싱 실패:', err);
    }
  }
  if (e && e.parameter) {
    if (e.parameter.payload) {
      try {
        return JSON.parse(e.parameter.payload);
      } catch (err) {
        console.error('payload 파싱 실패:', err);
      }
    }
    return e.parameter;
  }
  return {};
}

function openSheetByUrl(url) {
  if (!url) throw new Error('시트 URL이 필요합니다');
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) throw new Error('올바른 Google Sheets URL이 아닙니다');

  const spreadsheet = SpreadsheetApp.openById(idMatch[1]);
  const gidMatch = url.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  const sheets = spreadsheet.getSheets();
  for (const sheet of sheets) {
    if (sheet.getSheetId().toString() === gid) {
      return sheet;
    }
  }
  return spreadsheet.getActiveSheet();
}

/* -------------------------------------------------------------------------- */
/* HTTP 엔드포인트 (기존 유지)                                                */
/* -------------------------------------------------------------------------- */
function doGet(e) {
  console.log('📥 GET 요청 수신:', JSON.stringify(e));
  return createCorsResponse({
    status: 'ok',
    message: 'Virtual Table DB Apps Script v3.0 정상 작동 중',
    version: 'v3.0',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  console.log('📥 POST 요청 수신');
  const requestData = _parseRequestBody(e);
  const action = requestData.action || 'unknown';
  console.log(`🎯 액션: ${action}`);

  try {
    let result;
    switch (action) {
      /* 기존 액션들 (완전 호환 유지) ---------------------------------------- */
      case 'updateSheet':
        result = handleSheetUpdate(requestData);
        break;
      case 'updateHand':
        result = handleHandUpdate(requestData);
        break;
      case 'analyzeHand':
        result = handleHandAnalysis(requestData);
        break;
      case 'updateIndex':
        result = handleIndexUpdate(requestData);
        break;
      case 'updateSheetV2':
        result = handleSheetUpdateV2(requestData);
        break;
      case 'verifyUpdate':
        result = handleVerifyUpdate(requestData);
        break;

      /* 새 액션들 (v3.0 추가) ---------------------------------------------- */
      case 'batchVerify':
        result = handleBatchVerify(requestData);
        break;
      case 'getHandStatus':
        result = handleGetHandStatus(requestData);
        break;

      case 'test':
        result = {
          status: 'success',
          message: 'Apps Script 연결 성공!',
          timestamp: new Date().toISOString(),
          version: 'v3.0',
          receivedData: requestData,
          availableActions: [
            'updateSheet', 'updateSheetV2', 'verifyUpdate',
            'updateHand', 'updateIndex', 'analyzeHand',
            'batchVerify', 'getHandStatus', 'test'
          ]
        };
        break;
      default:
        result = {
          status: 'error',
          message: `알 수 없는 액션: ${action}`,
          availableActions: [
            'updateSheet', 'updateSheetV2', 'verifyUpdate',
            'updateHand', 'updateIndex', 'analyzeHand',
            'batchVerify', 'getHandStatus', 'test'
          ]
        };
    }
    return createCorsResponse(result);

  } catch (error) {
    console.error('❌ 처리 중 오류:', error);
    return createCorsResponse({
      status: 'error',
      message: error.toString(),
      action: action
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 기존 핸들러 함수들 (원본 유지) - 여기서는 구조만 표시                       */
/* -------------------------------------------------------------------------- */

// 기존 함수들이 여기에 그대로 유지됩니다
// handleSheetUpdate, handleHandUpdate, handleHandAnalysis,
// handleIndexUpdate, handleSheetUpdateV2, handleVerifyUpdate

/* -------------------------------------------------------------------------- */
/* 새 핸들러 함수들 (v3.0 추가)                                               */
/* -------------------------------------------------------------------------- */

/**
 * 일괄 상태 확인 - 여러 행의 E열 상태를 한번에 확인
 * @param {Object} data - {sheetUrl, rows: [행번호들]}
 * @returns {Object} 각 행의 상태 정보
 */
function handleBatchVerify(data) {
  console.log('🚀 [batchVerify] 일괄 상태 확인 시작...');

  try {
    const { sheetUrl, rows } = data;

    if (!sheetUrl || !rows || !Array.isArray(rows)) {
      throw new Error('sheetUrl과 rows 배열이 필요합니다');
    }

    console.log(`📋 대상: ${rows.length}개 행 상태 확인`);

    const sheet = openSheetByUrl(sheetUrl);
    const result = { data: {} };

    // 각 행의 E열 상태 확인
    for (const rowNum of rows) {
      try {
        const range = sheet.getRange(rowNum, 5); // E열 (5번째 열)
        const value = range.getValue();
        const status = value ? value.toString().trim() : '';

        result.data[rowNum] = {
          row: rowNum,
          status: status,
          timestamp: new Date().toISOString()
        };

        if (status) {
          console.log(`✅ 행 ${rowNum}: "${status}"`);
        }
      } catch (rowError) {
        console.warn(`⚠️ 행 ${rowNum} 처리 실패:`, rowError);
        result.data[rowNum] = {
          row: rowNum,
          status: '',
          error: rowError.toString()
        };
      }
    }

    console.log(`📊 [batchVerify] 완료: ${Object.keys(result.data).length}개 행 처리`);

    return {
      status: 'success',
      message: `${rows.length}개 행 상태 확인 완료`,
      result: result,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [batchVerify] 오류:', error);
    return {
      status: 'error',
      message: error.toString(),
      action: 'batchVerify'
    };
  }
}

/**
 * 개별 핸드 상태 확인 - 특정 핸드의 Virtual 시트 매칭 및 상태 확인
 * @param {Object} data - {sheetUrl, handNumber, handTime}
 * @returns {Object} 핸드의 상태 정보
 */
function handleGetHandStatus(data) {
  console.log('🔍 [getHandStatus] 실시간 핸드 상태 확인...');

  try {
    const { sheetUrl, handNumber, handTime } = data;

    if (!sheetUrl || !handNumber) {
      throw new Error('sheetUrl과 handNumber가 필요합니다');
    }

    console.log(`🎯 핸드 #${handNumber} 상태 확인 중...`);

    const sheet = openSheetByUrl(sheetUrl);

    // Virtual 시트에서 시간 매칭으로 해당 행 찾기
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    let matchedRow = null;
    let bestMatch = null;
    let minTimeDiff = Infinity;

    // handTime이 제공된 경우 시간 매칭
    if (handTime) {
      const targetDate = new Date(handTime * 1000);
      const targetHours = targetDate.getHours();
      const targetMinutes = targetDate.getMinutes();
      const targetTimeStr = `${targetHours.toString().padStart(2, '0')}:${targetMinutes.toString().padStart(2, '0')}`;

      console.log(`⏰ 타겟 시간: ${targetTimeStr}`);

      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        const timeValue = row[1]; // B열 (시간)

        if (timeValue && timeValue.toString().trim()) {
          const timeStr = timeValue.toString().trim();

          // 정확한 시간 매칭
          if (timeStr === targetTimeStr || timeStr.startsWith(targetTimeStr)) {
            matchedRow = {
              row: i + 1,
              time: timeStr,
              status: row[4] ? row[4].toString().trim() : '', // E열
              exactMatch: true
            };
            console.log(`✅ 정확한 시간 매칭: 행 ${i + 1}, 시간: ${timeStr}`);
            break;
          }

          // 근사 매칭 (±3분 이내)
          const timeParts = timeStr.split(':');
          if (timeParts.length >= 2) {
            const rowHours = parseInt(timeParts[0]);
            const rowMinutes = parseInt(timeParts[1]);

            if (!isNaN(rowHours) && !isNaN(rowMinutes)) {
              const rowTotalMinutes = rowHours * 60 + rowMinutes;
              const targetTotalMinutes = targetHours * 60 + targetMinutes;

              let timeDiff = Math.abs(rowTotalMinutes - targetTotalMinutes);

              // 자정 경계 처리
              if (timeDiff > 720) {
                timeDiff = 1440 - timeDiff;
              }

              if (timeDiff <= 3 && timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                bestMatch = {
                  row: i + 1,
                  time: timeStr,
                  status: row[4] ? row[4].toString().trim() : '',
                  timeDiff: timeDiff,
                  exactMatch: false
                };
              }
            }
          }
        }
      }

      // 정확한 매칭이 없으면 근사 매칭 사용
      if (!matchedRow && bestMatch) {
        matchedRow = bestMatch;
        console.log(`🔄 근사 매칭: 행 ${bestMatch.row}, 시간차: ${bestMatch.timeDiff}분`);
      }
    }

    if (matchedRow) {
      return {
        status: 'success',
        handNumber: handNumber,
        matchedRow: matchedRow.row,
        handStatus: matchedRow.status,
        matchType: matchedRow.exactMatch ? 'exact' : 'approximate',
        timeDiff: matchedRow.timeDiff || 0,
        message: `핸드 #${handNumber} 매칭 성공`,
        timestamp: new Date().toISOString()
      };
    } else {
      console.log(`❌ 핸드 #${handNumber} 매칭 실패`);
      return {
        status: 'not_found',
        handNumber: handNumber,
        message: `핸드 #${handNumber}에 해당하는 Virtual 시트 행을 찾을 수 없음`,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    console.error('❌ [getHandStatus] 오류:', error);
    return {
      status: 'error',
      message: error.toString(),
      action: 'getHandStatus',
      handNumber: data.handNumber || 'unknown'
    };
  }
}

/* -------------------------------------------------------------------------- */
/* 기존 핸들러 함수들을 여기에 복사해서 붙여넣으세요                           */
/* -------------------------------------------------------------------------- */

// 주의: 이 파일은 구조만 보여주는 템플릿입니다
// 실제 사용하려면 기존 appscripts_old.gs의 모든 핸들러 함수들을
// (handleSheetUpdate, handleHandUpdate 등) 여기에 복사해야 합니다