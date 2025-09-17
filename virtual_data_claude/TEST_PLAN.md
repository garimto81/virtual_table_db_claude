# 📱 모바일 팝업 제거 기능 테스트 계획

## 🎯 테스트 목표 및 통과 기준

### 핵심 성공 지표 (KPI)
| 지표 | 목표값 | 측정 방법 | 통과 기준 |
|-----|--------|----------|----------|
| **응답 속도** | < 200ms | Performance API | 95% 요청이 200ms 이내 |
| **실행 취소 성공률** | 100% | 기능 테스트 | 모든 작업 복원 가능 |
| **메모리 사용량** | < 20MB | Chrome DevTools | 피크 시에도 20MB 미만 |
| **오류율** | < 0.1% | 에러 로그 분석 | 1000건 중 1건 미만 |
| **사용자 실수 복구** | < 3초 | 시나리오 테스트 | 3초 내 원상 복구 |

---

## 📋 테스트 레벨별 계획

### 1️⃣ 단위 테스트 (Unit Test)
**도구**: Jest + Testing Library
**자동화**: 100% 자동화
**실행 시점**: 코드 커밋 시 자동

#### 테스트 케이스
```javascript
// actionHistory.test.js
describe('ActionHistory', () => {
  let history;

  beforeEach(() => {
    history = new MobileActionHistory();
    localStorage.clear();
  });

  test('작업 실행 시 히스토리에 저장', () => {
    const action = new DeletePlayerAction({ id: 1, name: 'Player1' });
    history.execute(action);

    expect(history.history.length).toBe(1);
    expect(history.history[0]).toBe(action);
  });

  test('20개 초과 시 오래된 작업 제거', () => {
    for (let i = 0; i < 25; i++) {
      history.execute(new DeletePlayerAction({ id: i, name: `P${i}` }));
    }

    expect(history.history.length).toBe(20);
    expect(history.history[0].player.id).toBe(5); // 0-4는 제거됨
  });

  test('실행 취소 시 작업 복원', async () => {
    const mockAPI = jest.fn().mockResolvedValue({ success: true });
    const action = new DeletePlayerAction({ id: 1, name: 'Player1' });
    action.execute = mockAPI;

    history.execute(action);
    await history.undo();

    expect(mockAPI).toHaveBeenCalledTimes(1);
    expect(history.history.length).toBe(0);
  });

  test('localStorage 자동 백업', () => {
    const action = new DeletePlayerAction({ id: 1, name: 'Player1' });
    history.execute(action);

    const saved = JSON.parse(localStorage.getItem('actionHistory'));
    expect(saved).toHaveLength(1);
    expect(saved[0].type).toBe('DeletePlayerAction');
  });
});
```

**통과 기준**:
- ✅ 모든 테스트 케이스 통과
- ✅ 코드 커버리지 > 90%
- ✅ 실행 시간 < 5초

---

### 2️⃣ 통합 테스트 (Integration Test)
**도구**: Playwright Mobile
**자동화**: 80% 자동화
**실행 시점**: PR 생성 시

#### 실제 시나리오 테스트
```javascript
// integration.test.js
describe('플레이어 관리 통합 테스트', () => {
  let page;

  beforeAll(async () => {
    // 모바일 뷰포트 설정
    page = await browser.newPage({
      viewport: { width: 375, height: 812 }, // iPhone 12
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
  });

  test('플레이어 삭제 → 실행취소 전체 플로우', async () => {
    // 1. 플레이어 목록 로드
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.player-list');

    const initialCount = await page.$$eval('.player-item', items => items.length);

    // 2. 첫 번째 플레이어 삭제
    await page.tap('.player-item:first-child .delete-btn');

    // 3. 스낵바 확인
    const snackbar = await page.waitForSelector('#snackbar.show');
    const message = await snackbar.textContent();
    expect(message).toContain('삭제됨');

    // 4. 플레이어 수 감소 확인
    const afterDeleteCount = await page.$$eval('.player-item', items => items.length);
    expect(afterDeleteCount).toBe(initialCount - 1);

    // 5. 실행취소 버튼 클릭
    await page.tap('#snackbar button');

    // 6. 플레이어 복원 확인
    await page.waitForTimeout(500);
    const finalCount = await page.$$eval('.player-item', items => items.length);
    expect(finalCount).toBe(initialCount);
  });

  test('스와이프로 실행취소', async () => {
    // 작업 실행
    await page.tap('.delete-btn');

    // 오른쪽 스와이프
    await page.touchscreen.swipe({
      start: { x: 50, y: 400 },
      end: { x: 300, y: 400 },
      duration: 300
    });

    // 실행취소 확인
    const snackbar = await page.waitForSelector('#snackbar.show');
    expect(await snackbar.textContent()).toContain('실행 취소됨');
  });

  test('더블탭 위험작업', async () => {
    const resetBtn = await page.$('.danger-action');

    // 첫 번째 탭
    await resetBtn.tap();
    const text1 = await resetBtn.textContent();
    expect(text1).toBe('한 번 더 탭');

    // 두 번째 탭
    await resetBtn.tap();

    // 작업 실행 확인
    const snackbar = await page.waitForSelector('#snackbar.show');
    expect(await snackbar.textContent()).toContain('초기화됨');
  });
});
```

