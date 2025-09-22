/**
 * Virtual Table SSE (Server-Sent Events) 서버
 * Google Apps Script를 사용한 실시간 핸드 감지 시스템
 *
 * @version 1.0.0
 * @date 2025-09-19
 */

// ============================================================
// 전역 설정
// ============================================================
const CONFIG = {
  SHEET_ID: 'YOUR_SHEET_ID', // Google Sheets ID를 여기에 입력
  SHEET_NAME: '시트1',
  MAX_EVENT_QUEUE: 100,
  HEARTBEAT_INTERVAL: 30000, // 30초
  CORS_ORIGIN: '*',
  EVENT_EXPIRY: 300000, // 5분
  CACHE_KEY: 'SSE_EVENT_QUEUE',
  LAST_HAND_KEY: 'LAST_HAND_NUMBER'
};

// ============================================================
// SSE 엔드포인트
// ============================================================

/**
 * HTTP GET 요청 처리
 * SSE 연결 및 일반 API 요청 처리
 */
function doGet(e) {
  const mode = e.parameter.mode || 'default';

  try {
    switch (mode) {
      case 'sse':
        return handleSSEConnection(e);
      case 'status':
        return handleStatusRequest();
      case 'test':
        return handleTestRequest();
      default:
        return createJsonResponse({
          status: 'ok',
          message: 'Virtual Table SSE Server',
          version: '1.0.0',
          endpoints: {
            sse: '?mode=sse',
            status: '?mode=status',
            test: '?mode=test'
          }
        });
    }
  } catch (error) {
    console.error('doGet 오류:', error);
    return createJsonResponse({
      error: error.toString()
    }, 500);
  }
}

/**
 * SSE 연결 처리
 */
function handleSSEConnection(e) {
  // SSE 헤더 설정
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.TEXT);

  // SSE 응답 생성
  let responseData = '';

  // 연결 성공 메시지
  responseData += ': SSE Connection Established\n\n';

  // 이벤트 큐에서 대기중인 이벤트 전송
  const events = getEventQueue();
  const lastEventId = e.parameter.lastEventId || '0';

  events.forEach(event => {
    if (event.id > lastEventId) {
      responseData += formatSSEEvent(event);
    }
  });

  // Heartbeat 메시지
  responseData += ': heartbeat\n\n';

  output.setContent(responseData);

  // CORS 헤더 추가
  return output
    .addHeader('Content-Type', 'text/event-stream')
    .addHeader('Cache-Control', 'no-cache')
    .addHeader('Access-Control-Allow-Origin', CONFIG.CORS_ORIGIN)
    .addHeader('X-Content-Type-Options', 'nosniff');
}

/**
 * SSE 이벤트 포맷팅
 */
function formatSSEEvent(event) {
  let output = '';
  output += `id: ${event.id}\n`;
  output += `event: ${event.type}\n`;
  output += `data: ${JSON.stringify(event.data)}\n`;
  output += `retry: 3000\n`;
  output += '\n';
  return output;
}

// ============================================================
// 시트 변경 감지
// ============================================================

/**
 * onChange 트리거 함수
 * Google Sheets에 변경사항 발생 시 자동 실행
 */
function onSheetChange(e) {
  try {
    console.log('시트 변경 감지:', e);

    // 스프레드시트 및 시트 가져오기
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      console.error('시트를 찾을 수 없음:', CONFIG.SHEET_NAME);
      return;
    }

    // 새 핸드 감지
    const newHand = detectNewHand(sheet);

    if (newHand) {
      console.log('새 핸드 감지됨:', newHand);
      addEventToQueue(newHand);
    }
  } catch (error) {
    console.error('onChange 오류:', error);
  }
}

/**
 * 새 핸드 감지 로직
 */
function detectNewHand(sheet) {
  try {
    // 마지막 행 가져오기
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return null; // 헤더만 있는 경우

    // 마지막 행 데이터 가져오기
    const rowData = sheet.getRange(lastRow, 1, 1, 10).getValues()[0];

    // 핸드 번호 추출 (A열)
    const handNumber = rowData[0];
    if (!handNumber) return null;

    // 이전에 처리한 핸드 번호 확인
    const lastProcessedHand = PropertiesService.getScriptProperties()
      .getProperty(CONFIG.LAST_HAND_KEY);

    if (lastProcessedHand && parseInt(handNumber) <= parseInt(lastProcessedHand)) {
      return null; // 이미 처리된 핸드
    }

    // 새 핸드 데이터 구성
    const newHandData = {
      handNumber: handNumber,
      time: rowData[1] || new Date().toISOString(),
      table: rowData[2] || 'Unknown',
      dealer: rowData[3] || 'Unknown',
      smallBlind: rowData[4] || 0,
      bigBlind: rowData[5] || 0,
      players: rowData[6] || 0,
      pot: rowData[7] || 0,
      winner: rowData[8] || '',
      notes: rowData[9] || '',
      timestamp: new Date().getTime()
    };

    // 마지막 처리 핸드 번호 업데이트
    PropertiesService.getScriptProperties()
      .setProperty(CONFIG.LAST_HAND_KEY, handNumber.toString());

    return newHandData;
  } catch (error) {
    console.error('detectNewHand 오류:', error);
    return null;
  }
}

