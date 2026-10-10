import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function AdminPage() {
  const session = await getSession();
  if (session) redirect("/admin/dashboard");

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-bold text-mil-900">Administration</h1>
      <p className="mt-2 text-stone-600 text-sm">
        Accès réservé aux gestionnaires autorisés de la plateforme.
      </p>
      <LoginForm />
    </div>
  );
}
