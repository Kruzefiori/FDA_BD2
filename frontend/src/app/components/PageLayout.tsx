"use client";

import { ReactNode } from "react";

type PageLayoutProps = {
  title: string;
  children: ReactNode;
};

export default function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 p-10">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-5xl text-gray-900">
        <h1 className="text-4xl font-extrabold text-center mb-10">{title}</h1>
        {children}
      </div>
    </main>
  );
}
