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

export default function SummaryThreeDigitPage() {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
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
  const keptEntries = filtered;
  const sentEntries = filtered;

  const handleExportExcel = (type: "kept" | "sent") => {
    const rows = filtered.map((item) => ({
      เลข: item.number,
      "3 ตัวบน": item.top?.[type] || 0,
      "3 ตัวโต๊ด": item.tod?.[type] || 0,
      "3 ตัวล่าง": item.bottom3?.[type] || 0,
    }));

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
              {keptEntries.map((item) => (
                <TableRow key={item._id}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top?.kept
                      ? parseFloat(item.top.kept).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.tod?.kept
                      ? parseFloat(item.tod.kept).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom3?.kept
                      ? parseFloat(item.bottom3.kept).toLocaleString()
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
                  {sum("top", "kept", keptEntries).toLocaleString()} บาท
                </TableCell>
                <TableCell
                  align="center"
                  className="text-emerald-900 font-semibold"
                >
                  {sum("tod", "kept", keptEntries).toLocaleString()} บาท
                </TableCell>
                <TableCell
                  align="center"
                  className="text-emerald-900 font-semibold"
                >
                  {sum("bottom3", "kept", keptEntries).toLocaleString()} บาท
                </TableCell>
              </TableRow>
              <TableRow className="bg-emerald-200 border-t border-emerald-300">
                <TableCell
                  colSpan={4}
                  align="center"
                  className="text-emerald-900 font-bold text-lg py-3"
                >
                  ✅ รวมตัดเก็บ:{" "}
                  {sumTotal("kept", keptEntries).toLocaleString()} บาท
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
              {sentEntries.map((item) => (
                <TableRow key={item._id}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top?.kept
                      ? parseFloat(item.top.sent).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.tod?.kept
                      ? parseFloat(item.tod.sent).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom3?.kept
                      ? parseFloat(item.bottom3.sent).toLocaleString()
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
