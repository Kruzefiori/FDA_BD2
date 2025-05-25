import Link from "next/link";


export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Medicine Consultancy App!</h1>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block bg-blue-300 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block bg-green-300 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            Cadastro
          </Link>
        </div>
      </div>
    </main>
  );
}
