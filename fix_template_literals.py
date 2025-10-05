#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모든 깨진 템플릿 리터럴 일괄 수정 스크립트
"""
import re

def fix_template_literals(file_path):
    """깨진 템플릿 리터럴 패턴들을 일괄 수정"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 백업 생성
    with open(file_path + '.before_template_fix', 'w', encoding='utf-8') as f:
        f.write(content)

    fixes = []

    # 1. 기본 패턴: }"; // Fixed: template literal 수정
    pattern1 = r'([^`]*)}"; // Fixed: template literal\s*(.*?;?)'
    def replace1(match):
        content_part = match.group(1)
        rest = match.group(2).strip()
        if rest and not rest.startswith('//'):
            return f'{content_part}`);\n        {rest}' if rest else f'{content_part}`);\n'
        else:
            return f'{content_part}`);\n'

    content = re.sub(pattern1, replace1, content, flags=re.MULTILINE)

    # 2. 다른 패턴들: "; // Fixed 수정
    pattern2 = r'([^`]*)" // Fixed[^;\n]*\s*(.*?)$'
    def replace2(match):
        content_part = match.group(1)
        rest = match.group(2).strip()
        if rest and not rest.startswith('//'):
            return f'{content_part}`);\n        {rest}' if rest else f'{content_part}`);\n'
        else:
            return f'{content_part}`);\n'

    content = re.sub(pattern2, replace2, content, flags=re.MULTILINE)

    # 3. 특별한 패턴: }..." 수정
    pattern3 = r'([^`]*)}\.\.\."; // Fixed: template literal'
    content = re.sub(pattern3, r'\1}`);', content)

    # 4. Fixed syntax error 단독 주석 제거
    content = re.sub(r'^\s*// Fixed syntax error\s*$\n', '', content, flags=re.MULTILINE)

    # 5. Fixed: removed orphaned 패턴 정리
    content = re.sub(r'^\s*// Fixed: removed orphaned [^;]*;\s*', '', content, flags=re.MULTILINE)

    print("Template literals fixed successfully:")
    print("1. Fixed }\" patterns to `)")
    print("2. Removed Fixed syntax error comments")
    print("3. Cleaned orphaned code")
    print("4. Backup file:", file_path + '.before_template_fix')

    # 파일 저장
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return True

if __name__ == "__main__":
    fix_template_literals("C:\\claude\\virtual_table_db_claude\\index.html")