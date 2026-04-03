import Link from "next/link";

export interface TopicCardData {
  slug: string;
  name: string;
  description: string | null;
  is_system: boolean;
  leaderboard_unlock_votes: number;
}

interface TopicCardProps {
  topic: TopicCardData;
  featured?: boolean;
  subtopics?: string[];
}

export default function TopicCard({ topic, featured = false, subtopics }: TopicCardProps) {
  return (
    <Link
      href={`/topic/${topic.slug}`}
      className={`
        group flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-150
        hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600
        ${featured
          ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-800 dark:border-zinc-200 text-white dark:text-zinc-900"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-semibold text-base leading-snug ${featured ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-zinc-100"}`}>
          {topic.name}
        </h3>
        {topic.is_system && (
          <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            featured
              ? "bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          }`}>
            Featured
          </span>
        )}
      </div>

      {subtopics && subtopics.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className={`text-xs font-medium ${featured ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
            Rank by:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {subtopics.map(name => (
              <span
                key={name}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  featured
                    ? "bg-white/15 dark:bg-zinc-900/30 text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ) : topic.description ? (
        <p className={`text-xs leading-relaxed line-clamp-2 ${featured ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
          {topic.description}
        </p>
      ) : null}

      <div className={`flex items-center gap-1.5 text-xs font-medium mt-auto pt-1 transition-colors ${
        featured
          ? "text-zinc-300 dark:text-zinc-600 group-hover:text-white dark:group-hover:text-zinc-900"
          : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
      }`}>
        Start voting
        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </Link>
  );
}
