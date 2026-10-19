import { InAppBrowser } from '@capgo/inappbrowser'
import { lerConfig, registarVisita } from './armazem'

const MOTORES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
}

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
  return MOTORES[lerConfig().motor] + encodeURIComponent(t)
}

let ouvinteAtivo = false
let ultimaUrl = ''

function guardarSeNovo(url: string) {
  if (url === ultimaUrl) return
  ultimaUrl = url
  if (!lerConfig().privado) registarVisita(url)
}

async function ativarOuvinte() {
  if (ouvinteAtivo) return
  ouvinteAtivo = true
  try {
    await InAppBrowser.addListener('urlChangeEvent', (e: { url?: string }) => {
      if (e.url) guardarSeNovo(e.url)
    })
  } catch {
    ouvinteAtivo = false
  }
}

export async function abrir(texto: string) {
  const url = montarUrl(texto)
  if (!url) return
  await ativarOuvinte()
  ultimaUrl = ''
  guardarSeNovo(url)
  await InAppBrowser.openWebView({ url })
}
