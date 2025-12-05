import os

file_path = r'c:\bio\bio-miner-ai\frontend\src\App.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

grid_css = """
.landing-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 0;
  pointer-events: none;
  mask-image: linear-gradient(to right, black 30%, transparent 80%);
  -webkit-mask-image: linear-gradient(to right, black 30%, transparent 80%);
}
"""

# Find the end of .landing-hero block
search_str = ".landing-hero {"
start_idx = content.find(search_str)
if start_idx != -1:
    # Find the closing brace for this block
    # Simple counter for braces
    brace_count = 0
    end_idx = -1
    for i in range(start_idx, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i
                break
    
    if end_idx != -1:
        # Insert after the closing brace
        new_content = content[:end_idx+1] + "\n" + grid_css + content[end_idx+1:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully added grid CSS.")
    else:
        print("Could not find closing brace for .landing-hero")
else:
    print("Could not find .landing-hero block")
