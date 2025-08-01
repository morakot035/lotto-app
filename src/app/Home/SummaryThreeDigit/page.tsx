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
  top?: AmountDetail;
  tod?: AmountDetail;
  bottom3?: AmountDetail;
  source: "self" | "dealer";
  createdAtThai: string;
}

type ExportRow = {
  เลข: string;
  "3 ตัวบน": number;
  "3 ตัวโต๊ด": number;
  "3 ตัวล่าง": number;
};

export default function SummaryThreeDigitPage() {
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

  const sum = (
    field: "top" | "tod" | "bottom3",
    subfield: "kept" | "sent",
    sourceEntries: EntryItem[] = entries
  ) => {
    return sourceEntries.reduce((acc, entry) => {
      const value = entry[field]?.[subfield];
      return acc + (value ? parseFloat(value) : 0);
    }, 0);
  };

  const sumTotal = (
    subfield: "kept" | "sent",
    sourceEntries: EntryItem[] = entries
  ) => {
    return (
      sum("top", subfield, sourceEntries) +
      sum("tod", subfield, sourceEntries) +
      sum("bottom3", subfield, sourceEntries)
    );
  };

  const filtered = entries.filter((e) => e.top || e.tod || e.bottom3);

  const keptEntries = filtered.filter((e) => e.source === "self");
  const sentEntries = filtered.filter((e) => e.source === "dealer");

  const getCappedEntries = (entries: EntryItem[], type: "kept" | "sent") => {
    if (type === "kept" && !cutConfig) return [];

    const limitTop = parseFloat(cutConfig?.threeDigitTop || "0");
    const limitTod = parseFloat(cutConfig?.threeDigitTod || "0");
    const limitBottom = parseFloat(cutConfig?.threeDigitBottom || "0");

    const combinedMap = new Map<
      string,
      { top: number; tod: number; bottom3: number }
    >();

    entries.forEach((item) => {
      const number = item.number;
      const prev = combinedMap.get(number) || {
        top: 0,
        tod: 0,
        bottom3: 0,
      };

      const rawTop = parseFloat(item.top?.[type] || "0");
      const rawTod = parseFloat(item.tod?.[type] || "0");
      const rawBottom = parseFloat(item.bottom3?.[type] || "0");

      const topAdd =
        type === "kept" ? Math.min(limitTop - prev.top, rawTop) : rawTop;
      const todAdd =
        type === "kept" ? Math.min(limitTod - prev.tod, rawTod) : rawTod;
      const bottomAdd =
        type === "kept"
          ? Math.min(limitBottom - prev.bottom3, rawBottom)
          : rawBottom;

      combinedMap.set(number, {
        top: prev.top + Math.max(0, topAdd),
        tod: prev.tod + Math.max(0, todAdd),
        bottom3: prev.bottom3 + Math.max(0, bottomAdd),
      });
    });

    return Array.from(combinedMap.entries()).map(([number, val]) => ({
      number,
      top: val.top,
      tod: val.tod,
      bottom3: val.bottom3,
    }));
  };

  const handleExportExcel = (type: "kept" | "sent") => {
    // ใช้ข้อมูลจาก UI ที่ผ่านการ limit แล้ว
    const sourceEntries =
      type === "kept"
        ? getCappedEntries(keptEntries, "kept")
        : getCappedEntries(sentEntries, "sent");

    // สร้างแถวสำหรับ export
    const rows: ExportRow[] = sourceEntries
      .sort((a, b) => a.number.localeCompare(b.number))
      .map((item) => ({
        เลข: item.number,
        "3 ตัวบน": item.top,
        "3 ตัวโต๊ด": item.tod,
        "3 ตัวล่าง": item.bottom3,
      }));

    // คำนวณรวม
    const totalTop = rows.reduce((acc, row) => acc + (row["3 ตัวบน"] || 0), 0);
    const totalTod = rows.reduce(
      (acc, row) => acc + (row["3 ตัวโต๊ด"] || 0),
      0
    );
    const totalBottom3 = rows.reduce(
      (acc, row) => acc + (row["3 ตัวล่าง"] || 0),
      0
    );

    // เพิ่มแถวรวม
    rows.push({
      เลข: "✅ รวม",
      "3 ตัวบน": totalTop,
      "3 ตัวโต๊ด": totalTod,
      "3 ตัวล่าง": totalBottom3,
    });

    // Export Excel
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      type === "kept" ? "ตัดเก็บ" : "ตัดส่ง"
    );

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(data, `สรุปยอด_${type}.xlsx`);
  };

  const cappedKeptEntries = getCappedEntries(keptEntries, "kept");

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 px-4 py-8">
      <Link
        href="/Home"
        className="absolute left-6 top-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
      >
        ← กลับหน้าเมนู
      </Link>

      <h1 className="text-2xl font-bold text-orange-800 text-center mb-6">
        📊 สรุปยอดตัดเก็บ และตัดส่ง เลข 3 ตัว
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
                <TableCell align="center">3 ตัวบน</TableCell>
                <TableCell align="center">3 โต๊ด</TableCell>
                <TableCell align="center">3 ตัวล่าง</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCappedEntries(keptEntries, "kept").map((item) => (
                <TableRow key={item.number}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top ? item.top.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.tod ? item.tod.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom3 ? item.bottom3.toLocaleString() : "-"}
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
                    .reduce((acc, item) => acc + (item.top || 0), 0)
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
                <TableCell
                  align="center"
                  className="text-emerald-900 font-semibold"
                >
                  {cappedKeptEntries
                    .reduce((acc, item) => acc + (item.tod || 0), 0)
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
                <TableCell
                  align="center"
                  className="text-emerald-900 font-semibold"
                >
                  {cappedKeptEntries
                    .reduce((acc, item) => acc + (item.bottom3 || 0), 0)
                    .toLocaleString()}{" "}
                  บาท
                </TableCell>
              </TableRow>
              <TableRow className="bg-emerald-200 border-t border-emerald-300">
                <TableCell
                  colSpan={4}
                  align="center"
                  className="text-emerald-900 font-bold text-lg py-3"
                >
                  ✅ รวมตัดเก็บ:{" "}
                  {(
                    cappedKeptEntries.reduce(
                      (acc, item) => acc + (item.top || 0),
                      0
                    ) +
                    cappedKeptEntries.reduce(
                      (acc, item) => acc + (item.tod || 0),
                      0
                    ) +
                    cappedKeptEntries.reduce(
                      (acc, item) => acc + (item.bottom3 || 0),
                      0
                    )
                  ).toLocaleString()}{" "}
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
                <TableCell align="center">3 ตัวบน</TableCell>
                <TableCell align="center">3 โต๊ด</TableCell>
                <TableCell align="center">3 ตัวล่าง</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCappedEntries(sentEntries, "sent").map((item) => (
                <TableRow key={item.number}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top ? item.top.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.tod ? item.tod.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom3 ? item.bottom3.toLocaleString() : "-"}
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
                  className="font-bold text-emerald-900"
                >
                  {sum("top", "sent", sentEntries).toLocaleString()} บาท
                </TableCell>
                <TableCell
                  align="center"
                  className="font-bold text-emerald-900"
                >
                  {sum("tod", "sent", sentEntries).toLocaleString()} บาท
                </TableCell>
                <TableCell
                  align="center"
                  className="font-bold text-emerald-900"
                >
                  {sum("bottom3", "sent", sentEntries).toLocaleString()} บาท
                </TableCell>
              </TableRow>
              <TableRow className="bg-emerald-200 border-t border-emerald-300">
                <TableCell
                  colSpan={4}
                  align="center"
                  className="text-emerald-900 font-bold text-lg py-3"
                >
                  ✅ รวมตัดส่ง: {sumTotal("sent", sentEntries).toLocaleString()}{" "}
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
