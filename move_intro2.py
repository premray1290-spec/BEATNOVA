import re

with open('static/js/script.js', 'r', encoding='utf-8') as f:
    script_js = f.read()

# Extract intro JS using flexible regex
intro_js_match = re.search(r'(document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{\s*const\s*overlay\s*=\s*document\.getElementById\("welcomeOverlay"\);.*\}\);)', script_js, re.DOTALL)
if intro_js_match:
    intro_js = intro_js_match.group(1)
    script_js = script_js.replace(intro_js, '')
    with open('static/js/script.js', 'w', encoding='utf-8') as f:
        f.write(script_js)
    
    with open('templates/welcome.html', 'r', encoding='utf-8') as f:
        welcome_html = f.read()
        
    with open('templates/index.html', 'r', encoding='utf-8') as f:
        index_html = f.read()

    # In case HTML didn't insert (since JS failed)
    intro_html_match = re.search(r'(<!-- CINEMATIC WELCOME OVERLAY \(KGF STYLE\) -->.*?</div>\s*</div>)', index_html, re.DOTALL)
    
    if intro_html_match:
        intro_html = intro_html_match.group(1)
        index_html = index_html.replace(intro_html, '')
        with open('templates/index.html', 'w', encoding='utf-8') as f:
            f.write(index_html)
    else:
        # It might be in welcome.html already from first pass, but JS isn't
        intro_html = ""
    
    if "const overlay = document.getElementById" not in welcome_html:
        injection = f"\n<script>\n{intro_js}\n</script>\n"
        if intro_html:
             injection = f"\n{intro_html}\n{injection}"
             
        welcome_html = welcome_html.replace('</body>', f'{injection}</body>')
        with open('templates/welcome.html', 'w', encoding='utf-8') as f:
            f.write(welcome_html)
        print("Successfully moved JS and HTML to welcome.html")
    else:
        print("Already in welcome.html")
else:
    print("JS not found")
