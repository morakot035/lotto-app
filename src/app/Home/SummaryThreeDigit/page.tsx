"use client";
import { useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  top?: AmountDetail;
  tod?: AmountDetail;
  bottom3?: AmountDetail;
  source: "self" | "dealer";
  createdAtThai: string;
}

export default function SummaryThreeDigitPage() {
  const [buyers, setBuyers] = useState<Buyers[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyers | null>(null);
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [openModal, setOpenModal] = useState(false);
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

  const filteredSelf = filtered.filter((e) => e.source === "self");

  const handleExportExcel = () => {
    const rows = filteredSelf.map((item) => ({
      เลข: item.number,
      "3 ตัวบน": item.top?.sent || 0,
      โต๊ด: item.tod?.sent || 0,
      ล่าง: item.bottom3?.sent || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "เจ้ามือหวย");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `เจ้ามือหวย_${selectedBuyer?.name}.xlsx`);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200 px-6 py-10">
      <h1 className="text-2xl font-bold text-emerald-800 text-center mb-6">
        สรุปยอดเลข 3 ตัว
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
            <thead className="bg-emerald-100 font-semibold">
              <tr>
                <th className="border px-2 py-1">เลข</th>
                <th className="border px-2 py-1">3 ตัวบน</th>
                <th className="border px-2 py-1">โต๊ด</th>
                <th className="border px-2 py-1">ล่าง</th>
                <th className="border px-2 py-1">เวลา</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} className="even:bg-emerald-50 text-center">
                  <td className="border px-2 py-1">{item.number}</td>
                  <td className="border px-2 py-1">{item.top?.kept || "-"}</td>
                  <td className="border px-2 py-1">{item.tod?.kept || "-"}</td>
                  <td className="border px-2 py-1">
                    {item.bottom3?.kept || "-"}
                  </td>
                  <td className="border px-2 py-1">{item.createdAtThai}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-green-100 text-right">
                <td className="border px-2 py-1 text-right">รวม</td>
                <td className="border px-2 py-1 text-center">
                  {sum("top", "kept").toLocaleString()} บาท
                </td>
                <td className="border px-2 py-1 text-center">
                  {sum("tod", "kept").toLocaleString()} บาท
                </td>
                <td className="border px-2 py-1 text-center">
                  {sum("bottom3", "kept").toLocaleString()} บาท
                </td>
                <td className="border px-2 py-1 text-center font-bold text-emerald-700"></td>
              </tr>
            </tfoot>
          </table>

          {/* รวมทั้งสิ้น */}
          <div className="mt-4 p-3 bg-emerald-100 text-right font-semibold rounded">
            ✅ รวมทั้งสิ้น:{" "}
            <span className="text-lg text-emerald-800 font-bold">
              {sumTotal("kept").toLocaleString()} บาท
            </span>
          </div>

          {/* ปุ่มส่งเจ้ามือหวย */}
          <div className="mt-4 text-right">
            {selectedBuyer && (
              <button
                onClick={() => setOpenModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
              >
                📤 ส่งให้เจ้ามือหวย
              </button>
            )}
          </div>
        </div>
      ) : (
        selectedBuyer && (
          <p className="text-center text-gray-500 mt-10">
            ไม่พบข้อมูลเลข 3 ตัว
          </p>
        )
      )}

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>รายการที่จะส่งให้เจ้ามือหวย</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">เลข</TableCell>
                <TableCell align="center">3 ตัวบน </TableCell>
                <TableCell align="center">โต๊ด </TableCell>
                <TableCell align="center">ล่าง </TableCell>
                <TableCell align="center"> </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSelf.map((item) => (
                <TableRow key={item._id}>
                  <TableCell align="center">{item.number}</TableCell>
                  <TableCell align="center">
                    {item.top?.sent.toLocaleString() || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.tod?.sent.toLocaleString() || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {item.bottom3?.sent || "-"}
                  </TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell align="center" className="font-bold">
                  รวม
                </TableCell>
                <TableCell align="center">
                  {sum("top", "sent", filteredSelf).toLocaleString()} บาท
                </TableCell>
                <TableCell align="center">
                  {sum("tod", "sent", filteredSelf).toLocaleString()} บาท
                </TableCell>
                <TableCell align="center">
                  {sum("bottom3", "sent", filteredSelf).toLocaleString()} บาท
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  className="font-bold text-emerald-700"
                >
                  รวมยอดส่งให้เจ้ามือทั้งหมด:{" "}
                  {sumTotal("sent", filteredSelf).toLocaleString()} บาท
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => handleExportExcel()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            📥 Export Excel
          </Button>
          <Button onClick={() => setOpenModal(false)} color="inherit">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
