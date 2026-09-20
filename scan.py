import os
import re

def find_issues():
    issues = []
    
    for root, dirs, files in os.walk('app'):
        for file in files:
            if not file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                continue
                
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            lines = content.split('\n')
            for i, line in enumerate(lines):
                # 1. Empty/Hash hrefs
                if re.search(r'href=["\']#["\']', line) or re.search(r'href=["\']["\']', line):
                    issues.append(f"{path}:{i+1} - Empty or hash href found: {line.strip()}")
                
                # 2. Map without key (basic regex check, prone to false positives but good for a quick scan)
                if '.map(' in line and 'key=' not in content[max(0, content.find(line)):content.find(line)+200]:
                    issues.append(f"{path}:{i+1} - Potential map without key: {line.strip()}")
                    
                # 3. Form without onSubmit or Button type=submit without form
                
    return issues

print("\n".join(find_issues()))
