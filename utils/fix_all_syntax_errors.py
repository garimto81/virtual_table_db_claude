#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Fix ALL JavaScript syntax errors in index.html - comprehensive version
"""

import re

def fix_all_syntax_errors(file_path):
    """Fix all remaining JavaScript syntax errors"""

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fixes_count = 0
    fixed_lines = []

    # Track specific line fixes
    specific_fixes = {
        1268: "        // Fixed: subtitle 로그 제거",
        1664: "            // Fixed: 복사완료, 빈값 로그 제거",
        4034: "        // Fixed: action 로그 제거",
        4035: "        // action: requestData.action",
        4036: "        // });",
        4154: "        // Fixed: resultType 로그 제거",
        6016: "        // Fixed: 시간 형식 로그 제거"
    }

    for i, line in enumerate(lines, 1):
        # Check if this line needs specific fix
        if i in specific_fixes:
            fixed_lines.append(specific_fixes[i] + '\n')
            fixes_count += 1
            print(f"Fixed line {i}: Replaced with comment")
        else:
            # Apply pattern-based fixes
            original_line = line

            # Pattern 1: Line starting with : followed by template literal
            if re.match(r'^\s*:`[^`]*\);?\s*$', line):
                line = re.sub(r'^(\s*):.*$', r'\1// Fixed: removed orphaned colon line', line)
                fixes_count += 1
                print(f"Fixed line {i}: Orphaned colon")

            # Pattern 2: Line starting with comma
            elif re.match(r'^\s*,\s*[^/]', line):
                # Check if it's a continuation that should be commented
                if re.match(r'^\s*,\s*[^:]+:.*\);?\s*$', line):
                    line = re.sub(r'^(\s*),(.*)$', r'\1//\2', line)
                    fixes_count += 1
                    print(f"Fixed line {i}: Orphaned comma")
                elif re.match(r'^\s*,\s*$', line):
                    line = re.sub(r'^(\s*),\s*$', r'\1// Fixed: removed orphaned comma', line)
                    fixes_count += 1
                    print(f"Fixed line {i}: Single comma")

            # Pattern 3: Orphaned closing parenthesis and semicolon
            elif re.match(r'^\s*\);?\s*$', line):
                line = re.sub(r'^(\s*)\);?\s*$', r'\1// Fixed: removed orphaned );', line)
                fixes_count += 1
                print(f"Fixed line {i}: Orphaned );")

            # Pattern 4: Lines ending with template literal fragments
            elif re.search(r'[^/]\s*`\);?\s*$', line) and not re.search(r'[\'"][^\'"`]*`\);?\s*$', line):
                line = re.sub(r'`\);?\s*$', '"; // Fixed: template literal', line)
                fixes_count += 1
                print(f"Fixed line {i}: Template literal fragment")

            # Pattern 5: Lines with orphaned template expressions ${...}`)
            elif re.search(r'\$\{[^}]+\}`\);?\s*$', line):
                line = re.sub(r'(\$\{[^}]+\})`\);?\s*$', r'\1"; // Fixed', line)
                fixes_count += 1
                print(f"Fixed line {i}: Template expression fragment")

            # Pattern 6: Line with }ms without proper context
            elif re.match(r'^\s*\}ms\s*$', line):
                line = re.sub(r'^(\s*)\}ms\s*$', r'\1// Fixed: removed }ms', line)
                fixes_count += 1
                print(f"Fixed line {i}: Orphaned }}ms")

            # Pattern 7: Lines that are just punctuation marks
            elif re.match(r'^\s*[,:;`]+\s*$', line):
                line = re.sub(r'^(\s*)[,:;`]+\s*$', r'\1// Fixed: removed orphaned punctuation', line)
                fixes_count += 1
                print(f"Fixed line {i}: Orphaned punctuation")

            fixed_lines.append(line)

    # Write the fixed content
    if fixes_count > 0:
        # Create backup
        with open(file_path + '.full_backup', 'w', encoding='utf-8') as f:
            f.writelines(lines)

        # Write fixed content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(fixed_lines)

        print(f"\nTotal fixes applied: {fixes_count}")
        print(f"Backup saved as: {file_path}.full_backup")
        print("File successfully fixed!")
    else:
        print("No syntax errors found to fix.")

    return fixes_count

if __name__ == "__main__":
    file_path = "C:\\claude\\virtual_table_db_claude\\index.html"
    fixes = fix_all_syntax_errors(file_path)
    print(f"\n✅ Fixed {fixes} syntax errors")