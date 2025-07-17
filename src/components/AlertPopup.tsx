"use client";

import { XCircle } from "lucide-react";

export default function AlertPopup({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <XCircle className="mx-auto mb-2 h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-800">{message}</h2>

        <button
          onClick={onClose}
          className="mt-4 rounded-xl bg-red-500 px-4 py-2 text-white shadow hover:bg-red-600 active:scale-95"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
