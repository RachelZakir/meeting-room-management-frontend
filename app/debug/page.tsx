"use client";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const [storageData, setStorageData] = useState<any>({});

  useEffect(() => {
    const data = {
      accessToken: localStorage.getItem("accessToken") ? "Present (length: " + localStorage.getItem("accessToken")?.length + ")" : "Missing",
      userRole: localStorage.getItem("userRole"),
      userName: localStorage.getItem("userName"),
      userEmail: localStorage.getItem("userEmail"),
      userId: localStorage.getItem("userId"),
    };
    setStorageData(data);
  }, []);

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - localStorage Contents</h1>
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <pre className="text-sm">{JSON.stringify(storageData, null, 2)}</pre>
      </div>
      <button
        onClick={clearStorage}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Clear localStorage
      </button>
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          After logging in, check this page to see what data is stored.
        </p>
      </div>
    </div>
  );
}