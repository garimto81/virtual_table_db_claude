#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import os

def clean_console_logs(file_path):
    """콘솔 로그 제거"""

    # 백업 생성
    backup_path = file_path + '.backup'

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Backup created: {backup_path}")

    # 제거할 패턴들 (중요한 에러는 보존)
    patterns_to_remove = [
        # 디버그 로그들
        r'console\.log\([^)]*["\']API["\'][^)]*\);?\s*\n?',
        r'console\.log\([^)]*["\']DEBUG["\'][^)]*\);?\s*\n?',
        r'console\.log\([^)]*["\']PERFORMANCE["\'][^)]*\);?\s*\n?',
        r'console\.log\([^)]*["\']MAPPING["\'][^)]*\);?\s*\n?',
        r'console\.log\([^)]*["\']SHEET["\'][^)]*\);?\s*\n?',
        r'console\.log\([^)]*["\']CACHE["\'][^)]*\);?\s*\n?',
        r'console\.log\([^)]*["\']TIME["\'][^)]*\);?\s*\n?',
        r'console\.log\([^)]*["\']AI["\'][^)]*\);?\s*\n?',
        r'console\.warn\([^)]*["\']WARN["\'][^)]*\);?\s*\n?',
        r'console\.warn\([^)]*["\']API["\'][^)]*\);?\s*\n?',
        r'console\.info\([^)]*\);?\s*\n?',
        r'console\.debug\([^)]*\);?\s*\n?',
        r'debugLog\([^)]*\);?\s*\n?',

        # 이모지가 포함된 로그들
        r'console\.log\([^)]*`[^`]*🔍[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*✅[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*🎯[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*📊[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*🔄[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*🤖[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*📝[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*⚠️[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*❌[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*🎬[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*📥[^`]*`[^)]*\);?\s*\n?',
        r'console\.log\([^)]*`[^`]*⏰[^`]*`[^)]*\);?\s*\n?',

        # 일반적인 console.log (긴 문장도 포함)
        r'\s*console\.log\([^;]*\);?\s*\n?',
        r'\s*console\.warn\([^;]*\);?\s*\n?',
    ]

    # 보존할 패턴들 (중요한 에러 처리)
    preserve_patterns = [
        r'catch\s*\([^)]*\)\s*{\s*[^}]*console\.error',
        r'\.catch\([^)]*console\.error',
        r'console\.error\([^)]*["\']ERROR["\']',
        r'audio\.play\(\)\.catch\([^)]*console\.error',
    ]

    removed_count = 0

    # 보존해야 할 부분 체크하는 함수
    def should_preserve(text, start_pos):
        for pattern in preserve_patterns:
            # 앞뒤 50자 정도 확인
            check_start = max(0, start_pos - 50)
            check_end = min(len(text), start_pos + 200)
            context = text[check_start:check_end]
            if re.search(pattern, context, re.IGNORECASE | re.DOTALL):
                return True
        return False

    # 패턴별로 제거
    for pattern in patterns_to_remove:
        matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))
        for match in reversed(matches):  # 뒤에서부터 제거해야 인덱스가 안 꼬임
            if not should_preserve(content, match.start()):
                content = content[:match.start()] + content[match.end():]
                removed_count += 1

    # 결과 저장
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Console logs removed: {removed_count}")
    print(f"File cleaned and saved: {file_path}")

if __name__ == "__main__":
    html_file = r"C:\claude\virtual_table_db_claude\index.html"
    clean_console_logs(html_file)