/**
 * 파일명 관리 모듈
 *
 * @description
 * index.html에서 분리된 파일명 생성 및 핸드번호 추출 전용 모듈
 * 성능 최적화와 유지보수성 향상을 위해 별도 모듈로 분리
 *
 * @version 1.0.0
 * @author Development Team
 * @date 2025-09-19
 */

class FilenameManager {
  constructor() {
    // 양방향 매핑 테이블 (O(1) 조회)
    this.handToFilename = new Map();  // 핸드번호 → 파일명
    this.filenameToHand = new Map();  // 파일명 → 핸드번호

    // 설정값 캐시
    this.config = {
      prefix: 'H',
      suffix: '',
      useAI: false,
      template: '{prefix}{handNumber}'
    };

    // 디바운싱을 위한 타이머
    this.saveTimer = null;
    this.SAVE_DELAY = 1000; // 1초 디바운스

    // 초기화
    this.initialize();
  }

  /**
   * 초기화 - localStorage에서 기존 매핑 로드
   */
  initialize() {
    try {
      // localStorage에서 매핑 데이터 로드
      const savedHandToFilename = localStorage.getItem('handToFilenameMapping');
      const savedFilenameToHand = localStorage.getItem('filenameToHandMapping');

      if (savedHandToFilename) {
        const data = JSON.parse(savedHandToFilename);
        Object.entries(data).forEach(([hand, filename]) => {
          this.handToFilename.set(parseInt(hand), filename);
        });
      }

      if (savedFilenameToHand) {
        const data = JSON.parse(savedFilenameToHand);
        Object.entries(data).forEach(([filename, hand]) => {
          this.filenameToHand.set(filename, parseInt(hand));
        });
      }

      // 설정값 로드
      this.loadConfig();

      if (window.DEBUG_MODE) console.log(`📦 FilenameManager 초기화: ${this.handToFilename.size}개 매핑 로드됨`);
    } catch (error) {
      console.error('FilenameManager 초기화 오류:', error);
    }
  }

  /**
   * 설정값 로드
   */
  loadConfig() {
    this.config.prefix = localStorage.getItem('filenamePrefix') || 'H';
    this.config.suffix = localStorage.getItem('filenameSuffix') || '';
    this.config.useAI = localStorage.getItem('useAIForFilename') === 'true';
    this.config.template = localStorage.getItem('filenameTemplate') || '{prefix}{handNumber}';
  }

  /**
   * 파일명 생성 (최적화된 버전)
   * @param {number} handNumber - 핸드 번호
   * @param {Object} context - 추가 컨텍스트 (선택적)
   * @returns {string} 생성된 파일명
   */
  async generateFilename(handNumber, context = {}) {
    try {
      // 1. 이미 매핑이 존재하면 즉시 반환 (O(1))
      if (this.handToFilename.has(handNumber)) {
        const cached = this.handToFilename.get(handNumber);
        if (window.DEBUG_MODE) console.log(`⚡ 캐시된 파일명 반환: #${handNumber} → ${cached}`);
        return cached;
      }

      // 2. 새 파일명 생성
      let filename = this.buildFilename(handNumber, context);

      // 3. AI 분석 추가 (설정된 경우)
      if (this.config.useAI && context.aiSummary) {
        filename = this.appendAISummary(filename, context.aiSummary);
      }

      // 4. 매핑 저장 (메모리 + localStorage)
      this.saveMapping(handNumber, filename);

      if (window.DEBUG_MODE) console.log(`✅ 새 파일명 생성: #${handNumber} → ${filename}`);
      return filename;

    } catch (error) {
      console.error('파일명 생성 오류:', error);
      // 폴백 파일명
      const fallback = `${this.config.prefix}${handNumber}_${Date.now()}`;
      this.saveMapping(handNumber, fallback);
      return fallback;
    }
  }

