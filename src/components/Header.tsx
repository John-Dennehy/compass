import { Link } from "@tanstack/react-router";
import { Compass, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md"
      style={{
        backgroundColor: "rgba(250, 248, 255, 0.8)",
        borderColor: "var(--compass-border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
              style={{ backgroundColor: "var(--compass-primary)" }}
            >
              <Compass className="text-white" size={24} />
            </div>
            <span
              className="text-2xl font-extrabold tracking-tighter"
              style={{ color: "var(--compass-text)" }}
            >
              Compass
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          <Link
            to="/"
            className="text-sm font-semibold transition-colors hover:opacity-70"
            style={{ color: "var(--compass-text)" }}
          >
            Browse
          </Link>
          <Link
            to="/events"
            className="text-sm font-semibold transition-colors hover:opacity-70"
            style={{ color: "var(--compass-text)" }}
          >
            Events
          </Link>
          <Link
            to="/compass-community"
            className="text-sm font-semibold transition-colors hover:opacity-70"
            style={{ color: "var(--compass-text)" }}
          >
            Compass Community
          </Link>
          <Link
            to="/about"
            className="text-sm font-semibold transition-colors hover:opacity-70"
            style={{ color: "var(--compass-text)" }}
          >
            About
          </Link>
          <Link
            to="/submit"
            className="inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: "var(--compass-primary)" }}
          >
            Add Resource
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          style={{ color: "var(--compass-text)" }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          className="border-b bg-white p-4 md:hidden"
          style={{ borderColor: "var(--compass-border)" }}
        >
          <nav className="flex flex-col gap-4">
            <Link
              to="/"
              className="text-lg font-semibold"
              style={{ color: "var(--compass-text)" }}
              onClick={() => setIsMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              to="/events"
              className="text-lg font-semibold"
              style={{ color: "var(--compass-text)" }}
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              to="/compass-community"
              className="text-lg font-semibold"
              style={{ color: "var(--compass-text)" }}
              onClick={() => setIsMenuOpen(false)}
            >
              Compass Community
            </Link>
            <Link
              to="/about"
              className="text-lg font-semibold"
              style={{ color: "var(--compass-text)" }}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/submit"
              className="flex h-12 items-center justify-center rounded-lg font-bold text-white"
              style={{ backgroundColor: "var(--compass-primary)" }}
              onClick={() => setIsMenuOpen(false)}
            >
              Add Resource
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
