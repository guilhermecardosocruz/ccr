"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoteControl() {
  const [isImageMode, setIsImageMode] = useState(true);
  const router = useRouter();

  const toggleView = () => {
    setIsImageMode((prev) => !prev);
    router.push(`/telao?view=${isImageMode ? 'resultados' : 'imagens'}`);
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-900 text-white rounded-lg">
      <button
        onClick={toggleView}
        className="px-4 py-2 border rounded-md bg-blue-500"
      >
        {isImageMode ? "Mostrar Resultados" : "Mostrar Imagens"}
      </button>
    </div>
  );
}
