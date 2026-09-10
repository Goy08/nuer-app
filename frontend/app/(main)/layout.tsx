import { Navbar } from "@/components/Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        <span className="font-display italic text-amber-700">Naath</span> — preserving the Nuer language, one word at a time 🌍
      </footer>
    </div>
  );
}
