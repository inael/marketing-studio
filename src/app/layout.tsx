import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marketing Studio | IT Booster",
  description: "Orquestração de conteúdo social (Instagram/LinkedIn) dos produtos IT Booster.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var a=JSON.parse(localStorage.getItem('ms_aparencia')||'{}');var d=document.documentElement;var e=a.tema==='escuro'||(a.tema==='sistema'&&matchMedia('(prefers-color-scheme: dark)').matches)||localStorage.theme==='dark';if(e)d.dataset.theme='dark';if(a.densidade==='compacta')d.dataset.densidade='compacta';if(a.texto)d.dataset.texto=a.texto;if(a.contraste)d.dataset.contraste='alto';}catch(x){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
