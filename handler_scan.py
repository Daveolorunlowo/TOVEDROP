import os
import re

def find_unhandled_handlers():
    issues = []
    
    for root, dirs, files in os.walk('app'):
        for file in files:
            if not file.endswith(('.tsx', '.jsx')):
                continue
                
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Look for typical handler names
            matches = re.finditer(r'(const|function)\s+(handle[A-Z]\w*)\s*=?\s*async', content)
            for match in matches:
                name = match.group(2)
                start_idx = match.end()
                block_snippet = content[start_idx:start_idx+1000]
                if 'try {' not in block_snippet and 'try{' not in block_snippet and '.catch(' not in block_snippet:
                    line_no = content.count('\n', 0, start_idx) + 1
                    issues.append(f"{path}:{line_no} - Handler {name} might be missing try/catch")
                    
    return issues

print("\n".join(find_unhandled_handlers()))
