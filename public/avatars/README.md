# Custom character avatars

Drop transparent **PNG** (or WebP) 3D character images here. They load locally
for 100% offline support and are referenced by `AVATARS` in `src/data/words.ts`.

Required filenames (must match exactly):

- `character_lemonade.png` — Lemonade question-mark guy
- `character_ninja.png` — Pizza-sword ninja
- `character_music.png` — Headphones dancing girl

Add more with the same pattern: `character_<name>.png`, then add the path
`'/avatars/character_<name>.png'` to the `AVATARS` array.

Until a file exists, `AvatarImg` shows a Unicode emoji fallback
(🥤 / 🥷 / 🎧 / 👤), so the app never renders a broken image.
