from threading import Thread
from datetime import datetime
from pathlib import Path

import numpy as np
from flask import Flask, jsonify, render_template_string, request, send_from_directory
from jinja2 import BaseLoader

from openrecall.config import appdata_folder, screenshots_path
from openrecall.database import (
    create_db,
    get_all_entries,
    get_timestamps,
    get_entries_by_time_range,
    get_unique_apps,
    get_unique_languages,
    get_activity_digest,
)
from openrecall.nlp import cosine_similarity, get_embedding
from openrecall.screenshot import record_screenshots_thread, recording_paused
from openrecall.utils import human_readable_time, timestamp_to_human_readable

app = Flask(__name__)

app.jinja_env.filters["human_readable_time"] = human_readable_time
app.jinja_env.filters["timestamp_to_human_readable"] = timestamp_to_human_readable

# Frontend directory for serving built React app
FRONTEND_DIR = Path(__file__).parent.parent / 'frontend'

base_template = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenRecall</title>
  <!-- Bootstrap CSS -->
  <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    body {
      display: flex;
      height: 100vh;
      overflow: hidden;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .sidebar {
      width: 250px;
      background: #f8f9fa;
      padding: 20px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #dee2e6;
    }
    .sidebar h1 {
      font-size: 1.5rem;
      margin-bottom: 20px;
    }
    .sidebar .nav-link {
      color: #333;
      padding: 10px;
      border-radius: 5px;
    }
    .sidebar .nav-link.active {
      background-color: #007bff;
      color: white;
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
      background: #fff;
    }
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    .dark-mode {
      background-color: #121212;
      color: #e0e0e0;
    }
    .dark-mode .sidebar {
      background: #1e1e1e;
      border-right: 1px solid #333;
    }
    .dark-mode .sidebar h1, .dark-mode .sidebar .nav-link {
      color: #e0e0e0;
    }
    .dark-mode .sidebar .nav-link.active {
      background-color: #007bff;
    }
    .dark-mode .top-bar {
      background: #1e1e1e;
      border-bottom: 1px solid #333;
    }
    .dark-mode .card {
      background-color: #2c2c2c;
      border: 1px solid #444;
    }
    .slider-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .slider {
      width: 80%;
    }
    .slider-value {
      margin-top: 10px;
      font-size: 1.2em;
    }
    .image-container {
      margin-top: 20px;
      text-align: center;
    }
    .image-container img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="sidebar">
    <h1>OpenRecall</h1>
    <ul class="nav flex-column">
      <li class="nav-item">
        <a class="nav-link active" href="/"><i class="fas fa-home"></i> Timeline</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/search"><i class="fas fa-search"></i> Search</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/digest"><i class="fas fa-chart-line"></i> Activity Digest</a>
      </li>
    </ul>
    <div class="mt-auto">
      <button id="pauseBtn" class="btn btn-secondary btn-block mb-2">Pause Recording</button>
      <div class="custom-control custom-switch">
        <input type="checkbox" class="custom-control-input" id="darkSwitch">
        <label class="custom-control-label" for="darkSwitch">Dark Mode</label>
      </div>
    </div>
  </div>

  <div class="main-content">
    <div class="top-bar">
      <form class="form-inline my-2 my-lg-0 w-100 d-flex" action="/search" method="get">
        <input type="text" class="form-control flex-grow-1" name="q" placeholder="Search..." value="{{ request.args.get('q', '') }}">
        <select class="form-control mx-2" name="app">
          <option value="">All Apps</option>
          {% for app in apps %}
            <option value="{{ app }}" {% if request.args.get('app') == app %}selected{% endif %}>{{ app }}</option>
          {% endfor %}
        </select>
        <select class="form-control mx-2" name="language">
          <option value="">All Languages</option>
          {% for lang in languages %}
            <option value="{{ lang }}" {% if request.args.get('language') == lang %}selected{% endif %}>{{ lang }}</option>
          {% endfor %}
        </select>
        <input type="datetime-local" class="form-control mx-2" name="start_time" value="{{ request.args.get('start_time', '') }}">
        <input type="datetime-local" class="form-control mx-2" name="end_time" value="{{ request.args.get('end_time', '') }}">
        <button class="btn btn-primary" type="submit"><i class="fas fa-search"></i></button>
      </form>
    </div>
    <div class="content-area">
      {% block content %}{% endblock %}
    </div>
  </div>

  <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.3/dist/umd/popper.min.js"></script>
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
  <script>
    const darkSwitch = document.getElementById('darkSwitch');
    const body = document.body;

    // Apply the cached theme on load
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
      body.classList.add('dark-mode');
      darkSwitch.checked = true;
    }

    darkSwitch.addEventListener('change', () => {
      body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', darkSwitch.checked);
    });

    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.addEventListener('click', () => {
      fetch('/pause', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
          pauseBtn.textContent = data.paused ? 'Resume Recording' : 'Pause Recording';
        });
    });
  </script>
