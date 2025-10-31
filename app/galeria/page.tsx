"use client";

import { useState } from "react";
import { getSession } from "@/lib/session";

export default function GaleriaPage() {
  const sess = getSession();
  const eventId = sess.eventId;

  // Estado para armazenar as imagens carregadas
  const [images, setImages] = useState<string[]>([]);

  // Estado para armazenar o arquivo da imagem carregada
  const [newImage, setNewImage] = useState<File | null>(null);

  // Função para adicionar a imagem ao estado 'images'
  const addImage = () => {
    if (newImage) {
      // Usando FileReader para criar uma URL da imagem no navegador
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImages([...images, reader.result as string]);  // Adiciona imagem ao estado
        }
      };
      reader.readAsDataURL(newImage); // Converte o arquivo para URL
      setNewImage(null); // Limpa o campo de seleção após a imagem ser adicionada
    }
  };

  return (
    <main className="container-page max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Galeria do Evento</h1>
          <p className="text-sm text-gray-500">Imagens do evento de robótica</p>
        </div>
      </header>

      {/* Formulário para adicionar novas imagens */}
      <section className="card p-3 md:p-5">
        <div className="flex gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && setNewImage(e.target.files[0])}
            className="border rounded-md p-2"
          />
          <button
            onClick={addImage}
            className="px-3 py-2 border rounded-md bg-blue-500 text-white"
            disabled={!newImage}
          >
            Adicionar Imagem
          </button>
        </div>
      </section>

      {/* Exibição das imagens da galeria */}
      <section className="card p-3 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.length === 0 ? (
            <p className="text-center text-gray-500">Nenhuma imagem disponível. Adicione imagens.</p>
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