  /**
   * 복잡한 커스텀 파일명 생성 (기존 index.html 에서 이동)
   * @param {number} handNumber - 핸드 번호
   * @returns {string} 생성된 파일명
   */
  async generateCustomFilename(handNumber) {
    try {
      // 1. 이미 매핑이 존재하면 즉시 반환 (O(1))
      if (this.handToFilename.has(handNumber)) {
        const cached = this.handToFilename.get(handNumber);
        if (window.DEBUG_MODE) console.log(`⚡ 캐시된 커스텀 파일명: #${handNumber} → ${cached}`);
        return cached;
      }

      // localStorage에서 설정 불러오기
      const prefix = localStorage.getItem('filenamePrefix') || 'H';
      const suffix = localStorage.getItem('filenameSuffix') || '';
      const useAI = localStorage.getItem('useAIForFilename') === 'true';

      if (window.DEBUG_MODE) {
        console.log(`🔍 [generateCustomFilename] 함수 호출 - 핸드 #${handNumber}`);
        console.log(`🔍 localStorage.useAIForFilename: "${localStorage.getItem('useAIForFilename')}"`);
        console.log(`🔍 useAI boolean: ${useAI}`);
      }

      // 통합 분석 데이터 가져오기 (캐시됨)
      let analysis = null;
      if (typeof window.getUnifiedHandAnalysis === 'function') {
        analysis = await window.getUnifiedHandAnalysis(handNumber);
      }

      // 기본 파일명 구조: H{handNumber}
      let filename = `${prefix}${handNumber}`;

      if (analysis) {
        // 모든 플레이어와 핸드 정보 추가 (전체 플레이어 포함)
        if (analysis.players && analysis.players.length > 0) {
          // 모든 플레이어 정보를 파일명에 추가
          analysis.players.forEach(player => {
            if (player && player.name && player.cards) {
              filename += `_${player.name}_${player.cards}`;
            }
          });
        } else {
          // 플레이어 정보가 없는 경우 기존 hero/villain 방식 폴백
          if (analysis.hero) {
            filename += `_${analysis.hero.name}_${analysis.hero.cards}`;
          }
          if (analysis.villain) {
            filename += `_${analysis.villain.name}_${analysis.villain.cards}`;
          }
        }

        // AI 요약 및 키워드 로직 제거 - 플레이어 정보만 사용
      }

      // 접미사 추가
      filename = filename + suffix;

      // 파일명에서 특수문자 제거 (안전한 파일명)
      filename = this.cleanFilename(filename);

      // 매핑 저장
      this.saveMapping(handNumber, filename);

      if (window.DEBUG_MODE) console.log(`✅ 커스텀 파일명 생성 완료: ${filename} (매핑 저장됨)`);
      return filename;
    } catch (error) {
      console.error('파일명 생성 오류:', error);
      // 기본 파일명으로 폴백
      const fallbackFilename = `H${handNumber}_${new Date().toISOString().slice(0,10).replace(/-/g, '')}`;
      this.saveMapping(handNumber, fallbackFilename); // 폴백 파일명도 매핑 저장
      return fallbackFilename;
    }
  }

  /**
   * 기본 파일명 빌드
   */
  buildFilename(handNumber, context) {
    let filename = this.config.template;

    // 변수 치환
    const variables = {
      prefix: this.config.prefix,
      suffix: this.config.suffix,
      handNumber: handNumber,
      date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      timestamp: Date.now(),
      // 컨텍스트 기반 변수 추가 (기본값 포함)
      position: context.position || '',
      action: context.action || '',
      result: context.result || '',
      hero: context.hero || '',
      villain: context.villain || '',
      ...context  // 추가 컨텍스트 변수
    };

    // 템플릿 변수 치환
    Object.entries(variables).forEach(([key, value]) => {
      filename = filename.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
    });

    // 파일명 정리 (연속된 밑줄 제거 등)
    filename = this.cleanFilename(filename);

    return filename;
  }

  /**
   * AI 요약 추가
   */
  appendAISummary(filename, aiSummary) {
    if (!aiSummary) return filename;

    // AI 요약을 파일명 안전한 형태로 변환
    const safeSummary = aiSummary
      .replace(/[^a-zA-Z0-9가-힣]/g, '_')  // 특수문자 제거
      .replace(/_+/g, '_')                  // 연속 밑줄 제거
      .slice(0, 30);                       // 최대 30자

    return `${filename}_${safeSummary}`;
  }

  /**
   * 파일명 정리
   */
  cleanFilename(filename) {
    return filename
      .replace(/_{2,}/g, '_')     // 연속 밑줄 제거
      .replace(/^_+|_+$/g, '')    // 시작/끝 밑줄 제거
      .replace(/\s+/g, '_')       // 공백을 밑줄로
      .replace(/[^\w가-힣-]/g, ''); // 안전하지 않은 문자 제거
  }

