import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

export function Header() {
  const { user, logout } = useAuth();
  const testMode = Boolean(user?.testMode);
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="border-b-2 border-bone">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="font-mono font-bold text-[18px] leading-none text-gold underline underline-offset-4 hover:opacity-80"
            onClick={closeMenu}
          >
            Paradox.
          </Link>
          {testMode && (
            <span className="border border-gold px-2 py-[2px] font-mono text-[10px] uppercase tracking-brutal text-gold">
              TEST MODE
            </span>
          )}
        </div>

        {/* Desktop nav + stats. Hidden on mobile. */}
        <div className="hidden flex-1 items-center justify-between gap-8 md:flex">
          <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-brutal">
            {user && <Nav to="/">TODAY</Nav>}
            <Nav to="/how-to-play">HOW TO PLAY</Nav>
            <Nav to="/archive">ARCHIVE</Nav>
            {user && <Nav to="/profile">PROFILE</Nav>}
            {user && <Nav to="/library">LIBRARY</Nav>}
            {user && <Nav to="/submit">SUBMIT</Nav>}
            <Nav to="/circles">CIRCLES</Nav>
            {user?.ownsOrAdminsCircle && <Nav to="/circles/manage">MANAGE</Nav>}
            {user && <Nav to="/party">PARTY</Nav>}
            {user && <Nav to="/feedback">FEEDBACK</Nav>}
            {user?.isAdmin && <Nav to="/admin">ADMIN</Nav>}
          </nav>
          {user && <UserStats user={user} onLogout={logout} />}
        </div>

        {/* Mobile hamburger. Always visible on mobile. */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] border-2 border-bone md:hidden"
        >
          <span
            className={`block h-[2px] w-5 bg-bone transition-transform ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-5 bg-bone ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-[2px] w-5 bg-bone transition-transform ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile drawer. */}
      {open && (
        <div className="flex flex-col border-t-2 border-bone md:hidden">
          <nav className="flex flex-col font-mono text-sm uppercase tracking-brutal">
            {user && <MobileNav to="/" onClick={closeMenu}>TODAY</MobileNav>}
            <MobileNav to="/how-to-play" onClick={closeMenu}>HOW TO PLAY</MobileNav>
            <MobileNav to="/archive" onClick={closeMenu}>ARCHIVE</MobileNav>
            {user && <MobileNav to="/profile" onClick={closeMenu}>PROFILE</MobileNav>}
            {user && <MobileNav to="/library" onClick={closeMenu}>LIBRARY</MobileNav>}
            {user && <MobileNav to="/submit" onClick={closeMenu}>SUBMIT</MobileNav>}
            <MobileNav to="/circles" onClick={closeMenu}>CIRCLES</MobileNav>
            {user?.ownsOrAdminsCircle && (
              <MobileNav to="/circles/manage" onClick={closeMenu}>MANAGE</MobileNav>
            )}
            {user && <MobileNav to="/party" onClick={closeMenu}>PARTY</MobileNav>}
            {user && <MobileNav to="/feedback" onClick={closeMenu}>FEEDBACK</MobileNav>}
            {user?.isAdmin && <MobileNav to="/admin" onClick={closeMenu}>ADMIN</MobileNav>}
          </nav>
          {user && (
            <div className="flex flex-col gap-2 border-t border-smoke px-4 py-4 font-mono text-sm uppercase tracking-brutal">
              <span className="text-bone">{user.username}</span>
              <span>
                <span className="text-gold">WP {user.wisdomPoints}</span>
                <span className="mx-3 text-muted">·</span>
                <span className={user.civilityScore < 40 ? "text-blood" : "text-bone"}>
                  CIV {user.civilityScore}
                </span>
              </span>
              <button
                onClick={() => {
                  closeMenu();
                  logout();
                }}
                className="self-start text-muted hover:text-blood"
                style={{ minHeight: 44 }}
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function UserStats({
  user,
  onLogout,
}: {
  user: { username: string; wisdomPoints: number; civilityScore: number };
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-5 font-mono text-sm uppercase tracking-brutal">
      <span className="text-muted">
        <span className="text-gold">WP {user.wisdomPoints}</span>
        <span className="mx-3 text-muted">·</span>
        <span className={user.civilityScore < 40 ? "text-blood" : "text-bone"}>
          CIV {user.civilityScore}
        </span>
      </span>
      <span className="text-bone">{user.username}</span>
      <button onClick={onLogout} className="text-muted hover:text-blood">
        LOGOUT
      </button>
    </div>
  );
}

function Nav({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        isActive ? "text-gold" : "text-muted hover:text-bone"
      }
    >
      {children}
    </NavLink>
  );
}

function MobileNav({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `border-b border-smoke px-4 py-4 ${
          isActive ? "text-gold" : "text-bone hover:text-gold"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
