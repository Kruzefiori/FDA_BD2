"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../components/AuthLayout";
import { Input, Button, LinkButton } from "../components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://192.168.1.39:3000/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro no cadastro");
      }

      setMessage("Cadastro realizado com sucesso!");
      router.push("/login"); // Redireciona para login
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <AuthLayout title="Cadastro">
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">Cadastrar</Button>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm text-green-500">{message}</p>
      )}

      <div className="mt-4 text-center">
        <LinkButton href="/login">Já tem conta? Entrar</LinkButton>
      </div>
    </AuthLayout>
  );
}
