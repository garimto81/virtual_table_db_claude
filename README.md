# 🎰 Virtual Data Claude - Poker Hand Logger

> 실시간 포커 핸드 기록 및 분석 시스템 v2.9.5

## 📋 개요

Google Sheets와 연동되는 웹 기반 포커 핸드 로거입니다. 실시간으로 플레이어의 액션, 칩 변동, 핸드 결과를 기록하고 관리합니다.

### ✨ 주요 기능
- 📊 Google Sheets 실시간 연동
- 👥 플레이어 IN/OUT 상태 관리
- 💰 자동 팟 계산 및 칩 추적
- 🎯 스트릿별 액션 기록
- 📸 카메라 번호 자동 관리
- 🏆 승자 선택 및 칩 분배
- 🌍 국가 정보 매핑 시스템

## 🚀 빠른 시작

### 1. Google Sheets 설정
```bash
1. 템플릿 시트 복사
2. Apps Script 열기 (확장 프로그램 → Apps Script)
3. Code_v59_InOut.gs 붙여넣기
4. 웹 앱으로 배포
```

### 2. 프론트엔드 설정
```javascript
// index.html에서 API URL 설정
const API_BASE_URL = 'YOUR_DEPLOYMENT_URL';
```

### 3. 실행
```bash
# Live Server 또는
python -m http.server 8000
```

## 📖 상세 문서

프로젝트의 전체 문서는 [DOCUMENTATION.md](./DOCUMENTATION.md)를 참조하세요.

### 문서 내용
- 시스템 구조
- 설치 가이드
- 기능 상세 설명
- 개발 가이드
- 문제 해결
- API 레퍼런스

## 🛠 기술 스택

- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Backend**: Google Apps Script v59
- **Database**: Google Sheets
- **API**: Gemini Vision API

## 📁 프로젝트 구조

```
virtual_data_claude/
├── index.html              # 메인 애플리케이션
├── apps-script/
│   ├── Code_v59_InOut.gs     # 메인 백엔드
│   ├── OneTimeCountryUpdate.gs
│   └── UpdateCountryInfo.gs
├── README.md              # 프로젝트 소개
└── DOCUMENTATION.md       # 통합 문서
```

## 🔄 최근 업데이트

### v2.9.5 (2025-09-12)
- 💰 **시작 칩 업데이트 버그 수정**
  - 플레이어 칩 수동 입력 시 항상 initialChips 업데이트
  - 기존: initialChips가 있으면 유지하는 문제
  - 수정: 사용자가 칩을 변경하면 그것이 새로운 시작칩이 됨
  - 예: 18,000 → 800,000 변경 시 800,000이 시작칩으로 등록

### v2.9.4 (2025-09-12)
- 🐛 **플레이어 이름 표시 버그 수정**
  - 포지션이 없는 플레이어의 이름이 표시되지 않던 문제 해결
  - 포지션(BTN/SB/BB)이 있을 때는 포지션 배지 우선 표시
  - 포지션이 없을 때는 플레이어 이름 표시 (notable ⭐ 포함)
  - 긴 이름은 7자로 잘라서 표시

### v2.9.3 (2025-09-12)
- 🎲 **좌석 배치 UI 개선 및 버그 수정**
  - 0.5 x 11 그리드로 변경하여 높이 50% 감소
  - 좌석 번호 제거, 포지션 배지(🎯/SB/BB)만 표시
  - 빈 좌석은 점(•)으로 간결하게 표시
  - 버튼 드롭다운 메뉴 활성화 버그 수정
  - 중복 이벤트 리스너 제거로 안정성 향상

### v2.9.2 (2025-01-11)
- 🎯 **1x11 그리드로 좌석 배치 개선**
  - 10개 좌석과 버튼 드롭다운을 1x11 그리드로 한 줄 배치
  - 11번째 위치에 버튼 선택 드롭다운만 간결하게 배치
  - '버튼:' 텍스트 제거로 더욱 컴팩트한 UI 구현
  - 좌석 번호만 드롭다운에 표시, 툴팁으로 상세 정보 제공

