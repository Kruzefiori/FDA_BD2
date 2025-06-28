"use client";

import { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

export default function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-gray-900">
        {/* Texto padrão mais escuro */}
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
          {title}
        </h1>
        {children}
      </div>
    </main>
  );
}
