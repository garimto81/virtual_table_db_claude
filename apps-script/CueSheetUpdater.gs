/****************************************************
 * Cue Sheet Updater - Apps Script v9.3.5
 * 
 * 기능:
 * - CUE SHEET의 F열(파일명), H열(AI분석) 업데이트만 담당
 * - B열 시간 기준으로 매칭된 행에 데이터 업데이트
 * - CORS 정책 우회를 통한 안전한 시트 접근
 * - Gemini AI를 통한 포커 핸드 자동 분석
 ****************************************************/

// ===== 설정 =====

// Gemini API 키 (Apps Script 스크립트 속성에서 설정)
// PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', 'YOUR_API_KEY');
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

// ===== 메인 핸들러 =====

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v9.3.5',
    service: 'Cue Sheet Updater',
    features: ['Cue Sheet Update', 'F Column Update', 'H Column AI Analysis', 'Time Based Matching'],
    gemini_enabled: !!GEMINI_API_KEY,
    sheet_type: 'cue_sheet_only'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    console.log('📥 Cue Sheet Updater POST 요청 수신:', e);
    
    const body = _parseRequestBody(e) || {};
    console.log('📋 파싱된 요청 데이터:', JSON.stringify(body));
    
    // 빈 요청 체크
    if (!body || Object.keys(body).length === 0) {
      return _json({
        status: 'error',
        message: '요청 데이터가 비어있습니다',
        received: JSON.stringify(e.parameter || {})
      });
    }
    
    const action = body.action;
    
    if (action === 'updateSheet') {
      return handleCueSheetUpdate(body);
    } else if (action === 'analyzeHand') {
      return handleHandAnalysis(body);
    } else {
      return _json({
        status: 'error',
        message: `지원되지 않는 액션: ${action}`
      });
    }
    
  } catch (error) {
    console.error('❌ doPost 오류:', error);
    return _json({
      status: 'error',
      message: String(error && error.message || error),
      stack: String(error.stack || '')
    });
  }
}

// ===== 큐 시트 업데이트 핸들러 =====

