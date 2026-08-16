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

      <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-2">
        <a
          href="https://www.b17.ru/morozova_natalia/?prt=1337388"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-85 hover:opacity-100 transition-opacity"
          aria-label="Профиль психолога Натальи Морозовой на B17.ru"
        >
          <img
            src="https://www.b17.ru/img/b17_100x100_w_retina.png"
            alt="Профиль на B17.ru — психолог Наталья Морозова, EMDR"
            width={100}
            height={100}
            className="w-[100px] h-[100px]"
            loading="lazy"
          />
        </a>
        <span className="text-[11px] text-muted-foreground">Профиль на B17.ru</span>
      </div>
    </footer>
  );
};

export default Footer;
