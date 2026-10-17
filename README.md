# Molemi's Certification Inventory

A public showcase of **every** certificate I've earned: technical skills, AI, work readiness, soft skills and more. LinkedIn holds my key professional certificates; this site holds the complete collection.

**Live site:** https://mo-lemi.github.io/Molemi-s-Certification-Inventory/

## Features

- A table of certificates, grouped by how each was earned: assessed credentials, hackathons and competitions, and courses and programmes
- Each row has a record number (`#CERT-001` is the oldest), the domain, the date and links to the verify page and the file
- Click a row to open it in place: description, credential ID, skills and a preview of the certificate (PDFs get a preview image made at build time)
- Search by title/issuer/skill and sort by newest, oldest or A–Z (within each section)
- Shareable links to a single certificate, e.g. `…/#hackerrank-java-basic`
- Expired certificates are flagged automatically
- Build-time checks catch mistakes in the data file (typos, missing files, bad dates)

## Tech stack

| Tool | Used for |
| --- | --- |
| [Astro](https://astro.build) | Static site framework (components + build) |
| TypeScript | Typed data and browser scripts |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [PDF.js](https://mozilla.github.io/pdf.js/) + [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) | Generating PDF preview images at build time |
| GitHub Actions + GitHub Pages | Automatic free hosting |

## Adding a certificate

1. Put the certificate file in [`public/certificates/`](public/certificates/). Use lowercase names with dashes, e.g. `hackerrank-java-basic.pdf`. Skip this step if it's a link-only certificate.
2. Add an entry to [`src/data/certificates.json`](src/data/certificates.json):

   ```json
   {
     "id": "hackerrank-java-basic",
     "title": "Java (Basic)",
     "description": null,
     "issuer": "HackerRank",
     "category": "technical",
     "type": "assessed",
     "dateEarned": "2025-08-14",
     "expiryDate": null,
     "credentialId": "ABC123XYZ",
     "verifyUrl": "https://www.hackerrank.com/certificates/abc123xyz",
     "file": "certificates/hackerrank-java-basic.pdf",
     "skills": ["Java", "OOP"]
   }
   ```

   | Field | Required | Notes |
   | --- | --- | --- |
   | `id` | yes | Unique, lowercase-with-dashes. Used in share links. |
   | `title`, `issuer` | yes | |
   | `description` | no | What you did or learnt, e.g. what you built at a hackathon. Shown when the row is opened and searchable. `null` if none |
   | `category` | yes | The subject, shown in the Domain column. Must match an `id` in [`src/data/categories.json`](src/data/categories.json) |
   | `type` | yes | How it was earned, which decides the section: `assessed`, `competition` or `course` (see [`src/data/types.json`](src/data/types.json)) |
   | `dateEarned` | yes | `YYYY-MM-DD` |
   | `expiryDate` | no | `YYYY-MM-DD` or `null` |
   | `credentialId`, `verifyUrl` | no | `null` if there isn't one |
   | `file` | no | Path inside `public/`, or `null` for link-only certificates |
   | `skills` | no | List of skills, searchable |

3. Run `npm run build` (or `npm run dev`) to check it. This also creates the preview image for PDFs. Then commit and push; the site redeploys automatically.

> **Tip:** keep files small, since recruiters may open the site on their phones. Big scans (several MB) are better exported as a JPG around 2000px wide.

**Adding a category:** add `{ "id": "...", "label": "..." }` to `src/data/categories.json`.

**Profile details** (tagline, one-line intro, photo, LinkedIn, email) are in [`src/data/profile.json`](src/data/profile.json). For a photo, put e.g. `profile.jpg` in `public/` and set `"photo": "profile.jpg"`.

## Running locally

```bash
npm install      # first time only
npm run dev      # start dev server at http://localhost:4321/Molemi-s-Certification-Inventory/
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Deployment

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the site and publishes it to GitHub Pages.

One-time setup: on GitHub go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

## Project structure

```
originals/             untouched original files (git-ignored, never published)
scripts/
  generate-previews.mjs  makes a JPG preview of each PDF (runs before dev/build)
public/
  certificates/        certificate files (PDF, PNG, JPG, SVG)
  previews/            generated PDF previews (git-ignored)
  favicon.svg
src/
  data/                certificates.json, categories.json, types.json, profile.json  ← edit these
  lib/certificates.ts  loads + validates the data, shared helpers
  components/          Header, CertificateRow, Preview
  scripts/             browser code: searching, sorting, opening rows
  pages/index.astro    the page itself
  styles/global.css    theme colours and fonts
```

## Roadmap

- [x] Replace the sample certificates with real ones
- [ ] Add profile photo, LinkedIn and email
- [ ] More filters (issuer, skill, year) as the collection grows
- [ ] Upload form / admin area (app-like version)
- [ ] Grow into a full portfolio site with a custom domain

## Learning journal

I'm documenting what I learn while building this in [LEARNING_JOURNAL.md](LEARNING_JOURNAL.md).
