import { Sermon } from "@/lib/api";

export default function SermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <div className="rounded-xl bg-vault-stone p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-vault-magenta">
        {sermon.categories.join(" • ")}
        {sermon.year ? ` · ${sermon.year}` : ""}
      </p>
      <h3 className="mt-1 text-lg font-bold text-vault-charcoal">
        {sermon.title}
      </h3>
      <p className="mt-2 text-sm text-gray-700 line-clamp-3">
        {sermon.description}
      </p>
      <div className="mt-3 flex gap-4">
        {sermon.spotify_link && (
          <a
            href={sermon.spotify_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-vault-magenta hover:underline"
          >
            Spotify
          </a>
        )}
        {sermon.apple_music_link && (
          <a
            href={sermon.apple_music_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-vault-magenta hover:underline"
          >
            Apple Music
          </a>
        )}
      </div>
    </div>
  );
}
