/**
 * SSE 클라이언트 - Virtual Table 실시간 핸드 감지
 * Server-Sent Events를 통한 실시간 업데이트
 *
 * @version 1.0.0
 * @date 2025-09-19
 */

// ============================================================
// SSE 핸드 감지 클래스
// ============================================================

class SSEHandDetector {
  constructor(config = {}) {
    // 설정
    this.config = {
      sseUrl: config.sseUrl || '',
      reconnectDelay: config.reconnectDelay || 1000,
      maxReconnectDelay: config.maxReconnectDelay || 30000,
      heartbeatTimeout: config.heartbeatTimeout || 60000,
      debug: config.debug || false,
      ...config
    };

    // 상태
    this.eventSource = null;
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.lastEventId = null;

    // 이벤트 핸들러
    this.handlers = {
      onNewHand: null,
      onConnect: null,
      onDisconnect: null,
      onError: null,
      onStatusChange: null
    };

    // 통계
    this.stats = {
      connectTime: null,
      eventsReceived: 0,
      reconnects: 0,
      errors: 0
    };
  }

  // ============================================================
  // 연결 관리
  // ============================================================

  /**
   * SSE 연결 시작
   */
  connect() {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
      this.log('이미 연결 중이거나 연결됨');
      return;
    }

    this.updateStatus('connecting');
    this.log('SSE 연결 시작...');

