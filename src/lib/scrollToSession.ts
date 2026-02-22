export const scrollToSession = (e: React.MouseEvent) => {
  e.preventDefault();
  const isMobile = window.innerWidth < 1024;
  const target = document.getElementById(isMobile ? "session-form" : "session");
  target?.scrollIntoView({ behavior: "smooth" });
};
