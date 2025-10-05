#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Fix JavaScript syntax errors in index.html
"""

import re

def fix_syntax_errors(file_path):
    """Fix all JavaScript syntax errors in the file"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    fixes_count = 0

    # Pattern 1: Fix incomplete console.log remnants like }"`);
    pattern1 = r'\}\s*"\s*`\s*\)\s*;'
    matches1 = re.findall(pattern1, content)
    if matches1:
        content = re.sub(pattern1, '// Fixed syntax error', content)
        fixes_count += len(matches1)
        print(f"Fixed {len(matches1)} instances of }}`); pattern")

    # Pattern 2: Fix standalone `); at end of lines
    pattern2 = r'^(\s*)`\);?\s*$'
    matches2 = re.findall(pattern2, content, re.MULTILINE)
    if matches2:
        content = re.sub(pattern2, r'\1// Fixed syntax error', content, flags=re.MULTILINE)
        fixes_count += len(matches2)
        print(f"Fixed {len(matches2)} instances of standalone `); pattern")

    # Pattern 3: Fix lines starting with : and ending with `);
    pattern3 = r'^(\s*):([^`]*)`\);?\s*$'
    matches3 = re.findall(pattern3, content, re.MULTILINE)
    if matches3:
        content = re.sub(pattern3, r'\1//\2', content, flags=re.MULTILINE)
        fixes_count += len(matches3)
        print(f"Fixed {len(matches3)} instances of : ... `); pattern")

    # Pattern 4: Fix lines with incomplete template literals ending with "`);
    pattern4 = r'([^/])\s*"\s*`\s*\)\s*;'
    matches4 = re.findall(pattern4, content)
    if matches4:
        content = re.sub(pattern4, r'\1"; // Fixed syntax', content)
        fixes_count += len(matches4)
        print(f"Fixed {len(matches4)} instances of \"`); pattern")

    # Pattern 5: Fix lines with , at the beginning followed by template literal
    pattern5 = r'^(\s*),\s*([^=]+)=\s*"([^"]*)".*`\);?\s*$'
    matches5 = re.findall(pattern5, content, re.MULTILINE)
    if matches5:
        content = re.sub(pattern5, r'\1// \2= "\3"', content, flags=re.MULTILINE)
        fixes_count += len(matches5)
        print(f"Fixed {len(matches5)} instances of comma-starting lines")

    # Pattern 6: Fix || '...'}`); pattern
    pattern6 = r'\|\|\s*\'([^\']*)\'\s*\}\s*"\s*`\s*\)\s*;'
    matches6 = re.findall(pattern6, content)
    if matches6:
        content = re.sub(pattern6, r"|| '\1'; // Fixed syntax", content)
        fixes_count += len(matches6)
        print(f"Fixed {len(matches6)} instances of || '...'}}`); pattern")

    # Save the fixed content
    if fixes_count > 0:
        # Create backup
        with open(file_path + '.syntax_backup', 'w', encoding='utf-8') as f:
            f.write(original_content)

        # Write fixed content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"\nTotal fixes applied: {fixes_count}")
        print(f"Backup saved as: {file_path}.syntax_backup")
        print("File successfully fixed!")
    else:
        print("No syntax errors found to fix.")

    return fixes_count

if __name__ == "__main__":
    import sys

    file_path = "C:\\claude\\virtual_table_db_claude\\index.html"
    if len(sys.argv) > 1:
        file_path = sys.argv[1]

    fixes = fix_syntax_errors(file_path)
    sys.exit(0 if fixes >= 0 else 1)