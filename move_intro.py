import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Extract intro HTML
intro_match = re.search(r'(<!-- CINEMATIC WELCOME OVERLAY \(KGF STYLE\) -->.*?</div>\s*</div>)', index_html, re.DOTALL)
if intro_match:
    intro_html = intro_match.group(1)
    # Remove from index.html
    index_html = index_html.replace(intro_html, '')
else:
    print("Intro HTML not found in index.html")
    intro_html = ""

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)


with open('static/js/script.js', 'r', encoding='utf-8') as f:
    script_js = f.read()

# Extract intro JS
intro_js_match = re.search(r'(document\.addEventListener\(''DOMContentLoaded'', \(\) => \{\s*const overlay = document\.getElementById\(''welcomeOverlay''\);.*\}\);\s*\n?)', script_js, re.DOTALL)
if intro_js_match:
    intro_js = intro_js_match.group(1)
    # Remove from script.js
    script_js = script_js.replace(intro_js, '')
else:
    print("Intro JS not found in script.js")
    intro_js = ""

with open('static/js/script.js', 'w', encoding='utf-8') as f:
    f.write(script_js)

with open('templates/welcome.html', 'r', encoding='utf-8') as f:
    welcome_html = f.read()

# Insert into welcome.html
if intro_html and intro_js:
    injection = f"\n{intro_html}\n<script>\n{intro_js}\n</script>\n"
    welcome_html = welcome_html.replace('</body>', f'{injection}</body>')
    with open('templates/welcome.html', 'w', encoding='utf-8') as f:
        f.write(welcome_html)
    print("Successfully moved intro to welcome.html")
