"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import { useLoading } from "@/context/LoadingContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export interface CutConfig {
  threeDigitTop: string;
  threeDigitTod: string;
  threeDigitBottom: string;
  twoDigitTop: string;
  twoDigitBottom: string;
}

export default function CutSettingPage() {
  useAuthGuard();
  const [cutConfig, setCutConfig] = useState<CutConfig>({
    threeDigitTop: "",
    threeDigitTod: "",
    threeDigitBottom: "",
    twoDigitTop: "",
    twoDigitBottom: "",
  });
  const labelMap: Record<keyof CutConfig, string> = {
    threeDigitTop: "3 ตัวเต็ง",
    threeDigitTod: "3 ตัวโต๊ด",
    threeDigitBottom: "3 ตัวล่าง",
    twoDigitTop: "2 ตัวบน",
    twoDigitBottom: "2 ตัวล่าง",
  };
  const { showLoading, hideLoading } = useLoading();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (key: string, value: string) => {
    setCutConfig({ ...cutConfig, [key]: value });
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      alert("กรุณา login ก่อนใช้งาน");
      return;
    }

    try {
      showLoading?.();

      // แปลง string เป็น number
      const payload = {
        threeDigitTop: cutConfig.threeDigitTop || "0",
        threeDigitTod: cutConfig.threeDigitTod || "0",
        threeDigitBottom: cutConfig.threeDigitBottom || "0",
        twoDigitTop: cutConfig.twoDigitTop || "0",
        twoDigitBottom: cutConfig.twoDigitBottom || "0",
      };

      const response = await apiClient.saveCutConfig(payload, token);
      console.log("response:", response);

      // ✅ modal dialog ยืนยันสำเร็จ
      setShowSuccessModal(true);
    } catch (err) {
      console.error("บันทึกค่าตัดเก็บล้มเหลว", err);
      setShowSuccessModal(true);
    } finally {
      hideLoading?.();
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const fetchConfig = async () => {
      showLoading?.();
      try {
        const response = await apiClient.getCutConfig(token); // ต้องมีฟังก์ชันนี้ใน apiClient
        if (response.data) {
          const config = response.data;

          // แปลงค่าตัวเลขให้เป็น string เพื่อให้แสดงใน input ได้
          setCutConfig({
            threeDigitTop: config.threeDigitTop.toString(),
            threeDigitTod: config.threeDigitTod.toString(),
            threeDigitBottom: config.threeDigitBottom.toString(),
            twoDigitTop: config.twoDigitTop.toString(),
            twoDigitBottom: config.twoDigitBottom.toString(),
          });
        }
      } catch (err) {
        console.error("โหลดค่าตัดเก็บล้มเหลว", err);
      } finally {
        hideLoading?.();
      }
    };

    fetchConfig();
  }, []);

  return (
    <>
      <section className="min-h-screen bg-gray-100 px-4 py-10 text-gray-800">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-emerald-700">
              📎 ตั้งค่าตัดเก็บรายตัว
            </h1>
            <Link
              href="/Home"
              className="rounded-lg bg-emerald-100 px-3 py-1 text-sm text-emerald-800 shadow hover:bg-emerald-200 transition"
            >
              ← กลับหน้าเมนู
            </Link>
          </div>

          <div className="rounded-xl bg-white p-6 shadow ring-1 ring-gray-200 space-y-6">
            <p className="text-gray-600 text-sm">
              กำหนดจำนวนที่คุณจะ “เก็บไว้เอง” รายตัว เช่น 100 บาท
              หากแทงเกินกว่านี้จะถูกส่งให้เจ้ามือโดยอัตโนมัติ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(cutConfig)
                .filter(
                  ([key]) => key in labelMap && labelMap[key as keyof CutConfig]
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {labelMap[key as keyof CutConfig]}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="เช่น 100"
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-white font-semibold shadow transition"
              >
                💾 บันทึกค่าตัดเก็บ
              </button>
            </div>
          </div>
        </div>

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center space-y-4">
              <h2 className="text-xl font-semibold text-emerald-700">
                ✅ บันทึกสำเร็จ
              </h2>
              <p className="text-gray-600">
                ระบบได้บันทึกค่าตัดเก็บของคุณเรียบร้อยแล้ว
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
