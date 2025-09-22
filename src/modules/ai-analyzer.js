/**
 * AI 핸드 분석 모듈
 *
 * @description
 * index.html에서 분리된 AI 핸드 분석 전용 모듈
 * Gemini API를 사용한 포커 핸드 분석 및 요약 생성
 *
 * @version 1.0.0
 * @author Development Team
 * @date 2025-09-19
 */

class AIAnalyzer {
  constructor() {
    // AI 분석 캐시 (24시간 TTL)
    this.analysisCache = new Map();
    this.CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

    // Gemini API 설정
    this.config = {
      apiKey: '',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
      models: [
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-pro'
      ],
      maxRetries: 3
    };

    // 초기화
    this.initialize();
  }

  /**
   * 초기화
   */
  initialize() {
    // localStorage에서 API 키 로드
    this.config.apiKey = localStorage.getItem('geminiApiKey') || '';

    // 캐시 로드
    this.loadCacheFromStorage();

    if (window.DEBUG_MODE) console.log('🤖 AIAnalyzer 초기화 완료');
  }

  /**
   * 핸드 분석 (메인 함수)
   * @param {number} handNumber - 핸드 번호
   * @returns {Promise<string>} AI 분석 결과
   */
  async analyzeHand(handNumber) {
    try {
      // 1. 캐시 확인
      const cached = this.getCachedAnalysis(handNumber);
      if (cached) {
        if (window.DEBUG_MODE) console.log(`💾 캐시된 AI 분석 반환: #${handNumber}`);
        return cached;
      }

      // 2. 핸드 데이터 로드 (window.loadHandData 호출)
      const handData = await this.loadHandData(handNumber);
      if (!handData) {
        if (window.DEBUG_MODE) console.warn(`핸드 데이터 없음: #${handNumber}`);
        return this.generateFallbackAnalysis(handNumber);
      }

      // 3. AI 분석 프롬프트 생성
      const prompt = this.buildAnalysisPrompt(handData);

      // 4. Gemini API 호출
      const analysis = await this.callGeminiAPI(prompt);

      // 5. 캐시 저장
      this.saveToCache(handNumber, analysis);

      if (window.DEBUG_MODE) console.log(`✅ AI 분석 완료: #${handNumber}`);
      return analysis;

    } catch (error) {
      console.error('AI 분석 오류:', error);
      return this.generateFallbackAnalysis(handNumber);
    }
  }

  /**
   * AI 파일명 요약 생성
   * @param {Object} handData - 핸드 데이터
   * @returns {Promise<string>} 3단어 요약
   */
  async generateFileSummary(handData) {
    try {
      const prompt = `
        포커 핸드를 3개 단어로 요약하세요.

        규칙:
        1. 정확히 3개 단어만
        2. 밑줄(_)로 연결
        3. 핵심 액션 중심
        4. 예: "3bet_bluff_fold", "allin_win_river"

        핸드 정보:
        - 플레이어: ${handData.hero?.name || 'Hero'} vs ${handData.villain?.name || 'Villain'}
        - 액션: ${handData.keywords?.join(', ') || '일반'}
        - 결과: ${handData.result || '미정'}

        3단어 요약:`;

      const summary = await this.callGeminiAPI(prompt, { temperature: 0.3 });

      // 형식 검증
      const cleaned = summary.replace(/[^a-zA-Z0-9가-힣_]/g, '_')
                            .replace(/_{2,}/g, '_')
                            .toLowerCase();

      return cleaned.slice(0, 30); // 최대 30자

    } catch (error) {
      console.error('AI 요약 생성 오류:', error);
      return 'hand_play_result';
    }
  }

  /**
   * Gemini API 호출
   * @param {string} prompt - 프롬프트
   * @param {Object} options - 옵션
   * @returns {Promise<string>} API 응답
   */
  async callGeminiAPI(prompt, options = {}) {
    if (!this.config.apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다');
    }

    const settings = {
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxTokens || 150,
      topK: options.topK || 40,
      topP: options.topP || 0.95,
      model: options.model || this.config.models[0]
    };

    // 모델 순회하며 시도
    for (const model of this.config.models) {
      try {
        const response = await this.makeAPIRequest(model, prompt, settings);
        if (response) return response;
      } catch (error) {
        if (window.DEBUG_MODE) console.warn(`모델 ${model} 실패, 다음 모델 시도...`);
      }
    }

    throw new Error('모든 AI 모델 호출 실패');
  }

