#!/usr/bin/env python3
"""
Wikidata Enrichment Script for Nuclear Reactor Data

Fetches additional data from Wikidata using Wikipedia URLs.
Extracts: operator, owner, cooling system, designer, region.
"""

import json
import urllib.request
import urllib.parse
import time
import sys
import re
from pathlib import Path
from typing import Optional, Dict, List

USER_AGENT = "ReactorMap/1.0 (https://github.com/reactormap; contact@example.com) Python/3"

# Wikidata property IDs
PROPERTIES = {
    "P137": "operator",      # operator
    "P127": "owner",         # owned by
    "P84": "architect",      # architect/designer
    "P131": "region",        # located in administrative territory
    "P2257": "coolingSystem", # cooling system
    "P18": "image",          # image (backup if no Wikipedia thumbnail)
}


def get_wikidata_id_from_wikipedia(wikipedia_url: str) -> Optional[str]:
    """
    Get Wikidata ID from a Wikipedia URL.

    Args:
        wikipedia_url: Full Wikipedia URL

    Returns:
        Wikidata ID (e.g., "Q123456") or None
    """
    if not wikipedia_url:
        return None

    # Extract title from URL
    match = re.search(r'wikipedia\.org/wiki/(.+)$', wikipedia_url)
    if not match:
        return None

    title = urllib.parse.unquote(match.group(1))

    # Query Wikipedia API for Wikidata ID
    endpoint = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": title,
        "prop": "pageprops",
        "ppprop": "wikibase_item",
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

            for page in pages.values():
                wikidata_id = page.get("pageprops", {}).get("wikibase_item")
                if wikidata_id:
                    return wikidata_id
    except Exception as e:
        print(f"  Error getting Wikidata ID: {e}")

    return None


def get_wikidata_properties(wikidata_id: str) -> Dict:
    """
    Fetch properties from Wikidata for a given entity.

    Args:
        wikidata_id: Wikidata entity ID (e.g., "Q123456")

    Returns:
        Dict of property values
    """
    endpoint = "https://www.wikidata.org/w/api.php"
    params = {
        "action": "wbgetentities",
        "ids": wikidata_id,
        "props": "claims|labels",
        "languages": "en",
        "format": "json",
        "utf8": 1
    }

    url = f"{endpoint}?{urllib.parse.urlencode(params)}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            entity = data.get("entities", {}).get(wikidata_id, {})
            claims = entity.get("claims", {})

            result = {}

            for prop_id, field_name in PROPERTIES.items():
                if prop_id in claims:
                    claim = claims[prop_id][0]  # Take first value
                    mainsnak = claim.get("mainsnak", {})
                    datavalue = mainsnak.get("datavalue", {})

                    if datavalue.get("type") == "wikibase-entityid":
                        # It's a reference to another entity, need to resolve
                        entity_id = datavalue.get("value", {}).get("id")
                        if entity_id:
                            label = get_entity_label(entity_id)
                            if label:
                                result[field_name] = label
                    elif datavalue.get("type") == "string":
                        result[field_name] = datavalue.get("value")
                    elif datavalue.get("type") == "commonsMedia":
                        # For images, construct the Commons URL
                        filename = datavalue.get("value")
                        if filename and field_name == "image":
                            result[field_name] = get_commons_image_url(filename)

            return result
    except Exception as e:
        print(f"  Error fetching Wikidata: {e}")

    return {}


def get_entity_label(entity_id: str) -> Optional[str]:
    """
    Get the English label for a Wikidata entity.

    Args:
        entity_id: Wikidata entity ID

    Returns:
        English label or None
    """
    endpoint = "https://www.wikidata.org/w/api.php"
    params = {
        "action": "wbgetentities",
        "ids": entity_id,
        "props": "labels",
        "languages": "en",
        "format": "json",
        "utf8": 1
    }

    url = f"{endpoint}?{urllib.parse.urlencode(params)}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            entity = data.get("entities", {}).get(entity_id, {})
            return entity.get("labels", {}).get("en", {}).get("value")
    except Exception:
        pass

    return None


def get_commons_image_url(filename: str, width: int = 300) -> str:
    """
    Construct a Wikimedia Commons thumbnail URL.

    Args:
        filename: Commons filename
        width: Thumbnail width

    Returns:
        Thumbnail URL
    """
    # Commons uses MD5 hash for directory structure
    import hashlib
    filename = filename.replace(" ", "_")
    md5 = hashlib.md5(filename.encode()).hexdigest()

    encoded_filename = urllib.parse.quote(filename)
    return f"https://upload.wikimedia.org/wikipedia/commons/thumb/{md5[0]}/{md5[0:2]}/{encoded_filename}/{width}px-{encoded_filename}"


def enrich_reactors(input_file: str, output_file: str):
    """
    Enrich reactor data with Wikidata properties.

    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file
    """
    print(f"Loading reactors from {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        reactors = json.load(f)

    print(f"Found {len(reactors)} reactors")

    # Track unique plants to avoid duplicate lookups
    plant_cache: Dict[str, Dict] = {}
    enriched_count = 0

    for i, reactor in enumerate(reactors):
        name = reactor.get("Name", "")
        wikipedia_url = reactor.get("WikipediaUrl")

        if not wikipedia_url:
            continue

        # Use Wikipedia URL as cache key
        if wikipedia_url in plant_cache:
            wikidata = plant_cache[wikipedia_url]
            if wikidata:
                for key, value in wikidata.items():
                    reactor[f"Wikidata{key[0].upper()}{key[1:]}"] = value
                enriched_count += 1
            continue

        print(f"[{i+1}/{len(reactors)}] Processing: {name}...", end=" ")

        # Get Wikidata ID from Wikipedia URL
        wikidata_id = get_wikidata_id_from_wikipedia(wikipedia_url)

        if not wikidata_id:
            print("No Wikidata ID")
            plant_cache[wikipedia_url] = {}
            continue

        # Get properties from Wikidata
        wikidata = get_wikidata_properties(wikidata_id)
        plant_cache[wikipedia_url] = wikidata

        if wikidata:
            for key, value in wikidata.items():
                reactor[f"Wikidata{key[0].upper()}{key[1:]}"] = value
            enriched_count += 1
            print(f"Found: {', '.join(wikidata.keys())}")
        else:
            print("No properties found")

        # Rate limiting
        time.sleep(0.3)

        # Save progress every 50 reactors
        if (i + 1) % 50 == 0:
            print(f"\nSaving progress... ({enriched_count} enriched so far)")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(reactors, f, indent=2, ensure_ascii=False)

    # Final save
    print(f"\nSaving final results to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(reactors, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Enriched {enriched_count}/{len(reactors)} reactors")

    # Stats
    stats = {
        "operator": sum(1 for r in reactors if r.get("WikidataOperator")),
        "owner": sum(1 for r in reactors if r.get("WikidataOwner")),
        "region": sum(1 for r in reactors if r.get("WikidataRegion")),
        "coolingSystem": sum(1 for r in reactors if r.get("WikidataCoolingSystem")),
        "architect": sum(1 for r in reactors if r.get("WikidataArchitect")),
    }
    print("Enrichment stats:")
    for field, count in stats.items():
        print(f"  - {field}: {count}")


if __name__ == "__main__":
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent

    input_file = project_dir / "nuclear_power_plants.json"
    output_file = project_dir / "nuclear_power_plants_wikidata.json"

    if len(sys.argv) > 1:
        input_file = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_file = Path(sys.argv[2])

    enrich_reactors(str(input_file), str(output_file))
