import { Link } from "react-router-dom";

const SERVICE_LINKS = [
  { to: "/emdr-therapy", label: "EMDR-терапия" },
  { to: "/panic-attacks", label: "Панические атаки" },
  { to: "/phobias", label: "Фобии" },
  { to: "/anxiety", label: "Тревожность" },
  { to: "/psychosomatics", label: "Психосоматика" },
  { to: "/business-psychology", label: "Бизнес-психология" },
];

const Footer = () => {
  return (
    <footer className="px-6 lg:px-[60px] py-8 border-t border-border">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="text-base font-bold text-foreground mb-1">Наталья Морозова</div>
          <div className="text-[13px] text-muted-foreground">Психолог · EMDR-терапевт · Работаю онлайн и в Москве</div>
        </div>

        <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
          {SERVICE_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link to="/privacy-policy" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Политика конфиденциальности
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
