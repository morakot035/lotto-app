"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useLoading } from "@/context/LoadingContext";
import { getToken } from "@/lib/auth";

dayjs.locale("th");

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

interface AmountDetail {
  total: string;
  kept: string;
  sent: string;
}

interface WinnerType {
  type: string;
  amount: AmountDetail;
}

interface WinnerItem {
  name: string;
  number: string;
  source: "self" | "dealer";
  matchedTypes: WinnerType[];
}

const PAY_RATES: Record<string, number> = {
  "2 ตัวบน": 65,
  "2 ตัวล่าง": 65,
  "3 ตัวบน": 450,
  โต๊ด: 95,
  "3 ตัวล่าง": 95,
};

export default function CheckLotteryPage() {
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [checked, setChecked] = useState(false);
  const [lotteryResult, setLotteryResult] =
    useState<LotteryResultResponse | null>(null);
  const [lotteryDate, setLotteryDate] = useState<string>("");
  const { showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        showLoading();
        const res = await apiClient.getLotteryResult();
        setLotteryResult(res);
        setError(null); // ✅ เคลียร์ error ถ้าสำเร็จ

        const { date, month, year } = res.date;
        const yearThai = (parseInt(year) + 543).toString();
        const formatted = dayjs(`${yearThai}-${month}-${date}`).format(
          "วันที่ D MMMM YYYY"
        );
        setLotteryDate(formatted);
      } catch (err) {
        console.error("ดึงผลหวยไม่สำเร็จ", err);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูลหวยจากเซิร์ฟเวอร์");
      } finally {
        hideLoading();
      }
    };

    fetchResult();
  }, []);

  const handleCheck = async () => {
    const token = getToken();
    if (!token) return;
    try {
      showLoading();
      const res = await apiClient.getWinners(token);
      setWinners(res.winners);
      setChecked(true);
      setError(null);
    } catch (err) {
      console.error("เกิดข้อผิดพลาด", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลผลผู้ถูกรางวัล");
    } finally {
      hideLoading();
    }
  };

  // const calculateTotalWinningAmount = () => {
  //   return winners
  //     .flatMap((w) => w.matchedTypes)
  //     .reduce((sum, type) => {
  //       const rate = PAY_RATES[type.type] || 0;
  //       const keptAmount = Number(type.amount.kept); // จำนวนเงินที่ซื้อ
  //       return sum + keptAmount * rate;
  //     }, 0);
  // };

  function calculateWinnerAmount(winner: WinnerItem): number {
    return winner.matchedTypes.reduce((sum, type) => {
      const rate = PAY_RATES[type.type] || 0;
      const kept = Number(type.amount.kept);
      return sum + kept * rate;
    }, 0);
  }

  return (
    <section className="min-h-screen bg-gray-100 px-4 py-12 text-gray-800">
      <Link
        href="/Home"
        className="absolute left-6 top-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
      >
        ← กลับหน้าเมนู
      </Link>
      <div className="mx-auto max-w-4xl space-y-10">
        {lotteryResult && (
          <div className="bg-white p-6 rounded-xl shadow ring-1 ring-gray-200">
            <h2 className="text-lg font-semibold mb-4">
              📅 ผลสลากประจำวันที่ {lotteryDate}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm">รางวัลที่ 1</p>
                <p className="text-xl font-bold">
                  {lotteryResult.data.firstPrize}
                </p>
              </div>
              <div>
                <p className="text-sm">เลขท้าย 2 ตัว</p>
                <p className="text-xl font-bold">
                  {lotteryResult.data.lastTwoDigits}
                </p>
              </div>
              <div>
                <p className="text-sm">เลขหน้า 3 ตัว</p>
                <p>
                  {lotteryResult.data.threeDigitFront
                    .map((f) => f.value)
                    .join(" / ")}
                </p>
              </div>
              <div>
                <p className="text-sm">เลขท้าย 3 ตัว</p>
                <p>
                  {lotteryResult.data.threeDigitBack
                    .map((b) => b.value)
                    .join(" / ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {lotteryResult && (
          <div className="flex justify-center">
            <button
              onClick={handleCheck}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2 rounded shadow"
            >
              ตรวจหวย
            </button>
          </div>
        )}

        {checked && winners.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">🎉 รายชื่อผู้ถูกรางวัล</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {winners.map((winner, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-xl shadow ring-1 ring-gray-200 space-y-2"
                >
                  <h3 className="font-medium">🧑‍💼 {winner.name}</h3>
                  <p>
                    เลขที่ซื้อ: <strong>{winner.number}</strong>
                  </p>
                  {winner.matchedTypes.map((match, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-3 rounded border text-sm"
                    >
                      <p>ประเภท: {match.type}</p>
                      <p>
                        ยอดรวม: {Number(match.amount.total).toLocaleString()}{" "}
                        บาท
                      </p>
                      <p>
                        เก็บเอง: {Number(match.amount.kept).toLocaleString()}{" "}
                        บาท
                      </p>
                      <p>
                        ส่งเจ้ามือ: {Number(match.amount.sent).toLocaleString()}{" "}
                        บาท
                      </p>
                    </div>
                  ))}
                  <p className="text-emerald-600 font-semibold">
                    ✅ รวมยอดที่ได้รับ:{" "}
                    {calculateWinnerAmount(winner).toLocaleString()} บาท
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold mb-2">
                💰 สรุปรวมยอดถูกรางวัล
              </h3>
              <p>จำนวนผู้ถูกรางวัล: {winners.length} คน</p>
              <p className="text-emerald-600 font-bold">
                ✅ ยอดถูกรางวัลรวมทั้งหมด:{" "}
                {winners
                  .reduce((sum, w) => sum + calculateWinnerAmount(w), 0)
                  .toLocaleString()}{" "}
                บาท
              </p>
            </div>
          </div>
        )}
        {checked && winners.length === 0 && (
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-xl shadow ring-1 ring-gray-200 text-center max-w-md space-y-4">
              <div className="text-5xl text-gray-400">😢</div>
              <h2 className="text-xl font-semibold text-gray-700">
                ไม่มีผู้ถูกรางวัลในงวดนี้
              </h2>
              <p className="text-gray-500">
                ตรวจสอบแล้วแต่ไม่มีใครถูกรางวัลในรายการของคุณ
              </p>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="flex justify-center">
          <div className="bg-white p-8 rounded-xl shadow ring-1 ring-red-300 text-center max-w-lg space-y-4 border border-red-300 mt-6">
            <div className="text-6xl text-red-400">🚨</div>
            <h2 className="text-2xl font-semibold text-red-600">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ปิดข้อความ
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
