# Virtual Table DB v13.5.2

포커 핸드 모니터링 및 분석 시스템

## 🚀 주요 기능

- **실시간 핸드 감지**: SSE를 통한 자동 새 핸드 감지
- **AI 분석**: Gemini API를 활용한 핸드 분석
- **자막 생성**: 키 플레이어 자막 자동 생성
- **Google Sheets 연동**: 실시간 데이터 동기화

## 📂 구조

```
virtual_table_db_claude/
├── index.html                    # 메인 애플리케이션
├── g-column-checkbox-handler.js  # G열 처리 로직
├── scripts/
│   └── appScripts.gs            # Google Apps Script v13.5.2
├── docs/                        # 프로젝트 문서
└── .github/                     # GitHub 설정
```

## ⚙️ 설정

1. **Google Sheets**: CSV 형식으로 웹에 게시
2. **Apps Script**: `scripts/appScripts.gs` 배포
3. **Gemini API**: 설정 패널에서 API 키 입력

## 🔧 최신 업데이트 (v13.5.2)

- **🔄 마이너 버전 업데이트**: v13.5.1 → v13.5.2 버전 업데이트
- **🔧 DEFAULT_CONFIG 스코프 오류 수정**: 'DEFAULT_CONFIG is not defined' ReferenceError 해결
- **🎆 대규모 디버깅 시스템 최적화**: 739개 console.log를 체계적인 로그 시스템으로 교체
- **🚀 성능 최적화**: 프로덕션 모드에서 로그 오버헤드 완전 제거
- **🎯 새로운 디버그 컨트롤 시스템**:
  - 12개 카테고리별 로그 분류 (API, UI, DATA, SHEET, AI 등)
  - 4단계 로그 레벨 (ERROR, WARN, INFO, DEBUG)
  - localStorage 기반 런타임 제어
  - 개발/프로덕션 환경 자동 감지
- **🔍 디버그 명령어 지원**:
  - `debugControl.enable()` - 디버깅 활성화
  - `debugControl.setLevel('DEBUG')` - 로그 레벨 설정
  - `debugControl.toggleCategory('API')` - 카테고리별 토글
  - `debugControl.status()` - 현재 상태 확인

---

**Live Demo**: [GitHub Pages](https://garimto81.github.io/virtual_table_db_claude/)