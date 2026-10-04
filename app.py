
from flask import Flask, render_template, request, jsonify
import urllib.request
import json

import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session, redirect, url_for, flash


app = Flask(__name__)


JAMENDO_CLIENT_ID = "709fa152"

@app.route("/api/jamendo/tracks")
def jamendo_tracks():
    url = (
        "https://api.jamendo.com/v3.0/tracks/"
        f"?client_id={JAMENDO_CLIENT_ID}"
        "&format=json"
        "&limit=20"
        "&audioformat=mp32"
        "&imagesize=300"
    )

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "BEATNOVA/1.0"}
    )

    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode("utf-8"))

    return jsonify(data)

app.secret_key = "beatnova-secret-key-change-this-later"
def init_db():
    conn = sqlite3.connect("beatnova.db")

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


init_db()



# Welcome Page
@app.route("/")
def home():
    return render_template("index.html")


# Music Player
@app.route("/player")
def player():
    return render_template("index.html")

# Login Page
@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not email or not password:
            flash("Please enter email and password.", "error")
            return redirect(url_for("login"))

        conn = sqlite3.connect("beatnova.db")
        conn.row_factory = sqlite3.Row

        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        conn.close()

        if user and check_password_hash(user["password"], password):

            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            session["user_email"] = user["email"]

            return redirect(url_for("player"))

        flash("Invalid email or password.", "error")
        return redirect(url_for("login"))

    return render_template("login.html")
# Signup Page
@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not name or not email or not password or not confirm_password:
            flash("Please fill all fields.", "error")
            return redirect(url_for("signup"))

        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return redirect(url_for("signup"))

        if len(password) < 6:
            flash("Password must be at least 6 characters.", "error")
            return redirect(url_for("signup"))

        conn = sqlite3.connect("beatnova.db")
        cursor = conn.cursor()

        existing_user = cursor.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        if existing_user:
            conn.close()
            flash("An account with this email already exists.", "error")
            return redirect(url_for("signup"))

        hashed_password = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
            """,
            (name, email, hashed_password)
        )

        conn.commit()
        conn.close()

        flash("Account created successfully! Please login.", "success")
        return redirect(url_for("login"))

    return render_template("signup.html")

# Forgot Password Page
@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():

    if request.method == "POST":

        email = request.form.get("email", "").strip().lower()
        new_password = request.form.get("new_password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not email or not new_password or not confirm_password:
            flash("Please fill all fields.", "error")
            return redirect(url_for("forgot_password"))

        if new_password != confirm_password:
            flash("Passwords do not match.", "error")
            return redirect(url_for("forgot_password"))

        if len(new_password) < 6:
            flash("Password must be at least 6 characters.", "error")
            return redirect(url_for("forgot_password"))

        conn = sqlite3.connect("beatnova.db")
        cursor = conn.cursor()

        user = cursor.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        if not user:
            conn.close()
            flash("No account found with this email.", "error")
            return redirect(url_for("forgot_password"))

        hashed_password = generate_password_hash(new_password)

        cursor.execute(
            "UPDATE users SET password = ? WHERE email = ?",
            (hashed_password, email)
        )

        conn.commit()
        conn.close()

        flash("Password reset successfully! Please login.", "success")
        return redirect(url_for("login"))

    return render_template("forgot_password.html")

# Songs API

@app.route("/api/trending")
def get_trending():
    url = "https://www.jiosaavn.com/api.php?__call=webapi.get&token=BECHl0fsh08_&type=playlist&p=1&n=20&includeMetaTags=0&ctx=web6dot0&api_version=4&_format=json&_marker=0"
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
    return jsonify({"results": data.get("list", [])})

@app.route("/api/songs")
def get_songs():
    query = request.args.get("q", "bollywood")
    query = urllib.parse.quote(query)

    url = f"https://www.jiosaavn.com/api.php?__call=search.getResults&q={query}&p=1&n=50&_format=json&_marker=0&api_version=4&ctx=web6dot0"

    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0'}
    )

    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))

    return jsonify(data)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))



from flask import send_from_directory
import os



if __name__ == "__main__":
    app.run(debug=True)