**통과 기준**:
- ✅ 주요 사용자 시나리오 100% 통과
- ✅ API 응답 시간 < 500ms
- ✅ 에러 발생률 < 1%

---

### 3️⃣ 성능 테스트 (Performance Test)
**도구**: Lighthouse CI + Custom Metrics
**자동화**: 100% 자동화
**실행 시점**: 매일 자정

#### 성능 측정 스크립트
```javascript
// performance.test.js
class PerformanceTester {
  constructor() {
    this.metrics = {
      touchResponse: [],
      actionComplete: [],
      memoryUsage: [],
      networkLatency: []
    };
  }

  async measureTouchResponse() {
    const start = performance.now();

    // 터치 이벤트 발생
    await this.simulateTouch('.delete-btn');

    // DOM 변경 감지
    await this.waitForDOMChange();

    const duration = performance.now() - start;
    this.metrics.touchResponse.push(duration);

    return duration;
  }

  async measureMemoryUsage() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize / 1048576; // MB
      this.metrics.memoryUsage.push(used);
      return used;
    }
  }

  async runStressTest() {
    console.log('🔥 스트레스 테스트 시작');

    // 100번 연속 작업
    for (let i = 0; i < 100; i++) {
      await this.measureTouchResponse();
      await this.measureMemoryUsage();

      if (i % 10 === 0) {
        console.log(`진행: ${i}/100`);
      }
    }

    return this.generateReport();
  }

  generateReport() {
    const report = {
      touchResponse: {
        avg: this.average(this.metrics.touchResponse),
        p95: this.percentile(this.metrics.touchResponse, 95),
        max: Math.max(...this.metrics.touchResponse)
      },
      memory: {
        avg: this.average(this.metrics.memoryUsage),
        peak: Math.max(...this.metrics.memoryUsage)
      },
      passed: true
    };

    // 통과 기준 체크
    if (report.touchResponse.p95 > 200) report.passed = false;
    if (report.memory.peak > 20) report.passed = false;

    return report;
  }

  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  percentile(arr, p) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// 실행
const tester = new PerformanceTester();
const report = await tester.runStressTest();

console.log('📊 성능 테스트 결과:');
console.log(`터치 응답 (P95): ${report.touchResponse.p95.toFixed(2)}ms`);
console.log(`메모리 피크: ${report.memory.peak.toFixed(2)}MB`);
console.log(`결과: ${report.passed ? '✅ 통과' : '❌ 실패'}`);
```

**통과 기준**:
- ✅ P95 응답시간 < 200ms
- ✅ 메모리 피크 < 20MB
- ✅ 100번 연속 작업 시 크래시 없음

---

### 4️⃣ 사용자 수용 테스트 (UAT)
**도구**: 실제 디바이스 + 체크리스트
**자동화**: 수동 테스트
**실행 시점**: 배포 전

#### 실무자 테스트 시나리오

##### 시나리오 1: 바쁜 게임 중 플레이어 관리
```
테스터: 실제 딜러
환경: 게임 진행 중
기기: 개인 스마트폰

1. [ ] 10명 플레이어 빠르게 등록
   - 목표: 30초 내 완료
   - 측정: 실제 소요 시간 _____초

2. [ ] 실수로 잘못 삭제 → 즉시 복구
   - 목표: 3초 내 복구
   - 측정: 복구 시간 _____초

3. [ ] 칩 수량 연속 수정
   - 목표: 오류 없이 10회 수정
   - 결과: ___/10 성공

4. [ ] 네트워크 끊김 상황
   - 목표: 데이터 손실 없음
   - 결과: [ ] 통과 [ ] 실패
```

