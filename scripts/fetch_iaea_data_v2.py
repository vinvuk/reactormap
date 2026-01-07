#!/usr/bin/env python3
"""
Fetch latest nuclear reactor data from IAEA PRIS.
Version 2: Properly scrapes individual reactor data from country pages.
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


# Country codes mapping from IAEA country names
COUNTRY_CODES = {
    "ARGENTINA": "AR", "ARMENIA": "AM", "BANGLADESH": "BD", "BELARUS": "BY",
    "BELGIUM": "BE", "BRAZIL": "BR", "BULGARIA": "BG", "CANADA": "CA",
    "CHINA": "CN", "CZECH REPUBLIC": "CZ", "EGYPT": "EG", "FINLAND": "FI",
    "FRANCE": "FR", "GERMANY": "DE", "HUNGARY": "HU", "INDIA": "IN",
    "IRAN, ISLAMIC REPUBLIC OF": "IR", "JAPAN": "JP", "KOREA, REPUBLIC OF": "KR",
    "LITHUANIA": "LT", "MEXICO": "MX", "NETHERLANDS, KINGDOM OF THE": "NL",
    "PAKISTAN": "PK", "PHILIPPINES": "PH", "POLAND": "PL", "ROMANIA": "RO",
    "RUSSIA": "RU", "SLOVAKIA": "SK", "SLOVENIA": "SI", "SOUTH AFRICA": "ZA",
    "SPAIN": "ES", "SWEDEN": "SE", "SWITZERLAND": "CH", "TAIWAN, CHINA": "TW",
    "TURKEY": "TR", "UKRAINE": "UA", "UNITED ARAB EMIRATES": "AE",
    "UNITED KINGDOM": "GB", "UNITED STATES OF AMERICA": "US", "KAZAKHSTAN": "KZ",
    "ITALY": "IT", "AUSTRIA": "AT", "INDONESIA": "ID", "VIETNAM": "VN",
    "SAUDI ARABIA": "SA", "JORDAN": "JO", "UZBEKISTAN": "UZ",
}


class CountryListParser(HTMLParser):
    """Parse list of countries with reactors from IAEA main page."""

    def __init__(self):
        super().__init__()
        self.countries = []
        self.in_link = False
        self.current_country = None
        self.current_code = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "a":
            href = attrs_dict.get("href", "")
            # Match country links like CountryDetails.aspx?current=US
            match = re.search(r"CountryDetails\.aspx\?current=(\w+)", href)
            if match:
                self.in_link = True
                self.current_code = match.group(1)

    def handle_endtag(self, tag):
        if tag == "a" and self.in_link:
            if self.current_country and self.current_code:
                self.countries.append({
                    "name": self.current_country.strip(),
                    "code": self.current_code,
                })
            self.in_link = False
            self.current_country = None
            self.current_code = None

    def handle_data(self, data):
        if self.in_link:
            self.current_country = data


class ReactorTableParser(HTMLParser):
    """Parse reactor table from country details page."""

    def __init__(self):
        super().__init__()
        self.reactors = []
        self.current_reactor = {}
        self.in_table = False
        self.in_tbody = False
        self.in_row = False
        self.in_cell = False
        self.cell_index = 0
        self.current_data = ""
        self.row_count = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == "table":
            # Look for tablesorter class which contains reactor data
            table_class = attrs_dict.get("class", "")
            if "tablesorter" in table_class:
                self.in_table = True

        if self.in_table:
            if tag == "tbody":
                self.in_tbody = True
            elif tag == "tr" and self.in_tbody:
                self.in_row = True
                self.cell_index = 0
                self.current_reactor = {}
                self.row_count += 1
            elif tag == "td" and self.in_row:
                self.in_cell = True
                self.current_data = ""
            elif tag == "a" and self.in_cell:
                # Extract reactor ID from element ID (e.g., MainContent_MainContent_rptCountryReactors_hypReactorName_0)
                elem_id = attrs_dict.get("id", "")
                if "hypReactorName" in elem_id:
                    # Extract index from ID to build reactor ID later
                    match = re.search(r"_(\d+)$", elem_id)
                    if match:
                        self.current_reactor["row_index"] = int(match.group(1))

    def handle_endtag(self, tag):
        if tag == "table" and self.in_table:
            self.in_table = False
            self.in_tbody = False
        elif tag == "tbody":
            self.in_tbody = False
        elif tag == "tr" and self.in_row:
            self.in_row = False
            if self.current_reactor.get("name"):
                self.reactors.append(self.current_reactor)
        elif tag == "td" and self.in_cell:
            self.in_cell = False
            data = self.current_data.strip()

            # Map cell index to field based on IAEA table structure
            # Columns: Name, Type, Status, Location, Ref Unit Power, Gross Capacity, First Grid
            if self.cell_index == 0:
                self.current_reactor["name"] = data
            elif self.cell_index == 1:
                self.current_reactor["reactor_type"] = data.strip()
            elif self.cell_index == 2:
                self.current_reactor["status"] = data.strip()
            elif self.cell_index == 3:
                self.current_reactor["location"] = data.strip()
            elif self.cell_index == 5:  # Gross Capacity (skip Ref Unit Power)
                if data:
                    try:
                        self.current_reactor["capacity"] = int(data.replace(",", "").replace(" ", ""))
                    except ValueError:
                        pass
            elif self.cell_index == 6:
                self.current_reactor["grid_connection"] = data.strip()

            self.cell_index += 1

    def handle_data(self, data):
        if self.in_cell:
            self.current_data += data


def fetch_page(url: str, retries: int = 3) -> str:
    """
    Fetch a page from IAEA PRIS with proper headers.

    Args:
        url: URL to fetch
        retries: Number of retry attempts

    Returns:
        Page HTML content or empty string on failure
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ReactorMap/2.0",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }
    req = Request(url, headers=headers)

    for attempt in range(retries):
        try:
            with urlopen(req, timeout=30) as response:
                return response.read().decode("utf-8")
        except (HTTPError, URLError) as e:
            print(f"  Attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff

    return ""


def fetch_country_list() -> list:
    """
    Fetch list of countries with nuclear reactors from IAEA.

    Returns:
        List of country dicts with name and code
    """
    url = "https://pris.iaea.org/PRIS/WorldStatistics/OperationalReactorsByCountry.aspx"
    print(f"Fetching country list from IAEA...")

    html = fetch_page(url)
    if not html:
        return []

    parser = CountryListParser()
    parser.feed(html)

    print(f"Found {len(parser.countries)} countries with reactors")
    return parser.countries


def fetch_country_reactors(country_code: str, country_name: str) -> list:
    """
    Fetch all reactors for a specific country.

    Args:
        country_code: IAEA country code (e.g., 'US')
        country_name: Full country name

    Returns:
        List of reactor dicts
    """
    url = f"https://pris.iaea.org/PRIS/CountryStatistics/CountryDetails.aspx?current={country_code}"

    html = fetch_page(url)
    if not html:
        return []

    parser = ReactorTableParser()
    parser.feed(html)

    # Add country info to each reactor
    for reactor in parser.reactors:
        reactor["country"] = country_name
        reactor["country_code"] = country_code

    return parser.reactors


def map_status(raw_status: str) -> str:
    """
    Map IAEA status to our internal status format.

    Args:
        raw_status: Status string from IAEA

    Returns:
        Normalized status string
    """
    status_map = {
        "Operational": "Operational",
        "Under Construction": "Under Construction",
        "Permanent Shutdown": "Shutdown",
        "Suspended Operation": "Suspended Operation",
        "Suspended Construction": "Suspended Construction",
        "Long-term Shutdown": "Suspended Operation",
        "Planned": "Planned",
    }
    return status_map.get(raw_status, raw_status)


def merge_with_existing(iaea_reactors: list, existing_file: Path) -> tuple:
    """
    Merge new IAEA data with existing local data.

    Args:
        iaea_reactors: List of reactors from IAEA
        existing_file: Path to existing JSON file

    Returns:
        Tuple of (updated data, stats dict)
    """
    with open(existing_file, "r", encoding="utf-8") as f:
        existing_data = json.load(f)

    # Create lookups
    existing_by_iaea = {r.get("IAEAId"): r for r in existing_data if r.get("IAEAId")}
    existing_by_name = {}
    for r in existing_data:
        name_key = f"{r.get('Name', '').lower()}_{r.get('Country', '').lower()}"
        existing_by_name[name_key] = r

    stats = {"updated": 0, "new": 0, "matched": 0}
    now = datetime.now().isoformat()

    for iaea_reactor in iaea_reactors:
        iaea_id = iaea_reactor.get("iaea_id")
        name = iaea_reactor.get("name", "").lower()
        country = iaea_reactor.get("country", "").lower()
        name_key = f"{name}_{country}"

        # Find existing reactor
        existing = existing_by_iaea.get(iaea_id) or existing_by_name.get(name_key)

        if existing:
            stats["matched"] += 1
            changed = False

            # Update capacity if different
            new_capacity = iaea_reactor.get("capacity")
            if new_capacity and existing.get("Capacity") != new_capacity:
                print(f"  Capacity update: {existing['Name']}: {existing.get('Capacity')} -> {new_capacity} MW")
                existing["Capacity"] = new_capacity
                changed = True

            # Update status if different
            new_status = map_status(iaea_reactor.get("status", ""))
            if new_status and existing.get("Status") != new_status:
                print(f"  Status update: {existing['Name']}: {existing.get('Status')} -> {new_status}")
                existing["Status"] = new_status
                changed = True

            # Add IAEA ID if missing
            if iaea_id and not existing.get("IAEAId"):
                existing["IAEAId"] = iaea_id
                changed = True

            if changed:
                existing["LastUpdatedAt"] = now
                stats["updated"] += 1
        else:
            # New reactor not in our database
            country_code = COUNTRY_CODES.get(iaea_reactor.get("country", "").upper(), "")
            print(f"  NEW: {iaea_reactor.get('name')} ({iaea_reactor.get('country')}) - {iaea_reactor.get('capacity')} MW")
            stats["new"] += 1

    return existing_data, stats


def main():
    """Main entry point for IAEA data fetcher."""
    project_root = Path(__file__).parent.parent
    data_file = project_root / "nuclear_power_plants.json"

    print("=" * 50)
    print("IAEA PRIS Data Fetcher v2")
    print("=" * 50)
    print()

    # Fetch country list
    countries = fetch_country_list()
    if not countries:
        print("Failed to fetch country list")
        return

    # Fetch reactors for each country
    all_reactors = []
    for i, country in enumerate(countries):
        print(f"[{i+1}/{len(countries)}] Fetching {country['name']}...")
        reactors = fetch_country_reactors(country["code"], country["name"])
        print(f"  Found {len(reactors)} reactors")
        all_reactors.extend(reactors)
        time.sleep(0.5)  # Rate limiting

    print()
    print(f"Total reactors fetched: {len(all_reactors)}")

    # Calculate totals
    operational = [r for r in all_reactors if r.get("status") == "Operational"]
    total_capacity = sum(r.get("capacity", 0) or 0 for r in operational)

    print(f"Operational reactors: {len(operational)}")
    print(f"Total capacity: {total_capacity:,} MW ({total_capacity/1000:.1f} GW)")
    print()

    # Merge with existing data
    print(f"Merging with existing data: {data_file}")
    updated_data, stats = merge_with_existing(all_reactors, data_file)

    print()
    print("Summary:")
    print(f"  Matched: {stats['matched']}")
    print(f"  Updated: {stats['updated']}")
    print(f"  New: {stats['new']}")

    # Save updated data
    output_file = project_root / "nuclear_power_plants_updated.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(updated_data, f, indent=2, ensure_ascii=False)

    print()
    print(f"Updated data saved to: {output_file}")
    print("Review the changes, then rename to nuclear_power_plants.json to apply.")


if __name__ == "__main__":
    main()
