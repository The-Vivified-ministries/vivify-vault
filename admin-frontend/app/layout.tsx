import "./globals.css";

export const metadata = {
  title: "Vivify Vault Admin",
  description: "Admin UI for managing sermon metadata and entries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
