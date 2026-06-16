# BigQuery Release Notes Tracker

A Python Flask web application that parses the official Google Cloud BigQuery Atom feed into granular, searchable, and tweetable updates.

## 🛠️ Features

- **Granular Updates**: Automatically parses feed entries by headers (`Feature`, `Issue`, `Changed`, etc.) so each update is listed as its own card.
- **Modern UI**: Tailored dark-mode slate theme with glassmorphism modals, statistics counters, keyword searches, category filters, and sorting.
- **Refresh & Cache**: Instant page load using local cache with the ability to trigger a live pull using the animated refresh button.
- **Smart Twitter/X Posting**: Formats updates into an elegant tweet draft, automatically truncating the text to fit the 280-character limit (accounting for URL wrapping) without cutting off words. Displays real-time validation and copies to clipboard or redirects to Twitter Web Intent.

## 🚀 Getting Started

1. **Activate the Virtual Environment**:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

2. **Run the Application**:
   ```bash
   python app.py
   ```

3. **Open in Browser**:
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

## 📂 Project Structure

- `app.py`: Flask backend, RSS feed XML parser, caching.
- `templates/index.html`: Web layout, stats trackers, search bars, modal placeholders.
- `static/css/style.css`: Design styling, theme variables, grids, gradients, transitions.
- `static/js/app.js`: API fetching, client-side searching, sorting, and Twitter composers.
