import { scrollToSession } from "@/lib/scrollToSession";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-[60px] py-4 flex justify-between items-center bg-background/92 backdrop-blur-xl border-b border-border">
      <div className="text-[15px] font-bold tracking-wide text-foreground">
        Наталья Морозова
      </div>
      <div className="hidden md:flex gap-7 items-center">
        <a href="#problems" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Запросы</a>
        <a href="#about" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">О психологе</a>
        <a href="#results" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Результаты</a>
        <a href="#pricing" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Форматы</a>
      </div>
      <a
        href="#session"
        onClick={scrollToSession}
        className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-accent hover:translate-y-[-1px] transition-all whitespace-nowrap"
      >
        Записаться →
      </a>
    </nav>
  );
};

export default Navbar;
