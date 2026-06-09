import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/molecules/Header/Header";
import Footer from "./components/atoms/Footer/Footer";


export const metadata: Metadata = {
  title: "Zênior",
  description: "Sistema para auxiliar famílias no cuidado de idosos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="page">
            <Header/>
            <main className="main">
              {children}
            </main>
            <Footer/>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}



