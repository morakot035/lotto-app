"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="rounded-md bg-red-600 px-4 py-1.5 text-white hover:bg-red-700"
      onClick={() => {
        localStorage.removeItem("token");
        router.replace("/Login");
      }}
    >
      ออกจากระบบ
    </button>
  );
}
