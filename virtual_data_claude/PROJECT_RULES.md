# 📋 Virtual Data Claude 프로젝트 관리 규칙

## 🎯 핵심 원칙

### 1. 폴더 경계 규칙 (CRITICAL)
```
✅ 모든 작업은 반드시 C:\claude\virtual_data_claude 내에서만 수행
❌ 상위 폴더(C:\claude)에 파일 생성 금지
❌ 다른 프로젝트 폴더 침범 금지
```

## 📁 표준 폴더 구조

```
C:\claude\virtual_data_claude/
├── 📦 src/                    # 소스 코드
│   ├── js/                   # JavaScript 모듈
│   ├── css/                  # 스타일시트
│   └── components/           # UI 컴포넌트
├── 🔧 apps-script/            # Google Apps Script
├── 📚 docs/                   # 프로젝트 문서
│   ├── development/          # 개발 가이드
│   ├── testing/             # 테스트 문서
│   └── deployment/          # 배포 가이드
├── 🧪 test/                   # 테스트 파일
├── ⚙️ config/                 # 설정 파일
├── 🛠️ scripts/                # 유틸리티 스크립트
├── 📦 archive/                # 아카이브 파일
├── 🎯 index.html              # 메인 애플리케이션
├── 📖 README.md               # 프로젝트 개요
└── 📋 PROJECT_RULES.md        # 이 문서

```

## 🚨 경계 위반 방지 체크리스트

### 파일 생성 전 확인사항
- [ ] 현재 작업 디렉토리가 `virtual_data_claude`인가?
- [ ] 생성할 파일 경로가 프로젝트 경계 내부인가?
- [ ] 상대 경로 사용 시 상위 폴더로 이동하지 않는가?

### 명령어 실행 전 확인
```bash
# ✅ 올바른 예
cd /c/claude/virtual_data_claude
mkdir -p src/components

# ❌ 잘못된 예
cd /c/claude
mkdir new_project  # 경계 위반!
```

## 🔒 자동 검증 스크립트

### 1. 경계 검증 함수 (boundary_check.sh)
```bash
#!/bin/bash
# 파일 경로가 프로젝트 경계 내에 있는지 확인

validate_path() {
    local path="$1"
    local project_root="/c/claude/virtual_data_claude"

    # 절대 경로로 변환
    local abs_path=$(realpath "$path")

    # 프로젝트 경계 내에 있는지 확인
    if [[ "$abs_path" == "$project_root"* ]]; then
        echo "✅ Valid path: $abs_path"
        return 0
    else
        echo "❌ BOUNDARY VIOLATION: $abs_path is outside project!"
        return 1
    fi
}

# 사용 예
validate_path "./src/new_file.js"
```

### 2. Git Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# 모든 스테이징된 파일이 프로젝트 경계 내에 있는지 확인
PROJECT_ROOT="/c/claude/virtual_data_claude"

for file in $(git diff --cached --name-only); do
    abs_file=$(realpath "$file")
    if [[ "$abs_file" != "$PROJECT_ROOT"* ]]; then
        echo "❌ Error: $file is outside project boundary!"
        exit 1
    fi
done
```

## 📝 작업 플로우

### 1. 새 기능 추가 시
```bash
# 1. 프로젝트 디렉토리로 이동
cd /c/claude/virtual_data_claude

# 2. 작업 브랜치 생성 (선택사항)
git checkout -b feature/new-feature

# 3. 파일 생성 (반드시 프로젝트 내부)
touch src/js/new-feature.js

# 4. 경계 검증
pwd  # 현재 위치 확인
```

### 2. 파일 이동/복사 시
```bash
# ✅ 프로젝트 내부 이동
mv src/old.js src/js/new.js

# ❌ 프로젝트 외부로 이동 금지
mv src/file.js ../other_project/  # 절대 금지!
```

## 🛡️ 보안 규칙

### 민감 정보 관리
- `.env` 파일은 절대 커밋하지 않음
- API 키는 환경 변수로 관리
- `config/secrets.js`는 .gitignore에 추가

### 권한 설정
```bash
# 프로젝트 폴더 권한 설정
chmod 755 /c/claude/virtual_data_claude
chmod 644 /c/claude/virtual_data_claude/*.md
```

## 🔄 정기 점검 항목

### 일일 점검
- [ ] 작업 디렉토리 확인
- [ ] 불필요한 파일 정리
- [ ] 경계 위반 파일 확인

### 주간 점검
- [ ] 폴더 구조 정합성 확인
- [ ] 아카이브 파일 정리
- [ ] 문서 업데이트

## 🚀 자동화 도구

### 프로젝트 초기화 스크립트
```bash
#!/bin/bash
# init_project.sh

PROJECT_ROOT="/c/claude/virtual_data_claude"

# 프로젝트 구조 생성
mkdir -p "$PROJECT_ROOT"/{src/{js,css,components},apps-script,docs,test,config,scripts,archive}

# 기본 파일 생성
touch "$PROJECT_ROOT"/{index.html,README.md,PROJECT_RULES.md}

# Git 초기화 (필요시)
cd "$PROJECT_ROOT" && git init

echo "✅ Project structure created successfully!"
```

### 경계 모니터링 스크립트
```python
# monitor_boundaries.py
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path("/c/claude/virtual_data_claude")

def check_boundaries():
    """프로젝트 경계 위반 파일 검색"""
    violations = []

    # 상위 디렉토리 스캔
    parent_dir = PROJECT_ROOT.parent
    for item in parent_dir.iterdir():
        if item.name != "virtual_data_claude" and item.is_file():
            # 프로젝트 관련 파일인지 확인
            if any(keyword in item.name.lower() for keyword in ['virtual', 'poker', 'hand']):
                violations.append(item)

    if violations:
        print("❌ 경계 위반 파일 발견:")
        for v in violations:
            print(f"  - {v}")
        return False
    else:
        print("✅ 모든 파일이 프로젝트 경계 내에 있습니다.")
        return True

if __name__ == "__main__":
    sys.exit(0 if check_boundaries() else 1)
```

## 📌 Claude AI 전용 지침

### Claude가 파일 작업 시 준수사항
1. **항상 작업 디렉토리 확인**
   ```bash
   pwd  # 반드시 /c/claude/virtual_data_claude 확인
   ```

2. **파일 생성 전 경로 검증**
   ```javascript
   const projectRoot = '/c/claude/virtual_data_claude';
   const filePath = path.resolve(newFilePath);
   if (!filePath.startsWith(projectRoot)) {
       throw new Error('Boundary violation!');
   }
   ```

3. **상대 경로 사용 시 주의**
   - `../` 사용 금지
   - 절대 경로 권장

## 🔍 트러블슈팅

### 경계 위반 발생 시
1. 잘못 생성된 파일 즉시 삭제
2. 올바른 위치로 이동
3. Git 상태 확인 및 정리

### 복구 명령어
```bash
# 잘못된 위치의 파일 이동
mv /c/claude/wrong_file.js /c/claude/virtual_data_claude/src/

# Git 스테이징 취소
git reset HEAD wrong_file.js

# 클린업
git clean -fd
```

## 📅 업데이트 이력

- **2025-09-18**: 초기 규칙 문서 생성
- **작성자**: Claude AI Assistant

---

**⚠️ 중요**: 이 규칙은 프로젝트의 무결성과 조직화를 위해 반드시 준수되어야 합니다.