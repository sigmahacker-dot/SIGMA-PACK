// Tool card: bold border, layered shadow, hover lift + glow, staggered entrance.

import type { Tool } from "./types";

interface ToolCardProps {
  tool: Tool;
  index?: number;
}

export default function ToolCard({ tool, index = 0 }: ToolCardProps) {
  return (
    <div
      className="tool-card group flex flex-col rounded-2xl p-5"
      style={{ animationDelay: `${Math.min(index, 11) * 60}ms` }}
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className="tool-icon inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          // icon_svg is a server-generated original letter-mark; safe to render.
          dangerouslySetInnerHTML={{ __html: tool.icon_svg }}
          aria-hidden
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-brand-light">
            {tool.name}
          </h3>
          <span className="mt-1 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand-light ring-1 ring-brand/30">
            {tool.category}
          </span>
        </div>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{tool.description}</p>
    </div>
  );
}
