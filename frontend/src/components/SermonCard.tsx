import { Sermon } from "@/lib/api";

export default function SermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <a
      href={sermon.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl bg-vault-stone p-5 hover:-translate-y-1 hover:shadow-lg transition-all"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-vault-magenta">
        {sermon.category}
      </p>
      <h3 className="mt-1 text-lg font-bold text-vault-charcoal">
        {sermon.title}
      </h3>
      {sermon.speaker && (
        <p className="mt-1 text-sm text-gray-600">{sermon.speaker}</p>
      )}
      <p className="mt-2 text-sm text-gray-700 line-clamp-3">
        {sermon.description}
      </p>
    </a>
  );
}
