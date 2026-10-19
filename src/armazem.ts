export type Favorito = { titulo: string; url: string }
export type Visita = { url: string; titulo: string; data: number; vezes: number }
export type Config = {
  motor: 'google' | 'duckduckgo' | 'bing'
  tema: 'escuro' | 'claro'
  privado: boolean
}

const CH_FAV = 'nexora_favoritos'
const CH_HIS = 'nexora_historico'
const CH_CFG = 'nexora_config'

const FAVORITOS_INICIAIS: Favorito[] = [
  { titulo: 'Google', url: 'https://www.google.com/' },
  { titulo: 'YouTube', url: 'https://www.youtube.com/' },
  { titulo: 'GitHub', url: 'https://github.com/' },
  { titulo: 'Wikipedia', url: 'https://pt.wikipedia.org/' },
]

const CONFIG_PADRAO: Config = { motor: 'google', tema: 'escuro', privado: false }

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : padrao
  } catch {
    return padrao
  }
}

function guardar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // sem espaço ou bloqueado: ignora
  }
}

export function nomeDoSite(url: string): string {
  try {
    const u = new URL(url)
    const q = u.searchParams.get('q')
    if (q) return 'Pesquisa: ' + q
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function lerFavoritos(): Favorito[] {
  return ler<Favorito[]>(CH_FAV, FAVORITOS_INICIAIS)
}

export function adicionarFavorito(fav: Favorito): void {
  const lista = lerFavoritos()
  if (lista.some((f) => f.url === fav.url)) return
  guardar(CH_FAV, [...lista, fav])
}

export function removerFavorito(url: string): void {
  guardar(CH_FAV, lerFavoritos().filter((f) => f.url !== url))
}

export function lerHistorico(): Visita[] {
  return ler<Visita[]>(CH_HIS, [])
}

export function registarVisita(url: string): void {
  const h = lerHistorico()
  const i = h.findIndex((v) => v.url === url)
  let visita: Visita
  if (i >= 0) {
    visita = { ...h[i], data: Date.now(), vezes: h[i].vezes + 1 }
    h.splice(i, 1)
  } else {
    visita = { url, titulo: nomeDoSite(url), data: Date.now(), vezes: 1 }
  }
  guardar(CH_HIS, [visita, ...h].slice(0, 200))
}

export function limparHistorico(): void {
  guardar(CH_HIS, [])
}

export function lerConfig(): Config {
  return { ...CONFIG_PADRAO, ...ler<Partial<Config>>(CH_CFG, {}) }
}

export function guardarConfig(config: Config): void {
  guardar(CH_CFG, config)
}