// ============================================================
// 이벤트 큐 관리
// ============================================================

/**
 * 이벤트를 큐에 추가
 */
function addEventToQueue(handData) {
  try {
    const cache = CacheService.getScriptCache();
    let events = getEventQueue();

    // 새 이벤트 생성
    const newEvent = {
      id: new Date().getTime().toString(),
      type: 'newHand',
      data: handData,
      timestamp: new Date().getTime()
    };

    // 큐에 추가
    events.push(newEvent);

    // 최대 크기 유지
    if (events.length > CONFIG.MAX_EVENT_QUEUE) {
      events = events.slice(-CONFIG.MAX_EVENT_QUEUE);
    }

    // 캐시에 저장
    cache.put(CONFIG.CACHE_KEY, JSON.stringify(events), 21600); // 6시간

    console.log('이벤트 큐에 추가됨:', newEvent.id);

    return newEvent;
  } catch (error) {
    console.error('addEventToQueue 오류:', error);
    return null;
  }
}

/**
 * 이벤트 큐 가져오기
 */
function getEventQueue() {
  try {
    const cache = CacheService.getScriptCache();
    const eventsJson = cache.get(CONFIG.CACHE_KEY);

    if (!eventsJson) {
      return [];
    }

    let events = JSON.parse(eventsJson);

    // 만료된 이벤트 제거
    const now = new Date().getTime();
    events = events.filter(event =>
      (now - event.timestamp) < CONFIG.EVENT_EXPIRY
    );

    return events;
  } catch (error) {
    console.error('getEventQueue 오류:', error);
    return [];
  }
}

/**
 * 이벤트 큐 초기화
 */
function clearEventQueue() {
  const cache = CacheService.getScriptCache();
  cache.remove(CONFIG.CACHE_KEY);
  console.log('이벤트 큐 초기화됨');
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * JSON 응답 생성
 */
function createJsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', CONFIG.CORS_ORIGIN);
}

/**
 * 상태 확인 엔드포인트
 */
function handleStatusRequest() {
  const events = getEventQueue();
  const lastHand = PropertiesService.getScriptProperties()
    .getProperty(CONFIG.LAST_HAND_KEY);

  return createJsonResponse({
    status: 'online',
    queueSize: events.length,
    lastHandNumber: lastHand || 'none',
    timestamp: new Date().toISOString()
  });
}

/**
 * 테스트 이벤트 생성
 */
function handleTestRequest() {
  const testHand = {
    handNumber: 'TEST-' + new Date().getTime(),
    time: new Date().toISOString(),
    table: 'Test Table',
    dealer: 'Test Dealer',
    smallBlind: 100,
    bigBlind: 200,
    players: 6,
    pot: 1500,
    winner: 'Test Player',
    notes: '테스트 핸드',
    timestamp: new Date().getTime()
  };

  const event = addEventToQueue(testHand);

  return createJsonResponse({
    success: true,
    message: '테스트 이벤트 생성됨',
    event: event
  });
}

// ============================================================
// 트리거 설정 함수
// ============================================================

/**
 * 프로젝트 초기 설정
 * 이 함수를 한 번 실행하여 트리거 설정
 */
function setupTriggers() {
  // 기존 트리거 제거
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // onChange 트리거 설정
  ScriptApp.newTrigger('onSheetChange')
    .forSpreadsheet(CONFIG.SHEET_ID)
    .onChange()
    .create();

  console.log('트리거 설정 완료');
}

/**
 * 수동 테스트 함수
 */
function testSSESystem() {
  // 테스트 핸드 데이터
  const testEvent = handleTestRequest();
  console.log('테스트 결과:', testEvent);

  // 이벤트 큐 확인
  const events = getEventQueue();
  console.log('현재 이벤트 큐:', events);

  // 상태 확인
  const status = handleStatusRequest();
  console.log('시스템 상태:', status);
}

// ============================================================
// 배포 정보
// ============================================================
/**
 * 배포 방법:
 * 1. Google Apps Script 에디터에서 이 코드 붙여넣기
 * 2. CONFIG.SHEET_ID를 실제 Google Sheets ID로 변경
 * 3. setupTriggers() 함수 한 번 실행
 * 4. 배포 > 새 배포 > 웹 앱으로 배포
 * 5. 액세스 권한: 모든 사용자
 * 6. 배포 URL 복사하여 index.html에서 사용
 */