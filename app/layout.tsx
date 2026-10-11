import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "MilChoix Sénégal",
  description:
    "Plateforme d'information, de cartographie et d'aide au choix variétal du mil au Sénégal.",
};

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/carte", label: "Carte" },
  { href: "/comparer", label: "Comparer" },
  { href: "/recommander", label: "Recommander" },
  { href: "/a-propos", label: "À propos" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-mil-900 text-white shadow">
          <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="inline-block h-7 w-7 rounded-full bg-mil-400 text-mil-950 grid place-items-center font-extrabold">
                M
              </span>
              <span>MilChoix Sénégal</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 rounded-md text-sm hover:bg-mil-800 transition"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/admin"
                className="ml-2 px-3 py-1.5 rounded-md text-sm bg-white/10 hover:bg-white/20 transition border border-white/20"
              >
                Administration
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <ChatWidget />
        <footer className="bg-stone-900 text-stone-300 text-sm">
          <div className="mx-auto max-w-6xl px-4 py-8 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-white">MilChoix Sénégal</p>
              <p className="mt-1 text-xs">
                La bonne variété de mil, au bon endroit, pour la bonne saison.
              </p>
            </div>
            <div className="text-xs">
              <p className="font-semibold text-white mb-1">Avertissement</p>
              <p>
                Les recommandations sont une aide à la décision et ne remplacent
                ni l'expérience des producteurs ni l'avis des conseillers
                agricoles.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
