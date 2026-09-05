# Slide templates

Files in this folder follow the exact slide contract (see
`.claude/skills/slide-author/SKILL.md`) plus one extra export that describes
them to the admin's **+ New slide** dialog:

```jsx
export const template = { name: "Statement", description: "One centered line", order: 1 };
```

Creating a slide copies the file to `src/slides/<id>.jsx`, rewrites
`meta.id` / `meta.title`, drops the `template` export and gives the new slide
its own copy of every `meta.assets` placeholder
(`public/assets/<dir>/<id>-<key>.<ext>`), so swapping an asset later never
touches the template or another slide.

Rules of thumb for a good template:

- `meta.id` must equal the filename (without `.jsx`).
- Reference media through `meta.assets` + the `assets` prop; point placeholders
  at the small shared files in `public/assets/`.
- Keep props literal (`size={96}`, `color="var(--accent)"`) and put absolute
  positions on the `<Appear style>` wrapper — the visual editor edits those.
- Comments are copied into every slide made from the template, so keep them
  short and useful to the next author.
- Drop a new file here and it shows up in the dialog — no registration needed.
