"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient"; // แก้ path ตามโปรเจกต์คุณ
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useLoading } from "@/context/LoadingContext";

dayjs.locale("th");

interface Entry {
  buyerName: string;
  number: string;
  amount: number;
  discount: number;
  win: boolean;
  winAmount: number;
}

interface LotteryResult {
  firstPrize: string;
  lastTwoDigits: string;
  threeDigitFront: { round: number; value: string }[];
  threeDigitBack: { round: number; value: string }[];
}

interface LotteryResultResponse {
  success: boolean;
  date: {
    date: string;
    month: string;
    year: string;
  };
  data: LotteryResult;
}

export default function CheckLotteryPage() {
  const [number, setNumber] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [checked, setChecked] = useState(false);
  const [lotteryResult, setLotteryResult] =
    useState<LotteryResultResponse | null>(null);
  const [lotteryDate, setLotteryDate] = useState<string>("");
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        showLoading();
        const res = await apiClient.getLotteryResult();
        setLotteryResult(res);

        // แปลงวันที่ให้เป็นรูปแบบ "วันที่ 16 กรกฎาคม 2568"
        const { date, month, year } = res.date;
        const yearThai = (parseInt(year) + 543).toString();
        const formatted = dayjs(`${yearThai}-${month}-${date}`).format(
          "วันที่ D MMMM YYYY"
        );
        setLotteryDate(formatted);
      } catch (err) {
        console.error("ดึงผลหวยไม่สำเร็จ", err);
        hideLoading();
      } finally {
        hideLoading();
      }
    };

    fetchResult();
  }, []);

  // Mock รางวัล (สามารถดึงจาก API ได้)

  const prize = {
    first: "452643",
    twoDigit: "99",
    threeDigitFront: ["726", "594"],
    threeDigitLast: ["810", "361"],
  };
  const winningNumbers = [
    prize.twoDigit,
    ...prize.threeDigitFront,
    ...prize.threeDigitLast,
  ];

  const handleCheck = () => {
    const newEntries = [
      {
        buyerName: "Mr. Admin - BIGGROUP",
        number,
        amount: 200,
        discount: 0.05,
        win: winningNumbers.includes(number),
        winAmount: winningNumbers.includes(number) ? 90000 : 0,
      },
    ];
    setEntries(newEntries);
    setChecked(true);
  };

  const calculateTotal = () => {
    let totalBuy = 0;
    let totalDiscount = 0;
    let totalWin = 0;

    entries.forEach((e) => {
      totalBuy += e.amount;
      totalDiscount += e.amount * e.discount;
      totalWin += e.winAmount;
    });

    return {
      totalBuy,
      totalDiscount,
      netPay: totalBuy - totalDiscount,
      netResult: totalWin - (totalBuy - totalDiscount),
    };
  };

  const result = calculateTotal();

  return (
    <section className="min-h-screen bg-gradient-to-br from-indigo-900 via-sky-800/70 to-emerald-700 px-4 py-12 text-white">
      <Link
        href="/Home"
        className="absolute left-6 top-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
      >
        ← กลับหน้าเมนู
      </Link>
      <div className="mx-auto max-w-4xl space-y-8 rounded-3xl bg-white/10 p-8 shadow-xl ring-1 ring-white/15 backdrop-blur">
        {/* ✅ แสดงผลรางวัล */}
        {lotteryResult && (
          <div className="rounded-xl bg-white/10 p-6 shadow ring-1 ring-white/10">
            <h2 className="text-lg font-semibold mb-3">
              📅 ตรวจหวย {lotteryDate}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center text-sm sm:text-base">
              <div className="bg-sky-700/40 rounded-lg py-2">
                รางวัลที่ 1<br />
                <span className="font-bold text-lg">
                  {lotteryResult.data.firstPrize}
                </span>
              </div>
              <div className="bg-indigo-700/40 rounded-lg py-2">
                เลขท้าย 2 ตัว
                <br />
                <span className="font-bold text-lg">
                  {lotteryResult.data.lastTwoDigits}
                </span>
              </div>
              <div className="bg-purple-700/40 rounded-lg py-2">
                เลขหน้า 3 ตัว
                <br />
                {lotteryResult.data.threeDigitFront
                  .map((f) => f.value)
                  .join(" / ")}
              </div>
              <div className="bg-rose-700/40 rounded-lg py-2">
                เลขท้าย 3 ตัว
                <br />
                {lotteryResult.data.threeDigitBack
                  .map((b) => b.value)
                  .join(" / ")}
              </div>
            </div>
          </div>
        )}

        {/* ✅ ช่องตรวจหวย */}
        <div className="flex items-center gap-4">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="ใส่เลขที่ต้องการตรวจ"
            className="flex-1 rounded-xl bg-white/20 px-4 py-2 text-white placeholder:text-slate-300 outline-none"
          />
          <button
            onClick={handleCheck}
            className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold shadow hover:bg-emerald-600"
          >
            <Search className="inline-block h-5 w-5 mr-1" /> ตรวจ
          </button>
        </div>

        {/* ✅ แสดงผลการตรวจ */}
        {checked && entries.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* ด้านซ้าย: ข้อมูลทั่วไป */}
            <div className="rounded-xl bg-white/10 p-4 shadow ring-1 ring-white/10">
              <h2 className="mb-3 text-lg font-bold">📋 ผลการตรวจ เลขโต๊ด</h2>
              <p>ชื่อ: {entries[0].buyerName}</p>
              <p>
                เลข: <strong>{entries[0].number}</strong>
              </p>
              <p>ราคาซื้อ: {entries[0].amount} บาท</p>
              <p>ส่วนลด: {entries[0].discount * 100}%</p>
              <p>
                ราคาที่ต้องชำระ = {entries[0].amount} -{" "}
                {entries[0].amount * entries[0].discount} ={" "}
                <strong>
                  {entries[0].amount - entries[0].amount * entries[0].discount}
                </strong>{" "}
                บาท
              </p>
            </div>

            {/* ด้านขวา: สรุปผล */}
            <div className="rounded-xl bg-white/10 p-4 shadow ring-1 ring-white/10">
              <h2 className="mb-3 text-lg font-bold">📊 สรุปผลรางวัล</h2>
              <p>ถูกรางวัล: {entries[0].win ? "✅ ใช่" : "❌ ไม่ใช่"}</p>
              <p>
                ยอดถูกรางวัล:{" "}
                <strong>{entries[0].winAmount.toLocaleString()} บาท</strong>
              </p>
              <p>ยอดซื้อสุทธิ: {result.netPay.toLocaleString()} บาท</p>
              <p
                className={
                  result.netResult >= 0 ? "text-green-400" : "text-red-400"
                }
              >
                สรุป: {result.netResult >= 0 ? "กำไร" : "ขาดทุน"}{" "}
                {Math.abs(result.netResult).toLocaleString()} บาท
              </p>
            </div>
            {result && entries.length > 0 && (
              <div className="col-span-full rounded-xl bg-white/10 p-6 ring-1 ring-white/10 text-sm sm:text-base">
                <h2 className="mb-4 text-lg font-semibold">
                  ผลการตรวจ สอง-สามตัว บน-ล่าง
                </h2>

                <div className="border-b border-white/20 pb-3 mb-3 flex justify-between">
                  <span>ประเภทหวย</span>
                  <span>สามตัวบน</span>
                </div>

                <div className="space-y-1">
                  <p>ชื่อ: {entries[0].buyerName}</p>
                  <p>
                    เลข: <span className="font-bold">{entries[0].number}</span>
                  </p>
                  <p>ราคาซื้อ: {entries[0].amount} บาท</p>
                  <p>มีส่วนลด (ถ้ามี): {entries[0].discount * 100} %</p>
                  <p>
                    ราคาหวยที่ซื้อทั้งหมด:{" "}
                    <span className="font-bold">
                      {entries[0].amount + 960} บาท
                    </span>{" "}
                    {/* คุณจะต้องคำนวณจริงใน logic หรือรวมหลายรายการถ้ามี */}
                  </p>
                  <p className="mt-3 font-semibold">วิธีคำนวณค่าหวย</p>
                  <p>ค่าหวยที่ซื้อทั้งหมด - ส่วนลด% (ถ้ามี)</p>
                  <p>ถ้าถูกหวย = ราคาที่ซื้อ × ราคาหวย</p>
                  <p>
                    จากสูตร = {entries[0].amount + 960} -{" "}
                    {((entries[0].amount + 960) * entries[0].discount).toFixed(
                      2
                    )}
                  </p>
                  <p>จากสูตร = {entries[0].amount} × 450 บาท</p>
                  <p>
                    ดังนั้น ={" "}
                    {entries[0].win
                      ? `${entries[0].winAmount.toLocaleString()} - ${
                          result.netPay
                        }`
                      : `0 - ${result.netPay}`}
                  </p>
                  <p className="mt-2 font-bold text-emerald-400">
                    รวมเงิน: {result.netResult.toLocaleString()} บาท
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
