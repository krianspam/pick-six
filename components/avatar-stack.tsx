import type { Member } from "@/lib/types";
export function AvatarStack({ members, max = 4 }: { members: Member[]; max?: number }) {
  return <div className="flex -space-x-2">{members.slice(0, max).map(m => <span key={m.id} title={m.name} style={{ background: m.color }} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white text-[9px] font-extrabold text-ink">{m.initials}</span>)}{members.length > max && <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-ink text-[9px] font-bold text-white">+{members.length - max}</span>}</div>
}
