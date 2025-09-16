# 🎰 Virtual Data - Poker Hand Logger

> 실시간 포커 핸드 기록 및 분석 시스템 v2.14.0

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
- 🚀 자동 액션 매핑 시스템 (v2.13.0 신기능)

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
// 설정(⚙️) 메뉴에서 Apps Script URL 입력
// 또는 index.html에서 직접 설정
const APPS_SCRIPT_URL = 'YOUR_DEPLOYMENT_URL';
```

### 3. 실행
```bash
# Live Server 또는
python -m http.server 8000
```

## 🛠 기술 스택

- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Backend**: Google Apps Script v59
- **Database**: Google Sheets
- **API**: Gemini Vision API (칩 분석)

## 📁 프로젝트 구조

```
virtual_data/
├── index.html                    # 메인 애플리케이션
├── chip-analysis-module.js       # 칩 분석 모듈
├── table-management-v59.js       # 테이블 관리 모듈
├── apps-script/
│   └── Code_v59_InOut.gs        # Google Apps Script 백엔드
└── README.md                     # 프로젝트 문서
```

## 📊 Google Sheets 구조

### Type 시트 (플레이어 관리)
| 열 | 필드 | 설명 |
|---|---|---|
| A | Camera Preset | 카메라 프리셋 |
| B | Player | 플레이어 이름 |
| C | Table | 테이블 이름 |
| D | Notable | 주목할 플레이어 |
| E | Chips | 현재 칩 |
| F | UpdatedAt | 업데이트 시간 |
| G | Seat | 좌석 번호 |
| H | Status | IN/OUT 상태 |
| I | pic | 프로필 사진 |
| J | Country | 국가 |
| K | CountryVerified | 국가 확인 여부 |

### Index 시트 (핸드 메타데이터)
| 열 | 필드 | 설명 |
|---|---|---|
| A | handNumber | 핸드 번호 |
| B | startRow | Hand 시트 시작 행 |
| C | endRow | Hand 시트 종료 행 |
| D | handUpdatedAt | 핸드 업데이트 시간 |
| E-F | handEdit | 편집 정보 |
| G | label | 게임 레이블 |
| H | table | 테이블 이름 |
| I | tableUpdatedAt | 테이블 업데이트 시간 |
| J-N | Camera | 카메라 정보 |
| O-Q | Street/Action | 마지막 스트리트/액션 |
| R | winners | 승자 정보 |

### Hand 시트 (상세 기록)
| 열 | 필드 | 설명 |
|---|---|---|
| A | 행번호 | 순번 |
| B | 타입 | HAND/PLAYER/EVENT |
| C | 데이터 | 플레이어명/액션 |
| D | 좌석 | 좌석 번호 |
| E | 0 | 고정값 |
| F | 시작칩 | 시작 칩 |
| G | 종료칩 | 종료 칩 |
| H | 카드 | 핸드 카드 |
| I | 포지션 | BTN/SB/BB |

## 🔄 최근 업데이트

### v2.14.0 (2025-09-16)
- 🎮 **플레이어 관리 기능 강화**
  - 관리 버튼에서 플레이어 추가/삭제 가능
  - 실시간 좌석 번호 변경 기능
  - 칩 수량 직접 수정 가능
  - Google Sheets와 실시간 동기화
  - 테이블별 플레이어 관리 UI 개선

### v2.13.0 (2025-09-15)
- 🚀 **자동 액션 매핑 시스템 구현**
  - 플레이어 선택 없이 액션만 순서대로 입력 가능
  - 포커 규칙에 따른 자동 플레이어 매핑
  - 프리플랍/포스트플랍 액션 순서 자동 계산
  - 설정에서 자동/수동 모드 전환 가능
  - 현재 차례 플레이어 실시간 표시
  - 퀵 액션 버튼 추가 (스마트 콜, 올인, 벳/레이즈)

### v2.12.0 (2025-09-15)
- ⚙️ **설정 기능 추가**
  - Apps Script URL을 대시보드에서 직접 변경 가능
  - localStorage에 자동 저장되어 재배포 시 편리
  - 칩 스택 검증 ON/OFF 설정 가능
  - 설정 모달에서 버전 정보 확인 가능

### v2.11.0 (2025-09-15)
- 🎯 **포지션 정보 Google Sheets 기록 추가**
  - PLAYER 행의 I열에 포지션 정보(BTN/SB/BB) 추가
  - getPositionsForSeat 함수를 활용하여 자동 계산
  - 여러 포지션을 가진 경우 쉼표로 구분하여 저장

## 💡 사용 팁

### 자동 액션 매핑 모드 사용법
1. 설정(⚙️) → "자동 액션 매핑 모드" 활성화
2. 버튼 위치 설정
3. 플레이어 선택 없이 액션만 순서대로 입력
4. 시스템이 자동으로 올바른 플레이어에게 매핑

### 칩 분석 기능
1. 관리 버튼 → 칩 컬러 탭
2. 칩 컬러 등록 (최대 5개)
3. 카메라로 칩 스택 촬영
4. AI가 자동으로 칩 개수 분석

### 효율적인 핸드 기록
- Smart 모드 활성화로 자동 스트리트 진행
- 키보드 단축키 활용 (ESC: 닫기, Enter: 확인)
- 버튼 위치 설정으로 액션 순서 자동 계산

## 🔧 개발 가이드

### Apps Script 배포
1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. `Code_v59_InOut.gs` 내용 붙여넣기
4. 스프레드시트 ID 설정
5. 웹 앱으로 배포 (액세스: 모든 사용자)

### 로컬 개발
```bash
# 저장소 클론
git clone https://github.com/garimto81/virtual_data.git

# 로컬 서버 실행
python -m http.server 8000

# 브라우저에서 열기
http://localhost:8000
```

## ⚠️ 주의사항

1. **권한 설정**: 웹 앱 배포 시 "모든 사용자" 액세스 허용
2. **CORS**: form-urlencoded 방식으로 전송하여 CORS 문제 회피
3. **시트 이름**: Hand, Index, Type 시트 이름 변경 금지
4. **API 제한**: Google Apps Script 일일 실행 시간 제한 고려

## 📧 문의

문제가 있거나 개선 사항이 있으면 [Issue](https://github.com/garimto81/virtual_data/issues)를 등록해주세요.

---

© 2025 Virtual Data - Poker Hand Logger. All rights reserved.