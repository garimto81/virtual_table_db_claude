# 버전 관리 템플릿

## HTML 파일 상단 주석 형식

```html
<!DOCTYPE html>
<!--
  ============================================
  포커 핸드 로거 (Poker Hand Logger)
  Version: X.X.X
  Last Modified: YYYY-MM-DD HH:MM KST
  
  Change Log:
  - vX.X.X (YYYY-MM-DD): 변경 내용
  - vX.X.X (YYYY-MM-DD): 변경 내용
  ============================================
-->
```

## JavaScript 섹션 주석 형식

```javascript
/**
 * ============================================
 * 포커 핸드 로거 - Main JavaScript
 * Version: X.X.X
 * Last Modified: YYYY-MM-DD HH:MM KST
 * Author: garimto81 with Claude
 * ============================================
 */
```

## 버전 번호 규칙 (Semantic Versioning)

- **MAJOR.MINOR.PATCH**
  - **MAJOR** (X.0.0): 대규모 변경, 하위 호환성 없음
  - **MINOR** (0.X.0): 새 기능 추가, 하위 호환성 유지
  - **PATCH** (0.0.X): 버그 수정, 작은 개선

## 버전 히스토리

### v2.0.0 (2025-01-02)
- Smart Check/Call 버튼 구현
- 플레이어 상태 추적 (active/folded/allin)
- 스트리트 자동 진행 시스템
- 사이드팟 계산 로직
- 팟 사이즈 조정 버그 수정
- 올인 콜 로직 개선

### v1.9.0 (2024-12-30)
- 팟 사이즈 조정 로직 수정
- 올인 콜 버그 수정

### v1.8.0 (2024-12-28)
- 플레이어 상태 추적 시스템 추가
- Fold/All-in 플레이어 자동 관리

### v1.7.0 (2024-12-25)
- 칩스택 관리 프로세스 개선
- 음수 칩 방지 로직

### v1.6.0 (2024-12-20)
- Type 시트 연동 개선
- 칩 업데이트 타임스탬프 추가

## 업데이트 시 체크리스트

1. [ ] HTML 파일 상단 버전 정보 업데이트
2. [ ] JavaScript 섹션 버전 정보 업데이트
3. [ ] title 태그 버전 업데이트
4. [ ] console.log 버전 업데이트
5. [ ] Change Log 추가
6. [ ] Git 커밋 메시지에 버전 명시
7. [ ] GitHub Release 태그 생성 (선택)

## 버전 업데이트 예시

### 작은 버그 수정 (PATCH)
```
v2.0.0 → v2.0.1
"fix: 특정 상황에서 칩 계산 오류 수정"
```

### 새 기능 추가 (MINOR)
```
v2.0.0 → v2.1.0
"feat: 자동 보드 카드 입력 기능 추가"
```

### 대규모 변경 (MAJOR)
```
v2.0.0 → v3.0.0
"breaking: UI 전면 개편 및 데이터 구조 변경"
```

## Git 커밋 메시지 형식

```
<type>: <description> (v<version>)

- 변경사항 1
- 변경사항 2

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type 종류
- **feat**: 새로운 기능
- **fix**: 버그 수정
- **docs**: 문서 수정
- **style**: 코드 포맷팅
- **refactor**: 코드 리팩토링
- **test**: 테스트 추가
- **chore**: 기타 변경사항