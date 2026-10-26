import { Browser } from '@capacitor/browser'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { InAppBrowser } from '@capgo/inappbrowser'
import {
  lerConfig,
  registarDownload,
  registarVisita,
} from './armazem'

// Plugin nativo para guardar ficheiros na pasta Download.
const NexoraDownloads = registerPlugin<{
  guardar(opcoes: {
    caminho: string
    nome: string
    tipo: string
  }): Promise<{ destino: string }>
}>('NexoraDownloads')

const MOTORES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
}

// Modo computador para o navegador Android nativo.
const SCRIPT_PC = `
(function () {
  var UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  function definir(obj, nome, valor) {
    try {
      Object.defineProperty(obj, nome, {
        get: function () { return valor; },
        configurable: true
      });
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
    new MutationObserver(viewport).observe(
      document.documentElement,
      { childList: true, subtree: true }
    );
  } catch (e) {}
})();
`

// Converte um endereço ou texto numa URL.
export function montarUrl(texto: string): string {
  const t = texto.trim()
  if (!t) return ''

  const config = lerConfig()
  const comProtocolo = /^https?:\/\//i.test(t)

  const pareceEndereco =
    !/\s/.test(t) &&
    (/\.[a-z]{2,}/i.test(t) || /^localhost/i.test(t))

  if (comProtocolo || pareceEndereco) {
    try {
      const url = new URL(
        comProtocolo ? t : 'https://' + t,
      )

      const local =
        /^(localhost|\d+\.\d+\.\d+\.\d+)(:|$)/.test(url.host)

      if (
        config.seguro &&
        url.protocol === 'http:' &&
        !local
      ) {
        url.protocol = 'https:'
      }

      return url.href
    } catch {
      // Se o endereço for inválido, pesquisar o texto.
    }
  }

  return MOTORES[config.motor] + encodeURIComponent(t)
}

// Limpa os cookies e a cache do navegador nativo.
export async function limparCookies(): Promise<void> {
  await InAppBrowser.clearAllCookies()
  await InAppBrowser.clearCache()
}

let ouvintesAtivos = false
let ultimaUrl = ''

// Regista visitas, respeitando o modo privado.
function guardarSeNovo(url: string) {
  if (url === ultimaUrl) return

  ultimaUrl = url

  if (!lerConfig().privado) {
    registarVisita(url)
  }
}

// Impede que falhas nos ouvintes interrompam o navegador.
async function tentar(acao: () => Promise<unknown>) {
  try {
    await acao()
  } catch {
    // Continua mesmo se um ouvinte falhar.
  }
}

// Ativa os eventos do navegador Android nativo.
async function ativarOuvintes() {
  if (ouvintesAtivos) return

  ouvintesAtivos = true

  await tentar(() =>
    InAppBrowser.addListener(
      'urlChangeEvent',
      (e: { url?: string }) => {
        if (e.url) guardarSeNovo(e.url)
      },
    ),
  )

  await tentar(() =>
    InAppBrowser.addListener(
      'browserPageLoaded',
      () => {
        if (lerConfig().computador) {
          InAppBrowser.executeScript({
            code: SCRIPT_PC,
          }).catch(() => {})
        }
      },
    ),
  )

  await tentar(() =>
    InAppBrowser.addListener(
      'downloadCompleted',
      (e) => {
        const base = {
          nome: e.fileName,
          caminho: e.path,
          tipo: e.mimeType ?? '',
          origem: e.sourceUrl ?? '',
          data: Date.now(),
        }

        NexoraDownloads.guardar({
          caminho: e.path,
          nome: e.fileName,
          tipo: base.tipo,
        })
          .then((r) =>
            registarDownload({
              ...base,
              caminho: r.destino,
            }),
          )
          .catch((err: unknown) =>
            registarDownload({
              ...base,
              erro:
                err instanceof Error
                  ? err.message
                  : String(err),
            }),
          )
      },
    ),
  )

  await tentar(() =>
    InAppBrowser.addListener(
      'downloadFailed',
      (e) => {
        registarDownload({
          nome: e.fileName ?? 'Ficheiro',
          caminho: '',
          tipo: e.mimeType ?? '',
          origem: e.sourceUrl ?? '',
          data: Date.now(),
          erro: e.error,
        })

        // Alternativa: abrir o download no navegador do sistema.
        if (
          e.sourceUrl &&
          /^https?:\/\//i.test(e.sourceUrl)
        ) {
          Browser.open({
            url: e.sourceUrl,
          }).catch(() => {})
        }
      },
    ),
  )

  await tentar(() =>
    InAppBrowser.addListener(
      'closeEvent',
      () => {
        if (!lerConfig().cookies) {
          limparCookies().catch(() => {})
        }
      },
    ),
  )
}

// Abre endereços na versão web e no APK.
export async function abrir(texto: string) {
  const urlBase = montarUrl(texto)
  if (!urlBase) return

  let url = urlBase

  // Na versão web, usar o YouTube móvel.
  if (!Capacitor.isNativePlatform()) {
    try {
      const destino = new URL(urlBase)

      if (
        ['youtube.com', 'www.youtube.com'].includes(
          destino.hostname.toLowerCase(),
        )
      ) {
        destino.hostname = 'm.youtube.com'
        url = destino.href
      }
    } catch {
      // Mantém a URL original se não for válida.
    }

    guardarSeNovo(url)

    const separador = window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    )

    // Se o navegador bloquear o separador, usar a janela atual.
    if (!separador) {
      window.location.assign(url)
    }

    return
  }

  // No APK, manter a navegação nativa existente.
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
