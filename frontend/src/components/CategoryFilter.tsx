export default function CategoryFilter({
  categories,
  active,
  onSelect,
}: {
  categories: string[];
  active: string | null;
  onSelect: (category: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          active === null
            ? "bg-vault-magenta text-white"
            : "bg-vault-stone text-vault-charcoal hover:bg-vault-lavender"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            active === c
              ? "bg-vault-magenta text-white"
              : "bg-vault-stone text-vault-charcoal hover:bg-vault-lavender"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