    try {
      // URL 구성
      let url = this.config.sseUrl + '?mode=sse';
      if (this.lastEventId) {
        url += `&lastEventId=${this.lastEventId}`;
      }

      // EventSource 생성
      this.eventSource = new EventSource(url);

      // 이벤트 리스너 설정
      this.setupEventListeners();

      // Heartbeat 타이머 시작
      this.startHeartbeatTimer();

    } catch (error) {
      this.handleError('연결 생성 실패', error);
      this.scheduleReconnect();
    }
  }

  /**
   * SSE 연결 종료
   */
  disconnect() {
    this.log('SSE 연결 종료');

    // 재연결 타이머 취소
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Heartbeat 타이머 취소
    this.stopHeartbeatTimer();

    // EventSource 종료
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.updateStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * 재연결
   */
  reconnect() {
    this.disconnect();
    this.connect();
  }

  /**
   * 재연결 스케줄링 (Exponential Backoff)
   */
  scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    this.log(`${delay}ms 후 재연결 시도... (시도 #${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.stats.reconnects++;
      this.connect();
    }, delay);
  }

  // ============================================================
  // 이벤트 처리
  // ============================================================

  /**
   * EventSource 이벤트 리스너 설정
   */
  setupEventListeners() {
    if (!this.eventSource) return;

    // 연결 성공
    this.eventSource.onopen = (event) => {
      this.log('✅ SSE 연결 성공');
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
      this.stats.connectTime = new Date();

      if (this.handlers.onConnect) {
        this.handlers.onConnect(event);
      }
    };

    // 새 핸드 이벤트
    this.eventSource.addEventListener('newHand', (event) => {
      this.handleNewHand(event);
    });

    // 기본 메시지
    this.eventSource.onmessage = (event) => {
      this.log('메시지 수신:', event.data);
      this.resetHeartbeatTimer();
    };

    // 에러 처리
    this.eventSource.onerror = (error) => {
      this.handleError('SSE 연결 오류', error);

      if (this.eventSource.readyState === EventSource.CLOSED) {
        this.updateStatus('disconnected');
        this.scheduleReconnect();
      }
    };
  }

  /**
   * 새 핸드 이벤트 처리
   */
  handleNewHand(event) {
    try {
      // 이벤트 ID 저장
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
      }

      // 데이터 파싱
      const handData = JSON.parse(event.data);
      this.log('🎯 새 핸드 감지:', handData);

      // 통계 업데이트
      this.stats.eventsReceived++;

      // Heartbeat 리셋
      this.resetHeartbeatTimer();

      // 핸들러 호출
      if (this.handlers.onNewHand) {
        this.handlers.onNewHand(handData, event);
      }

    } catch (error) {
      this.handleError('새 핸드 처리 오류', error);
    }
  }

  // ============================================================
  // Heartbeat 관리
  // ============================================================

  /**
   * Heartbeat 타이머 시작
   */
  startHeartbeatTimer() {
    this.stopHeartbeatTimer();

    this.heartbeatTimer = setTimeout(() => {
      this.log('⚠️ Heartbeat 타임아웃');
      this.handleError('Heartbeat 타임아웃', new Error('No heartbeat received'));
      this.reconnect();
    }, this.config.heartbeatTimeout);
  }

  /**
   * Heartbeat 타이머 중지
   */
  stopHeartbeatTimer() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Heartbeat 타이머 리셋
   */
  resetHeartbeatTimer() {
    this.startHeartbeatTimer();
  }

  // ============================================================
  // 유틸리티
  // ============================================================

  /**
   * 상태 업데이트
   */
  updateStatus(status) {
    const oldStatus = this.connectionStatus;
    this.connectionStatus = status;

    if (oldStatus !== status) {
      this.log(`상태 변경: ${oldStatus} → ${status}`);

      if (this.handlers.onStatusChange) {
        this.handlers.onStatusChange(status, oldStatus);
      }

      if (status === 'disconnected' && this.handlers.onDisconnect) {
        this.handlers.onDisconnect();
      }
    }
  }

  /**
   * 에러 처리
   */
  handleError(message, error) {
    this.stats.errors++;
    console.error(`❌ ${message}:`, error);

    if (this.handlers.onError) {
      this.handlers.onError(message, error);
    }
  }

  /**
   * 디버그 로그
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[SSE]', ...args);
    }
  }

  /**
   * 이벤트 핸들러 등록
   */
  on(event, handler) {
    if (this.handlers.hasOwnProperty(event)) {
      this.handlers[event] = handler;
    }
  }

  /**
   * 통계 정보 반환
   */
  getStats() {
    return {
      ...this.stats,
      connectionStatus: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts,
      uptime: this.stats.connectTime ?
        (new Date() - this.stats.connectTime) / 1000 : 0
    };
  }

  /**
   * 수동 테스트 이벤트 트리거
   */
  async triggerTest() {
    try {
      const response = await fetch(this.config.sseUrl + '?mode=test');
      const data = await response.json();
      this.log('테스트 이벤트 트리거됨:', data);
      return data;
    } catch (error) {
      this.handleError('테스트 이벤트 트리거 실패', error);
      throw error;
    }
  }

  /**
   * 서버 상태 확인
   */
  async checkStatus() {
    try {
      const response = await fetch(this.config.sseUrl + '?mode=status');
      const data = await response.json();
      this.log('서버 상태:', data);
      return data;
    } catch (error) {
      this.handleError('상태 확인 실패', error);
      throw error;
    }
  }
}

// ============================================================
// UI 통합 헬퍼
// ============================================================

class SSEHandUI {
  constructor(detector) {
    this.detector = detector;
    this.container = null;
    this.statusElement = null;
    this.notificationEnabled = true;
    this.soundEnabled = true;
  }

  /**
   * UI 초기화
   */
  init(containerId, statusId) {
    this.container = document.getElementById(containerId);
    this.statusElement = document.getElementById(statusId);

    // 상태 표시 업데이트
    this.detector.on('onStatusChange', (status) => {
      this.updateStatusDisplay(status);
    });

    // 새 핸드 처리
    this.detector.on('onNewHand', (handData) => {
      this.addHandToUI(handData);
    });
  }

  /**
   * 핸드를 UI에 추가
   */
  addHandToUI(handData) {
    // 중복 체크
    if (this.isHandExists(handData.handNumber)) {
      console.log('중복 핸드 무시:', handData.handNumber);
      return;
    }

    // 핸드 엘리먼트 생성
    const handElement = this.createHandElement(handData);

    // 애니메이션 클래스 추가
    handElement.classList.add('new-hand-animation', 'sse-new-hand');

    // 컨테이너에 추가 (맨 앞에)
    if (this.container) {
      this.container.prepend(handElement);
    }

    // 알림
    if (this.notificationEnabled) {
      this.showNotification(handData);
    }

    // 사운드
    if (this.soundEnabled) {
      this.playNotificationSound();
    }
  }

  /**
   * 핸드 엘리먼트 생성
   */
  createHandElement(handData) {
    const div = document.createElement('div');
    div.className = 'hand-item';
    div.dataset.handNumber = handData.handNumber;

    div.innerHTML = `
      <div class="hand-header">
        <span class="hand-number">#${handData.handNumber}</span>
        <span class="hand-time">${this.formatTime(handData.time)}</span>
        <span class="sse-badge">LIVE</span>
      </div>
      <div class="hand-body">
        <div class="hand-info">
          <span class="table">테이블: ${handData.table}</span>
          <span class="blinds">${handData.smallBlind}/${handData.bigBlind}</span>
          <span class="players">${handData.players}명</span>
        </div>
        ${handData.winner ? `
          <div class="hand-result">
            <span class="winner">우승자: ${handData.winner}</span>
            <span class="pot">팟: ${handData.pot}</span>
          </div>
        ` : ''}
      </div>
    `;

    return div;
  }

  /**
   * 핸드 존재 여부 확인
   */
  isHandExists(handNumber) {
    if (!this.container) return false;
    return this.container.querySelector(`[data-hand-number="${handNumber}"]`) !== null;
  }

  /**
   * 연결 상태 표시
   */
  updateStatusDisplay(status) {
    if (!this.statusElement) return;

    const statusMap = {
      'connected': { text: '연결됨', class: 'status-connected', icon: '🟢' },
      'connecting': { text: '연결 중...', class: 'status-connecting', icon: '🟡' },
      'disconnected': { text: '연결 끊김', class: 'status-disconnected', icon: '🔴' },
      'reconnecting': { text: '재연결 중...', class: 'status-reconnecting', icon: '🟠' }
    };

    const statusInfo = statusMap[status] || statusMap['disconnected'];

    this.statusElement.innerHTML = `
      <span class="sse-status ${statusInfo.class}">
        ${statusInfo.icon} SSE: ${statusInfo.text}
      </span>
    `;
  }

  /**
   * 알림 표시
   */
  showNotification(handData) {
    const message = `새 핸드 #${handData.handNumber} 추가됨!`;

    // 브라우저 알림
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Virtual Table', {
        body: message,
        icon: '/favicon.ico',
        tag: 'new-hand',
        requireInteraction: false
      });
    }

    // 화면 알림
    this.showToast(message);
  }

  /**
   * 토스트 메시지
   */
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'sse-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * 알림 사운드 재생
   */
  playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLYiTQHGWi77OScTgwOUaXh8btpHgU+ktvzzH0vBS+Hz/fdk0EKFWi068+jTxELSp3k8cJwKAg2k9vvw3UnBSF8yvPfkEYKHGy36+OoVA0KTJve6adXDC7m9quzPgwfd0+pUBAwSJvg7blmFAU7k9npw3IkBSyAzOjWhDQIHWy96+OUSAoLSZzd77RpGAU+jtrryHMpBSh+y+7bkD0KEV6y58KiUBAMTKXi8LZhHAcziM/yx4U7CRlmuvPppVgSC1Kw5vinUBEHOIbP68p2KgUlgMzx2oo3CRxstvHkPgwKR4zb8L1lHwU7lNjsxHkoBCh+yvHckTcHG2q86eShVg0LUqzn8a1aEAErc8xpNwsUZ7Xs6KVUEAEpdMtpOAoUZ7Xs6KVUEAEpdMtpOAoUZ7Xs6KVUEAEpdMxpNwsUZ7Xs6KVUEAEpdMxpNwsUZ7Xs6KVUEAEpdMxpNwsUZ7Ts6KVUEAE=');
      audio.volume = 0.3;
      audio.play();
    } catch (error) {
      console.warn('사운드 재생 실패:', error);
    }
  }

  /**
   * 시간 포맷팅
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

// ============================================================
// CSS 스타일 (동적 주입)
// ============================================================

const injectSSEStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* SSE 상태 표시 */
    .sse-status {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
    }

    .status-connected {
      background: #10b98115;
      color: #10b981;
    }

    .status-connecting {
      background: #eab30815;
      color: #eab308;
    }

    .status-disconnected {
      background: #ef444415;
      color: #ef4444;
    }

    .status-reconnecting {
      background: #f9731615;
      color: #f97316;
    }

    /* 새 핸드 애니메이션 */
    @keyframes slideInFromTop {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .new-hand-animation {
      animation: slideInFromTop 0.5s ease-out;
    }

    .sse-new-hand {
      border-left: 4px solid #10b981;
      background: linear-gradient(90deg, #10b98110 0%, transparent 100%);
    }

    /* SSE 배지 */
    .sse-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #10b981;
      color: white;
      font-size: 11px;
      font-weight: bold;
      border-radius: 10px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    /* 토스트 알림 */
    .sse-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateX(400px);
      transition: transform 0.3s ease-out;
      z-index: 10000;
    }

    .sse-toast.show {
      transform: translateX(0);
    }

    /* 디버그 패널 */
    .sse-debug-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
    }

    .sse-debug-panel h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: bold;
    }

    .sse-debug-panel .stat-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .sse-debug-panel .stat-label {
      color: #6b7280;
    }

    .sse-debug-panel .stat-value {
      font-weight: bold;
      color: #1f2937;
    }

    /* 테스트 버튼 */
    .sse-test-button {
      position: fixed;
      bottom: 20px;
      left: 20px;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
      z-index: 9999;
    }

    .sse-test-button:hover {
      background: #2563eb;
    }

    .sse-test-button:active {
      transform: scale(0.95);
    }
  `;
  document.head.appendChild(style);
};

// ============================================================
// Export
// ============================================================

// 브라우저 환경에서 전역 객체로 노출
if (typeof window !== 'undefined') {
  window.SSEHandDetector = SSEHandDetector;
  window.SSEHandUI = SSEHandUI;
  window.injectSSEStyles = injectSSEStyles;
}

// Node.js 환경에서 모듈로 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SSEHandDetector,
    SSEHandUI,
    injectSSEStyles
  };
}