"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
} from "@mui/material";
import { apiClient } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import { useLoading } from "@/context/LoadingContext";
import Link from "next/link";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

type TwoDigitSummary = {
  number: string;
  top2: number;
  bottom2: number;
};

export default function SummaryTwoDigitPage() {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const { showLoading, hideLoading } = useLoading();

  const [cutConfig, setCutConfig] = useState<{
    threeDigitTop: string;
    threeDigitTod: string;
    threeDigitBottom: string;
    twoDigitTop: string;
    twoDigitBottom: string;
  } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await apiClient.getCutConfig(token);
        setCutConfig({
          threeDigitTop: res.data.threeDigitTop,
          threeDigitTod: res.data.threeDigitTod,
          threeDigitBottom: res.data.threeDigitBottom,
          twoDigitTop: res.data.twoDigitTop,
          twoDigitBottom: res.data.twoDigitBottom,
        });
      } catch (err) {
        console.error("โหลด cut config ล้มเหลว", err);
      }
    };

    const fetchEntries = async () => {
      const token = getToken();
      if (!token) return;
      showLoading();
      try {
        const res = await apiClient.getAll(token);
        setEntries(res.data);
      } catch (err) {
        console.error("โหลดข้อมูลไม่สำเร็จ", err);
      } finally {
        hideLoading();
      }
    };

    fetchConfig();
    fetchEntries();
  }, []);

  // -----------------------------
  // รวมตามเลข แล้วแตก kept/sent จาก total (ดูเฉพาะ self)
  // -----------------------------
  const getCappedEntries = (type: "kept" | "sent"): TwoDigitSummary[] => {
    if (!cutConfig) return [];

    const limitTop = parseFloat(cutConfig.twoDigitTop || "0");
    const limitBottom = parseFloat(cutConfig.twoDigitBottom || "0");

    // ใช้เฉพาะ self เป็นฐาน
    const selfEntries = entries.filter(
      (e) => (e.top2 || e.bottom2) && e.source === "self"
    );

    const combinedMap = new Map<
      string,
      { topTotal: number; bottomTotal: number }
    >();

    selfEntries.forEach((item) => {
      const number = item.number;
      const prev = combinedMap.get(number) || {
        topTotal: 0,
        bottomTotal: 0,
      };

      const topTotal = parseFloat(item.top2?.total || "0");
      const bottomTotal = parseFloat(item.bottom2?.total || "0");

      combinedMap.set(number, {
        topTotal: prev.topTotal + topTotal,
        bottomTotal: prev.bottomTotal + bottomTotal,
      });
    });

    return Array.from(combinedMap.entries())
      .map(([number, val]) => {
        const keptTop = Math.min(limitTop, val.topTotal);
        const keptBottom = Math.min(limitBottom, val.bottomTotal);

        const sentTop = Math.max(0, val.topTotal - keptTop);
        const sentBottom = Math.max(0, val.bottomTotal - keptBottom);

        return {
          number,
          top2: type === "kept" ? keptTop : sentTop,
          bottom2: type === "kept" ? keptBottom : sentBottom,
        };
      })
      .sort((a, b) => a.number.localeCompare(b.number));
  };

  const cappedKeptEntries = getCappedEntries("kept");
  const cappedSentEntries = getCappedEntries("sent");

  // -----------------------------
  // Export Excel ใช้ข้อมูลเดียวกับที่แสดงบนหน้า
  // -----------------------------
  const handleExportExcel = (type: "kept" | "sent") => {
    const cappedData = type === "kept" ? cappedKeptEntries : cappedSentEntries;

    const exportRows = cappedData.map((item) => ({
      เลข: item.number,
      "2 ตัวบน": item.top2,
      "2 ตัวล่าง": item.bottom2,
    }));

    const sumTop2 = cappedData.reduce((acc, cur) => acc + (cur.top2 || 0), 0);
    const sumBottom2 = cappedData.reduce(
      (acc, cur) => acc + (cur.bottom2 || 0),
      0
    );

    exportRows.push({
      เลข: "✅ รวม",
      "2 ตัวบน": sumTop2,
      "2 ตัวล่าง": sumBottom2,
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      type === "kept" ? "ตัดเก็บ" : "ตัดส่ง"
    );

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `สรุปยอด_2ตัว_${type}.xlsx`);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 px-4 py-8">
      <Link
        href="/Home"
        className="absolute left-6 top-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
      >
        ← กลับหน้าเมนู
      </Link>

      <h1 className="text-2xl font-bold text-orange-800 text-center mb-6">
        📊 สรุปยอดตัดเก็บ และตัดส่ง เลข 2 ตัว
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* ตัดเก็บ */}
        <div className="bg-white/80 p-4 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-green-700 mb-4 text-center">
            📦 สรุปยอดตัดเก็บ (kept)
          </h2>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">เลข</TableCell>
                <TableCell align="center">2 ตัวบน</TableCell>
                <TableCell align="center">2 ตัวล่าง</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cappedKeptEntries.map((item) => (
                <TableRow key={item.number}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top2 !== undefined ? item.top2.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom2 !== undefined
                      ? item.bottom2.toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-emerald-100">
                <TableCell
                  align="center"
                  className="font-bold text-emerald-900"
                >
                  รวม
                </TableCell>
                <TableCell
                  align="center"
                  className="text-emerald-900 font-semibold"
                >
                  {cappedKeptEntries
                    .reduce((acc, cur) => acc + (cur.top2 || 0), 0)
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
                <TableCell
                  align="center"
                  className="text-emerald-900 font-semibold"
                >
                  {cappedKeptEntries
                    .reduce((acc, cur) => acc + (cur.bottom2 || 0), 0)
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
              </TableRow>
              <TableRow className="bg-emerald-200 border-t border-emerald-300">
                <TableCell
                  colSpan={3}
                  align="center"
                  className="text-emerald-900 font-bold text-lg py-3"
                >
                  ✅ รวมตัดเก็บทั้งหมด:{" "}
                  {cappedKeptEntries
                    .reduce(
                      (acc, cur) => acc + (cur.top2 || 0) + (cur.bottom2 || 0),
                      0
                    )
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          <div className="mt-3 text-right">
            <button
              onClick={() => handleExportExcel("kept")}
              className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              📤 Export Excel
            </button>
          </div>
        </div>

        {/* ตัดส่ง */}
        <div className="bg-white/80 p-4 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-red-700 mb-4 text-center">
            🚚 สรุปยอดตัดส่ง (sent)
          </h2>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">เลข</TableCell>
                <TableCell align="center">2 ตัวบน</TableCell>
                <TableCell align="center">2 ตัวล่าง</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cappedSentEntries.map((item) => (
                <TableRow key={item.number}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top2 !== undefined ? item.top2.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom2 !== undefined
                      ? item.bottom2.toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-emerald-100">
                <TableCell
                  align="center"
                  className="font-bold text-emerald-900"
                >
                  รวม
                </TableCell>
                <TableCell
                  align="center"
                  className="text-emerald-900 font-semibold"
                >
                  {cappedSentEntries
                    .reduce((acc, cur) => acc + (cur.top2 || 0), 0)
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
                <TableCell
                  align="center"
                  className="text-emerald-900 font-semibold"
                >
                  {cappedSentEntries
                    .reduce((acc, cur) => acc + (cur.bottom2 || 0), 0)
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
              </TableRow>
              <TableRow className="bg-emerald-200 border-t border-emerald-300">
                <TableCell
                  colSpan={3}
                  align="center"
                  className="text-emerald-900 font-bold text-lg py-3"
                >
                  ✅ รวมตัดส่ง:{" "}
                  {cappedSentEntries
                    .reduce(
                      (acc, cur) => acc + (cur.top2 || 0) + (cur.bottom2 || 0),
                      0
                    )
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          <div className="mt-3 text-right">
            <button
              onClick={() => handleExportExcel("sent")}
              className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              📥 Export Excel
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
