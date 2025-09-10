# 🎰 Virtual Data Claude - Poker Hand Logger

> 실시간 포커 핸드 기록 및 분석 시스템 v2.8.2

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

**Version**: v2.8.2  
**Last Updated**: 2025-01-10