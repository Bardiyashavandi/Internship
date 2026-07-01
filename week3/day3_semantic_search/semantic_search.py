from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")



listings = [
    "3-bed flat in Kadıköy, close to metro, 180k EUR, renovated kitchen",
    "Studio apartment near subway station, budget price, 65k EUR",
    "4-bed villa with garden, far from city center, 450k EUR, quiet neighborhood",
    "2-bed apartment in Beşiktaş, sea view, 220k EUR, walking distance to ferry",
    "Affordable 1-bed flat, public transport nearby, 90k EUR, needs renovation",
    "Luxury penthouse in Nişantaşı, 3 bedrooms, 850k EUR, rooftop terrace",
    "Small apartment close to tram line, 75k EUR, good for students",
    "5-bed house with private pool, 600k EUR, gated community",
    "2-bed flat near Kadıköy metro exit, 195k EUR, balcony",
    "Cheap studio, 15 min walk to bus stop, 55k EUR, ground floor",
    "3-bed duplex in Üsküdar, Bosphorus view, 380k EUR, elevator building",
    "1-bed apartment near subway, recently renovated, 100k EUR",
    "Countryside cottage, no public transport access, 120k EUR, large land",
    "Modern 2-bed flat, metro-adjacent, 210k EUR, gym in building",
    "Budget flat close to public transportation, 85k EUR, needs paint"
]

listing_embeddings = model.encode(listings)

print(f"Number of listings: {len(listings)}")
print(f"Shape of embeddings: {listing_embeddings.shape}")
print(f"First embedding (first 10 numbers): {listing_embeddings[0][:10]}")

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

query = "affordable apartment near public transport"
query_embedding = model.encode([query])[0]

scores = []
for i, listing_embedding in enumerate(listing_embeddings):
    score = cosine_similarity(query_embedding, listing_embedding)
    scores.append((score, listings[i]))

scores.sort(reverse=True)

print(f"\nQuery: {query}\n")
print("Top 5 results:")
for score, listing in scores[:5]:
    print(f"  {score:.3f} — {listing}")
    
query2 = "cheap flat close to the metro"
query2_embedding = model.encode([query2])[0]

scores2 = []
for i, listing_embedding in enumerate(listing_embeddings):
    score = cosine_similarity(query2_embedding, listing_embedding)
    scores2.append((score, listings[i]))

scores2.sort(reverse=True)

print(f"\nQuery: {query2}\n")
print("Top 3 results:")
for score, listing in scores2[:3]:
    print(f"  {score:.3f} — {listing}")