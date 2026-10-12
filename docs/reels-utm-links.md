# UTM-ссылки для рилс-лендингов

Формат:

```text
https://www.morozovanatalia.ru/<страница>/?utm_source=<instagram|tiktok>
&utm_medium=<reels|bio>&utm_campaign=<proba|sessiya>
&utm_content=<название-рилса>&utm_term=<ПРОБА|СЕССИЯ>
```

| Кодовое слово `utm_term` | Страницы |
| --- | --- |
| **ПРОБА** | `/probnaya-razvod/`, `/probnaya-poterya/` |
| **СЕССИЯ** | `/sessiya-razvod/`, `/sessiya-poterya/` |

| Платформа | `utm_medium` | Где ставить |
| --- | --- | --- |
| Instagram | `reels` | автоответ в Direct |
| TikTok | `bio` | ссылка в профиле |

Генератор:

```bash
node scripts/reels-utm-link.mjs --table
node scripts/reels-utm-link.mjs --page probnaya-razvod --platform instagram --reel basic
node scripts/reels-utm-link.mjs --page sessiya-poterya --platform tiktok --medium bio --reel emdr-poterya --keyword СЕССИЯ
```

См. также `docs/social-bio-links.md` для основного сайта.
