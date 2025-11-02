// src/components/BookIcon.tsx
export default function BookIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.185 0 4.237.62 6 1.741m6-16.279a8.967 8.967 0 01-6 2.291c-1.052 0-2.062-.18-3-.512v14.25A8.987 8.987 0 0018 18c2.185 0 4.237.62 6 1.741M18 6.042A8.967 8.967 0 0012 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0112 18c2.185 0 4.237.62 6 1.741"
      />
    </svg>
  );
}
