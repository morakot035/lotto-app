"use client";

import { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { apiClient } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import { useLoading } from "@/context/LoadingContext";

interface Buyers {
  _id: number;
  name: string;
  phone: string;
}

interface EntryItem {
  buyerName: string;
  number: string;
  top?: { total: string; kept: string; sent: string };
  top2?: { total: string; kept: string; sent: string };
  tod?: { total: string; kept: string; sent: string };
  bottom2?: { total: string; kept: string; sent: string };
  bottom3?: { total: string; kept: string; sent: string };
  source: "self" | "dealer";
  createdAtThai: string;
}

export default function SummaryPage() {
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
        console.error("โหลด buyers ล้มเหลว", err);
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
      const res = await apiClient.getEntriesByBuyer(buyerName, token); // คุณต้องมี API นี้
      setEntries(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลสรุปล้มเหลว", err);
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

  const renderTable = (source: "self" | "dealer") => {
    const filtered = entries.filter((item) => item.source === source);
    if (filtered.length === 0)
      return <p className="text-slate-400">ไม่มีข้อมูล</p>;

    return (
      <table className="min-w-full border border-slate-300 rounded-md bg-white text-sm">
        <thead className="bg-sky-100 text-sky-900 font-semibold">
          <tr>
            <th className="px-3 py-2 border">เลข</th>
            <th className="px-3 py-2 border">บน</th>
            <th className="px-3 py-2 border">โต๊ด</th>
            <th className="px-3 py-2 border">ล่าง</th>
            <th className="px-3 py-2 border">เวลา</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item, index) => (
            <tr key={index} className="even:bg-sky-50">
              <td className="px-3 py-2 border">{item.number}</td>
              <td className="px-3 py-2 border">
                {item.top?.total || item.top2?.total || "-"}
              </td>
              <td className="px-3 py-2 border">{item.tod?.total || "-"}</td>
              <td className="px-3 py-2 border">
                {item.bottom3?.total || item.bottom2?.total || "-"}
              </td>
              <td className="px-3 py-2 border">{item.createdAtThai}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 px-6 py-10">
      <h1 className="text-center text-2xl font-bold text-blue-800 mb-6">
        สรุปยอดซื้อ
      </h1>

      <div className="max-w-xl mx-auto mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <div className="bg-white/70 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">ฝั่งเรา</h2>
          {renderTable("self")}
        </div>
        <div className="bg-white/70 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-rose-700 mb-2">
            ฝั่งเจ้ามือ
          </h2>
          {renderTable("dealer")}
        </div>
      </div>
    </section>
  );
}
