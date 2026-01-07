#!/usr/bin/env python3
"""
Fetch latest nuclear reactor data from IAEA PRIS.
Updates the local JSON file with current operational status and capacity.
"""

import json
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from html.parser import HTMLParser


class IAEAReactorParser(HTMLParser):
    """Parse reactor data from IAEA PRIS HTML pages."""

    def __init__(self):
        super().__init__()
        self.reactors = []
        self.current_reactor = {}
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.cell_index = 0
        self.current_data = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "table" and "class" in attrs_dict and "tablesorter" in attrs_dict.get("class", ""):
            self.in_table = True
        elif self.in_table and tag == "tr":
            self.in_row = True
            self.cell_index = 0
            self.current_reactor = {}
        elif self.in_row and tag == "td":
            self.in_cell = True
            self.current_data = ""
        elif self.in_cell and tag == "a":
            # Extract reactor ID from link
            href = attrs_dict.get("href", "")
            match = re.search(r"current=(\d+)", href)
            if match:
                self.current_reactor["iaea_id"] = int(match.group(1))

    def handle_endtag(self, tag):
        if tag == "table":
            self.in_table = False
        elif tag == "tr" and self.in_row:
            self.in_row = False
            if self.current_reactor.get("name"):
                self.reactors.append(self.current_reactor)
        elif tag == "td" and self.in_cell:
            self.in_cell = False
            data = self.current_data.strip()

            # Map cell index to field
            field_map = {
                0: "name",
                1: "country",
                2: "status",
                3: "reactor_type",
                4: "capacity",
                5: "construction_start",
                6: "grid_connection",
                7: "commercial_operation",
            }

            if self.cell_index in field_map:
                field = field_map[self.cell_index]
                if field == "capacity" and data:
                    try:
                        self.current_reactor[field] = int(data.replace(",", "").replace(" ", ""))
                    except ValueError:
                        self.current_reactor[field] = None
                else:
                    self.current_reactor[field] = data if data else None

            self.cell_index += 1

    def handle_data(self, data):
        if self.in_cell:
            self.current_data += data


def fetch_page(url: str) -> str:
    """Fetch a page from IAEA PRIS with proper headers."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ReactorMap/1.0",
        "Accept": "text/html,application/xhtml+xml",
    }
    req = Request(url, headers=headers)

    try:
        with urlopen(req, timeout=30) as response:
            return response.read().decode("utf-8")
    except (HTTPError, URLError) as e:
        print(f"Error fetching {url}: {e}")
        return ""


def fetch_operational_reactors() -> list:
    """Fetch list of all operational reactors from IAEA PRIS."""
    url = "https://pris.iaea.org/PRIS/WorldStatistics/OperationalReactorsByCountry.aspx"
    print(f"Fetching operational reactors from {url}...")

    html = fetch_page(url)
    if not html:
        return []

    parser = IAEAReactorParser()
    parser.feed(html)

    print(f"Found {len(parser.reactors)} operational reactors")
    return parser.reactors


def fetch_reactor_details(iaea_id: int) -> dict:
    """Fetch detailed information for a specific reactor."""
    url = f"https://pris.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx?current={iaea_id}"
    html = fetch_page(url)

    if not html:
        return {}

    details = {"iaea_id": iaea_id}

    # Extract coordinates from the page
    lat_match = re.search(r"Latitude[:\s]+(-?\d+\.?\d*)", html)
    lon_match = re.search(r"Longitude[:\s]+(-?\d+\.?\d*)", html)

    if lat_match:
        details["latitude"] = float(lat_match.group(1))
    if lon_match:
        details["longitude"] = float(lon_match.group(1))

    return details


def update_local_data(new_reactors: list, existing_file: Path) -> list:
    """Merge new IAEA data with existing local data."""

    # Load existing data
    with open(existing_file, "r", encoding="utf-8") as f:
        existing_data = json.load(f)

    # Create lookup by IAEA ID
    existing_by_iaea = {r.get("IAEAId"): r for r in existing_data if r.get("IAEAId")}
    existing_by_name = {r.get("Name", "").lower(): r for r in existing_data}

    updated_count = 0
    new_count = 0

    for new_reactor in new_reactors:
        iaea_id = new_reactor.get("iaea_id")
        name = new_reactor.get("name", "").lower()

        # Find existing reactor
        existing = existing_by_iaea.get(iaea_id) or existing_by_name.get(name)

        if existing:
            # Update capacity if different
            new_capacity = new_reactor.get("capacity")
            if new_capacity and existing.get("Capacity") != new_capacity:
                print(f"  Updating {existing['Name']}: {existing.get('Capacity')} -> {new_capacity} MW")
                existing["Capacity"] = new_capacity
                updated_count += 1

            # Update status
            status_map = {
                "Operational": "Operational",
                "Under Construction": "Under Construction",
                "Permanent Shutdown": "Shutdown",
                "Suspended Operation": "Suspended Operation",
            }
            new_status = status_map.get(new_reactor.get("status"), new_reactor.get("status"))
            if new_status and existing.get("Status") != new_status:
                print(f"  Status change {existing['Name']}: {existing.get('Status')} -> {new_status}")
                existing["Status"] = new_status
                updated_count += 1

            existing["LastUpdatedAt"] = datetime.now().isoformat()
        else:
            # New reactor not in our database
            print(f"  NEW: {new_reactor.get('name')} ({new_reactor.get('country')}) - {new_reactor.get('capacity')} MW")
            new_count += 1

    print(f"\nSummary: {updated_count} updated, {new_count} new reactors found")
    return existing_data


def main():
    """Main entry point."""
    project_root = Path(__file__).parent.parent
    data_file = project_root / "nuclear_power_plants.json"

    print("=== IAEA PRIS Data Fetcher ===\n")

    # Fetch current operational reactors
    operational = fetch_operational_reactors()

    if not operational:
        print("Failed to fetch data from IAEA PRIS")
        return

    # Calculate totals
    total_capacity = sum(r.get("capacity", 0) or 0 for r in operational)
    print(f"\nIAEA PRIS Totals:")
    print(f"  Operational reactors: {len(operational)}")
    print(f"  Total capacity: {total_capacity:,} MW ({total_capacity/1000:.1f} GW)")

    # Update local data
    print(f"\nUpdating local data file: {data_file}")
    updated_data = update_local_data(operational, data_file)

    # Save updated data
    output_file = project_root / "nuclear_power_plants_updated.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(updated_data, f, indent=2, ensure_ascii=False)

    print(f"\nUpdated data saved to: {output_file}")
    print("Review the changes, then rename to nuclear_power_plants.json to apply.")


if __name__ == "__main__":
    main()
