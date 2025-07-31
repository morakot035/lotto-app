"use client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { apiClient } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import { useLoading } from "@/context/LoadingContext";
import { Trash } from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

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

interface ExcelRow {
  เลข: string;
  บน: string;
  โต๊ด: string;
  ล่าง: string;
  เวลา: string;
}

interface EntryItem {
  _id: string;
  buyerName: string;
  number: string;
  top?: AmountDetail;
  top2?: AmountDetail; // ใช้ในกรณี 2 ตัวบน (optional)
  tod?: AmountDetail;
  bottom2?: AmountDetail; // 2 ตัวล่าง (optional)
  bottom3?: AmountDetail; // 3 ตัวล่าง (optional)
  source: "self" | "dealer";
  createdAtThai: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function SummaryPage() {
  const [buyers, setBuyers] = useState<Buyers[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyers | null>(null);
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const { showLoading, hideLoading } = useLoading();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

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

  const calculateTotal = (source: "self" | "dealer") => {
    let total = 0;
    entries
      .filter((e) => e.source === source)
      .forEach((e) => {
        ["top", "top2", "tod", "bottom2", "bottom3"].forEach((key) => {
          const val = e[key as keyof EntryItem] as AmountDetail | undefined;
          if (val) {
            total += parseFloat(source === "self" ? val.kept : val.sent);
          }
        });
      });
    return total;
  };

  const sumColumn = (
    source: "self" | "dealer",
    type: "top" | "tod" | "bottom"
  ): number => {
    return entries
      .filter((e) => e.source === source)
      .reduce((acc, e) => {
        let field: { kept: string; sent: string } | undefined;

        if (type === "top") field = e.top || e.top2;
        else if (type === "tod") field = e.tod;
        else if (type === "bottom") field = e.bottom3 || e.bottom2;

        if (!field) return acc;

        return acc + parseFloat(source === "self" ? field.kept : field.sent);
      }, 0);
  };

  const handleDeleteClick = (number: string) => {
    setSelectedNumber(number);
    setModalOpen(true);
  };

  const handleDeletePair = async () => {
    if (!selectedBuyer || !selectedNumber) return;

    setModalOpen(true);
    try {
      showLoading();
      const token = getToken();
      if (!token) return;
      await apiClient.deleteEntryPair(
        selectedBuyer.name,
        selectedNumber,
        token
      );
      await fetchSummary(selectedBuyer.name); // รีโหลดใหม่
    } catch (err) {
      console.error("ลบไม่สำเร็จ", err);
      alert("เกิดข้อผิดพลาดในการลบ");
    } finally {
      hideLoading();
      setSelectedNumber(null);
      setModalOpen(false);
    }
  };

  const renderTable = (source: "self" | "dealer") => {
    const filtered = entries.filter((item) => item.source === source);
    if (filtered.length === 0)
      return <p className="text-slate-400">ไม่มีข้อมูล</p>;

    return (
      <>
        <table className="min-w-full border border-slate-300 rounded-md bg-white text-sm">
          <thead className="bg-sky-100 text-sky-900 font-semibold">
            <tr>
              <th className="px-3 py-2 border">เลข</th>
              <th className="px-3 py-2 border">บน</th>
              <th className="px-3 py-2 border">โต๊ด</th>
              <th className="px-3 py-2 border">ล่าง</th>
              <th className="px-3 py-2 border"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => {
              const getAmount = (field?: { kept: string; sent: string }) =>
                field ? (source === "self" ? field.kept : field.sent) : "-";

              return (
                <tr key={index} className="even:bg-sky-50">
                  <td className="px-3 py-2 border text-center">
                    {item.number}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    {getAmount(item.top || item.top2)}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    {getAmount(item.tod)}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    {getAmount(item.bottom3 || item.bottom2)}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    {source === "self" && (
                      <button
                        onClick={() => handleDeleteClick(item.number)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        <Trash size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50 font-bold text-blue-800">
              <td className="px-3 py-2 border text-center">รวม</td>
              <td className="px-3 py-2 border text-center">
                {sumColumn(source, "top").toLocaleString()}
              </td>
              <td className="px-3 py-2 border text-center">
                {sumColumn(source, "tod").toLocaleString()}
              </td>
              <td className="px-3 py-2 border text-center">
                {sumColumn(source, "bottom").toLocaleString()}
              </td>
              <td className="px-3 py-2 border"></td>
            </tr>
          </tfoot>
        </table>
      </>
    );
  };

  const handleExportDealerExcel = () => {
    const dealerData = entries.filter((e) => e.source === "dealer");

    const excelData: ExcelRow[] = dealerData.map((e) => ({
      เลข: e.number,
      บน: e.top?.sent || e.top2?.sent || "-",
      โต๊ด: e.tod?.sent || "-",
      ล่าง: e.bottom3?.sent || e.bottom2?.sent || "-",
      เวลา: e.createdAtThai,
    }));

    excelData.push({
      เลข: "รวม",
      บน: sumColumn("dealer", "top").toLocaleString(),
      โต๊ด: sumColumn("dealer", "tod").toLocaleString(),
      ล่าง: sumColumn("dealer", "bottom").toLocaleString(),
      เวลา: "",
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dealer Summary");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, `dealer-summary-${selectedBuyer?.name}.xlsx`);
  };

  return (
    <section className="min-h-screen bg-gray-100 px-4 py-10 text-gray-800">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-800">📊 สรุปยอดซื้อ</h1>
          <Link
            href="/Home"
            className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 shadow hover:bg-blue-200 transition"
          >
            ← กลับหน้าเมนู
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow ring-1 ring-gray-200">
          <Autocomplete
            options={buyers}
            getOptionLabel={(option) => option.name}
            value={selectedBuyer}
            onChange={(event, newValue) => handleBuyerChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="🔍 ค้นหาผู้ซื้อ"
                variant="outlined"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ฝั่งเรา */}
          <div className="bg-white p-6 rounded-xl shadow ring-1 ring-gray-200">
            <h2 className="text-lg font-semibold text-emerald-700 mb-4">
              🧾 ฝั่งเรา (เก็บเอง)
            </h2>
            {renderTable("self")}
            <p className="mt-4 font-bold text-emerald-600">
              ✅ รวมยอด: {calculateTotal("self").toLocaleString()} บาท
            </p>
          </div>

          {/* ฝั่งเจ้ามือ */}
          <div className="bg-white p-6 rounded-xl shadow ring-1 ring-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rose-700">
                📨 ฝั่งเจ้ามือ (ตัดส่ง)
              </h2>
              {selectedBuyer && (
                <button
                  onClick={handleExportDealerExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm shadow"
                >
                  📤 Export Excel
                </button>
              )}
            </div>
            {renderTable("dealer")}
            <p className="mt-4 font-bold text-rose-600">
              ✅ รวมยอด: {calculateTotal("dealer").toLocaleString()} บาท
            </p>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleDeletePair}
        title="ยืนยันการลบ"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบเลข ${selectedNumber} ทั้งฝั่งเก็บและส่ง?`}
      />
    </section>
  );
}
