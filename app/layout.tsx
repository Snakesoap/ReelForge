import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'ReelForge',
  description: 'AI video generation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-F2QN9E3T3J"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F2QN9E3T3J');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
