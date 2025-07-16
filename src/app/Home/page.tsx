"use client";

import Link from "next/link";
import {
  Users,
  Keyboard,
  CheckCircle,
  Sliders,
  Ban,
  ShoppingCart,
  FileText,
  Hash,
  Database,
  ListOrdered,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { useAuthGuard } from "@/hooks/useAuthGuard";

// export const metadata = { title: "Home | Lotto-App" };

const menu = [
  { title: "ผู้ซื้อ/คนเดินโพยหวย", href: "/Home/Buyers", icon: Users },
  { title: "คีย์ข้อมูลหวย", href: "/home/entry", icon: Keyboard },
  { title: "ตรวจหวย", href: "/home/check", icon: CheckCircle },
  { title: "ตั้งค่าตัดเก็บรายตัว", href: "/home/fee-setting", icon: Sliders },
  { title: "ตั้งค่าเลขไม่รับซื้อ", href: "/home/block-number", icon: Ban },
  { title: "ตั้งค่าซื้อ", href: "/home/purchase-setting", icon: ShoppingCart },
  { title: "สรุปยอดซื้อ", href: "/home/summary", icon: FileText },
  { title: "สรุป 2 ตัว บน–ล่าง", href: "/home/summary-2", icon: Hash },
  { title: "สรุป 3 ตัว", href: "/home/summary-3", icon: Hash },
  { title: "สำรองข้อมูลทั้งหมด", href: "/home/backup", icon: Database },
  { title: "สรุปเลขทั้งหมด", href: "/home/summary-all", icon: ListOrdered },
];

export default function HomePage() {
  useAuthGuard();
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-sky-800/70 to-emerald-700 px-4 py-14 text-white">
      {/* Header */}
      <div className="mx-auto mb-12 flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Lotto-App Dashboard</h1>
        <LogoutButton />
      </div>

      {/* Menu */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {menu.map(({ title, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group relative flex aspect-[5/3] flex-col items-center justify-center overflow-hidden rounded-3xl bg-white/10 p-6 text-center shadow-2xl ring-1 ring-white/15 backdrop-blur-xl transition hover:bg-white/15"
          >
            <Icon className="mb-3 h-10 w-10 text-indigo-300 transition group-hover:scale-110" />
            <span className="font-medium text-slate-100 transition-colors group-hover:text-white">
              {title}
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
