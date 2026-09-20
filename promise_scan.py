import os
import re

def find_unhandled_promises():
    issues = []
    
    for root, dirs, files in os.walk('app'):
        for file in files:
            if not file.endswith(('.tsx', '.jsx')):
                continue
                
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find onClick or onSubmit with async
            matches = re.finditer(r'(onClick|onSubmit)\s*=\s*{\s*async\s*\(.*?\)\s*=>\s*{', content)
            for match in matches:
                start_idx = match.end()
                # Simple check: does the block have a 'try {' within a reasonable distance?
                # A robust parser would match brackets, but a regex heuristic is ok here
                block_snippet = content[start_idx:start_idx+300]
                if 'try {' not in block_snippet and 'try{' not in block_snippet:
                    line_no = content.count('\n', 0, start_idx) + 1
                    issues.append(f"{path}:{line_no} - Potential unhandled async rejection in {match.group(1)}")
                    
    return issues

print("\n".join(find_unhandled_promises()))
