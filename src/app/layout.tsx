import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";

// Tipografia: Inter para texto e tabelas; Unbounded para títulos e números de destaque.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      className={`${inter.variable} ${unbounded.variable} h-full antialiased`}
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
