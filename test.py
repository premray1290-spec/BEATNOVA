import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Match the main tag
main_match = re.search(r'(<main>)(.*?)(</main>)', content, re.DOTALL)
if main_match:
    main_start = main_match.group(1)
    main_inner = main_match.group(2)
    main_end = main_match.group(3)

    # Extract the hero section
    hero_match = re.search(r'(<section class="hero" id="home">.*?</section>\s*<!-- DISCOVER SECTION -->)', main_inner, re.DOTALL)
    
    # Wait, the hero section doesn't end with <!-- DISCOVER SECTION --> in a clean way if I just use regex.
    # Let's extract hero by finding '<section class="hero" id="home">' and the FIRST '</section>' after it.
