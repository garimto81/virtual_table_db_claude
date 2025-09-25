# Virtual Table DB v13.5.4

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
│   └── appScripts.gs            # Google Apps Script v13.5.4
├── docs/                        # 프로젝트 문서
└── .github/                     # GitHub 설정
```

## ⚙️ 설정

1. **Google Sheets**: CSV 형식으로 웹에 게시
2. **Apps Script**: `scripts/appScripts.gs` 배포
3. **Gemini API**: 설정 패널에서 API 키 입력

## 🔧 최신 업데이트 (v13.5.4)

- **🚀 프로덕션 완전 최적화**: 디버그 시스템 전체 제거로 성능 극대화
  - 744개 logger 호출을 직접 console 호출로 교체
  - DEBUG_CONFIG 시스템 완전 제거 (160라인 삭제)
  - Maximum call stack size exceeded 오류 완전 근절
- **🔧 에러 및 경고 완전 제거**:
  - TailwindCSS 프로덕션 경고 무음 처리
  - 404 에러 유발 파일 참조 제거
  - favicon 추가로 아이콘 404 에러 방지
- **🎯 이전 버전 주요 수정사항**:
  - **v13.5.3**: 순환 참조 치명적 버그 수정
  - **v13.5.2**: 마이너 버전 업데이트
  - **v13.5.1**: DEFAULT_CONFIG 스코프 오류 해결

---

**Live Demo**: [GitHub Pages](https://garimto81.github.io/virtual_table_db_claude/)