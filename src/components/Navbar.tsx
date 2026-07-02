import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { scrollToSession } from "@/lib/scrollToSession";

const SERVICE_LINKS = [
  { to: "/emdr-therapy", label: "EMDR-терапия" },
  { to: "/panic-attacks", label: "Панические атаки" },
  { to: "/phobias", label: "Фобии и страхи" },
  { to: "/anxiety", label: "Тревожность и ГТР" },
  { to: "/psychosomatics", label: "Психосоматика" },
  { to: "/grief", label: "Горевание и потеря" },
  { to: "/divorce", label: "Развод и расставание" },
  { to: "/emotional-abuse", label: "Эмоциональное насилие" },
  { to: "/sexual-abuse", label: "Сексуальное насилие" },
  { to: "/eating-disorders", label: "РПП" },
  { to: "/business-psychology", label: "Бизнес-психология" },
];

const Navbar = () => {
  const location = useLocation();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const isHome = location.pathname === "/";

  const navLinkClass = "text-[13px] text-muted-foreground hover:text-foreground transition-colors";
  const ctaClass = "bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-accent hover:translate-y-[-1px] transition-all whitespace-nowrap";

  const handleSessionClick = (e: React.MouseEvent) => {
    if (isHome) {
      scrollToSession(e);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-[60px] py-4 flex justify-between items-center bg-background/92 backdrop-blur-xl border-b border-border">
      <Link to="/" className="text-[15px] font-bold tracking-wide text-foreground hover:text-primary transition-colors">
        Наталья Морозова
      </Link>

      <div className="hidden md:flex gap-7 items-center">
        <Link to="/#problems" className={navLinkClass}>
          Запросы
        </Link>
        <Link to="/#about" className={navLinkClass}>
          О психологе
        </Link>
        <Link to="/#results" className={navLinkClass}>
          Результаты
        </Link>
        <Link to="/#pricing" className={navLinkClass}>
          Форматы
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsServicesOpen(!isServicesOpen)}
            className={navLinkClass}
            aria-haspopup="true"
            aria-expanded={isServicesOpen}
          >
            Услуги
          </button>
          {isServicesOpen && (
            <div
              className="absolute top-full right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-background border border-border rounded-lg shadow-lg py-2"
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              {SERVICE_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setIsServicesOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link
        to="/#session"
        onClick={handleSessionClick}
        className={ctaClass}
      >
        Записаться →
      </Link>
    </nav>
  );
};

export default Navbar;