  /**
   * 핸드번호 추출 (최적화)
   * @param {string} filename - 파일명
   * @returns {number|null} 추출된 핸드번호
   */
  extractHandNumber(filename) {
    if (!filename) return null;

    // 1. 매핑 테이블에서 즉시 조회 (O(1))
    if (this.filenameToHand.has(filename)) {
      const cached = this.filenameToHand.get(filename);
      if (window.DEBUG_MODE) console.log(`⚡ 매핑에서 핸드번호 조회: ${filename} → #${cached}`);
      return cached;
    }

    // 2. 패턴 매칭 (폴백)
    const patterns = [
      /^[A-Z]*(\d+)_/,    // H142_, VT142_ 등
      /^(\d+)_/,          // 142_
      /^(\d+)$/           // 142
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        const handNumber = parseInt(match[1]);
        // 추출 성공 시 매핑 저장
        this.saveMapping(handNumber, filename);
        if (window.DEBUG_MODE) console.log(`🔍 패턴으로 핸드번호 추출: ${filename} → #${handNumber}`);
        return handNumber;
      }
    }

    if (window.DEBUG_MODE) console.warn(`❌ 핸드번호 추출 실패: ${filename}`);
    return null;
  }

  /**
   * 매핑 저장 (양방향)
   */
  saveMapping(handNumber, filename) {
    if (!handNumber || !filename) return;

    const handNum = parseInt(handNumber);
    if (isNaN(handNum) || handNum <= 0) return;

    // 메모리에 저장
    this.handToFilename.set(handNum, filename);
    this.filenameToHand.set(filename, handNum);

    // localStorage에 영구 저장 (디바운스)
    this.scheduleSave();

    if (window.DEBUG_MODE) console.log(`💾 매핑 저장: #${handNum} ↔ "${filename}"`);
  }

  /**
   * localStorage 저장 스케줄링 (디바운싱)
   */
  scheduleSave() {
    // 이전 타이머 취소
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // 새 타이머 설정
    this.saveTimer = setTimeout(() => {
      this.persistToStorage();
    }, this.SAVE_DELAY);
  }

  /**
   * localStorage에 즉시 저장
   */
  persistToStorage() {
    try {
      const handToFilenameObj = Object.fromEntries(this.handToFilename);
      const filenameToHandObj = Object.fromEntries(this.filenameToHand);

      localStorage.setItem('handToFilenameMapping', JSON.stringify(handToFilenameObj));
      localStorage.setItem('filenameToHandMapping', JSON.stringify(filenameToHandObj));

      if (window.DEBUG_MODE) console.log(`💾 localStorage 동기화: ${this.handToFilename.size}개 매핑`);
    } catch (error) {
      console.warn('localStorage 저장 실패:', error);
    }
  }

  /**
   * 일괄 처리 최적화
   * @param {Array} items - [{handNumber, filename}] 배열
   */
  batchSaveMappings(items) {
    if (window.DEBUG_MODE) console.log(`📦 일괄 매핑 시작: ${items.length}개`);

    items.forEach(({handNumber, filename}) => {
      if (handNumber && filename) {
        const handNum = parseInt(handNumber);
        if (!isNaN(handNum) && handNum > 0) {
          this.handToFilename.set(handNum, filename);
          this.filenameToHand.set(filename, handNum);
        }
      }
    });

    // 일괄 처리 후 즉시 저장
    this.persistToStorage();
    if (window.DEBUG_MODE) console.log(`✅ 일괄 매핑 완료: ${this.handToFilename.size}개`);
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      totalMappings: this.handToFilename.size,
      memorySize: this.estimateMemorySize(),
      config: this.config
    };
  }

  /**
   * 메모리 사용량 추정
   */
  estimateMemorySize() {
    // 대략적인 추정 (각 매핑당 100바이트)
    const bytes = this.handToFilename.size * 100 * 2; // 양방향
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  /**
   * 매핑 초기화
   */
  clearMappings() {
    this.handToFilename.clear();
    this.filenameToHand.clear();
    localStorage.removeItem('handToFilenameMapping');
    localStorage.removeItem('filenameToHandMapping');
    if (window.DEBUG_MODE) console.log('🗑️ 모든 매핑 초기화됨');
  }

  /**
   * 디버그 정보 출력
   */
  debug() {
    console.group('📊 FilenameManager 디버그 정보');
    console.log('총 매핑 수:', this.handToFilename.size);
    console.log('메모리 사용:', this.estimateMemorySize());
    console.log('현재 설정:', this.config);
    console.log('샘플 매핑 (처음 5개):');

    let count = 0;
    for (const [hand, filename] of this.handToFilename) {
      console.log(`  #${hand} → ${filename}`);
      if (++count >= 5) break;
    }

    console.groupEnd();
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const filenameManager = new FilenameManager();

// 전역 객체에 노출 (index.html과의 호환성)
window.FilenameManager = filenameManager;

// ES6 모듈 내보내기 (향후 모듈화 시 사용)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = filenameManager;
}