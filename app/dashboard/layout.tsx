import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard#profile", label: "Profile Info" },
  { href: "/dashboard#projects", label: "Projects" },
  { href: "/dashboard#certificates", label: "Certificates" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080808] text-[#d8ffd0]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-b border-[#2e6417] bg-[#0d0d0d] p-6 md:border-b-0 md:border-r">
          <p className="text-xs tracking-[0.24em] text-[#39ff14]">OBSIDIAN ADMIN</p>
          <h1 className="mt-2 text-xl font-semibold text-[#eaffdf]">Dashboard</h1>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-sm text-[#b8e8af] transition hover:border-[#39ff14] hover:text-[#e4ffd8]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
