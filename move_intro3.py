with open('static/js/script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "document.addEventListener('DOMContentLoaded', () => {" in line and "welcomeOverlay" in lines[i+1]:
        start_idx = i
        break

if start_idx != -1:
    intro_js = "".join(lines[start_idx:])
    
    # Remove from script.js
    new_script = "".join(lines[:start_idx])
    with open('static/js/script.js', 'w', encoding='utf-8') as f:
        f.write(new_script)
        
    # Add to welcome.html
    with open('templates/welcome.html', 'r', encoding='utf-8') as f:
        welcome_html = f.read()
        
    if "const overlay = document.getElementById('welcomeOverlay');" not in welcome_html:
        injection = f"\n<script>\n{intro_js}\n</script>\n"
        welcome_html = welcome_html.replace('</body>', f'{injection}</body>')
        with open('templates/welcome.html', 'w', encoding='utf-8') as f:
            f.write(welcome_html)
        print("Moved JS successfully")
else:
    print("Not found")
