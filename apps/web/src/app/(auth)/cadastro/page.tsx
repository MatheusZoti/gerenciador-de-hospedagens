import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { SignupForm } from "@/modules/auth/components/signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <AuthCard
      title="Criar conta"
      description="Sua organização e o funil de vendas padrão são criados automaticamente."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
