## Book Recommender System (FastAPI + React)

Content‑based book recommendations with a FastAPI backend and a modern React + Vite + Tailwind frontend.

Previously this project included a Streamlit UI; it has since been migrated to a dedicated frontend app that talks to a lightweight API server. This README reflects the current architecture and adds detailed notes about the ML pipeline.

## Project overview

This is a content‑based recommender. Offline, we preprocess book metadata and compute a similarity matrix between books. Online, the API looks up the selected book and returns the most similar titles with near‑instant latency, while the frontend enriches them with cover images and links from OpenLibrary.

High‑level flow
- Offline: clean/normalize text, stem words, build a bag‑of‑words vector for each book, compute cosine similarity, and persist artifacts (`books.pkl`, `simi_sparse.npz`).
- Online: the FastAPI service loads these artifacts at startup. For a query, it finds the book index and returns the top‑N similar titles (no model training or inference at request time).
- Frontend: debounced search suggests titles; upon selection, it requests recommendations and fetches covers/links from OpenLibrary to render cards.

## Key features

- Content‑based recommendations built from book metadata (no user history required)
- Low‑latency API via precomputed cosine similarity and efficient sparse storage
- Debounced search suggestions for responsive UX
- Graceful UI states: loading skeletons, error messages, and fallbacks for missing covers
- OpenLibrary integration for cover images and detail page links
- Reproducible ML pipeline in a notebook with clear artifact outputs
- Decoupled architecture (FastAPI backend, React + Vite frontend) for flexible deployment and iteration

## What’s inside

- backend/ (FastAPI API)
	- Loads a precomputed similarity sparse matrix and a books dataframe
	- Exposes endpoints to search titles and get recommendations
	- CORS enabled to allow the frontend to call it locally
- book-frontend/ (React + TypeScript + Vite + Tailwind v4)
	- Autocomplete search with debounce
	- Calls the API for suggestions and recommendations
	- Fetches covers and links from OpenLibrary on the client for speed
- Data artifacts (stored under `backend/`)
	- `simi_sparse.npz` – compressed cosine similarity sparse matrix (Scipy)
	- `books.pkl` – pickled pandas DataFrame that includes at least a `Title` column

## Quick start (local dev)

Run the backend API and the frontend app in two terminals.

### 1) Backend (FastAPI)

Requirements: Python 3.10+ recommended.

From the repo root:

```powershell
# Create venv (Windows PowerShell)
py -m venv .venv
./.venv/Scripts/Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Ensure data files exist in backend/
# - backend/simi_sparse.npz
# - backend/books.pkl

# Start the API (reload for local dev)
uvicorn backend.app:app --reload --port 8000
```

The API will be available at http://127.0.0.1:8000.

### 2) Frontend (React + Vite)

Requirements: Node.js 18+.

```powershell
cd book-frontend
npm install
npm run dev
```

