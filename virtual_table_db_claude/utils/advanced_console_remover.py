#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

def advanced_clean_console_logs(file_path):
    """더 정교한 콘솔 로그 제거"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 제거할 패턴들 (더 포괄적)
    advanced_patterns = [
        # AI 관련 console.log (이모지 포함)
        r'console\.log\([^)]*["\']AI["\'][^)]*✅[^)]*\);?\s*\n?',

        # SHEET 관련 (일부는 남겨두고 디버그성만)
        r'console\.log\([^)]*["\']SHEET["\'][^)]*🚀[^)]*\);?\s*\n?',
        r'console\.log\([^)]*["\']SHEET["\'][^)]*ℹ️[^)]*\);?\s*\n?',

        # PERFORMANCE 관련
        r'console\.log\([^)]*["\']PERFORMANCE["\'][^)]*ℹ️[^)]*\);?\s*\n?',

        # CACHE 관련 (성공 메시지)
        r'console\.log\([^)]*["\']CACHE["\'][^)]*💾[^)]*\);?\s*\n?',

        # 주석처리된 디버그 로그 제거
        r'//\s*console\.log\([^)]*\);\s*//[^\\n]*\n?',

        # 빈 줄과 주석만 있는 줄들도 정리
        r'\n\s*\n\s*\n',  # 3개 이상 연속 빈 줄을 2개로
    ]

    removed_count = 0

    for pattern in advanced_patterns:
        matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))
        for match in reversed(matches):
            content = content[:match.start()] + content[match.end():]
            removed_count += 1

    # 연속된 빈 줄 정리
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Additional console logs removed: {removed_count}")

    # 최종 개수 확인
    remaining = len(re.findall(r'console\.', content))
    print(f"Remaining console calls: {remaining}")

    # 남은 콘솔 로그들의 타입별 개수
    error_count = len(re.findall(r'console\.error', content))
    warn_count = len(re.findall(r'console\.warn', content))
    log_count = len(re.findall(r'console\.log', content))

    print(f"  - console.error: {error_count} (mostly preserved for critical error handling)")
    print(f"  - console.warn: {warn_count}")
    print(f"  - console.log: {log_count}")

if __name__ == "__main__":
    html_file = r"C:\claude\virtual_table_db_claude\index.html"
    advanced_clean_console_logs(html_file)