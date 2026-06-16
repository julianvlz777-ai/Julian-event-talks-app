import os
import json
import datetime
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = "notes_cache.json"

def parse_feed_to_items():
    """Fetches the Atom feed and parses it into individual release items."""
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        # Parse the raw content
        feed = feedparser.parse(response.content)
    except Exception as e:
        print(f"Error fetching feed: {e}")
        # If fetch fails, try to load from cache
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        raise e

    parsed_items = []
    
    for entry in feed.entries:
        date_str = entry.get("title", "Unknown Date")
        timestamp = entry.get("updated", "")
        entry_link = entry.get("link", "")
        summary_html = entry.get("summary", "")
        
        soup = BeautifulSoup(summary_html, "html.parser")
        
        # In this feed, entries contain multiple headers (h3) followed by paragraph elements.
        # We want to break these down into distinct items.
        current_type = "General"
        current_elements = []
        item_index = 0
        
        for child in soup.contents:
            if child.name == 'h3':
                # Save the accumulated elements of the previous item
                if current_elements:
                    item_data = create_item_dict(
                        date_str, timestamp, entry_link, current_type, current_elements, entry.get("id", ""), item_index
                    )
                    parsed_items.append(item_data)
                    item_index += 1
                current_type = child.get_text().strip()
                current_elements = []
            elif child.name or (isinstance(child, str) and child.strip()):
                current_elements.append(child)
                
        # Add the last item of the entry
        if current_elements:
            item_data = create_item_dict(
                date_str, timestamp, entry_link, current_type, current_elements, entry.get("id", ""), item_index
            )
            parsed_items.append(item_data)
            
    # Cache the parsed results
    cache_data = {
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "items": parsed_items
    }
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)
        
    return cache_data

def create_item_dict(date_str, timestamp, entry_link, item_type, elements, entry_id, item_index):
    """Helper to structure a single release note item."""
    content_html = "".join(str(el) for el in elements).strip()
    
    # Generate clean text for search and tweet composing
    # We clean up some spacing for plain text
    content_soup = BeautifulSoup(content_html, "html.parser")
    content_text = content_soup.get_text(separator=" ").strip()
    # Normalize multiple whitespaces
    content_text = " ".join(content_text.split())
    
    # Generate a unique ID for this specific item
    item_id = f"{entry_id}#{item_index}" if entry_id else f"{date_str.replace(' ', '_')}_{item_index}"
    
    return {
        "id": item_id,
        "date": date_str,
        "timestamp": timestamp,
        "link": entry_link,
        "type": item_type,
        "content_html": content_html,
        "content_text": content_text
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/notes")
def get_notes():
    force_refresh = request.args.get("refresh", "false").lower() == "true"
    
    # Try loading cached data if not forcing refresh
    if not force_refresh and os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache_data = json.load(f)
                return jsonify(cache_data)
        except Exception as e:
            print(f"Error reading cache: {e}")
            
    # Fetch and parse
    try:
        data = parse_feed_to_items()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Failed to load release notes", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
