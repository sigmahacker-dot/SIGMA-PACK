// Original letter-mark icon generator — colored rounded square + initials.
// Never copy real product logos; every tool gets one of these.
const PALETTE = [
  ['#FF6A00', '#0A1830'], // orange on navy
  ['#2563EB', '#FFFFFF'],
  ['#7C3AED', '#FFFFFF'],
  ['#059669', '#FFFFFF'],
  ['#DC2626', '#FFFFFF'],
  ['#0891B2', '#FFFFFF'],
  ['#DB2777', '#FFFFFF'],
  ['#4D7C0F', '#FFFFFF'],
  ['#0D9488', '#0A1830'],
  ['#EA580C', '#FFFFFF'],
  ['#1D4ED8', '#FFFFFF'],
  ['#9333EA', '#FFFFFF'],
];

function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? 'S';
  const second = words.length > 1 ? words[1][0] : (words[0]?.[1] ?? '');
  return (first + second).toUpperCase().slice(0, 2);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic original letter-mark SVG for a tool name. */
export function letterIcon(name: string): string {
  const [bg, fg] = PALETTE[hashStr(name) % PALETTE.length];
  const text = initials(name)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${bg}"/>` +
    `<rect x="3" y="3" width="58" height="58" rx="11" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="2"/>` +
    `<text x="32" y="41" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="bold" fill="${fg}" text-anchor="middle">${text}</text>` +
    `</svg>`
  );
}