Vite will print a local URL (typically http://127.0.0.1:5173). The app expects the API on http://127.0.0.1:8000.

## API reference

Base URL: `http://127.0.0.1:8000`

- GET `/books`
	- Returns: `string[]` of all titles (may be large)

- GET `/search?query=<text>`
	- Case‑insensitive partial match over titles
	- Returns: up to 15 matching titles: `string[]`

- POST `/recommend`
	- Body: `{ "title": "<exact title>" }`
	- Returns on success: `{ "titles": string[] }` (top N similar titles)
	- Returns on miss: `{ "error": "Book not found. Please enter a valid title." }`

Notes
- The API returns titles only. The frontend fetches cover images and book links from OpenLibrary.
- CORS is enabled for all origins during development.

## Frontend details

Tech stack
- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 via `@tailwindcss/vite`

Key components
- `src/App.tsx`: Search box with 300ms debounce, calls `/search` and `/recommend`, manages loading/error states.
- `src/components/BookCard.tsx`: Displays title, cover skeleton/placeholder, and link (OpenLibrary or Google fallback).
- `src/components/LoadingSpinner.tsx` + `BookIcon.tsx`: Small UI primitives.

Configuration
- `vite.config.ts` enables the Tailwind v4 Vite plugin and React plugin.
- The frontend uses utility classes from Tailwind; no extra config files are required with v4.

## Theoretical concepts

Vector space model
- Each book is represented as a high‑dimensional vector over a vocabulary of terms (bag‑of‑words). The geometric relationships between vectors capture topical similarity.

Tokenization, normalization, stemming
- Lowercasing and punctuation stripping reduce superficial variation.
- Porter stemming conflates inflected forms (e.g., “running” → “run”), reducing sparsity and improving recall.

Bag‑of‑words vs TF‑IDF
- This system uses raw term frequency via CountVectorizer. TF‑IDF is a common alternative that down‑weights frequent terms; it can be swapped in with minimal code changes if you prefer higher discrimination.

Cosine similarity
- Measures the angle between vectors (scale‑invariant), which is robust to differences in document length. Ideal for sparse text vectors.

Sparsity and scalability
- Limiting vocabulary (`max_features=7000`) and using sparse matrices reduce memory and computation cost.
- Precomputing item‑item similarity shifts work offline, turning requests into fast lookups.

Top‑K retrieval
- For a selected book, we sort its similarity row and take the top‑K neighbors (excluding itself). This yields deterministic, low‑variance recommendations aligned with content features.

Limitations and extensions
- Content‑based methods can over‑specialize. Extensions include: TF‑IDF or character n‑grams, dimensionality reduction (e.g., SVD), hybrid models (mix with collaborative filtering), or semantic encoders (e.g., transformer embeddings).

## Data and model artifacts

The backend expects two files in `backend/`:

- `simi_sparse.npz`: Scipy CSR matrix of cosine similarities
- `books.pkl`: Pickled pandas DataFrame with a `Title` column (index must align with the similarity matrix rows)

These are produced offline by the notebook `b-r-s.ipynb`.

### How the model works (ML/AI pipeline)

At a high level, this is a content‑based recommender. It represents each book as a bag‑of‑words vector built from its metadata and then uses cosine similarity to retrieve the most similar items.

- Text preparation
	- Merge relevant metadata fields into a single text “tag” (e.g., title, author, categories/genres, description, publisher as available).
	- Normalize text: lowercase, remove punctuation/special chars.
	- Stemming: NLTK PorterStemmer is applied to reduce words to root forms.
- Vectorization
	- `sklearn.feature_extraction.text.CountVectorizer` is used with: `max_features=7000` and `stop_words='english'`.
	- Produces a sparse term‑frequency matrix `vector` with shape `[num_books, vocab_size]`.
- Similarity
	- `sklearn.metrics.pairwise.cosine_similarity` computes an item‑item similarity matrix `simi`.
	- For storage efficiency, `simi` is converted to a CSR sparse matrix and saved as `simi_sparse.npz` using `scipy.sparse.save_npz`.
- Artifacts
	- `books.pkl`: pickled DataFrame (at least a `Title` column); index order must match `simi_sparse.npz` rows.
	- `simi.pkl` (intermediate, optional): dense similarity matrix before conversion to sparse.
	- `simi_sparse.npz`: final sparse similarity matrix consumed by the API.

Retrieval
- Given an input title, the API finds its row index in `books.pkl`, then returns the top‑N most similar titles from the precomputed similarity matrix (excluding the item itself).

### Rebuild artifacts from the notebook

Use `b-r-s.ipynb` to regenerate the data artifacts. The notebook includes these steps:

1) Preprocess data and build merged/stemmed text features.
2) Fit `CountVectorizer(max_features=7000, stop_words='english')` and transform to TF vectors.
3) Compute cosine similarity: `simi = cosine_similarity(vector)`.
4) Save outputs:
	 - `pickle.dump(new_df, open("books.pkl", "wb"))`
	 - `pickle.dump(simi, open("simi.pkl", "wb"))` (optional)
	 - Convert to CSR and persist: `save_npz("simi_sparse.npz", csr_matrix(simi))`

Make sure to copy the resulting `books.pkl` and `simi_sparse.npz` into the `backend/` folder.

## Deployment notes

- The backend includes its own `backend/Procfile` for API deployment:

	```Procfile
	web: uvicorn app:app --host 0.0.0.0 --port $PORT
	```

- Use `backend/requirements.txt` for API dependencies.

## Troubleshooting

- Frontend shows “Could not fetch suggestions. Is the server running?”
	- Make sure the API is started on port 8000 and CORS is enabled (it is by default in `backend/app.py`).
	- Verify `http://127.0.0.1:8000/search?query=test` returns JSON.

- API fails to start with file‑not‑found errors
	- Ensure `backend/simi_sparse.npz` and `backend/books.pkl` exist and are readable.

- Covers not appearing or broken images
	- The app falls back to a placeholder if OpenLibrary lacks a cover or the request fails. Check browser console/network tab for 429s or network issues.

## Repository layout

This is a two‑app monorepo:

- `backend/` — FastAPI server and data artifacts (`books.pkl`, `simi_sparse.npz`).
- `book-frontend/` — React + Vite + Tailwind frontend.

## License

This repository is for educational/demonstration purposes. Add a LICENSE if you plan to distribute or use in production.
