# PLAYER 행 형식 문제 디버깅 가이드

## 문제 상황
PLAYER 행이 예상과 다른 형식으로 생성되는 문제
- 예상: `4 PLAYER Jaewon 1 0 134000 994000 3h 3d`
- 실제: `4 PLAYER Jaewon 1 0 0 134000 994000 3h 3d` (칼럼이 하나 더 많음)

## 디버깅 방법

### 1. index.html 실행
1. Chrome 브라우저로 `index.html` 열기
2. F12 키를 눌러 개발자 도구 열기
3. Console 탭 선택

### 2. 데이터 입력
1. 플레이어 추가:
   - Name: Jaewon
   - Chips: 994,000
   - Hand: 3h 3d
   
2. 플레이어 추가:
   - Name: Trey
   - Chips: 374,000
   - Hand: 4s 4h

### 3. Generate CSV 클릭
"Generate CSV" 버튼 클릭 시 콘솔에 다음 정보가 출력됩니다:

```
=== PLAYER 행 생성 시작 ===
현재 행번호(no): 4
플레이어 수: 2

--- Jaewon 처리 시작 ---
  원본 데이터: {name: "Jaewon", chips: "994,000", initialChips: "134,000", ...}
  초기칩(raw): "134,000" → 134000
  최종칩(raw): "994,000" → 994000
  핸드: 3h 3d
  ===== PLAYER 행 생성 =====
  playerRow 배열: ['PLAYER', 'Jaewon', 1, 0, 134000, 994000, '3h 3d']
  playerRow.length: 7
  push 전 행번호: 4
  push 후 저장된 행: [4, 'PLAYER', 'Jaewon', 1, 0, 134000, 994000, '3h 3d', '', '', ...]
  최종 CSV 형식:
    A=4, B=PLAYER, C=Jaewon, D=1,
    E=0, F=134000, G=994000, H=3h 3d
--- Jaewon 처리 완료 ---
```

### 4. 문제 확인 포인트

콘솔 로그에서 다음 사항을 확인하세요:

1. **playerRow 배열 길이**: 정확히 7이어야 함
2. **playerRow 내용**: 
   - [0] = 'PLAYER'
   - [1] = 이름
   - [2] = 좌석번호
   - [3] = 0
   - [4] = 시작칩
   - [5] = 종료칩
   - [6] = 핸드
3. **push 후 저장된 행**: 
   - A열 = 행번호
   - B열 = 'PLAYER'
   - C열 = 이름
   - D열 = 좌석
   - E열 = 0
   - F열 = 시작칩
   - G열 = 종료칩
   - H열 = 핸드

### 5. 추가 테스트 파일

문제를 더 자세히 분석하기 위한 테스트 파일들:

1. `test-generation.html` - 실제 generateRows_v46 시뮬레이션
2. `test-jaewon-issue.html` - Jaewon 플레이어 문제 재현
3. `test-player-format.html` - PLAYER 행 형식 검증
4. `test-player-output.html` - PLAYER 출력 테스트

## 예상 원인

1. **initialChips 미설정**: 시작칩이 undefined인 경우
2. **데이터 순서 오류**: chips와 initialChips가 바뀐 경우
3. **추가 필드 포함**: 의도치 않은 추가 필드가 배열에 포함

## 현재 수정 사항

1. 상세한 디버깅 로그 추가
2. initialChips가 없을 경우 chips 값으로 대체
3. playerRow 배열이 정확히 7개 요소만 포함하도록 확인

## 문제가 지속될 경우

콘솔 로그 전체를 복사하여 제공해주세요. 특히:
- playerRow 배열의 실제 내용
- push 후 저장된 행의 내용
- 에러 메시지 (있을 경우)