</body>
</html>
"""

class StringLoader(BaseLoader):
    def get_source(self, environment, template):
        if template == "base_template":
            return base_template, None, lambda: True
        return None, None, None

app.jinja_env.loader = StringLoader()

# Serve built assets (JS/CSS) directly
@app.route("/assets/<path:path>")
def serve_assets(path):
    return send_from_directory(str(FRONTEND_DIR / 'assets'), path)

@app.route("/")
def serve_react_app():
    return send_from_directory(str(FRONTEND_DIR), 'index.html')

@app.route("/<path:path>")
def serve_react_static(path):
    # Try to serve from frontend directory first (React app)
    try:
        return send_from_directory(str(FRONTEND_DIR), path)
    except:
        # Fallback to old routes for backward compatibility
        if path == "search":
            return search()
        elif path == "digest":
            return digest()
        else:
            return send_from_directory(str(FRONTEND_DIR), 'index.html')

# Legacy routes for backward compatibility (only if frontend doesn't exist)
@app.route("/search")
def search():
    # Only serve legacy if frontend doesn't exist
    if not FRONTEND_DIR.exists():
        return _legacy_search()
    return send_from_directory(str(FRONTEND_DIR), "index.html")

def _legacy_search():
    q = request.args.get("q")
    app_filter = request.args.get("app")
    language_filter = request.args.get("language")
    start_time_str = request.args.get("start_time")
    end_time_str = request.args.get("end_time")
    apps = get_unique_apps()
    languages = get_unique_languages()

    if start_time_str and end_time_str:
        start_time = int(
            datetime.strptime(start_time_str, "%Y-%m-%dT%H:%M").timestamp()
        )
        end_time = int(datetime.strptime(end_time_str, "%Y-%m-%dT%H:%M").timestamp())
        entries = get_entries_by_time_range(start_time, end_time)
    else:
        entries = get_all_entries()

    if app_filter:
        entries = [entry for entry in entries if entry.app == app_filter]

    if language_filter:
        entries = [entry for entry in entries if entry.language == language_filter]

    if q:
        embeddings = [np.frombuffer(entry.embedding, dtype=np.float32) for entry in entries]
        query_embedding = get_embedding(q)
        similarities = [cosine_similarity(query_embedding, emb) for emb in embeddings]
        indices = np.argsort(similarities)[::-1]
        sorted_entries = [entries[i] for i in indices]
    else:
        sorted_entries = entries

    return render_template_string(
        """
{% extends "base_template" %}
{% block content %}
    <div class="container-fluid">
        <div class="row">
            {% for entry in entries %}
                <div class="col-md-3 mb-4">
                    <div class="card">
                        <a href="#" data-toggle="modal" data-target="#modal-{{ loop.index0 }}">
                            <img src="/static/{{ entry['timestamp'] }}.webp" alt="Image" class="card-img-top">
                        </a>
                    </div>
                </div>
                <div class="modal fade" id="modal-{{ loop.index0 }}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl" role="document" style="max-width: none; width: 100vw; height: 100vh; padding: 20px;">
                        <div class="modal-content" style="height: calc(100vh - 40px); width: calc(100vw - 40px); padding: 0;">
                            <div class="modal-body" style="padding: 0;">
                                <img src="/static/{{ entry['timestamp'] }}.webp" alt="Image" style="width: 100%; height: 100%; object-fit: contain; margin: 0 auto;">
                            </div>
                        </div>
                    </div>
                </div>
            {% endfor %}
        </div>
    </div>
{% endblock %}
""",
        entries=sorted_entries,
        apps=apps,
        languages=languages,
    )

@app.route("/static/<filename>")
def serve_image(filename):
    return send_from_directory(screenshots_path, filename)

@app.route("/pause", methods=["POST"])
def pause_recording():
    if recording_paused.is_set():
        recording_paused.clear()
        return {"paused": False}
    else:
        recording_paused.set()
        return {"paused": True}

@app.route("/digest")
def digest():
    daily_digest = get_activity_digest("day")
    weekly_digest = get_activity_digest("week")
    return render_template_string(
        """
{% extends "base_template" %}
{% block content %}
    <div class="container-fluid">
        <h1>Activity Digest</h1>
        <div class="row">
            <div class="col-md-6">
                <h2>Last 24 Hours</h2>
                <div class="card">
                    <div class="card-header">Most Used Apps</div>
                    <ul class="list-group list-group-flush">
                        {% for app, count in daily_digest['apps'] %}
                            <li class="list-group-item">{{ app }} ({{ count }})</li>
                        {% endfor %}
                    </ul>
                </div>
                <div class="card mt-4">
                    <div class="card-header">Most Common Words</div>
                    <ul class="list-group list-group-flush">
                        {% for word, count in daily_digest['words'] %}
                            <li class="list-group-item">{{ word }} ({{ count }})</li>
                        {% endfor %}
                    </ul>
                </div>
            </div>
            <div class="col-md-6">
                <h2>Last 7 Days</h2>
                <div class="card">
                    <div class="card-header">Most Used Apps</div>
                    <ul class="list-group list-group-flush">
                        {% for app, count in weekly_digest['apps'] %}
                            <li class="list-group-item">{{ app }} ({{ count }})</li>
                        {% endfor %}
                    </ul>
                </div>
                <div class="card mt-4">
                    <div class="card-header">Most Common Words</div>
                    <ul class="list-group list-group-flush">
                        {% for word, count in weekly_digest['words'] %}
                            <li class="list-group-item">{{ word }} ({{ count }})</li>
                        {% endfor %}
                    </ul>
                </div>
            </div>
        </div>
    </div>
{% endblock %}
""",
        daily_digest=daily_digest,
        weekly_digest=weekly_digest,
    )

@app.route("/api/entries")
def api_entries():
    entries = get_all_entries()
    # Convert entries to dict and make embedding JSON serializable
    entries_dict = []
    for entry in entries:
        entry_dict = entry._asdict()
        entry_dict['embedding'] = entry.embedding.tolist() if hasattr(entry.embedding, 'tolist') else entry.embedding
        entries_dict.append(entry_dict)
    return jsonify(entries_dict)

if __name__ == "__main__":
    create_db()

    print(f"Appdata folder: {appdata_folder}")

    # Start the thread to record screenshots
    t = Thread(target=record_screenshots_thread)
    t.start()

    app.run(port=8082)
