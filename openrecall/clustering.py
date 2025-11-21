import time
import uuid
import numpy as np
from typing import List, Dict, Tuple
from collections import Counter

from openrecall.database import Entry, Event, insert_event, get_all_entries
from openrecall.nlp import cosine_similarity

def extract_features(entries: List[Entry]) -> List[Dict]:
    features_list = []
    for i, entry in enumerate(entries):
        prev_entry = entries[i-1] if i > 0 else None
        
        # Time delta
        time_delta = entry.timestamp - prev_entry.timestamp if prev_entry else 0
        
        # Normalize time delta (0-1 scale, assuming max gap of 1 hour)
        # Hard split for gaps larger than 2 hours (7200s)
        if time_delta > 7200:
            normalized_time_delta = 10.0 # Force split
        else:
            normalized_time_delta = min(time_delta / 3600.0, 1.0)
            
        # App change
        app_changed = 1.0 if prev_entry and entry.app != prev_entry.app else 0.0
        
        # Title similarity (simple string check for now)
        title_sim = 1.0
        if prev_entry:
            title_sim = 1.0 if entry.title == prev_entry.title else 0.5
            
        # Embedding distance
        embed_dist = 0.5
        if prev_entry and entry.embedding is not None and prev_entry.embedding is not None:
            # cosine_similarity returns 1 for similar, 0 for dissimilar
            # we want distance: 0 for similar, 1 for dissimilar
            sim = cosine_similarity(entry.embedding, prev_entry.embedding)
            embed_dist = 1.0 - sim
            
        features = np.array([
            normalized_time_delta,
            app_changed,
            title_sim,
            embed_dist
        ], dtype=np.float32)
        
        features_list.append({
            "entry": entry,
            "features": features
        })
    return features_list

def distance(a: np.ndarray, b: np.ndarray) -> float:
    # Weighted distance: time(0.4) + app(0.3) + title(0.2) + embed(0.1)
    weights = np.array([0.4, 0.3, 0.2, 0.1], dtype=np.float32)
    diff = a - b
    return np.sqrt(np.sum(weights * (diff ** 2)))

def cluster_entries(entries: List[Entry], eps: float = 0.3, min_samples: int = 2) -> List[Tuple[Dict, List[Entry]]]:
    if not entries:
        return []
        
    # Sort by timestamp just in case
    entries = sorted(entries, key=lambda x: x.timestamp)
    
    feature_data = extract_features(entries)
    clusters = []
    visited = set()
    noise = set()
    
    n = len(feature_data)
    
    def region_query(index):
        neighbors = []
        for i in range(n):
            if distance(feature_data[index]["features"], feature_data[i]["features"]) <= eps:
                neighbors.append(i)
        return neighbors

    def expand_cluster(index, neighbors, cluster):
        cluster.append(feature_data[index]["entry"])
        
        i = 0
        while i < len(neighbors):
            neighbor_index = neighbors[i]
            
            if neighbor_index not in visited:
                visited.add(neighbor_index)
                neighbor_neighbors = region_query(neighbor_index)
                
                if len(neighbor_neighbors) >= min_samples:
                    # Add new neighbors to the list we are iterating
                    for nn in neighbor_neighbors:
                        if nn not in neighbors:
                            neighbors.append(nn)
            
            # Check if neighbor is already in any cluster
            in_any_cluster = False
            for c in clusters:
                if feature_data[neighbor_index]["entry"] in c:
                    in_any_cluster = True
                    break
            
            # Also check current cluster (though we just started it)
            if feature_data[neighbor_index]["entry"] in cluster:
                in_any_cluster = True

            if not in_any_cluster:
                cluster.append(feature_data[neighbor_index]["entry"])
                
            i += 1
            
    for i in range(n):
        if i in visited:
            continue
            
        visited.add(i)
        neighbors = region_query(i)
        
        if len(neighbors) < min_samples:
            noise.add(i)
        else:
            cluster = []
            expand_cluster(i, neighbors, cluster)
            clusters.append(cluster)
            
    # Convert clusters to Events
    events = []
    for cluster in clusters:
        event = create_event_from_cluster(cluster)
        events.append(event)
        
    return events

