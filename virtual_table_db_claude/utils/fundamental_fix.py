#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
근본적 구문 오류 해결 - debugLog를 안전하게 처리
"""

import re

def fundamental_fix(file_path):
    """debugLog 호출을 안전하게 주석 처리"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 백업 생성
    with open(file_path + '.before_fundamental_fix', 'w', encoding='utf-8') as f:
        f.write(content)

    fixes = []

    # 1. 특정 라인 수정 (982번 줄 문제)
    lines = content.split('\n')

    # 982번 줄 근처 수정 (0-indexed이므로 981)
    if len(lines) > 981:
        if 'debugLog(' in lines[981] and 'return filename' in lines[981]:
            # 잘못 합쳐진 라인 분리 및 수정
            lines[981] = '        // debugLog 호출 제거됨'
            lines.insert(982, '        return filename;')
            fixes.append("Line 982: Fixed merged debugLog and return statement")

    content = '\n'.join(lines)

    # 2. 모든 debugLog 함수 호출을 안전하게 주석 처리
    # 단순 제거가 아닌 전체 호출을 주석으로 변경
    pattern = r'(\s*)debugLog\([^;]*\);'

    def replace_debuglog(match):
        indent = match.group(1)
        return f'{indent}// debugLog 호출 제거'

    content = re.sub(pattern, replace_debuglog, content, flags=re.MULTILINE | re.DOTALL)

    # 3. 깨진 템플릿 리터럴 수정
    # 백틱으로 시작해서 따옴표로 끝나는 패턴
    content = re.sub(r'`([^`]*)"', r'`\1`', content)

    # 4. 파일 끝에 debugLog 함수를 빈 함수로 재정의 추가
    debug_override = """

// debugLog 함수를 빈 함수로 재정의 (구문 오류 방지)
if (typeof debugLog === 'undefined') {
    window.debugLog = function() {};
}
"""

    # </script> 태그 바로 앞에 삽입
    content = content.replace('</script>', debug_override + '\n</script>', 1)

    # 파일 저장
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ 근본적 수정 완료:")
    print("1. debugLog 호출을 안전하게 주석 처리")
    print("2. 깨진 템플릿 리터럴 수정")
    print("3. debugLog 빈 함수 정의 추가")
    print("4. 백업 파일: " + file_path + '.before_fundamental_fix')

    return True

if __name__ == "__main__":
    fundamental_fix("C:\\claude\\virtual_table_db_claude\\index.html")