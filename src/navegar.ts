import { Browser } from '@capacitor/browser'

export function montarUrl(texto: string): string {
  const t = texto.trim()
  if (!t) return ''
  const comProtocolo = /^https?:\/\//i.test(t)
  const pareceEndereco =
    !/\s/.test(t) && (/\.[a-z]{2,}/i.test(t) || /^localhost/i.test(t))

  if (comProtocolo || pareceEndereco) {
    try {
      return new URL(comProtocolo ? t : 'https://' + t).href
    } catch {
      // se não for um endereço válido, cai na pesquisa
    }
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(t)
}

export async function abrir(texto: string) {
  const url = montarUrl(texto)
  if (!url) return
  await Browser.open({ url })
}