def classify_event_type(entries: List[Entry]) -> str:
    apps = [e.app.lower() for e in entries]
    titles = [e.title.lower() for e in entries]
    
    # Coding
    if any(x in app for app in apps for x in ['code', 'vscode', 'cursor', 'pycharm', 'intellij', 'vim', 'terminal']):
        return 'coding'
        
    # Gaming
    if any(x in app for app in apps for x in ['game', 'steam', 'epic']) or \
       any(x in title for title in titles for x in ['game']):
        return 'gaming'
        
    # Video
    if any(x in app for app in apps for x in ['youtube', 'netflix', 'vlc', 'mpv']):
        return 'video'
        
    # Meeting
    if any(x in title for title in titles for x in ['meeting', 'zoom', 'teams', 'meet']):
        return 'meeting'
        
    return 'browsing'

def create_event_from_cluster(entries: List[Entry]) -> Tuple[Dict, List[Entry]]:
    entries.sort(key=lambda x: x.timestamp)
    start_time = entries[0].timestamp
    end_time = entries[-1].timestamp
    
    event_type = classify_event_type(entries)
    
    # Hero image: middle
    hero_idx = len(entries) // 2
    hero_image = f"{entries[hero_idx].timestamp}.webp"
    
    thumbnails = []
    thumbnails.append(f"{entries[0].timestamp}.webp")
    if len(entries) > 1:
        thumbnails.append(f"{entries[-1].timestamp}.webp")
    if len(entries) > 2:
        thumbnails.append(hero_image)
    thumbnails = list(set(thumbnails)) # Dedupe
    
    # Stats
    app_counts = Counter([e.app for e in entries])
    top_apps = app_counts.most_common(5)
    
    # Simple word count
    word_count = sum(len(e.text.split()) for e in entries)
    
    # Tags
    tags = set()
    for e in entries:
        tags.add(e.app)
        if e.language and e.language != 'unknown':
            tags.add(e.language)
    
    stats = {
        "screenshotCount": len(entries),
        "topApps": top_apps,
        "wordCount": word_count
    }
    
    # ID
    event_id = str(uuid.uuid4())
    
    # Title/Desc (Placeholder, will be filled by AI job)
    title = f"{event_type.capitalize()} Session"
    description = "Processing..."
    
    return {
        "id": event_id,
        "start_time": start_time,
        "end_time": end_time,
        "title": title,
        "description": description,
        "type": event_type,
        "stats": stats,
        "hero_image": hero_image,
        "thumbnails": thumbnails,
        "tags": list(tags)
    }, entries

def run_clustering():
    """
    Main entry point to cluster all unclustered entries.
    Strategy:
    1. Get all entries that don't have an event_id.
    2. Cluster them.
    3. Save events.
    4. Update entries with event_id.
    5. Create jobs for AI summary/title.
    """
    try:
        # 1. Get unclustered entries
        # We need a function for this. Let's add it to database.py or just query here.
        # For simplicity, let's query directly or use get_all_entries and filter.
        # Since we wiped DB, get_all_entries is fine for now, but inefficient later.
        # Let's add get_unclustered_entries to database.py later.
        # For now, we'll iterate all entries and filter.
        all_entries = get_all_entries()
        unclustered = [e for e in all_entries if not e.event_id]
        
        if not unclustered:
            return
            
        # 2. Cluster them
        events_data = cluster_entries(unclustered)
        
        # 3. Save events and update entries
        from openrecall.database import insert_job
        from openrecall.config import db_path
        import sqlite3
        
        for event_dict, entries in events_data:
            # Save event
            insert_event(event_dict)
            
            # Update entries
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                for entry in entries:
                    cursor.execute(
                        "UPDATE entries SET event_id = ? WHERE id = ?",
                        (event_dict["id"], entry.id)
                    )
                conn.commit()
                
            # 4. Create jobs for AI summary/title
            # Combine text for context
            combined_text = "\n".join([f"{e.app}: {e.title} - {e.text}" for e in entries])
            
            insert_job("generate_summary", {
                "event_id": event_dict["id"],
                "text": combined_text
            })
            
            insert_job("generate_title", {
                "event_id": event_dict["id"],
                "text": combined_text,
                "event_type": event_dict["type"]
            })

    except Exception as e:
        print(f"Clustering error: {e}")
