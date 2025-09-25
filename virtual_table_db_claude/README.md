# Virtual Table DB v13.5.10

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
│   └── appScripts.gs            # Google Apps Script v13.5.10
├── docs/                        # 프로젝트 문서
└── .github/                     # GitHub 설정
```

## ⚙️ 설정

1. **Google Sheets**: CSV 형식으로 웹에 게시
2. **Apps Script**: `scripts/appScripts.gs` 배포
3. **Gemini API**: 설정 패널에서 API 키 입력

## 🔧 최신 업데이트 (v13.5.10)

- **✅ 구문 오류 완전 해결**: 끝없이 발생하던 JavaScript 구문 오류 완전 정리
  - 1638번 줄 'Unexpected token "||"' 오류 해결
  - 불완전한 debugLog 매개변수들 모두 정리
  - 깨진 템플릿 리터럴들 완전 수정 (2172, 2179, 6102, 8473번 줄)
  - orphaned 매개변수 및 빈 블록들 정리
  - 브라우저 테스트로 구문 검증 완료
- **🚀 이전 버전 주요 개선사항**:
  - **v13.5.8**: 114개 구문 오류 완전 해결
  - **v13.5.7**: 39개 구문 오류 자동 검출 및 수정
  - **v13.5.6**: generateCustomFilename 함수 구문 오류 수정
  - **v13.5.5**: 609개 디버그 로그 완전 제거 및 최적화
  - **v13.5.4**: 디버그 시스템 전체 제거 및 순환 참조 해결
  - **v13.5.3**: Maximum call stack size exceeded 버그 수정
  - **v13.5.2**: TailwindCSS 경고 및 404 에러 제거
  - **v13.5.1**: DEFAULT_CONFIG 스코프 오류 해결

---

**Live Demo**: [GitHub Pages](https://garimto81.github.io/virtual_table_db_claude/)