##### 시나리오 2: 다양한 기기 테스트
```
테스트 기기 체크리스트:

iPhone:
[ ] iPhone 12 mini (5.4") - 작은 화면
[ ] iPhone 14 Pro (6.1") - 표준
[ ] iPhone 14 Pro Max (6.7") - 큰 화면

Android:
[ ] Galaxy S23 (6.1") - 최신
[ ] Galaxy A32 (6.4") - 중저가
[ ] Xiaomi Redmi (6.5") - 중국폰

태블릿:
[ ] iPad mini (8.3")
[ ] Galaxy Tab A8 (10.5")

각 기기별 체크:
[ ] 터치 반응 정상
[ ] 레이아웃 깨짐 없음
[ ] 스와이프 동작
[ ] 더블탭 인식
```

**통과 기준**:
- ✅ 실무자 만족도 > 90%
- ✅ 모든 시나리오 성공
- ✅ 치명적 버그 0개

---

## 🔄 회귀 테스트 (Regression Test)

### 자동화된 일일 테스트
```yaml
# .github/workflows/daily-test.yml
name: Daily Regression Test

on:
  schedule:
    - cron: '0 2 * * *' # 매일 새벽 2시

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Performance test
        run: npm run test:performance

      - name: Generate report
        run: npm run test:report

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-reports/
```

---

## 📊 테스트 결과 대시보드

### 실시간 모니터링 지표
```javascript
class TestDashboard {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, skipped: 0 },
      integration: { passed: 0, failed: 0, skipped: 0 },
      performance: { metrics: {} },
      uat: { feedback: [] }
    };
  }

  generateHTML() {
    return `
      <div class="test-dashboard">
        <h2>테스트 현황</h2>

        <div class="summary">
          <div class="metric">
            <span class="label">전체 통과율</span>
            <span class="value">${this.getPassRate()}%</span>
          </div>

          <div class="metric">
            <span class="label">평균 응답시간</span>
            <span class="value">${this.getAvgResponse()}ms</span>
          </div>

          <div class="metric">
            <span class="label">메모리 사용</span>
            <span class="value">${this.getMemoryUsage()}MB</span>
          </div>
        </div>

        <div class="details">
          <h3>상세 결과</h3>
          <table>
            <tr>
              <th>테스트 유형</th>
              <th>통과</th>
              <th>실패</th>
              <th>건너뜀</th>
              <th>통과율</th>
            </tr>
            ${this.generateTableRows()}
          </table>
        </div>

        <div class="failures">
          <h3>실패 항목</h3>
          ${this.generateFailureList()}
        </div>
      </div>
    `;
  }
}
```

---

## ✅ 최종 배포 기준

### Go/No-Go 체크리스트

#### 필수 통과 항목 (모두 통과 필요)
- [ ] 단위 테스트 100% 통과
- [ ] 통합 테스트 95% 이상 통과
- [ ] P95 응답시간 < 200ms
- [ ] 메모리 사용량 < 20MB
- [ ] 치명적(Critical) 버그 0개
- [ ] 실무자 UAT 승인

#### 권장 통과 항목 (80% 이상)
- [ ] 코드 커버리지 > 90%
- [ ] 성능 개선 > 80%
- [ ] 사용자 만족도 > 90%
- [ ] 모든 기기 호환성

### 배포 중단 기준
- 🔴 치명적 버그 발견
- 🔴 데이터 손실 가능성
- 🔴 성능 기준 미달 (3배 이상 느림)
- 🔴 실무자 거부

---

## 📝 테스트 보고서 템플릿

```markdown
# 테스트 결과 보고서

**날짜**: 2025-01-XX
**버전**: v3.0.0-rc1
**테스터**: [이름]

## 요약
- 전체 통과율: XX%
- 주요 이슈: X건
- 권고사항: [배포 가능/조건부 배포/배포 중단]

## 상세 결과

### 기능 테스트
- [✅/❌] 플레이어 삭제 즉시 실행
- [✅/❌] 실행취소 기능
- [✅/❌] 스와이프 제스처
- [✅/❌] 더블탭 확인

### 성능 테스트
- 평균 응답: XXms
- P95 응답: XXms
- 메모리 피크: XXMB

### 이슈 목록
1. [심각도] 이슈 설명
2. [심각도] 이슈 설명

## 결론
[배포 승인/재테스트 필요/개발 추가 필요]
```

---

**작성일**: 2025-01-17
**버전**: 1.0.0
**담당**: QA Team