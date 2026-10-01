import fs from 'node:fs';
import path from 'node:path';
import rawCertificates from '../data/certificates.json';
import rawCategories from '../data/categories.json';

export interface Category {
  id: string;
  label: string;
  color: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  category: string;
  /** ISO date, e.g. "2025-08-14" */
  dateEarned: string;
  expiryDate: string | null;
  credentialId: string | null;
  verifyUrl: string | null;
  /** Path inside /public, e.g. "certificates/java.pdf". null for link-only certificates. */
  file: string | null;
  skills: string[];
  featured: boolean;
}

export const categories: Category[] = rawCategories;

const categoryById = new Map(categories.map((c) => [c.id, c]));

export function getCategory(id: string): Category {
  return categoryById.get(id)!;
}

/** Prefixes a /public path with the site's base path (needed for GitHub Pages). */
export function withBase(p: string): string {
  if (/^https?:\/\//.test(p)) return p;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${p.replace(/^\//, '')}`;
}

/** Path (inside /public) of the image shown for a certificate file: PDFs use their generated preview. */
function previewPath(file: string): string {
  return file.toLowerCase().endsWith('.pdf')
    ? file.replace(/^certificates\//, 'previews/').replace(/\.pdf$/i, '.jpg')
    : file;
}

/** URL of the image to display for a certificate, or null for link-only certificates. */
export function previewImage(file: string | null): string | null {
  return file ? withBase(previewPath(file)) : null;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso),
  );
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Checks certificates.json at build time so mistakes (typos in a category,
 * a missing file, a badly formatted date) fail loudly instead of silently
 * producing a broken page.
 */
function validate(certs: Certificate[]): Certificate[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const c of certs) {
    const where = `Certificate "${c.id ?? c.title ?? '?'}"`;
    for (const field of ['id', 'title', 'issuer', 'category', 'dateEarned'] as const) {
      if (!c[field]) errors.push(`${where}: missing "${field}"`);
    }
    if (seen.has(c.id)) errors.push(`${where}: duplicate id`);
    seen.add(c.id);
    if (c.category && !categoryById.has(c.category)) {
      errors.push(`${where}: unknown category "${c.category}" (add it to src/data/categories.json)`);
    }
    if (c.dateEarned && !ISO_DATE.test(c.dateEarned)) errors.push(`${where}: dateEarned must look like 2025-08-14`);
    if (c.expiryDate && !ISO_DATE.test(c.expiryDate)) errors.push(`${where}: expiryDate must look like 2025-08-14`);
    if (c.file && !c.file.startsWith('certificates/')) {
      errors.push(`${where}: "file" should look like "certificates/my-certificate.pdf" (forward slashes, no "public/")`);
    } else if (c.file && !fs.existsSync(path.join(process.cwd(), 'public', c.file))) {
      errors.push(`${where}: file not found at public/${c.file}`);
    } else if (c.file && !fs.existsSync(path.join(process.cwd(), 'public', previewPath(c.file)))) {
      errors.push(`${where}: preview image missing; run "npm run build" (it generates PDF previews first)`);
    }
  }

  if (errors.length) {
    throw new Error(`Problems in src/data/certificates.json:\n  - ${errors.join('\n  - ')}`);
  }
  return certs;
}

export const certificates: Certificate[] = validate(
  rawCertificates.map((c) => ({ ...c, skills: c.skills ?? [], featured: c.featured ?? false })) as Certificate[],
);
