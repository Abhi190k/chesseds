import './globals.css';

export const metadata = {
  title: 'Chess Analysis & Review',
  description: 'Upload, analyze, and review chess games and positions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900">
        {children}
      </body>
    </html>
  );
}
