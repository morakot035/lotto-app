"use client";
import { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { apiClient } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import { useLoading } from "@/context/LoadingContext";
import Link from "next/link";

interface Buyers {
  _id: number;
  name: string;
  phone: string;
}

interface AmountDetail {
  total: string;
  kept: string;
  sent: string;
}

interface EntryItem {
  _id: string;
  buyerName: string;
  number: string;
  top2?: AmountDetail;
  bottom2?: AmountDetail;
  source: "self" | "dealer";
  createdAtThai: string;
}

export default function SummaryTwoDigitPage() {
  const [buyers, setBuyers] = useState<Buyers[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyers | null>(null);
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchBuyers = async () => {
      const token = getToken();
      if (!token) return;
      showLoading();
      try {
        const res = await apiClient.getBuyers(token);
        setBuyers(res.data);
      } catch (err) {
        console.error("โหลดรายชื่อผู้ซื้อไม่สำเร็จ", err);
      } finally {
        hideLoading();
      }
    };
    fetchBuyers();
  }, []);

  const fetchSummary = async (buyerName: string) => {
    const token = getToken();
    if (!token) return;
    showLoading();
    try {
      const res = await apiClient.getEntriesByBuyer(buyerName, token);
      setEntries(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลไม่สำเร็จ", err);
    } finally {
      hideLoading();
    }
  };

  const handleBuyerChange = (buyer: Buyers | null) => {
    setSelectedBuyer(buyer);
    if (buyer) {
      fetchSummary(buyer.name);
    } else {
      setEntries([]);
    }
  };

  const sum = (field: "top2" | "bottom2", subfield: "kept" | "sent") => {
    return entries.reduce((acc, entry) => {
      const value = entry[field]?.[subfield];
      return acc + (value ? parseFloat(value) : 0);
    }, 0);
  };

  const filtered = entries.filter((e) => e.top2 || e.bottom2);

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 px-6 py-10">
      <h1 className="text-2xl font-bold text-orange-800 text-center mb-6">
        สรุปยอด 2 ตัว บน - ล่าง
      </h1>
      <Link
        href="/Home"
        className="absolute left-6 top-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
      >
        ← กลับหน้าเมนู
      </Link>

      <div className="max-w-xl mx-auto mb-6">
        <Autocomplete
          options={buyers}
          getOptionLabel={(option) => option.name}
          value={selectedBuyer}
          onChange={(event, newValue) => handleBuyerChange(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="ค้นหาผู้ซื้อ" variant="outlined" />
          )}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-orange-100 font-semibold">
              <tr>
                <th className="border px-2 py-1">เลข</th>
                <th className="border px-2 py-1">2 ตัวบน</th>
                <th className="border px-2 py-1">2 ตัวล่าง</th>
                <th className="border px-2 py-1">เวลา</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} className="even:bg-orange-50 text-center">
                  <td className="border px-2 py-1">{item.number}</td>
                  <td className="border px-2 py-1">{item.top2?.kept || "-"}</td>
                  <td className="border px-2 py-1">
                    {item.bottom2?.kept || "-"}
                  </td>
                  <td className="border px-2 py-1">{item.createdAtThai}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-yellow-100 text-right">
                <td className="border px-2 py-1 text-right">รวม</td>
                <td className="border px-2 py-1 text-center">
                  {sum("top2", "kept").toLocaleString()} บาท
                </td>
                <td className="border px-2 py-1 text-center">
                  {sum("bottom2", "kept").toLocaleString()} บาท
                </td>
                <td className="border px-2 py-1"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        selectedBuyer && (
          <p className="text-center text-gray-500 mt-10">
            ไม่พบข้อมูลเลข 2 ตัว
          </p>
        )
      )}
    </section>
  );
}
