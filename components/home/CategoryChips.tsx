// Row of category chips with letter-mark icons (server-rendered, static list).

import Link from "next/link";

const CATEGORIES = [
  { letter: "V", name: "Video", color: "from-orange-500 to-amber-500" },
  { letter: "D", name: "Design", color: "from-sky-500 to-blue-600" },
  { letter: "W", name: "Writing", color: "from-violet-500 to-purple-600" },
  { letter: "A", name: "Audio", color: "from-emerald-500 to-teal-600" },
  { letter: "M", name: "Marketing", color: "from-rose-500 to-pink-600" },
  { letter: "I", name: "Images", color: "from-cyan-500 to-sky-600" },
  { letter: "C", name: "Chatbots", color: "from-indigo-500 to-violet-600" },
  { letter: "P", name: "Productivity", color: "from-lime-500 to-green-600" },
];

export default function CategoryChips() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.name}
            href={`/tools?category=${encodeURIComponent(c.name)}`}
            className="glass group flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 transition-transform hover:-translate-y-0.5"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-base font-extrabold text-white ${c.color}`}
            >
              {c.letter}
            </span>
            <span className="text-sm font-semibold text-slate-200 group-hover:text-white">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
