#!/usr/bin/env python3
"""
Virtual Data Claude - 경계 모니터링 시스템
프로젝트 경계 위반을 감지하고 자동으로 보고합니다.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

# 프로젝트 루트 설정
PROJECT_ROOT = Path("/c/claude/virtual_data_claude")
PARENT_DIR = PROJECT_ROOT.parent

# 프로젝트 관련 키워드
PROJECT_KEYWORDS = ['virtual', 'poker', 'hand', 'player', 'chip', 'table']

# 색상 코드
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

def print_header():
    """헤더 출력"""
    print(f"{Colors.CYAN}{'='*50}{Colors.NC}")
    print(f"{Colors.CYAN}  Virtual Data Claude - Boundary Monitor{Colors.NC}")
    print(f"{Colors.CYAN}{'='*50}{Colors.NC}\n")

def check_boundaries() -> Tuple[List[Path], List[Path]]:
    """
    프로젝트 경계 위반 파일 검색
    Returns: (violations, suspicious_files)
    """
    violations = []
    suspicious = []

    # 상위 디렉토리 스캔
    try:
        for item in PARENT_DIR.iterdir():
            if item.name == "virtual_data_claude":
                continue

            if item.is_file():
                # 파일명에 프로젝트 키워드가 포함되어 있는지 확인
                file_lower = item.name.lower()
                if any(keyword in file_lower for keyword in PROJECT_KEYWORDS):
                    violations.append(item)
                # 프로젝트 확장자 확인
                elif item.suffix in ['.html', '.js', '.gs', '.md']:
                    # 내용 확인 (첫 100줄만)
                    try:
                        with open(item, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read(5000)  # 처음 5000자만 읽기
                            if any(keyword in content.lower() for keyword in PROJECT_KEYWORDS):
                                suspicious.append(item)
                    except:
                        pass
    except PermissionError:
        print(f"{Colors.YELLOW}⚠️  Permission denied accessing parent directory{Colors.NC}")

    return violations, suspicious

def verify_project_structure() -> Dict[str, bool]:
    """프로젝트 구조 검증"""
    required_dirs = ['src', 'apps-script', 'docs', 'test', 'config', 'scripts', 'archive']
    structure = {}

    for dir_name in required_dirs:
        dir_path = PROJECT_ROOT / dir_name
        structure[dir_name] = dir_path.exists() and dir_path.is_dir()

    return structure

def count_project_files() -> Dict[str, int]:
    """프로젝트 파일 통계"""
    stats = {
        'html': 0,
        'js': 0,
        'css': 0,
        'md': 0,
        'json': 0,
        'other': 0,
        'total': 0
    }

    for file in PROJECT_ROOT.rglob('*'):
        if file.is_file():
            stats['total'] += 1
            ext = file.suffix.lower()[1:]  # Remove the dot
            if ext in stats:
                stats[ext] += 1
            else:
                stats['other'] += 1

    return stats

def generate_report(violations: List[Path], suspicious: List[Path], structure: Dict[str, bool], stats: Dict[str, int]):
    """보고서 생성 및 출력"""

    # 경계 위반 검사 결과
    print(f"{Colors.YELLOW}📋 Boundary Check Results:{Colors.NC}")
    print("-" * 40)

    if violations:
        print(f"{Colors.RED}❌ Found {len(violations)} boundary violations:{Colors.NC}")
        for v in violations:
            print(f"   {Colors.RED}→{Colors.NC} {v.relative_to(PARENT_DIR)}")
    else:
        print(f"{Colors.GREEN}✅ No boundary violations found{Colors.NC}")

    if suspicious:
        print(f"\n{Colors.YELLOW}⚠️  Found {len(suspicious)} suspicious files:{Colors.NC}")
        for s in suspicious:
            print(f"   {Colors.YELLOW}?{Colors.NC} {s.relative_to(PARENT_DIR)}")

    # 프로젝트 구조 검증
    print(f"\n{Colors.YELLOW}📁 Project Structure:{Colors.NC}")
    print("-" * 40)

    missing = [name for name, exists in structure.items() if not exists]
    if missing:
        print(f"{Colors.YELLOW}⚠️  Missing directories:{Colors.NC}")
        for dir_name in missing:
            print(f"   {Colors.RED}✗{Colors.NC} {dir_name}/")
    else:
        print(f"{Colors.GREEN}✅ All required directories present{Colors.NC}")

    # 파일 통계
    print(f"\n{Colors.YELLOW}📊 File Statistics:{Colors.NC}")
    print("-" * 40)
    for ext, count in stats.items():
        if count > 0:
            print(f"   {ext:8} : {count:4} files")

def auto_fix_violations(violations: List[Path]) -> int:
    """경계 위반 파일 자동 이동 (사용자 확인 후)"""
    if not violations:
        return 0

    print(f"\n{Colors.YELLOW}🔧 Auto-fix Options:{Colors.NC}")
    print("-" * 40)
    print(f"Found {len(violations)} files outside project boundary.")

    response = input(f"{Colors.CYAN}Would you like to move them to the project? (y/n): {Colors.NC}")

    if response.lower() != 'y':
        return 0

    moved = 0
    for file in violations:
        try:
            # 적절한 대상 디렉토리 결정
            if file.suffix == '.html':
                target_dir = PROJECT_ROOT
            elif file.suffix == '.js':
                target_dir = PROJECT_ROOT / 'src' / 'js'
            elif file.suffix == '.md':
                target_dir = PROJECT_ROOT / 'docs'
            else:
                target_dir = PROJECT_ROOT / 'archive'

            # 디렉토리 생성
            target_dir.mkdir(parents=True, exist_ok=True)

            # 파일 이동
            target_path = target_dir / file.name
            file.rename(target_path)
            print(f"   {Colors.GREEN}✓{Colors.NC} Moved {file.name} to {target_dir.relative_to(PROJECT_ROOT)}/")
            moved += 1
        except Exception as e:
            print(f"   {Colors.RED}✗{Colors.NC} Failed to move {file.name}: {e}")

    return moved

def save_report(violations: List[Path], suspicious: List[Path]):
    """JSON 형식으로 보고서 저장"""
    report_dir = PROJECT_ROOT / 'logs'
    report_dir.mkdir(exist_ok=True)

    report = {
        'timestamp': datetime.now().isoformat(),
        'violations': [str(v) for v in violations],
        'suspicious': [str(s) for s in suspicious],
        'project_root': str(PROJECT_ROOT)
    }

    report_file = report_dir / f"boundary_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n{Colors.BLUE}📄 Report saved to: {report_file.relative_to(PROJECT_ROOT)}{Colors.NC}")

def main():
    """메인 실행 함수"""
    print_header()

    # 프로젝트 루트 확인
    if not PROJECT_ROOT.exists():
        print(f"{Colors.RED}❌ Error: Project root does not exist: {PROJECT_ROOT}{Colors.NC}")
        sys.exit(1)

    # 경계 검사
    violations, suspicious = check_boundaries()

    # 구조 검증
    structure = verify_project_structure()

    # 파일 통계
    stats = count_project_files()

    # 보고서 생성
    generate_report(violations, suspicious, structure, stats)

    # 자동 수정 옵션
    if violations and '--auto-fix' in sys.argv:
        moved = auto_fix_violations(violations)
        if moved > 0:
            print(f"\n{Colors.GREEN}✅ Successfully moved {moved} files{Colors.NC}")

    # 보고서 저장 옵션
    if '--save-report' in sys.argv:
        save_report(violations, suspicious)

    # 종료 코드
    if violations:
        print(f"\n{Colors.RED}⚠️  Action required: Please resolve boundary violations{Colors.NC}")
        sys.exit(1)
    else:
        print(f"\n{Colors.GREEN}✅ All checks passed successfully{Colors.NC}")
        sys.exit(0)

if __name__ == "__main__":
    main()