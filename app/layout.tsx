export const metadata = { title: "CCR • Placar", description: "Planilha interativa de pontuação" };
import "./../styles/globals.css";
import AppMenu from "@/components/AppMenu";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppMenu />
        {children}
      </body>
    </html>
  );
}
