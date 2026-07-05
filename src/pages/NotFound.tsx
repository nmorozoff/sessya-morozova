import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="text-center max-w-xl">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-2 text-2xl font-semibold">Страница не найдена</p>
        <p className="mb-8 text-muted-foreground">
          Запрашиваемая страница <code className="bg-background px-2 py-1 rounded text-sm">{location.pathname}</code> не существует или была удалена.
        </p>

        <div className="mb-8 text-left inline-block">
          <p className="font-semibold mb-3">Полезные ссылки:</p>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="text-primary underline hover:text-primary/90">
                Главная страница
              </Link>
            </li>
            <li>
              <Link to="/emdr-therapy" className="text-primary underline hover:text-primary/90">
                EMDR-терапия
              </Link>
            </li>
            <li>
              <Link to="/panic-attacks" className="text-primary underline hover:text-primary/90">
                Панические атаки — как я работаю
              </Link>
            </li>
            <li>
              <Link to="/business-psychology" className="text-primary underline hover:text-primary/90">
                Бизнес-психология
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