### v2.9.1 (2025-01-11)
- 📍 **좌석 배치 UI 공간 최적화**
  - 기존 별도 그리드 제거하고 플레이어 선택 영역에 통합
  - 10개 좌석을 한 줄로 컴팩트하게 배치 (2x5 그리드)
  - Type 시트의 Seat 정보에 따라 플레이어 자동 배치
  - 버튼 위치 선택을 같은 줄에 배치하여 공간 절약
  - 빈 좌석은 회색으로, 참여 플레이어는 주황색으로 표시
  - BTN/SB/BB 포지션을 테두리 색상과 배지로 표시

### v2.9.0 (2025-01-11)
- 🎲 **좌석 배치 시스템 및 액션 순서 로직 추가**
  - 10개 좌석 그리드 UI로 플레이어 좌석 배치 관리
  - 버튼 위치 선택 기능으로 SB/BB 자동 결정
  - 포커 규칙에 따른 정확한 액션 순서 처리
    - 프리플럍: UTG → ... → BTN → SB → BB
    - 포스트플럍: SB → BB → ... → BTN
  - 다음 액션 플레이어 자동 하이라이트
  - 폴드/올인 플레이어 자동 제외

### v2.8.3 (2025-01-11)
- 🔄 카드 입력 다이얼로그 버튼 위치 변경 (UX 개선)
  - 취소 버튼을 왼쪽, 확인 버튼을 오른쪽으로 배치
  - 실수로 확인을 누르는 것을 방지하는 안전한 UI

### v2.8.2 (2025-01-10)
- 📚 모든 문서를 DOCUMENTATION.md로 통합
- 🗑️ 중복 및 불필요한 파일 대량 정리
- 📁 프로젝트 구조 단순화

### v2.8.1 (2025-01-10)
- 🐛 2백만 칩 이상 무한 표시 버그 수정
- ✨ 국가 정보 매핑 시스템 추가
- 📝 승자 저장 솔루션 구현
- 🗑️ 불필요한 파일 정리

## 📄 라이센스

MIT License

## 🤝 기여

Pull Request 환영합니다!

## 📞 문의

- **GitHub**: [Issues](https://github.com/garimto81/virtual_data_claude/issues)
- **Email**: garimto81@gmail.com

---

## 📌 현재 작업 상황 (2025-01-11)

### ✅ 완료된 작업
1. **칩 무한 버그 수정** - 2백만 이상 칩 정상 처리 (v2.8.1)
2. **국가 정보 시스템** - J열(Country), K열(CountryVerified) 추가
3. **승자 저장 문제** - 해결 방안 문서화 (Index 시트 F열)
4. **프로젝트 정리** - 불필요한 파일 삭제, 문서 통합 (v2.8.2)

### 🔧 다음 작업 필요 사항

#### 1. 승자 저장 기능 구현
```javascript
// index.html 약 2240줄 근처 수정 필요
function getWinnerNames() {
  return window.state.playersInHand
    .filter(p => p.role === 'winner')
    .map(p => p.name)
    .join(', ');
}

// indexMeta 객체에 추가
const indexMeta = {
  // ... 기존 필드들
  winners: getWinnerNames(), // 이 줄 추가
};
```

#### 2. 국가 정보 1회성 업데이트
```javascript
// Google Apps Script에서 실행
runOneTimeCountryUpdate()
```
- 55명 플레이어 자동 매핑 준비됨
- Type 시트 J/K열 사용

#### 3. 테스트 필요
- [ ] 승자 선택 → 시트 전송 → Index F열 확인
- [ ] 2백만 이상 칩 입력 테스트
- [ ] 국가 정보 업데이트 실행

### 💡 중요 파일 위치
- **메인 앱**: `index.html`
- **백엔드**: `apps-script/Code_v59_InOut.gs`
- **국가 업데이트**: `apps-script/OneTimeCountryUpdate.gs`
- **전체 문서**: `DOCUMENTATION.md`

### 🐛 알려진 이슈
1. **승자 정보가 Index 시트에 저장 안됨** → 위 코드 수정으로 해결
2. **복수 승자(스플릿 팟) 미구현** → 추후 개발 필요

### 📝 개발 메모
- Google Sheets ID: `1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U`
- Apps Script URL 재배포 필요시 index.html의 `APPS_SCRIPT_URL` 수정
- Type 시트 구조: A~H(기존) + I(pic) + J(Country) + K(CountryVerified)

---

**Version**: v2.9.5  
**Last Updated**: 2025-09-12  
**Next Session**: 승자 저장 기능 구현부터 시작