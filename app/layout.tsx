import "./globals.css";

export const metadata = {
  title: "ViralShop AI",
  description: "Criador de vídeos para TikTok Shop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
