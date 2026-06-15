import re, os
data = open('v0_code.md', encoding='utf-8').read()
os.makedirs('src/components/mobile', exist_ok=True)
matches = re.finditer(r'## `([^`]+)`\n+```(?:tsx|css|typescriptreact)?\n(.*?)\n```', data, re.DOTALL)
count = 0
for m in matches:
    name = os.path.basename(m.group(1))
    content = m.group(2)
    with open(os.path.join('src/components/mobile', name), 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Extracted {name}')
    count += 1
print(f'Total {count} files')
