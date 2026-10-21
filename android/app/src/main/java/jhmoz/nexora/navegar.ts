import { registerPlugin } from '@capacitor/core'
import { InAppBrowser } from '@capgo/inappbrowser'
import { lerConfig, registarDownload, registarVisita } from './armazem'

// Plugin nativo (Java) que copia o ficheiro para a pasta Download do telemóvel
const NexoraDownloads = registerPlugin<{
  guardar(opcoes: { caminho: string; nome: string; tipo: string }): Promise<{ destino: string }>
}>('NexoraDownloads')

const MOTORES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
}

// Modo computador (aproximação): finge um navegador de PC para o JavaScript
// da página e força uma largura de ecrã de 1280. Não muda o que o servidor
// do site vê, por isso alguns sites podem continuar a mostrar a versão móvel.
const SCRIPT_PC = `
(function () {
  var UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  function definir(obj, nome, valor) {
    try {
      Object.defineProperty(obj, nome, { get: function () { return valor; }, configurable: true });
    } catch (e) {}
  }
  definir(navigator, 'userAgent', UA);
  definir(navigator, 'platform', 'Linux x86_64');
  definir(navigator, 'maxTouchPoints', 0);
  definir(navigator, 'userAgentData', undefined);
  function viewport() {
    try {
      var m = document.querySelector('meta[name="viewport"]');
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'viewport');
        (document.head || document.documentElement).appendChild(m);
      }
      if (m.getAttribute('content') !== 'width=1280') {
        m.setAttribute('content', 'width=1280');
      }
    } catch (e) {}
  }
  viewport();
  try {
    new MutationObserver(viewport).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
`

export function montarUrl(texto: string): string {
  const t = texto.trim()
  if (!t) return ''
  const config = lerConfig()
  const comProtocolo = /^https?:\/\//i.test(t)
  const pareceEndereco =
    !/\s/.test(t) && (/\.[a-z]{2,}/i.test(t) || /^localhost/i.test(t))

  if (comProtocolo || pareceEndereco) {
    try {
      const url = new URL(comProtocolo ? t : 'https://' + t)
      const local = /^(localhost|\d+\.\d+\.\d+\.\d+)(:|$)/.test(url.host)
      if (config.seguro && url.protocol === 'http:' && !local) {
        url.protocol = 'https:'
      }
      return url.href
    } catch {
      // se não for um endereço válido, cai na pesquisa
    }
  }
  return MOTORES[config.motor] + encodeURIComponent(t)
}

export async function limparCookies(): Promise<void> {
  await InAppBrowser.clearAllCookies()
  await InAppBrowser.clearCache()
}

let ouvintesAtivos = false
let ultimaUrl = ''

function guardarSeNovo(url: string) {
  if (url === ultimaUrl) return
  ultimaUrl = url
  if (!lerConfig().privado) registarVisita(url)
}

async function tentar(acao: () => Promise<unknown>) {
  try {
    await acao()
  } catch {
    // se um ouvinte falhar, o resto do navegador continua a funcionar
  }
}

async function ativarOuvintes() {
  if (ouvintesAtivos) return
  ouvintesAtivos = true

  await tentar(() =>
    InAppBrowser.addListener('urlChangeEvent', (e: { url?: string }) => {
      if (e.url) guardarSeNovo(e.url)
    }),
  )

  await tentar(() =>
    InAppBrowser.addListener('browserPageLoaded', () => {
      if (lerConfig().computador) {
        InAppBrowser.executeScript({ code: SCRIPT_PC }).catch(() => {})
      }
    }),
  )

  await tentar(() =>
      }
      NexoraDownloads.guardar({ caminho: e.path, nome: e.fileName, tipo: base.tipo })
        .then((r) => registarDownload({ ...base, caminho: r.destino }))
        .catch((err: unknown) =>
          registarDownload({ ...base, erro: err instanceof Error ? err.message : String(err) }),
        )
    }),
  )

  await tentar(() =>
    InAppBrowser.addListener('downloadFailed', (e) => {
      registarDownload({
        nome: e.fileName ?? 'Ficheiro',
        caminho: '',
        tipo: e.mimeType ?? '',
        origem: e.sourceUrl ?? '',
        data: Date.now(),
        erro: e.error,
      })
    }),
  )

  await tentar(() =>
    InAppBrowser.addListener('closeEvent', () => {
      if (!lerConfig().cookies) limparCookies().catch(() => {})
    }),
  )
}

export async function abrir(texto: string) {
  const url = montarUrl(texto)
  if (!url) return
  await ativarOuvintes()
  ultimaUrl = ''
  guardarSeNovo(url)

  const pc = lerConfig().computador
  await InAppBrowser.openWebView({
    url,
    handleDownloads: true,
    ...(pc
      ? {
          enableZoom: true,
          isPresentAfterPageLoad: true,
          preShowScript: SCRIPT_PC,
          preShowScriptInjectionTime: 'documentStart' as const,
        }
      : {}),
  })
}
