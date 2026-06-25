/** Prefix a public-folder path with Vite's base URL so it works on GitHub Pages. */
export const asset = (path: string | undefined): string | undefined =>
  path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : undefined