  /**
   * 실제 API 요청
   */
  async makeAPIRequest(model, prompt, settings) {
    const url = `${this.config.apiUrl}${model}:generateContent?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: settings.maxOutputTokens,
          topK: settings.topK,
          topP: settings.topP
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();

    // 응답 구조 안전 체크
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('응답 텍스트 없음');
    }

    return text.trim();
  }

  /**
   * 분석 프롬프트 생성
   */
  buildAnalysisPrompt(handData) {
    return `
      포커 핸드 분석:

      플레이어 정보:
      - Hero: ${handData.hero?.name || 'Unknown'} (${handData.hero?.cards || 'XX'})
      - Villain: ${handData.villain?.name || 'Unknown'} (${handData.villain?.cards || 'XX'})

      액션:
      ${handData.actions?.map(a => `- ${a.action}`).join('\n') || '액션 없음'}

      보드: ${handData.board || '미공개'}
      결과: ${handData.result || '진행중'}

      이 핸드를 3줄 이내로 분석하세요:
      1. 핵심 전략
      2. 실수나 개선점
      3. 배울 점

      분석:`;
  }

  /**
   * 핸드 데이터 로드 (호환성)
   */
  async loadHandData(handNumber) {
    // window.loadHandData가 있으면 사용
    if (typeof window.loadHandData === 'function') {
      return await window.loadHandData(handNumber);
    }

    // 없으면 기본 구조 반환
    if (window.DEBUG_MODE) console.warn('loadHandData 함수 없음, 기본값 사용');
    return {
      handNumber,
      hero: { name: 'Hero', cards: 'XX' },
      villain: { name: 'Villain', cards: 'XX' },
      actions: [],
      board: '',
      result: ''
    };
  }

  /**
   * 폴백 분석 생성
   */
  generateFallbackAnalysis(handNumber) {
    return `핸드 #${handNumber} - AI 분석 불가 (API 오류 또는 데이터 없음)`;
  }

  /**
   * 캐시 관리
   */
  getCachedAnalysis(handNumber) {
    const key = `ai_analysis_${handNumber}`;
    const cached = this.analysisCache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.analysis;
    }

    return null;
  }

  saveToCache(handNumber, analysis) {
    const key = `ai_analysis_${handNumber}`;
    this.analysisCache.set(key, {
      analysis,
      timestamp: Date.now()
    });

    // localStorage에도 저장
    this.saveCacheToStorage();
  }

  /**
   * localStorage 캐시 관리
   */
  loadCacheFromStorage() {
    try {
      const saved = localStorage.getItem('ai_analysis_cache');
      if (saved) {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([key, value]) => {
          // TTL 확인
          if (Date.now() - value.timestamp < this.CACHE_TTL) {
            this.analysisCache.set(key, value);
          }
        });
        if (window.DEBUG_MODE) console.log(`📥 AI 캐시 로드: ${this.analysisCache.size}개`);
      }
    } catch (error) {
      if (window.DEBUG_MODE) console.warn('AI 캐시 로드 실패:', error);
    }
  }

  saveCacheToStorage() {
    try {
      const data = Object.fromEntries(this.analysisCache);
      localStorage.setItem('ai_analysis_cache', JSON.stringify(data));
      if (window.DEBUG_MODE) console.log(`💾 AI 캐시 저장: ${this.analysisCache.size}개`);
    } catch (error) {
      if (window.DEBUG_MODE) console.warn('AI 캐시 저장 실패:', error);
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.analysisCache.clear();
    localStorage.removeItem('ai_analysis_cache');
    if (window.DEBUG_MODE) console.log('🗑️ AI 캐시 초기화됨');
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      cacheSize: this.analysisCache.size,
      apiKey: this.config.apiKey ? '설정됨' : '미설정',
      models: this.config.models
    };
  }

  /**
   * 디버그 정보
   */
  debug() {
    console.group('🤖 AIAnalyzer 디버그 정보');
    console.log('캐시 크기:', this.analysisCache.size);
    console.log('API 키:', this.config.apiKey ? '설정됨' : '미설정');
    console.log('사용 모델:', this.config.models);
    console.log('캐시 샘플 (처음 3개):');

    let count = 0;
    for (const [key, value] of this.analysisCache) {
      console.log(`  ${key}: ${value.analysis.slice(0, 50)}...`);
      if (++count >= 3) break;
    }

    console.groupEnd();
  }
}

// 싱글톤 인스턴스 생성
const aiAnalyzer = new AIAnalyzer();

// 전역 객체에 노출 (index.html과의 호환성)
window.AIAnalyzer = aiAnalyzer;

// 기존 함수 래퍼 (하위 호환성)
window.analyzeHandWithAI = async function(handNumber) {
  return await aiAnalyzer.analyzeHand(handNumber);
};

window.generateAIFileSummary = async function(handData) {
  return await aiAnalyzer.generateFileSummary(handData);
};

// ES6 모듈 내보내기 (향후 사용)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = aiAnalyzer;
}