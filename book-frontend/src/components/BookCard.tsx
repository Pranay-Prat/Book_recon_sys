// src/components/BookCard.tsx
import BookIcon from "./BookIcon";


export interface Book {
  title: string;
  cover_url: string | null | false; // null: loading, false: no cover found, string: URL
  book_url: string | null;
}

export default function BookCard({ book }: { book: Book }) {
  const renderCover = () => {
    if (book.cover_url === null) {
      return <div className="w-full h-56 sm:h-64 bg-gray-200 animate-pulse"></div>;
    }

    if (book.cover_url === false) {
      return (
        <div className="w-full h-56 sm:h-64 bg-gray-100 text-gray-400 flex flex-col items-center justify-center gap-2">
          <BookIcon className="w-12 h-12" />
          <span className="text-xs font-medium">No Cover</span>
        </div>
      );
    }

    return (
      <img
        src={book.cover_url}
        alt={book.title}
        className="w-full h-56 sm:h-64 object-cover group-hover:opacity-90 transition-opacity"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://placehold.co/200x300/e2e8f0/94a3b8?text=Error";
        }}
      />
    );
  };

  return (
    <a
      href={
        book.book_url ||
        `https://www.google.com/search?q=${encodeURIComponent(book.title + " book")}`
      }
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col"
    >
      {renderCover()}
      <div className="p-4 grow">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
          {book.title}
        </p>
      </div>
    </a>
  );
}
