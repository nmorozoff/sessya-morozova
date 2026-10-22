# Черновики (не в сборке)

В `content/blog/` и `public/blog-assets/` попадают **только опубликованные** статьи — в момент commit + push перед `deploy:blog`.

До публикации держите артефакты в репозитории **Контент EMDR**, например:

- `memory/syndicate/gore-react/articles/<slug>/`
- очередь горя: `memory/syndicate/gore-blog/`

Не копируйте черновики в этот worktree «на будущее» — иначе `prebuild` подтянет их в manifest и испортит `git status`.
