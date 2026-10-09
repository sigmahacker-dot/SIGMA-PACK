// Glass tool card: letter-mark icon, name, category chip, 2-line description.

import type { Tool } from "./types";

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="glass card-glow group flex flex-col rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-1">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          // icon_svg is a server-generated original letter-mark; safe to render.
          dangerouslySetInnerHTML={{ __html: tool.icon_svg }}
          aria-hidden
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-white">{tool.name}</h3>
          <span className="mt-1 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand-light">
            {tool.category}
          </span>
        </div>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{tool.description}</p>
    </div>
  );
}
