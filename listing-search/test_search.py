from search import search_listings, parse_listing

def test_parse_listing():
    """Test that parse_listing extracts correct fields."""
    raw = {
        "suggestedTexts": {"title": "Flat in Madrid"},
        "price": 250000,
        "size": 80,
        "rooms": 3,
        "address": "Calle Mayor, Madrid",
        "url": "https://idealista.com/123"
    }
    
    result = parse_listing(raw)
    
    assert result["title"] == "Flat in Madrid"
    assert result["price"] == 250000
    assert result["size"] == 80
    assert result["bedrooms"] == 3
    assert result["location"] == "Calle Mayor, Madrid"
    print("✅ test_parse_listing passed")

def test_empty_results():
    """Test that empty API response returns empty list."""
    raw_listings = []
    results = [parse_listing(l) for l in raw_listings]
    assert results == []
    print("✅ test_empty_results passed")

def test_missing_fields():
    """Test that missing fields return defaults."""
    raw = {}  # empty listing
    result = parse_listing(raw)
    
    assert result["price"] == 0
    assert result["size"] == 0
    assert result["bedrooms"] == 0
    assert result["location"] == "Unknown"
    print("✅ test_missing_fields passed")

if __name__ == "__main__":
    test_parse_listing()
    test_empty_results()
    test_missing_fields()
    print("\n✅ All tests passed!")
