#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
콘솔 로그 정리 스크립트
- 모든 디버그 콘솔 로그 제거 (742개)
- 중요한 에러 처리는 보존
- 성능 최적화를 위한 프로덕션 준비 작업
"""

import re
import os
from typing import List, Tuple

class ConsoleLogCleaner:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.backup_path = file_path + '.backup'
        self.removed_count = 0
        self.preserved_count = 0
        self.console_patterns = {
            'debug_logs': [
                # 디버그용 콘솔 로그들 (제거 대상)
                r'console\.log\([^)]*["\']DEBUG["\'][^)]*\);?\s*',
                r'console\.log\([^)]*["\']PERFORMANCE["\'][^)]*\);?\s*',
                r'console\.log\([^)]*["\']MAPPING["\'][^)]*\);?\s*',
                r'console\.log\([^)]*["\']SHEET["\'][^)]*\);?\s*',
                r'console\.log\([^)]*["\']CACHE["\'][^)]*\);?\s*',
                r'console\.log\([^)]*["\']TIME["\'][^)]*\);?\s*',
                r'console\.log\([^)]*["\']AI["\'][^)]*\);?\s*',
                r'console\.log\([^)]*["\']API["\'][^)]*\);?\s*',
                r'console\.warn\([^)]*["\']WARN["\'][^)]*\);?\s*',
                r'console\.warn\([^)]*["\']DEPRECATED["\'][^)]*\);?\s*',
                r'console\.info\([^)]*\);?\s*',
                r'console\.debug\([^)]*\);?\s*',
                # 일반 디버그 로그들
                r'console\.log\([^)]*`[^`]*🔍[^`]*`[^)]*\);?\s*',
                r'console\.log\([^)]*`[^`]*✅[^`]*`[^)]*\);?\s*',
                r'console\.log\([^)]*`[^`]*🎯[^`]*`[^)]*\);?\s*',
                r'console\.log\([^)]*`[^`]*📊[^`]*`[^)]*\);?\s*',
                r'console\.log\([^)]*`[^`]*🔄[^`]*`[^)]*\);?\s*',
                r'debugLog\([^)]*\);?\s*',
            ],
            'critical_errors': [
                # 중요한 에러 처리 (보존 대상) - try-catch 블록 내의 console.error
                r'catch\s*\([^)]*\)\s*{\s*console\.error',
                r'\.catch\([^)]*console\.error',
                r'onerror\s*=.*console\.error',
                # 사용자 피드백용 에러
                r'console\.error\([^)]*["\']ERROR["\'][^)]*파일명 생성 오류[^)]*\);?\s*',
                r'console\.error\([^)]*["\']ERROR["\'][^)]*핸드 상세 정보 추출 오류[^)]*\);?\s*',
                r'console\.error\([^)]*["\']ERROR["\'][^)]*통합 핸드 분석 오류[^)]*\);?\s*',
                r'console\.error\([^)]*["\']ERROR["\'][^)]*자막 생성 오류[^)]*\);?\s*',
                r'console\.error\([^)]*["\']ERROR["\'][^)]*캐시 갱신 실패[^)]*\);?\s*',
                r'console\.error\([^)]*["\']ERROR["\'][^)]*소리 재생 실패[^)]*\);?\s*',
            ]
        }

    def create_backup(self) -> bool:
        """백업 파일 생성"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as original:
                with open(self.backup_path, 'w', encoding='utf-8') as backup:
                    backup.write(original.read())
            print(f"✅ 백업 생성 완료: {self.backup_path}")
            return True
        except Exception as e:
            print(f"❌ 백업 생성 실패: {e}")
            return False

    def is_critical_error(self, line: str) -> bool:
        """중요한 에러 처리인지 판단"""
        for pattern in self.console_patterns['critical_errors']:
            if re.search(pattern, line, re.IGNORECASE):
                return True
        return False

    def should_remove_console(self, line: str) -> bool:
        """콘솔 로그 제거 여부 판단"""
        # 중요한 에러는 보존
        if self.is_critical_error(line):
            self.preserved_count += 1
            return False

        # 디버그 로그는 제거
        for pattern in self.console_patterns['debug_logs']:
            if re.search(pattern, line, re.IGNORECASE):
                self.removed_count += 1
                return True

        # 일반적인 console.log/warn/info/debug는 제거
        if re.search(r'console\.(log|warn|info|debug)\s*\(', line):
            # try-catch 블록 내의 console.error는 보존
            if 'console.error' in line and ('catch' in line or 'error' in line.lower()):
                self.preserved_count += 1
                return False
            self.removed_count += 1
            return True

        return False

    def clean_console_logs(self) -> bool:
        """콘솔 로그 정리 실행"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()

            cleaned_lines = []
            i = 0
            while i < len(lines):
                line = lines[i]

                # 멀티라인 console.log 처리
                if re.search(r'console\.(log|warn|info|debug|error)\s*\(', line):
                    # 완전한 console 문장을 찾기 위해 다음 줄들도 확인
                    full_statement = line
                    j = i + 1
                    open_parens = line.count('(') - line.count(')')

                    while j < len(lines) and open_parens > 0:
                        full_statement += lines[j]
                        open_parens += lines[j].count('(') - lines[j].count(')')
                        j += 1

                    # 제거 여부 판단
                    if self.should_remove_console(full_statement):
                        # 제거된 라인 수만큼 스킵
                        i = j
                        continue
                    else:
                        # 보존 - 현재 라인만 추가
                        cleaned_lines.append(line)
                else:
                    cleaned_lines.append(line)

                i += 1

            # 정리된 내용을 파일에 저장
            with open(self.file_path, 'w', encoding='utf-8') as file:
                file.writelines(cleaned_lines)

            return True

        except Exception as e:
            print(f"❌ 콘솔 로그 정리 실패: {e}")
            return False

    def get_statistics(self) -> dict:
        """정리 통계 반환"""
        return {
            'removed': self.removed_count,
            'preserved': self.preserved_count,
            'total_processed': self.removed_count + self.preserved_count
        }

def main():
    html_file = r"C:\claude\virtual_table_db_claude\index.html"

    if not os.path.exists(html_file):
        print(f"❌ 파일을 찾을 수 없습니다: {html_file}")
        return

    print("🧹 콘솔 로그 정리 시작...")
    print(f"📁 대상 파일: {html_file}")

    cleaner = ConsoleLogCleaner(html_file)

    # 백업 생성
    if not cleaner.create_backup():
        print("❌ 백업 실패로 인해 작업을 중단합니다.")
        return

    # 콘솔 로그 정리
    if cleaner.clean_console_logs():
        stats = cleaner.get_statistics()
        print(f"\n✅ 콘솔 로그 정리 완료!")
        print(f"📊 제거된 로그: {stats['removed']}개")
        print(f"📊 보존된 로그: {stats['preserved']}개")
        print(f"📊 총 처리된 로그: {stats['total_processed']}개")
        print(f"💾 백업 파일: {cleaner.backup_path}")
    else:
        print("❌ 콘솔 로그 정리 실패")

if __name__ == "__main__":
    main()