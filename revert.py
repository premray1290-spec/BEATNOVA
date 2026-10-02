import re

# Revert app.py
app_py = '''from flask import Flask, render_template, request, jsonify
import urllib.request
import json

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/songs")
def get_songs():
    query = request.args.get("q", "bollywood")
    url = f"https://www.jiosaavn.com/api.php?__call=search.getResults&q={query}&p=1&n=50&_format=json&_marker=0&api_version=4&ctx=web6dot0"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)'''

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(app_py)

# Revert script.js (Remove AUTH UI LOGIC completely)
with open('static/js/script.js', 'r', encoding='utf-8') as f:
    script_js = f.read()
script_js = re.sub(r'// AUTH UI LOGIC.*', '', script_js, flags=re.DOTALL)
with open('static/js/script.js', 'w', encoding='utf-8') as f:
    f.write(script_js)

# Revert index.html buttons
with open('templates/index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

index_html = re.sub(r'<a href="/login" class="login-button".*?</a>', '<button class="login-button">Log in</button>', index_html)
index_html = re.sub(r'<a href="/signup" class="signup-button".*?</a>', '<button class="signup-button">Get Started <span>&rarr;</span></button>', index_html)
index_html = re.sub(r'<a href="#premium" class="primary-button" id="premiumBtn">.*?</a>', '<a href="#premium" class="primary-button">\n                Explore Premium <span>&rarr;</span>\n            </a>', index_html)

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

