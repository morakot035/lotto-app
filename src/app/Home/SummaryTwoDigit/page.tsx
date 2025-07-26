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
    field: "top2" | "bottom2",
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
      sum("top2", subfield, sourceEntries) +
      sum("bottom2", subfield, sourceEntries)
    );
  };

  const filtered = entries.filter((e) => e.top2 || e.bottom2);
  const keptEntries = filtered;
  const sentEntries = filtered;

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 px-4 py-8">
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
              {keptEntries.map((item) => (
                <TableRow key={item._id}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top2?.kept
                      ? parseFloat(item.top2.kept).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom2?.kept
                      ? parseFloat(item.bottom2.kept).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell align="center" className="font-bold">
                  รวม
                </TableCell>
                <TableCell align="center">
                  {sum("top2", "kept", keptEntries).toLocaleString()} บาท
                </TableCell>
                <TableCell align="center">
                  {sum("bottom2", "kept", keptEntries).toLocaleString()} บาท
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={3}
                  align="center"
                  className="text-emerald-800 font-bold"
                >
                  ✅ รวมตัดเก็บ:{" "}
                  {sumTotal("kept", keptEntries).toLocaleString()} บาท
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
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
              {sentEntries.map((item) => (
                <TableRow key={item._id}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top2?.sent
                      ? parseFloat(item.top2.sent).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom2?.sent
                      ? parseFloat(item.bottom2.sent).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell align="center" className="font-bold">
                  รวม
                </TableCell>
                <TableCell align="center">
                  {sum("top2", "sent", sentEntries).toLocaleString()} บาท
                </TableCell>
                <TableCell align="center">
                  {sum("bottom2", "sent", sentEntries).toLocaleString()} บาท
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={3}
                  align="center"
                  className="text-rose-700 font-bold"
                >
                  ✅ รวมตัดส่ง: {sumTotal("sent", sentEntries).toLocaleString()}{" "}
                  บาท
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </section>
  );
}
