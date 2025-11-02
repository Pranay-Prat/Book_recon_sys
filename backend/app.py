from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import numpy as np
from scipy.sparse import load_npz
import requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_sparse_matrix(filename):
    return load_npz(filename)

def get_similar_books(book_index, simi_matrix, n=10):
    similarities = simi_matrix[book_index].toarray().flatten()
    similar_indices = np.argsort(similarities)[::-1][1:n+1]
    return similar_indices

def recon(book, book_list, simi_matrix):
    # Case-insensitive matching
    matches = book_list[book_list['Title'].str.lower() == book.lower()]

    if matches.empty:
        return []  # return empty list instead of crashing

    book_index = matches.index[0]
    similar_indices = get_similar_books(book_index, simi_matrix)
    return book_list.iloc[similar_indices]['Title'].tolist()


def fetch_book_data(title):
    query = f"https://openlibrary.org/search.json?title={title}"
    response = requests.get(query)
    if response.status_code == 200:
        data = response.json()
        if "docs" in data and data["docs"]:
            book_data = data["docs"][0]
            cover_id = book_data.get("cover_i")
            cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None
            key = book_data.get("key")
            book_url = f"https://openlibrary.org{key}" if key else None
            return {"cover_url": cover_url, "book_url": book_url}
    return {"cover_url": None, "book_url": None}

simi_matrix = load_sparse_matrix("simi_sparse.npz")
book_list = pickle.load(open("books.pkl", "rb"))

class BookRequest(BaseModel):
    title: str

@app.get("/books")
def get_books():
    return list(book_list["Title"].values)
@app.get("/search")
def search_books(query: str):
    # case-insensitive partial match
    results = book_list[book_list['Title'].str.contains(query, case=False, na=False)]
    return list(results['Title'].values[:15])  # limit to top 15 matches


@app.post("/recommend")
@app.post("/recommend")
def recommend(data: BookRequest):
    recs = recon(data.title, book_list, simi_matrix)

    if not recs:
        return {"error": "Book not found. Please enter a valid title."}

    # ✅ Return only titles → ZERO delay
    return {"titles": recs}

