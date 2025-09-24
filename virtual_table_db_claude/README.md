# Virtual Table DB v13.4.1

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
│   └── appScripts.gs            # Google Apps Script v13.4.1
├── docs/                        # 프로젝트 문서
└── .github/                     # GitHub 설정
```

## ⚙️ 설정

1. **Google Sheets**: CSV 형식으로 웹에 게시
2. **Apps Script**: `scripts/appScripts.gs` 배포
3. **Gemini API**: 설정 패널에서 API 키 입력

## 🔧 최신 업데이트 (v13.4.1)

- **버전 업데이트**: v13.4.0 → v13.4.1 마이너 버전 업데이트
- **G열 업데이트 기능 완전 구현**: 편집 버튼 클릭 시 Google Sheets G열에 자동으로 'A' 값 저장
- **저장소 대대적 정리**: 70개 이상 불필요 파일/폴더 삭제로 깔끔한 구조 완성
- **Apps Script v13.4.1**: G열 처리 로직 추가 및 버전 통일
- **프론트엔드/백엔드 완전 연동**: G열 값 전송부터 저장까지 전체 파이프라인 구현

---

**Live Demo**: [GitHub Pages](https://garimto81.github.io/virtual_table_db_claude/)