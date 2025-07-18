"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getToken } from "@/lib/auth";
import { apiClient } from "@/lib/apiClient";
import { useLoading } from "@/context/LoadingContext";
import AlertPopup from "@/components/AlertPopup";
import { Autocomplete, TextField } from "@mui/material";

interface Buyers {
  _id: number;
  name: string;
  phone: string;
}

interface LotteryEntry {
  buyerName: string;
  number: string;
  top?: string;
  tod?: string;
  bottom2?: string;
}

interface SaveLotteryResponse {
  data: LotteryEntry & { _id: string; createdAt: string };
  createdAtThai: string;
}

export default function EntryPage() {
  const [buyers, setBuyers] = useState<Buyers[]>([]);
  const [entries, setEntries] = useState<SaveLotteryResponse[]>([]);
  const [entry, setEntry] = useState<LotteryEntry>({
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
  const [blacklistNumbers, setBlacklistNumbers] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState("");

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

  useEffect(() => {
    const fetchBlacklist = async () => {
      const token = getToken();
      if (!token) return;
      const res = await apiClient.getBlacklist(token);
      setBlacklistNumbers(res.data.map((item) => item.number.trim()));
    };
    fetchBlacklist();
  }, []);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (blacklistNumbers.includes(inputValue.trim())) {
      setAlertMessage(`เลข ${inputValue} เป็นเลขที่ไม่รับซื้อ`);
      setEntry({ ...entry, number: "" }); // reset
    } else {
      setEntry({ ...entry, number: inputValue });
    }
  };

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef?: React.RefObject<HTMLInputElement | HTMLButtonElement | null>
  ) => {
    if (e.key === "Enter" && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  const handleSave = async () => {
    const numberLength = entry.number.trim().length;

    if (!entry.buyerName || (numberLength !== 2 && numberLength !== 3)) {
      setAlertMessage("กรุณากรอกเลขให้ถูกต้อง 2 หรือ 3 หลัก");
      return;
    }

    // กรณีเลข 3 หลัก
    if (numberLength === 3) {
      if (entry.bottom2) {
        setAlertMessage("เลข 3 ตัวห้ามกรอกช่อง 2 ตัวล่าง");
        return;
      }
    }

    // กรณีเลข 2 หลัก
    if (numberLength === 2) {
      if (entry.tod) {
        setAlertMessage("เลข 2 ตัวห้ามกรอกช่อง โต๊ด");
        return;
      }
    }

    try {
      showLoading();
      const token = getToken();
      if (!token) return;

      const response = await apiClient.saveLottery(entry, token);

      setEntries((prev) => [
        ...prev,
        {
          ...response.data,
          createdAtThai: response.createdAtThai,
        },
      ]);

      setEntry({ buyerName: "", number: "", top: "", tod: "", bottom2: "" });
    } catch (err) {
      hideLoading();
      console.error("บันทึกหวยล้มเหลว", err);
    } finally {
      hideLoading();
    }
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 px-4 py-10 text-gray-800 flex flex-col items-center">
        <Link
          href="/Home"
          className="absolute left-6 top-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
        >
          ← กลับหน้าเมนู
        </Link>

        <h1 className="mb-10 text-2xl font-bold text-blue-800">
          คีย์ข้อมูลหวย
        </h1>

        <div className="flex w-full max-w-6xl gap-6 flex-col lg:flex-row">
          {/* ฝั่งซ้าย: ฟอร์มกรอกข้อมูล */}
          <div className="flex-1 rounded-2xl bg-white/60 p-6 shadow-xl backdrop-blur-sm ring-1 ring-white/40">
            <div className="space-y-4">
              {/* Autocomplete เลือกชื่อ */}
              <div>
                <label className="block mb-1 text-sm font-medium">ชื่อ</label>
                <Autocomplete
                  options={buyers}
                  getOptionLabel={(option) => option.name}
                  value={buyers.find((b) => b.name === entry.buyerName) || null}
                  onChange={(event, newValue) => {
                    setEntry({ ...entry, buyerName: newValue?.name || "" });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="เลือกชื่อ"
                      variant="outlined"
                      sx={{
                        "& .MuiInputBase-root": {
                          backgroundColor: "rgba(255,255,255,0.7)",
                          borderRadius: "10px",
                        },
                        "& input": { color: "#1e293b" },
                      }}
                    />
                  )}
                />
              </div>

              {/* ช่องกรอกข้อมูลแนวตั้ง */}
              <div>
                <label className="block mb-1 text-sm font-medium">เลข</label>
                <input
                  ref={numberRef}
                  value={entry.number}
                  onChange={handleNumberChange}
                  onKeyDown={(e) => handleInputKeyDown(e, topRef)}
                  placeholder="เลข"
                  className="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">บน</label>
                <input
                  ref={topRef}
                  value={entry.top}
                  onChange={(e) => setEntry({ ...entry, top: e.target.value })}
                  onKeyDown={(e) => handleInputKeyDown(e, todRef)}
                  placeholder="บน"
                  className="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">โต๊ด</label>
                <input
                  ref={todRef}
                  value={entry.tod}
                  onChange={(e) => setEntry({ ...entry, tod: e.target.value })}
                  onKeyDown={(e) => handleInputKeyDown(e, bottomRef)}
                  placeholder="โต๊ด"
                  className="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  2 ตัวล่าง
                </label>
                <input
                  ref={bottomRef}
                  value={entry.bottom2}
                  onChange={(e) =>
                    setEntry({ ...entry, bottom2: e.target.value })
                  }
                  onKeyDown={(e) => handleInputKeyDown(e, saveButtonRef)}
                  placeholder="2 ตัวล่าง"
                  className="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                ref={saveButtonRef}
                onClick={handleSave}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-white transition hover:bg-emerald-600 active:scale-95"
              >
                <Plus className="h-5 w-5" /> บันทึก
              </button>
            </div>
          </div>

          {/* ฝั่งขวา: ตารางแสดงผล */}
          <div className="flex-1 rounded-2xl bg-white/70 p-6 shadow-xl backdrop-blur-sm ring-1 ring-white/40">
            <h2 className="mb-4 text-lg font-semibold text-blue-700">
              รายการที่บันทึก
            </h2>
            {entries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-300 rounded-lg bg-white/90 shadow-md text-sm">
                  <thead className="bg-blue-100 text-blue-800 font-semibold">
                    <tr>
                      <th className="px-3 py-2 border">ชื่อ</th>
                      <th className="px-3 py-2 border">เลข</th>
                      <th className="px-3 py-2 border">บน</th>
                      <th className="px-3 py-2 border">โต๊ด</th>
                      <th className="px-3 py-2 border">2 ตัวล่าง</th>
                      <th className="px-3 py-2 border">เวลา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((item, index) => (
                      <tr
                        key={index}
                        className="text-slate-700 even:bg-blue-50"
                      >
                        <td className="px-3 py-2 border">
                          {item.data.buyerName}
                        </td>
                        <td className="px-3 py-2 border">{item.data.number}</td>
                        <td className="px-3 py-2 border">{item.data.top}</td>
                        <td className="px-3 py-2 border">{item.data.tod}</td>
                        <td className="px-3 py-2 border">
                          {item.data.bottom2}
                        </td>
                        <td className="px-3 py-2 border">
                          {item.createdAtThai}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500">ยังไม่มีข้อมูลที่บันทึก</p>
            )}
          </div>
        </div>
      </section>

      {alertMessage && (
        <AlertPopup
          message={alertMessage}
          onClose={() => setAlertMessage("")}
        />
      )}
    </>
  );
}
