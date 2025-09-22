/**
 * 파일명 관리 어댑터
 *
 * @description
 * index.html과 filename-manager.js 모듈을 연결하는 어댑터
 * 기존 코드와의 호환성을 유지하면서 점진적 마이그레이션 지원
 *
 * @version 1.0.0
 * @date 2025-09-19
 */

(function(window) {
  'use strict';

  /**
   * FilenameManager 모듈 로드 확인
   */
  function ensureFilenameManager() {
    if (!window.FilenameManager) {
      console.error('❌ FilenameManager 모듈이 로드되지 않았습니다.');
      // 폴백: 기본 매핑 객체 생성
      window.FilenameManager = {
        handToFilename: new Map(),
        filenameToHand: new Map(),
        generateFilename: async (handNumber) => `H${handNumber}`,
        extractHandNumber: (filename) => {
          const match = filename.match(/(\d+)/);
          return match ? parseInt(match[1]) : null;
        }
      };
    }
  }

  /**
   * 기존 함수를 새 모듈로 리다이렉트
   * index.html의 기존 함수 호출을 모듈로 위임
   */
  function setupCompatibilityLayer() {
    ensureFilenameManager();

    // 기존 전역 변수 매핑 (하위 호환성)
    window.handToFilenameMapping = window.FilenameManager.handToFilename;
    window.filenameToHandMapping = window.FilenameManager.filenameToHand;

    // 기존 함수 오버라이드

    /**
     * generateCustomFilename 래퍼
     * 기존 index.html 코드와 동일한 인터페이스 제공
     */
    window.generateCustomFilename = async function(handNumber) {
      try {
        // FilenameManager의 generateCustomFilename 메서드 직접 호출
        return await window.FilenameManager.generateCustomFilename(handNumber);
      } catch (error) {
        console.error('generateCustomFilename 래퍼 오류:', error);
        // 폴백
        return `H${handNumber}_${Date.now()}`;
      }
    };

    /**
     * extractHandNumberFromFilename 래퍼
     */
    window.extractHandNumberFromFilename = function(filename) {
      return window.FilenameManager.extractHandNumber(filename);
    };

    /**
     * saveHandFilenameMapping 래퍼
     */
    window.saveHandFilenameMapping = function(handNumber, filename) {
      window.FilenameManager.saveMapping(handNumber, filename);
    };

    /**
     * getHandNumberFromMapping 래퍼
     */
    window.getHandNumberFromMapping = function(filename) {
      return window.FilenameManager.filenameToHand.get(filename) || null;
    };

    /**
     * loadHandFilenameMappingsFromStorage 래퍼
     */
    window.loadHandFilenameMappingsFromStorage = function() {
      window.FilenameManager.initialize();
    };

    /**
     * saveHandFilenameMappingsToStorage 래퍼
     */
    window.saveHandFilenameMappingsToStorage = function() {
      window.FilenameManager.persistToStorage();
    };
  }

  /**
   * 핸드 컨텍스트 수집 (기존 로직 재사용)
   */
  async function collectHandContext(handNumber) {
    const context = {};

    try {
      // AI 사용 여부 확인
      const useAI = localStorage.getItem('useAIForFilename') === 'true';

      if (useAI && typeof window.getUnifiedHandAnalysis === 'function') {
        // 기존 분석 함수 호출
        const analysis = await window.getUnifiedHandAnalysis(handNumber);

        if (analysis) {
          context.hero = analysis.hero?.name || '';
          context.villain = analysis.villain?.name || '';
          context.heroCards = analysis.hero?.cards || '';
          context.villainCards = analysis.villain?.cards || '';
          context.keywords = (analysis.keywords || []).join('_');

          // AI 요약 (있는 경우)
          if (analysis.aiSummary) {
            context.aiSummary = analysis.aiSummary;
          }
        }
      }

      // 추가 컨텍스트
      context.date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      context.time = new Date().toTimeString().slice(0, 5).replace(':', '');

    } catch (error) {
      console.warn('컨텍스트 수집 중 오류 (무시):', error);
    }

    return context;
  }

  /**
   * 성능 모니터링 래퍼
   */
  function wrapWithPerformanceMonitoring(fn, fnName) {
    return async function(...args) {
      const startTime = performance.now();

      try {
        const result = await fn.apply(this, args);
        const duration = performance.now() - startTime;

        if (window.DEBUG_MODE) {
          console.log(`⏱️ ${fnName}: ${duration.toFixed(2)}ms`);
        }

        return result;
      } catch (error) {
        console.error(`${fnName} 오류:`, error);
        throw error;
      }
    };
  }

  /**
   * 초기화 및 마이그레이션
   */
  function initialize() {
    console.log('🔄 FilenameAdapter 초기화 시작');

    // 호환성 레이어 설정
    setupCompatibilityLayer();

    // 성능 모니터링 적용 (디버그 모드)
    if (window.DEBUG_MODE) {
      window.generateCustomFilename = wrapWithPerformanceMonitoring(
        window.generateCustomFilename,
        'generateCustomFilename'
      );
      window.extractHandNumberFromFilename = wrapWithPerformanceMonitoring(
        window.extractHandNumberFromFilename,
        'extractHandNumberFromFilename'
      );
    }

    // 기존 매핑 마이그레이션
    migrateExistingMappings();

    console.log('✅ FilenameAdapter 초기화 완료');
  }

  /**
   * 기존 매핑 데이터 마이그레이션
   */
  function migrateExistingMappings() {
    try {
      // localStorage에서 기존 매핑 확인
      const oldHandToFilename = localStorage.getItem('handToFilenameMapping');
      const oldFilenameToHand = localStorage.getItem('filenameToHandMapping');

      if (oldHandToFilename || oldFilenameToHand) {
        console.log('🔄 기존 매핑 데이터 마이그레이션 시작');

        // FilenameManager로 데이터 이전
        if (oldHandToFilename) {
          const data = JSON.parse(oldHandToFilename);
          Object.entries(data).forEach(([hand, filename]) => {
            window.FilenameManager.handToFilename.set(parseInt(hand), filename);
          });
        }

        if (oldFilenameToHand) {
          const data = JSON.parse(oldFilenameToHand);
          Object.entries(data).forEach(([filename, hand]) => {
            window.FilenameManager.filenameToHand.set(filename, parseInt(hand));
          });
        }

        // 저장
        window.FilenameManager.persistToStorage();

        console.log(`✅ 마이그레이션 완료: ${window.FilenameManager.handToFilename.size}개 매핑`);
      }
    } catch (error) {
      console.warn('마이그레이션 중 오류 (무시):', error);
    }
  }

  /**
   * 유틸리티 함수들
   */
  window.FilenameUtils = {
    /**
     * 파일명 패턴 테스트
     */
    testPattern: function(filename, pattern) {
      const regex = new RegExp(pattern);
      return regex.test(filename);
    },

    /**
     * 일괄 파일명 생성
     */
    batchGenerateFilenames: async function(handNumbers) {
      const results = [];
      for (const handNumber of handNumbers) {
        const filename = await window.generateCustomFilename(handNumber);
        results.push({ handNumber, filename });
      }
      return results;
    },

    /**
     * 매핑 통계
     */
    getStats: function() {
      return window.FilenameManager.getStats();
    },

    /**
     * 디버그 정보
     */
    debug: function() {
      window.FilenameManager.debug();
    }
  };

  // 페이지 로드 시 자동 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})(window);