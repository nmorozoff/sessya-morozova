const Footer = () => {
  return (
    <footer className="px-6 lg:px-[60px] py-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2.5 text-center">
      <div className="text-base font-bold text-foreground">Наталья Морозова</div>
      <div className="flex items-center gap-4">
        <a href="/privacy" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors underline">Согласие на обработку персональных данных</a>
        <a href="/advertising-consent" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors underline">Согласие на получение рекламной рассылки</a>
        <span className="text-[13px] text-muted-foreground">Психолог · Работаю онлайн</span>
      </div>
    </footer>
  );
};

export default Footer;
