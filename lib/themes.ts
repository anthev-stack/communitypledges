export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  surfaceElevated: string
  text: string
  textSecondary: string
  border: string
  nav: string
  focus: string
  hover: string
}

/** Discord client UI palette (dark only). */
export const themeColors: ThemeColors = {
  primary: "#5865f2",
  secondary: "#4752c4",
  accent: "#00a8fc",
  background: "#313338",
  surface: "#2b2d31",
  surfaceElevated: "#1e1f22",
  text: "#f2f3f5",
  textSecondary: "#b5bac1",
  border: "#3f4147",
  nav: "#2b2d31",
  focus: "rgba(88, 101, 242, 0.25)",
  hover: "rgba(79, 84, 92, 0.4)",
}

export function getThemeInitScript(): string {
  const keys = Object.keys(themeColors) as (keyof ThemeColors)[]
  const serialize = keys
    .map((k) => `'${k.replace(/([A-Z])/g, (m) => "-" + m.toLowerCase())}':'${themeColors[k]}'`)
    .join(",")
  return `(function(){try{document.documentElement.setAttribute('data-theme','dark');var c={${serialize}};var r=document.documentElement;Object.keys(c).forEach(function(k){r.style.setProperty('--color-'+k,c[k]);});r.style.setProperty('--background',c.background);r.style.setProperty('--foreground',c.text);}catch(e){}})();`
}
