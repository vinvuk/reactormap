#!/usr/bin/env python3
"""
Wikipedia Enrichment Script for Nuclear Reactor Data

Fetches Wikipedia URLs for nuclear reactors using the Wikipedia API.
Handles redirects, disambiguation, and validates page existence.
"""

import json
import urllib.request
import urllib.parse
import time
import sys
import re
from pathlib import Path
from typing import Optional, List, Dict

# Wikipedia requires a proper User-Agent header
USER_AGENT = "ReactorMap/1.0 (https://github.com/reactormap; contact@example.com) Python/3"


def search_wikipedia(query: str, limit: int = 3) -> List[Dict]:
    """
    Search Wikipedia for pages matching the query.

    Args:
        query: Search term
        limit: Maximum number of results

    Returns:
        List of search results with title and pageid
    """
    endpoint = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "format": "json",
        "utf8": 1
    }

    url = f"{endpoint}?{urllib.parse.urlencode(params)}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get("query", {}).get("search", [])
    except Exception as e:
        print(f"  Search error: {e}")
        return []


def get_page_info(title: str) -> Optional[Dict]:
    """
    Get page info including the canonical URL.

    Args:
        title: Wikipedia page title

    Returns:
        Page info dict or None if not found
    """
    endpoint = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": title,
        "prop": "info|extracts|pageimages",
        "inprop": "url",
        "exintro": 1,
        "explaintext": 1,
        "exsentences": 2,
        "piprop": "thumbnail",
        "pithumbsize": 300,
        "format": "json",
        "utf8": 1,
        "redirects": 1
    }

    url = f"{endpoint}?{urllib.parse.urlencode(params)}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            pages = data.get("query", {}).get("pages", {})

            for page_id, page in pages.items():
                if page_id != "-1":  # -1 means page not found
                    return {
                        "title": page.get("title"),
                        "url": page.get("fullurl"),
                        "extract": page.get("extract", ""),
                        "thumbnail": page.get("thumbnail", {}).get("source")
                    }
            return None
    except Exception as e:
        print(f"  Page info error: {e}")
        return None


def find_reactor_wikipedia(reactor: Dict) -> Optional[Dict]:
    """
    Find Wikipedia page for a nuclear reactor.

    Tries multiple search strategies:
    1. Exact name + "nuclear power plant"
    2. Exact name + "nuclear reactor"
    3. Just the reactor name
    4. Plant name without unit number

    Args:
        reactor: Reactor data dict

    Returns:
        Wikipedia info dict or None
    """
    name = reactor.get("Name", "")
    country = reactor.get("Country", "")

    # Extract base plant name (remove unit numbers like -1, -2, Unit 1, etc.)
    base_name = re.sub(r'[-\s]*(Unit\s*)?\d+$', '', name, flags=re.IGNORECASE).strip()

    # Search strategies in order of preference
    search_queries = [
        f"{base_name} nuclear power plant",
        f"{base_name} nuclear power station",
        f"{name} reactor",
        f"{base_name} {country} nuclear",
        base_name,
    ]

    for query in search_queries:
        results = search_wikipedia(query, limit=3)

        for result in results:
            title = result.get("title", "").lower()

            # Check if result is likely about our reactor
            base_lower = base_name.lower()
            if base_lower in title or any(word in title for word in base_lower.split()):
                # Verify it's a nuclear-related page
                if any(term in title for term in ["nuclear", "power", "reactor", "station", "plant"]) or base_lower == title:
                    page_info = get_page_info(result["title"])
                    if page_info:
                        return page_info

        time.sleep(0.1)  # Rate limiting

    return None


def enrich_reactors(input_file: str, output_file: str):
    """
    Enrich reactor data with Wikipedia URLs.

    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file
    """
    print(f"Loading reactors from {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        reactors = json.load(f)

    print(f"Found {len(reactors)} reactors")

    # Track unique plants (avoid duplicate lookups for multi-unit plants)
    plant_cache = {}
    enriched_count = 0

    for i, reactor in enumerate(reactors):
        name = reactor.get("Name", "")

        # Extract base plant name for caching
        base_name = re.sub(r'[-\s]*(Unit\s*)?\d+$', '', name, flags=re.IGNORECASE).strip()

        # Check cache first
        if base_name in plant_cache:
            wiki_info = plant_cache[base_name]
            if wiki_info:
                reactor["WikipediaUrl"] = wiki_info["url"]
                reactor["WikipediaTitle"] = wiki_info["title"]
                if wiki_info.get("extract"):
                    reactor["WikipediaExtract"] = wiki_info["extract"]
                if wiki_info.get("thumbnail"):
                    reactor["WikipediaThumbnail"] = wiki_info["thumbnail"]
                enriched_count += 1
            continue

        print(f"[{i+1}/{len(reactors)}] Searching: {name}...", end=" ")

        wiki_info = find_reactor_wikipedia(reactor)
        plant_cache[base_name] = wiki_info

        if wiki_info:
            reactor["WikipediaUrl"] = wiki_info["url"]
            reactor["WikipediaTitle"] = wiki_info["title"]
            if wiki_info.get("extract"):
                reactor["WikipediaExtract"] = wiki_info["extract"]
            if wiki_info.get("thumbnail"):
                reactor["WikipediaThumbnail"] = wiki_info["thumbnail"]
            enriched_count += 1
            print(f"Found: {wiki_info['title']}")
        else:
            print("Not found")

        # Rate limiting
        time.sleep(0.2)

        # Save progress every 50 reactors
        if (i + 1) % 50 == 0:
            print(f"\nSaving progress... ({enriched_count} enriched so far)")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(reactors, f, indent=2, ensure_ascii=False)

    # Final save
    print(f"\nSaving final results to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(reactors, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Enriched {enriched_count}/{len(reactors)} reactors ({enriched_count*100//len(reactors)}%)")

    # Stats
    with_url = sum(1 for r in reactors if r.get("WikipediaUrl"))
    with_thumb = sum(1 for r in reactors if r.get("WikipediaThumbnail"))
    print(f"  - With Wikipedia URL: {with_url}")
    print(f"  - With thumbnail: {with_thumb}")


if __name__ == "__main__":
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent

    input_file = project_dir / "nuclear_power_plants.json"
    output_file = project_dir / "nuclear_power_plants_enriched.json"

    if len(sys.argv) > 1:
        input_file = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_file = Path(sys.argv[2])

    enrich_reactors(str(input_file), str(output_file))
