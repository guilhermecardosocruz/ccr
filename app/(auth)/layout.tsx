import "@/styles/globals.css";
import AppMenu from "@/components/AppMenu";

export const metadata = {
  title: "CCR • Login",
  description: "Login do painel CCR",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <AppMenu />
        <main className="flex-1 flex items-center justify-center">{children}</main>
      </body>
    </html>
  );
}
