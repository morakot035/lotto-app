"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, FileEdit, Trash2 } from "lucide-react";
import { getToken } from "@/lib/auth";
import { apiClient } from "@/lib/apiClient";
import { useLoading } from "@/context/LoadingContext";


interface Buyers {
  _id: number;
  name: string;
  phone: string;
}

interface Entry {
  buyerName: string;
  number: string;
  top: string;
  tod: string;
  bottom2: string;
}

export default function EntryPage() {
  const [buyers, setBuyers] = useState<Buyers[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entry, setEntry] = useState<Entry>({
    buyerName: "",
    number: "",
    top: "",
    tod: "",
    bottom2: "",
  });

  const { showLoading, hideLoading } = useLoading();

  const numberRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLInputElement>(null);
  const todRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchBuyers = async () => {
      const token = getToken();
      if (!token) return;
      showLoading();
      try {
        const res = await apiClient.getBuyers(token);
        setBuyers(res.data);
      } catch (err) {
        console.error("โหลด buyers ล้มเหลว", err);
      } finally {
        hideLoading();
      }
    };
    fetchBuyers();
  }, []);

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | HTMLButtonElement>
  ) => {
    if (e.key === "Enter" && nextRef.current) {
      e.preventDefault();
      nextRef.current.focus();
    }
  };

  const handleSave = () => {
    if (!entry.buyerName || !entry.number) return;
    setEntries((prev) => [...prev, entry]);
    setEntry({ buyerName: "", number: "", top: "", tod: "", bottom2: "" });
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-sky-800/70 to-emerald-700 px-4 py-10 text-white">
      <Link
        href="/Home"
        className="absolute left-6 top-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
      >
        ← กลับหน้าเมนู
      </Link>

      <div className="w-full max-w-4xl rounded-3xl bg-white/10 p-8 backdrop-blur-md shadow-xl ring-1 ring-white/15">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold tracking-wide">
          <FileEdit className="h-7 w-7" /> คีย์ข้อมูลหวย
        </h1>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
          <select
            value={entry.buyerName}
            onChange={(e) => setEntry({ ...entry, buyerName: e.target.value })}
            className="rounded-xl bg-white/20 px-3 py-2 text-white outline-none backdrop-blur-sm"
          >
            <option value="">เลือกชื่อ</option>
            {buyers.map((b) => (
              <option key={b._id} value={b.name} className="text-black">
                {b.name}
              </option>
            ))}
          </select>
          <input
            ref={numberRef}
            value={entry.number}
            onChange={(e) => setEntry({ ...entry, number: e.target.value })}
            onKeyDown={(e) => handleInputKeyDown(e, topRef)}
            placeholder="เลข"
            className="rounded-xl bg-white/20 px-3 py-2 text-white placeholder-slate-300 outline-none"
          />
          <input
            ref={topRef}
            value={entry.top}
            onChange={(e) => setEntry({ ...entry, top: e.target.value })}
            onKeyDown={(e) => handleInputKeyDown(e, todRef)}
            placeholder="บน"
            className="rounded-xl bg-white/20 px-3 py-2 text-white placeholder-slate-300 outline-none"
          />
          <input
            ref={todRef}
            value={entry.tod}
            onChange={(e) => setEntry({ ...entry, tod: e.target.value })}
            onKeyDown={(e) => handleInputKeyDown(e, bottomRef)}
            placeholder="โต๊ด"
            className="rounded-xl bg-white/20 px-3 py-2 text-white placeholder-slate-300 outline-none"
          />
          <input
            ref={bottomRef}
            value={entry.bottom2}
            onChange={(e) => setEntry({ ...entry, bottom2: e.target.value })}
            onKeyDown={(e) => handleInputKeyDown(e, saveButtonRef)}
            placeholder="2 ตัวล่าง"
            className="rounded-xl bg-white/20 px-3 py-2 text-white placeholder-slate-300 outline-none"
          />
        </div>

        <button
          ref={saveButtonRef}
          onClick={handleSave}
          className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 font-semibold shadow-lg transition hover:bg-emerald-600 active:scale-95"
        >
          <Plus className="h-5 w-5" /> บันทึก
        </button>

        {/* Table */}
        {entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse rounded-xl text-white">
              <thead>
                <tr className="bg-white/20">
                  <th className="px-4 py-2">ชื่อ</th>
                  <th className="px-4 py-2">เลข</th>
                  <th className="px-4 py-2">บน</th>
                  <th className="px-4 py-2">โต๊ด</th>
                  <th className="px-4 py-2">2 ตัวล่าง</th>
                  <th className="px-4 py-2">ลบ</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, index) => (
                  <tr key={index} className="text-center">
                    <td className="px-4 py-2">{e.buyerName}</td>
                    <td className="px-4 py-2">{e.number}</td>
                    <td className="px-4 py-2">{e.top}</td>
                    <td className="px-4 py-2">{e.tod}</td>
                    <td className="px-4 py-2">{e.bottom2}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() =>
                          setEntries((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="rounded p-1 text-red-300 hover:bg-white/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
