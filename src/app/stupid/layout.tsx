import Header from '@/components/Header';
import React from 'react';

export default function StupidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">{children}</div>
    </>
  );
}