async function handleCueSheetUpdate(data) {
  try {
    console.log('🎯 큐 시트 업데이트 시작:', JSON.stringify(data));
    
    const {
      sheetUrl,
      handNumber,
      filename,
      aiAnalysis,
      timestamp
    } = data;
    
    if (!sheetUrl) {
      throw new Error('시트 URL이 없습니다');
    }
    
    if (!handNumber) {
      throw new Error('핸드 번호가 없습니다');
    }
    
    if (!filename) {
      throw new Error('파일명이 없습니다');
    }
    
    // 큐 시트 업데이트
    const cueUpdateResult = await updateCueSheet(sheetUrl, handNumber, filename, aiAnalysis, timestamp);
    
    console.log('✅ 큐 시트 업데이트 완료!');
    
    return _json({
      status: 'success',
      message: '큐 시트 업데이트 완료',
      handNumber: handNumber,
      filename: filename,
      cueSheet: cueUpdateResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 큐 시트 업데이트 실패:', error);
    return _json({
      status: 'error',
      message: String(error && error.message || error),
      stack: String(error.stack || '')
    });
  }
}

// ===== 큐 시트 업데이트 함수 =====

async function updateCueSheet(sheetUrl, handNumber, filename, aiAnalysis, timestamp) {
  try {
    console.log(`🎯 큐 시트에서 핸드 ${handNumber} 업데이트 시작`);
    
    // 시트 ID 추출
    const sheetId = _extractSheetId(sheetUrl);
    if (!sheetId) {
      throw new Error('큐 시트 URL에서 ID를 추출할 수 없습니다');
    }
    
    const gid = _extractGid(sheetUrl) || '0';
    console.log(`🔗 큐 시트 ID: ${sheetId}, GID: ${gid}`);
    
    // CSV 데이터 다운로드
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    console.log(`📥 CSV 다운로드: ${csvUrl}`);
    
    const response = UrlFetchApp.fetch(csvUrl);
    if (response.getResponseCode() !== 200) {
      throw new Error(`CSV 다운로드 실패: ${response.getResponseCode()}`);
    }
    
    const csvData = response.getContentText();
    const rows = _parseCsv(csvData);
    console.log(`📊 CSV 파싱 완료: ${rows.length}개 행`);
    
    if (rows.length === 0) {
      throw new Error('CSV 데이터가 비어있습니다');
    }
    
    // 타임스탬프 기준으로 매칭할 행 찾기
    let matchedRowIndex = -1;
    const targetTime = timestamp || new Date().toISOString();
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const timeCell = row[1]; // B열 (인덱스 1)
      
      if (timeCell && _isTimeMatch(timeCell, targetTime)) {
        matchedRowIndex = i;
        console.log(`⏰ 시간 매칭 성공: 행 ${i + 1}, 시간 ${timeCell}`);
        break;
      }
    }
    
    if (matchedRowIndex === -1) {
      throw new Error(`시간 매칭 실패: ${targetTime}에 해당하는 행을 찾을 수 없습니다`);
    }
    
    // 시트 업데이트
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    let sheet;
    
    if (gid === '0') {
      sheet = spreadsheet.getActiveSheet();
    } else {
      const sheets = spreadsheet.getSheets();
      sheet = sheets.find(s => s.getSheetId().toString() === gid);
      if (!sheet) {
        throw new Error(`GID ${gid}에 해당하는 시트를 찾을 수 없습니다`);
      }
    }
    
    const actualRowNumber = matchedRowIndex + 1; // 1-based
    
    // F열에 파일명 업데이트
    sheet.getRange(actualRowNumber, 6).setValue(filename);
    console.log(`📝 F열 업데이트: 행 ${actualRowNumber}, 파일명 ${filename}`);
    
    // AI 분석이 있으면 H열에 업데이트
    if (aiAnalysis) {
      sheet.getRange(actualRowNumber, 8).setValue(aiAnalysis);
      console.log(`🤖 H열 AI 분석 업데이트: 행 ${actualRowNumber}, 분석 결과 ${aiAnalysis}`);
    }
    
    return {
      success: true,
      rowNumber: actualRowNumber,
      filename: filename,
      aiAnalysis: aiAnalysis || null,
      message: `큐 시트 행 ${actualRowNumber} 업데이트 완료`
    };
    
  } catch (error) {
    console.error('❌ 큐 시트 업데이트 실패:', error);
    throw error;
  }
}

// ===== 핸드 분석 핸들러 =====

async function handleHandAnalysis(data) {
  try {
    console.log('🤖 핸드 분석 요청:', JSON.stringify(data));
    
    const { handData, analysisType = 'summary' } = data;
    
    if (!handData) {
      throw new Error('분석할 핸드 데이터가 없습니다');
    }
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API 키가 설정되지 않았습니다');
    }
    
    const analysis = await _analyzeWithGemini(handData, analysisType);
    
    return _json({
      status: 'success',
      analysis: analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 핸드 분석 실패:', error);
    return _json({
      status: 'error',
      message: String(error && error.message || error)
    });
  }
}

// ===== Gemini AI 분석 함수 =====

async function _analyzeWithGemini(handData, analysisType) {
  try {
    console.log('🧠 Gemini AI 분석 시작...');
    
    const prompt = `포커 핸드를 분석해주세요:

핸드 데이터:
${JSON.stringify(handData, null, 2)}

분석 유형: ${analysisType}

다음 형식으로 분석해주세요:
- 핸드의 핵심 포인트
- 주요 플레이어 액션
- 결과 요약

50자 이내로 간단명료하게 작성해주세요.`;

    // Gemini API 호출
    const response = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        }
      })
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Gemini API 오류: ${response.getResponseCode()}`);
    }
    
    const responseData = JSON.parse(response.getContentText());
    console.log('🔍 Gemini API 응답:', JSON.stringify(responseData));
    
    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
      throw new Error('유효하지 않은 Gemini API 응답');
    }
    
    const analysis = responseData.candidates[0].content.parts[0].text;
    console.log(`✅ AI 분석 결과: "${analysis}"`);
    
    // 분석 결과 검증 및 정리
    const cleanedAnalysis = analysis.trim().substring(0, 50);
    return cleanedAnalysis || '분석 완료';
    
  } catch (error) {
    console.error('❌ Gemini AI 분석 실패:', error);
    throw error;
  }
}

// ===== 유틸리티 함수 =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _parseRequestBody(e) {
  // FormData 방식
  if (e && e.parameter && e.parameter.payload) {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      console.error('❌ FormData 파싱 실패:', err);
    }
  }
  
  // JSON Body 방식
  if (e && e.postData && e.postData.type === 'application/json') {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      console.error('❌ JSON 파싱 실패:', err);
    }
  }
  
  // URL 파라미터 방식
  return e?.parameter || {};
}

function _extractSheetId(url) {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function _extractGid(url) {
  if (!url) return null;
  const match = url.match(/[#&]gid=([0-9]+)/);
  return match ? match[1] : null;
}

function _parseCsv(csvText) {
  if (!csvText) return [];
  
  const lines = csvText.split('\n');
  const result = [];
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    const row = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current); // 마지막 필드
    result.push(row);
  }
  
  return result;
}

function _isTimeMatch(csvTime, targetTime) {
  if (!csvTime || !targetTime) return false;
  
  try {
    // CSV에서 온 시간을 정규화
    let normalizedCsvTime = csvTime.toString().trim();
    
    // 다양한 시간 형식 처리
    if (normalizedCsvTime.match(/^\d{2}:\d{2}:\d{2}$/)) {
      // HH:MM:SS 형식
      const today = new Date().toISOString().split('T')[0];
      normalizedCsvTime = `${today}T${normalizedCsvTime}`;
    } else if (normalizedCsvTime.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      // YYYY-MM-DD HH:MM:SS 형식
      normalizedCsvTime = normalizedCsvTime.replace(' ', 'T');
    }
    
    const csvDate = new Date(normalizedCsvTime);
    const targetDate = new Date(targetTime);
    
    if (isNaN(csvDate.getTime()) || isNaN(targetDate.getTime())) {
      return false;
    }
    
    // 1분 이내 차이면 매칭으로 간주
    const timeDiff = Math.abs(csvDate.getTime() - targetDate.getTime());
    return timeDiff <= 60000; // 60초 = 1분
    
  } catch (error) {
    console.error('❌ 시간 매칭 오류:', error);
    return false;
  }
}