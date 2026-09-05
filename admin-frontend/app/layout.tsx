import "./globals.css";

export const metadata = {
  title: "Vivify Vault Admin",
  description: "Admin UI for managing sermon metadata and entries.",
  icons: {
    icon: "/tvc-logo2.png",
    shortcut: "/tvc-logo2.png",
    apple: "/tvc-logo2.png",
  },
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
