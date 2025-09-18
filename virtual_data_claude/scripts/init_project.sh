#!/bin/bash
# Virtual Data Claude - 프로젝트 초기화 스크립트
# 표준 폴더 구조를 생성하고 기본 설정을 초기화합니다.

PROJECT_ROOT="/c/claude/virtual_data_claude"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Virtual Data Claude - Project Initializer ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

# 프로젝트 루트 생성
echo -e "${YELLOW}📁 Creating project structure...${NC}"

# 메인 디렉토리 생성
directories=(
    "src/js"
    "src/css"
    "src/components"
    "apps-script"
    "docs/development"
    "docs/testing"
    "docs/deployment"
    "test/unit"
    "test/integration"
    "config"
    "scripts"
    "archive"
    "logs"
)

for dir in "${directories[@]}"; do
    mkdir -p "$PROJECT_ROOT/$dir"
    echo -e "  ${GREEN}✓${NC} Created: $dir"
done

# 기본 파일 생성 (존재하지 않는 경우만)
echo -e "\n${YELLOW}📄 Creating base files...${NC}"

# README.md
if [ ! -f "$PROJECT_ROOT/README.md" ]; then
    cat > "$PROJECT_ROOT/README.md" << 'EOF'
# Virtual Data Claude - Poker Hand Logger

## 프로젝트 개요
Google Sheets 기반 실시간 포커 핸드 기록 시스템

## 빠른 시작
1. Google Sheets 설정
2. Apps Script 배포
3. 로컬 서버 실행

자세한 내용은 [docs/](./docs/) 참조
EOF
    echo -e "  ${GREEN}✓${NC} Created: README.md"
fi

# index.html (템플릿)
if [ ! -f "$PROJECT_ROOT/index.html" ]; then
    cat > "$PROJECT_ROOT/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Virtual Data Claude</title>
    <link rel="stylesheet" href="src/css/main.css">
</head>
<body>
    <h1>Virtual Data Claude - Poker Hand Logger</h1>
    <!-- Application content here -->
    <script src="src/js/main.js"></script>
</body>
</html>
EOF
    echo -e "  ${GREEN}✓${NC} Created: index.html"
fi

# package.json
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    cat > "$PROJECT_ROOT/package.json" << 'EOF'
{
  "name": "virtual-data-claude",
  "version": "1.0.0",
  "description": "Poker Hand Logger with Google Sheets integration",
  "main": "index.html",
  "scripts": {
    "start": "python -m http.server 8000",
    "test": "echo \"Error: no test specified\" && exit 1",
    "check": "bash scripts/boundary_check.sh",
    "monitor": "python scripts/monitor_boundaries.py"
  },
  "keywords": ["poker", "google-sheets", "hand-logger"],
  "author": "Virtual Data Team",
  "license": "MIT"
}
EOF
    echo -e "  ${GREEN}✓${NC} Created: package.json"
fi

# 환경 변수 템플릿
if [ ! -f "$PROJECT_ROOT/.env.example" ]; then
    cat > "$PROJECT_ROOT/.env.example" << 'EOF'
# Google Apps Script URL
APPS_SCRIPT_URL=your_deployment_url_here

# API Keys (if needed)
GEMINI_API_KEY=your_api_key_here

# Environment
NODE_ENV=development
EOF
    echo -e "  ${GREEN}✓${NC} Created: .env.example"
fi

# Git 초기화 (필요한 경우)
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo -e "\n${YELLOW}🔧 Initializing Git repository...${NC}"
    cd "$PROJECT_ROOT"
    git init
    echo -e "  ${GREEN}✓${NC} Git repository initialized"
fi

# 권한 설정
echo -e "\n${YELLOW}🔒 Setting permissions...${NC}"
chmod 755 "$PROJECT_ROOT"
chmod 755 "$PROJECT_ROOT"/*/
chmod 644 "$PROJECT_ROOT"/*.md
chmod 755 "$PROJECT_ROOT/scripts"/*.sh 2>/dev/null || true
chmod 755 "$PROJECT_ROOT/scripts"/*.py 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Permissions set"

# 최종 확인
echo -e "\n${YELLOW}🔍 Verifying setup...${NC}"

# 경계 체크 스크립트 실행
if [ -f "$PROJECT_ROOT/scripts/boundary_check.sh" ]; then
    bash "$PROJECT_ROOT/scripts/boundary_check.sh" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Boundary check passed"
    fi
fi

# 완료 메시지
echo -e "\n${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Project initialization complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}\n"

echo "Next steps:"
echo "1. cd $PROJECT_ROOT"
echo "2. Copy your project files to appropriate directories"
echo "3. Run 'bash scripts/boundary_check.sh' to verify"
echo "4. Start development!"