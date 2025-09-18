#!/bin/bash
# Virtual Data Claude - 경계 검증 스크립트
# 모든 파일 작업이 프로젝트 경계 내에서 이루어지는지 확인

PROJECT_ROOT="/c/claude/virtual_data_claude"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 경로 검증 함수
validate_path() {
    local path="$1"

    # 절대 경로로 변환
    local abs_path=$(realpath "$path" 2>/dev/null || echo "$path")

    # 프로젝트 경계 내에 있는지 확인
    if [[ "$abs_path" == "$PROJECT_ROOT"* ]]; then
        echo -e "${GREEN}✅ Valid path:${NC} $abs_path"
        return 0
    else
        echo -e "${RED}❌ BOUNDARY VIOLATION:${NC} $abs_path is outside project!"
        return 1
    fi
}

# 현재 디렉토리 확인
check_current_directory() {
    local current=$(pwd)
    echo -e "${YELLOW}📍 Current directory:${NC} $current"

    if [[ "$current" == "$PROJECT_ROOT"* ]]; then
        echo -e "${GREEN}✅ Working inside project boundary${NC}"
        return 0
    else
        echo -e "${RED}⚠️  WARNING: Working outside project boundary!${NC}"
        echo -e "${YELLOW}   Please run: cd $PROJECT_ROOT${NC}"
        return 1
    fi
}

# 프로젝트 구조 검증
verify_project_structure() {
    echo -e "${YELLOW}🔍 Verifying project structure...${NC}"

    local required_dirs=("src" "apps-script" "docs" "test" "config" "scripts" "archive")
    local missing=0

    for dir in "${required_dirs[@]}"; do
        if [ -d "$PROJECT_ROOT/$dir" ]; then
            echo -e "  ${GREEN}✓${NC} $dir/"
        else
            echo -e "  ${RED}✗${NC} $dir/ (missing)"
            missing=$((missing + 1))
        fi
    done

    if [ $missing -eq 0 ]; then
        echo -e "${GREEN}✅ All required directories present${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $missing directories missing${NC}"
        return 1
    fi
}

# 경계 위반 파일 검색
find_boundary_violations() {
    echo -e "${YELLOW}🔍 Scanning for boundary violations...${NC}"

    local parent_dir=$(dirname "$PROJECT_ROOT")
    local violations=0

    # 상위 디렉토리에서 프로젝트 관련 파일 검색
    while IFS= read -r file; do
        if [[ "$file" != "$PROJECT_ROOT"* ]]; then
            echo -e "  ${RED}⚠️  Violation:${NC} $file"
            violations=$((violations + 1))
        fi
    done < <(find "$parent_dir" -maxdepth 1 -type f \( -name "*.html" -o -name "*.js" -o -name "*.gs" \) 2>/dev/null | grep -E "(poker|hand|virtual)" | grep -v "virtual_data_claude")

    if [ $violations -eq 0 ]; then
        echo -e "${GREEN}✅ No boundary violations found${NC}"
        return 0
    else
        echo -e "${RED}❌ Found $violations boundary violations${NC}"
        return 1
    fi
}

# 메인 실행
main() {
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
    echo -e "${YELLOW}   Virtual Data Claude - Boundary Check    ${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
    echo ""

    # 인자가 있으면 특정 경로 검증
    if [ $# -gt 0 ]; then
        for path in "$@"; do
            validate_path "$path"
        done
    else
        # 전체 검증 수행
        check_current_directory
        echo ""
        verify_project_structure
        echo ""
        find_boundary_violations
    fi

    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
}

# 스크립트 실행
main "$@"