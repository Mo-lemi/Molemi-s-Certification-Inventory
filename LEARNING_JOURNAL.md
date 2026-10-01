# Learning Journal

What I learn while building my certification inventory: concepts, problems I hit, and how I solved them.

> **How to use this:** add a new entry at the top each time you work on the project. Fill in the "In my own words" parts yourself. Explaining something in your own words is how you find out whether you really understand it.

---

## Entry 1: Project setup (1 October 2026)

### What we built
- A static website with Astro that shows all my certificates as cards
- Category filters, search and sorting
- A pop-up detail view (`<dialog>`) for each certificate
- PDF previews rendered in the browser with PDF.js
- A GitHub Actions workflow that deploys the site to GitHub Pages automatically

### Concepts I met

| Concept | Where it shows up | In my own words |
| --- | --- | --- |
| **Static site** | The whole project: `npm run build` turns everything into plain HTML/CSS/JS in `dist/` | |
| **Separating data from code** | `src/data/*.json`: adding a certificate means editing data, not HTML | |
| **Components** | `src/components/*.astro`: one card design reused for every certificate | |
| **Props** | `<CertificateCard cert={cert} />` passes data into a component | |
| **TypeScript interfaces** | `interface Certificate` in `src/lib/certificates.ts` | |
| **Validation** | `validate()` throws an error at build time if the data has mistakes | |
| **Utility-first CSS (Tailwind)** | Classes like `rounded-3xl p-5 shadow-sm` in the components | |
| **CSS custom properties** | `--cat` holds each category's colour; `color-mix()` makes the soft tints | |
| **DOM manipulation** | `src/scripts/gallery.ts` hides/shows and reorders cards | |
| **`data-*` attributes** | Cards store `data-category`, `data-date` etc. for the script to read | |
| **`<template>` element** | `CertificateDetail.astro`: HTML that's stored but not shown until copied into the dialog | |
| **Lazy loading** | `IntersectionObserver` only renders a PDF when its card scrolls into view | |
| **Base path** | `base` in `astro.config.mjs` + `withBase()`: GitHub Pages serves the site from `/Molemi-s-Certification-Inventory/`, not `/` | |
| **CI/CD** | `.github/workflows/deploy.yml` builds and deploys on every push | |

### Bug I hit: PDF preview unavailable
- **Symptom:** the SQL certificate showed "PDF preview unavailable".
- **How we found the cause:** temporarily displayed the real error message on the page instead of the friendly one. It said: *`getDocument - expected either data, range, or url parameter`*.
- **Cause:** in PDF.js version 6, `getDocument()` no longer accepts a plain URL string. It needs an object: `getDocument({ url })`.
- **Lesson:** read the actual error message, and check the docs when a library's major version number changes, because major versions can contain "breaking changes".

### Questions to explore
- Why does a static site not need a server or database? What are the limits of that?
- What would change if I wanted an upload form (the "app-like" version)?
- How does `IntersectionObserver` know when an element is on screen?

### Next steps
- [ ] Replace the sample certificates with my real ones
- [ ] Add my photo, LinkedIn and email to `src/data/profile.json`
- [ ] Turn on GitHub Pages and share the link

---

<!--
## Entry N: <title> (<date>)

### What I did

### What I learned

### What went wrong and how I fixed it

### Questions I still have

### Next steps
-->
