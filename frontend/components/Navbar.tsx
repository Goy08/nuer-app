"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Globe, PlusCircle, Shield, LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const navLinks = [
  { href: "/",           label: "Translate",  icon: Globe },
  { href: "/dictionary", label: "Dictionary", icon: BookOpen },
  { href: "/lessons",    label: "Lessons",    icon: GraduationCap },
  { href: "/contribute", label: "Contribute", icon: PlusCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    clearAuth();
    router.push("/");
  }

  const allLinks = [
    ...navLinks,
    ...(user?.role === "moderator" || user?.role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: Shield }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="font-display text-2xl font-bold italic text-amber-700 transition-colors group-hover:text-amber-600">
            Naath
          </span>
          <span className="hidden rounded-sm border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-600 sm:inline">
            beta
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {allLinks.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all",
                  active
                    ? "text-amber-700"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {active && (
                  <span className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground sm:inline">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-amber-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95"
              >
                Register
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {allLinks.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-amber-50 text-amber-700"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            <Separator className="my-2" />
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
