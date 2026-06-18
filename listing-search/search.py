import httpx
import time
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("IDEALISTA_API_KEY")
BASE_URL = "https://api.idealista.com/3.5/es/search"

def parse_listing(raw: dict) -> dict:
    """Parse raw API response into clean listing object."""
    return {
        "title": raw.get("suggestedTexts", {}).get("title", "No title"),
        "price": raw.get("price", 0),
        "size": raw.get("size", 0),
        "bedrooms": raw.get("rooms", 0),
        "location": raw.get("address", "Unknown"),
        "url": raw.get("url", "")
    }

def search_listings(
    city: str,
    max_price: int,
    min_bedrooms: int = 1,
    property_type: str = "flat"
) -> list[dict]:
    """
    Search Idealista listings based on criteria.
    
    Args:
        city: City to search in (e.g. "Madrid")
        max_price: Maximum price in euros
        min_bedrooms: Minimum number of bedrooms
        property_type: Type of property (flat/house)
    
    Returns:
        List of matching listings
    """
    if not API_KEY:
        raise ValueError("IDEALISTA_API_KEY not set in .env")

    params = {
        "operation": "sale",
        "locationId": city,
        "maxPrice": max_price,
        "minRooms": min_bedrooms,
        "propertyType": property_type,
        "numPage": 1,
        "maxItems": 20,
        "order": "price",
        "sort": "asc"
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    for attempt in range(3):
        try:
            response = httpx.post(BASE_URL, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()
                raw_listings = data.get("elementList", [])
                return [parse_listing(l) for l in raw_listings]

            elif response.status_code == 429:
                wait = 2 ** attempt
                print(f"Rate limited. Waiting {wait}s...")
                time.sleep(wait)

            elif response.status_code == 401:
                raise ValueError("Invalid API key")

            else:
                print(f"Error: {response.status_code}")
                return []

        except httpx.RequestError as e:
            print(f"Network error: {e}")
            return []

    return []


if __name__ == "__main__":
    results = search_listings(
        city="Madrid",
        max_price=300000,
        min_bedrooms=2
    )
    
    if results:
        for listing in results:
            print(f"{listing['title']} — €{listing['price']} — {listing['size']}m²")
    else:
        print("No listings found")
