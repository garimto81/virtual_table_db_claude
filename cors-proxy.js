// CORS 프록시 함수 - Google Apps Script와의 통신 문제 해결
// Apps Script는 mode: 'no-cors'일 때 응답을 읽을 수 없으므로 다른 방법 사용

/**
 * Google Apps Script와 안전하게 통신하는 함수
 * CORS 문제를 회피하면서도 응답을 받을 수 있도록 처리
 */
async function callAppsScript(url, data) {
  console.log('📡 Apps Script 호출:', data.action || 'unknown');

  try {
    // 방법 1: 일반 fetch 시도 (CORS 헤더가 설정된 경우 작동)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Apps Script 응답:', result);
        return result;
      }
    } catch (corsError) {
      console.log('⚠️ CORS 오류, 대체 방법 시도:', corsError.message);
    }

    // 방법 2: JSONP 방식 (GET 요청으로 변환)
    return new Promise((resolve, reject) => {
      const callbackName = 'callback_' + Date.now();
      const script = document.createElement('script');

      // 전역 콜백 함수 생성
      window[callbackName] = (result) => {
        delete window[callbackName];
        document.body.removeChild(script);
        console.log('✅ JSONP 응답:', result);
        resolve(result);
      };

      // GET 파라미터로 데이터 전달
      const params = new URLSearchParams({
        callback: callbackName,
        data: JSON.stringify(data)
      });

      script.src = url + '?' + params.toString();
      script.onerror = () => {
        delete window[callbackName];
        document.body.removeChild(script);
        reject(new Error('JSONP 요청 실패'));
      };

      document.body.appendChild(script);

      // 타임아웃 설정
      setTimeout(() => {
        if (window[callbackName]) {
          delete window[callbackName];
          document.body.removeChild(script);
          reject(new Error('요청 시간 초과'));
        }
      }, 30000);
    });

  } catch (error) {
    console.error('❌ Apps Script 호출 실패:', error);
    throw error;
  }
}

// 기존 fetch를 대체하는 래퍼 함수
window.fetchAppsScript = async function(url, options = {}) {
  const data = JSON.parse(options.body || '{}');
  return callAppsScript(url, data);
};

// 로컬 개발용 프록시 서버 정보
const PROXY_CONFIG = {
  // 로컬 프록시 서버를 사용하는 경우
  useProxy: false,
  proxyUrl: 'http://localhost:3001/proxy',

  // Apps Script URL
  appsScriptUrl: localStorage.getItem('apps_script_url') || ''
};

/**
 * 프록시를 통한 Apps Script 호출 (옵션)
 * 로컬 Node.js 프록시 서버가 필요합니다
 */
async function callAppsScriptViaProxy(data) {
  if (!PROXY_CONFIG.useProxy) {
    return callAppsScript(PROXY_CONFIG.appsScriptUrl, data);
  }

  try {
    const response = await fetch(PROXY_CONFIG.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: PROXY_CONFIG.appsScriptUrl,
        data: data
      })
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`프록시 응답 오류: ${response.status}`);
  } catch (error) {
    console.error('❌ 프록시 호출 실패:', error);
    throw error;
  }
}

// 전역 함수로 노출
window.callAppsScript = callAppsScript;
window.callAppsScriptViaProxy = callAppsScriptViaProxy;

console.log('✅ CORS 프록시 모듈 로드됨');