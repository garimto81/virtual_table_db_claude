#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

def final_clean_console_logs(file_path):
    """최종 콘솔 로그 제거"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 모든 console.log 제거 (console.error는 보존)
    final_patterns = [
        # 모든 console.log를 제거 (멀티라인 고려)
        r'\s*console\.log\([^;]*;\s*\n?',
        r'\s*console\.log\([^)]*\);\s*\n?',

        # 줄 끝에 }console.log 형태 수정
        r'}console\.log\([^)]*\);\s*\n?',
    ]

    removed_count = 0

    for pattern in final_patterns:
        old_content = content
        content = re.sub(pattern, '\n', content, flags=re.MULTILINE | re.DOTALL)
        removed_count += len(re.findall(pattern, old_content, re.MULTILINE | re.DOTALL))

    # }console.log 형태 특별 처리
    content = re.sub(r'}console\.log\([^)]*\);', '}', content)

    # 연속 빈 줄 정리
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Final console.log removal: {removed_count}")

    # 최종 검증
    remaining = len(re.findall(r'console\.', content))
    error_count = len(re.findall(r'console\.error', content))
    warn_count = len(re.findall(r'console\.warn', content))
    log_count = len(re.findall(r'console\.log', content))

    print(f"Final count:")
    print(f"  - Total console calls: {remaining}")
    print(f"  - console.error: {error_count} (preserved)")
    print(f"  - console.warn: {warn_count} (mostly preserved)")
    print(f"  - console.log: {log_count} (should be 0)")

    original_count = 742
    removed_total = original_count - remaining
    print(f"\nSummary:")
    print(f"  - Original console calls: {original_count}")
    print(f"  - Removed console calls: {removed_total}")
    print(f"  - Remaining console calls: {remaining}")
    print(f"  - Removal rate: {(removed_total/original_count*100):.1f}%")

if __name__ == "__main__":
    html_file = r"C:\claude\virtual_table_db_claude\index.html"
    final_clean_console_logs(html_file)