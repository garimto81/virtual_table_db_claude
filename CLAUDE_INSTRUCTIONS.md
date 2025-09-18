# 🤖 Claude AI 전용 작업 지침서

## ⚠️ 최우선 규칙: 프로젝트 경계 준수

### 🔴 절대 규칙 (CRITICAL)
```
✅ 모든 작업은 반드시: C:\claude\virtual_data_claude 내부에서만!
❌ 절대 금지: 상위 폴더(C:\claude)에 파일 생성
❌ 절대 금지: 다른 프로젝트 폴더 접근
```

## 📌 작업 전 필수 체크리스트

### 1️⃣ 작업 시작 전
```bash
# 항상 먼저 실행
cd /c/claude/virtual_data_claude
pwd  # 출력이 /c/claude/virtual_data_claude 인지 확인
```

### 2️⃣ 파일 생성/수정 전
```bash
# 경로 확인 (Python)
import os
current = os.getcwd()
assert "virtual_data_claude" in current, "Wrong directory!"

# 경로 확인 (JavaScript)
const path = require('path');
if (!process.cwd().includes('virtual_data_claude')) {
    throw new Error('Working outside project boundary!');
}
```

### 3️⃣ 명령어 실행 전
```bash
# ✅ 올바른 예
cd /c/claude/virtual_data_claude && mkdir src/new_module

# ❌ 잘못된 예
cd /c/claude && mkdir something  # 경계 위반!
cd .. && touch file.txt          # 경계 위반!
```

## 🛠️ 표준 작업 프로세스

### 새 기능 개발
```bash
# 1. 프로젝트 디렉토리 이동
cd /c/claude/virtual_data_claude

# 2. 경계 확인
bash scripts/boundary_check.sh

# 3. 적절한 폴더에 파일 생성
# JavaScript → src/js/
# CSS → src/css/
# 문서 → docs/
# 테스트 → test/

# 4. 작업 완료 후 검증
python scripts/monitor_boundaries.py
```

### 파일 구조 규칙
```
virtual_data_claude/
├── src/           # 소스 코드만
├── docs/          # 문서만
├── test/          # 테스트만
├── config/        # 설정만
├── scripts/       # 유틸리티만
├── archive/       # 오래된 파일만
└── logs/          # 로그만
```

## 🚫 금지 사항

### 절대 하지 말 것
1. ❌ `cd ..` 후 파일 작업
2. ❌ 절대 경로로 프로젝트 외부 접근
3. ❌ 심볼릭 링크로 외부 연결
4. ❌ 상위 폴더로 파일 이동/복사

### 위반 예시
```bash
# 모두 금지됨!
mv file.js ../                    # 외부로 이동
cp script.js /c/claude/other/     # 다른 프로젝트로 복사
ln -s /c/claude/file.txt link     # 외부 링크
touch ../newfile.md                # 상위 폴더에 생성
```

## ✅ 자동 검증 활용

### 작업 전 검증
```bash
# 경계 체크 실행
bash /c/claude/virtual_data_claude/scripts/boundary_check.sh

# 특정 파일 검증
bash scripts/boundary_check.sh src/new_file.js
```

### 작업 후 모니터링
```python
# 전체 스캔
python /c/claude/virtual_data_claude/scripts/monitor_boundaries.py

# 자동 수정 옵션
python scripts/monitor_boundaries.py --auto-fix

# 보고서 저장
python scripts/monitor_boundaries.py --save-report
```

## 📊 상태 확인 명령어

### 빠른 체크
```bash
# 현재 위치
pwd

# 프로젝트 구조
ls -la /c/claude/virtual_data_claude/

# 최근 변경 파일
find /c/claude/virtual_data_claude -type f -mmin -10

# Git 상태 (프로젝트 내에서)
cd /c/claude/virtual_data_claude && git status
```

## 🔄 복구 프로세스

### 경계 위반 발생 시
```bash
# 1. 잘못된 파일 확인
python scripts/monitor_boundaries.py

# 2. 자동 이동
python scripts/monitor_boundaries.py --auto-fix

# 3. 수동 이동 (필요시)
mv /c/claude/wrong_file.js /c/claude/virtual_data_claude/src/

# 4. 검증
bash scripts/boundary_check.sh
```

## 💡 모범 사례

### 1. 세션 시작 시
```bash
cd /c/claude/virtual_data_claude
bash scripts/boundary_check.sh
```

### 2. 파일 작업 시
```javascript
// 항상 상대 경로 사용
const filePath = './src/js/module.js';  // ✅ Good
const filePath = '../outside.js';       // ❌ Bad
```

### 3. 대량 작업 시
```bash
# 배치 작업 전 검증
for file in *.js; do
    bash scripts/boundary_check.sh "$file"
done
```

## 📝 일일 체크리스트

- [ ] 작업 시작: `cd /c/claude/virtual_data_claude`
- [ ] 경계 확인: `bash scripts/boundary_check.sh`
- [ ] 작업 수행: 항상 프로젝트 내부에서
- [ ] 작업 검증: `python scripts/monitor_boundaries.py`
- [ ] 완료 확인: 모든 파일이 경계 내부인지 확인

## 🚨 긴급 연락

문제 발생 시:
1. 즉시 작업 중단
2. `python scripts/monitor_boundaries.py --save-report` 실행
3. 보고서 확인: `logs/boundary_report_*.json`
4. PROJECT_RULES.md 참조

---

**⚠️ 기억하세요**:
> "모든 파일은 virtual_data_claude 안에!"
> "경계를 벗어나면 안 됩니다!"

**마지막 업데이트**: 2025-09-18
**우선순위**: 🔴 CRITICAL - 반드시 준수