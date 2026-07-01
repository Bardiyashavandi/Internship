from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
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

pca = PCA(n_components=2)
embeddings_2d = pca.fit_transform(listing_embeddings)

print("Shape before PCA:", listing_embeddings.shape)
print("Shape after PCA:", embeddings_2d.shape)

plt.figure(figsize=(12, 8))
plt.scatter(embeddings_2d[:, 0], embeddings_2d[:, 1], s=100, color="steelblue")

for i, listing in enumerate(listings):
    short_label = listing[:30] + "..."
    plt.annotate(
        short_label,
        (embeddings_2d[i, 0], embeddings_2d[i, 1]),
        fontsize=8,
        xytext=(5, 5),
        textcoords="offset points"
    )

plt.title("Real Estate Listings in 2D Embedding Space")
plt.xlabel("PCA Component 1")
plt.ylabel("PCA Component 2")
plt.tight_layout()
plt.savefig("embeddings_plot.png", dpi=150)
print("\nSaved plot to embeddings_plot.png")