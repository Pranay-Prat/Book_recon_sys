import  { useEffect, useState, useRef } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import BookIcon from "./components/BookIcon";
import BookCard from "./components/BookCard";
import type { Book } from "./components/BookCard";

// ✅ Use environment variable (set in .env file as VITE_API_BASE_URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSelectionMade = useRef(false);

  useEffect(() => {
    if (isSelectionMade.current) {
      isSelectionMade.current = false;
      return;
    }

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (text: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error("Search failed");
      setSuggestions(await res.json());
    } catch (err) {
      console.error(err);
      setError("Could not fetch suggestions. Is the backend running?");
      setSuggestions([]);
    }
  };

  const handleRecommend = async (title: string) => {
    setLoading(true);
    setResults([]);
    setError(null);
    isSelectionMade.current = true;
    setQuery(title);
    setSuggestions([]);

    try {
      const res = await fetch(`${API_BASE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) throw new Error("Recommendation request failed");

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      const booksArr: Book[] = data.titles.map((t: string) => ({
        title: t,
        cover_url: null,
        book_url: null,
      }));

      setResults(booksArr);
      setLoading(false);

      // fetch covers asynchronously
      data.titles.forEach(async (t: string, i: number) => {
        try {
          const r = await fetch(
            `https://openlibrary.org/search.json?title=${encodeURIComponent(t)}`
          );
          if (!r.ok) throw new Error("OpenLibrary search failed");

          const d = await r.json();
          const doc = d?.docs?.[0];
          const coverId = doc?.cover_i || null;
          const cover = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
            : false;
          const book_url = doc?.key
            ? `https://openlibrary.org${doc.key}`
            : null;

          setResults((prev) => {
            const copy = [...prev];
            if (copy[i]) {
              copy[i] = { ...copy[i], cover_url: cover, book_url };
            }
            return copy;
          });
        } catch (coverError) {
          console.error(`Failed to fetch cover for ${t}:`, coverError);
          setResults((prev) => {
            const copy = [...prev];
            if (copy[i]) {
              copy[i] = { ...copy[i], cover_url: false, book_url: null };
            }
            return copy;
          });
        }
      });
    } catch (err) {
      console.error(err);
      setError("Could not get recommendations. Is the backend running?");
      setLoading(false);
      setResults([]);
    }
  };

  return (
    <div className="flex flex-col items-center p-8 pt-12 sm:pt-24 gap-8 min-h-screen bg-slate-50 font-sans">
      <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight">
        Book Recommender
      </h1>
      <p className="text-lg text-slate-600 -mt-4 text-center">
        Find your next great read. Based on 50,000+ user ratings.
      </p>

      {/* Search Bar */}
      <div className="relative w-full max-w-xl z-10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a book you like..."
          className="w-full p-4 rounded-lg border border-gray-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
        />

        {suggestions.length > 0 && (
          <ul className="absolute bg-white border border-gray-300 rounded-lg w-full mt-1 shadow-xl max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <li
                key={s}
                className="p-3 hover:bg-blue-50 cursor-pointer text-gray-700"
                onClick={() => handleRecommend(s)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-lg font-semibold text-blue-600 mt-8">
          <LoadingSpinner />
          <span>Finding recommendations...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg max-w-xl w-full text-center">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      <div className="w-full max-w-7xl">
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 pt-8">
            {results.map((b, i) => (
              <BookCard key={`${b.title}-${i}`} book={b} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div className="flex flex-col items-center gap-4 text-center mt-16 text-slate-500">
            <BookIcon className="w-24 h-24" />
            <h2 className="text-2xl font-semibold">Ready to Read?</h2>
            <p className="max-w-md">
              Type a book title in the search bar above. When you select one,
              we'll show you 10 similar books you might also love.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
