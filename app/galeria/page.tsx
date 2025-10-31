"use client";

import { useState, useEffect } from "react";
import { getSession } from "@/lib/session";

export default function GaleriaPage() {
  const sess = getSession();
  const eventId = sess.eventId;

  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    // Carregar imagens para a galeria (aqui você pode carregar de um servidor ou banco de dados)
    setImages([
      "/images/image1.jpg", // Exemplo de imagens
      "/images/image2.jpg",
      "/images/image3.jpg",
    ]);
  }, [eventId]);

  return (
    <main className="container-page max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Galeria do Evento</h1>
          <p className="text-sm text-gray-500">Imagens do evento de robótica</p>
        </div>
      </header>

      <section className="card p-3 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.length === 0 ? (
            <p className="text-center text-gray-500">Nenhuma imagem disponível.</p>
          ) : (
            images.map((img, index) => (
              <div key={index} className="overflow-hidden rounded-lg shadow-lg"> 
                <img src={img} alt={`Imagem do evento ${index + 1}`} className="w-full h-auto" />
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
