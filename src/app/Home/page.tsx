"use client";

import Link from "next/link";
import {
  Users,
  Keyboard,
  CheckCircle,
  Sliders,
  Ban,
  FileText,
  Hash,
  Database,
  ListOrdered,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const menu = [
  { title: "ผู้ซื้อ/คนเดินโพยหวย", href: "/Home/Buyers", icon: Users },
  { title: "คีย์ข้อมูลหวย", href: "/Home/Entry", icon: Keyboard },
  { title: "ตรวจหวย", href: "/Home/CheckLottery", icon: CheckCircle },
  { title: "ตั้งค่าตัดเก็บรายตัว", href: "/Home/CutSetting", icon: Sliders },
  { title: "ตั้งค่าเลขไม่รับซื้อ", href: "/Home/Blacklist", icon: Ban },
  { title: "สรุปยอดซื้อ", href: "/Home/Summary", icon: FileText },
  { title: "สรุป 2 ตัว บน–ล่าง", href: "/Home/SummaryTwoDigit", icon: Hash },
  { title: "สรุป 3 ตัว", href: "/Home/SummaryThreeDigit", icon: Hash },
  { title: "สำรองข้อมูลทั้งหมด", href: "/home/backup", icon: Database },
  { title: "สรุปเลขทั้งหมด", href: "/home/summary-all", icon: ListOrdered },
];

export default function HomePage() {
  useAuthGuard();

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-sky-800 to-emerald-700 px-4 py-14 text-white">
      {/* Header */}
      <div className="mx-auto mb-12 flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-wide">Lotto Application</h1>
        <LogoutButton />
      </div>

      {/* Menu */}
      <section className="mx-auto grid max-w-7xl gap-6 px-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {menu.map(({ title, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group relative flex aspect-[5/3] flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-xl ring-1 ring-white/10 backdrop-blur-md transition hover:scale-105 hover:border-white/30 hover:bg-white/15"
          >
            <Icon className="mb-4 h-12 w-12 text-white/80 transition duration-200 group-hover:text-white" />
            <span className="text-lg font-semibold tracking-tight text-white/90 group-hover:text-white">
              {title}
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
