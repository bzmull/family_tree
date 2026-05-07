# Family Tree

An interactive, password-protected family tree web app built for large extended families. Zoom and pan through hundreds of people across multiple family branches, with a click-to-edit UI for non-technical family members.

**Live demo:** *(add your Netlify URL here after setup)*

---

## Features

- **Password-protected viewing** — family members need a shared password just to see the tree
- **Two-tier access** — a separate edit password for those who can make changes
- **Click-to-edit** — non-technical family members can edit directly in the browser; no GitHub knowledge required
- **Multi-branch support** — toggle between Mom's side, Dad's side, or view all at once with color-coded branches
- **All relationship types** — spouse, parent-child, step-parent, adoptive, half-sibling
- **Private fields** — mark individual fields (birthdays, notes) as hidden from viewers
- **Search** — fuzzy search by name, scoped to the active branch filter
- **PDF export** — export any subtree as a PDF with configurable generation depth
- **Zoom and pan** — handles 500+ people with smooth D3-powered navigation
- **Code/data separation** — this repo contains zero family data; your data lives in a private repo you control

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
