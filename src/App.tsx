
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'
import { abrir, limparCookies, montarUrl } from './navegar'
import {
  adicionarFavorito,
  guardarConfig,
  lerConfig,
  lerDownloads,
  lerFavoritos,
  lerHistorico,
  limparDownloads,
  limparHistorico,
  nomeDoSite,
  removerFavorito,
} from './armazem'
import type { Config } from './armazem'

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

const FUNDO = '/fundo.png'
const FUNDO_CLARO = '/FUNDO_CLARO.png'

type Aba = 'inicio' | 'favoritos' | 'historico' | 'definicoes'
type VistaHistorico = 'sites' | 'downloads'

const GRAD =
  'linear-gradient(135deg, #38BDF8 0%, #2563EB 48%, #6366F1 100%)'

const TEXTO_GRAD: React.CSSProperties = {
  background: GRAD,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}

const ANIMACOES = `
@keyframes nx-entrar {
  from { opacity: 0; transform: scale(0.4) rotate(-12deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes nx-subir {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes nx-onda {
  0% { transform: scale(0.8); opacity: 0.7; }
  100% { transform: scale(2); opacity: 0; }
}
@keyframes nx-carregar {
  from { width: 0%; }
  to { width: 100%; }
}
@keyframes nx-flutuar {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes nx-brilho {
  0%, 100% { box-shadow: 0 0 12px rgba(56,189,248,0.08); }
  50% { box-shadow: 0 0 24px rgba(56,189,248,0.2); }
}
* {
  box-sizing: border-box;
}
button, input {
  font-family: inherit;
}
button {
  -webkit-tap-highlight-color: transparent;
}
`

const TEMAS = {
  escuro: {
    fundo: '#050B18',
    texto: '#EAF2FF',
    suave: '#91A4C7',
    cartao: 'rgba(12, 25, 48, 0.88)',
    borda: 'rgba(56, 189, 248, 0.22)',
    botao: 'rgba(17, 34, 62, 0.92)',
    botaoBorda: 'rgba(59, 130, 246, 0.35)',
    botaoTexto: '#DCEBFF',
  },
  claro: {
    fundo: '#F3F7FF',
    texto: '#10213D',
    suave: '#607493',
    cartao: 'rgba(255, 255, 255, 0.94)',
    borda: 'rgba(37, 99, 235, 0.16)',
    botao: 'rgba(231, 240, 255, 0.96)',
    botaoBorda: 'rgba(37, 99, 235, 0.22)',
    botaoTexto: '#18345D',
  },
}

const ABAS: { id: Aba; nome: string }[] = [
  { id: 'inicio', nome: 'Início' },
  { id: 'favoritos', nome: 'Favoritos' },
  { id: 'historico', nome: 'Histórico' },
  { id: 'definicoes', nome: 'Definições' },
]

function formatarData(ms: number): string {
  return new Date(ms).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Carrega o AdSense apenas no website. */
function AnuncioAdSense() {
  const anuncioRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return

    const anuncio = anuncioRef.current
    if (!anuncio || anuncio.dataset.nexoraProcessado === 'true') return

    anuncio.dataset.nexoraProcessado = 'true'

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (erro) {
      console.error('Erro ao preparar o anúncio AdSense:', erro)
    }
  }, [])

  if (Capacitor.isNativePlatform()) return null

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        margin: '24px auto',
        textAlign: 'center',
      }}
    >
      <ins
        ref={anuncioRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-7936089745101654"
        data-ad-slot="4763217913"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}

function Icone({ nome, tamanho = 24 }: { nome: string; tamanho?: number }) {
  const caminhos: Record<string, React.ReactNode> = {
    inicio: (
      <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    ),
    favoritos: (
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    ),
    historico: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    definicoes: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    lupa: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </>
    ),
    seta: <path d="M5 12h14M13 6l6 6-6 6" />,
    escudo: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
    cadeado: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    raio: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
    direita: <path d="M9 6l6 6-6 6" />,
  }

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {caminhos[nome]}
    </svg>
  )
}

function CartaoSite({
  titulo,
  url,
  aoTocar,
  estilo,
}: {
  titulo: string
  url: string
  aoTocar: () => void
  estilo: React.CSSProperties
}) {
  const [falhou, setFalhou] = useState(false)

  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    host = ''
  }

  return (
    <button
      type="button"
      onClick={aoTocar}
      style={{
        ...estilo,
        minWidth: 0,
        overflow: 'hidden',
        wordBreak: 'break-word',
      }}
    >
      {host && !falhou ? (
        <img
          src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
          width={36}
          height={36}
          alt=""
          onError={() => setFalhou(true)}
          style={{
            borderRadius: 10,
            objectFit: 'contain',
            background: '#FFFFFF',
          }}
        />
      ) : (
        <span
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 11,
            background: GRAD,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
          }}
        >
          {titulo.charAt(0).toUpperCase()}
        </span>
      )}
      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{titulo}</span>
    </button>
  )
}

function Foguete() {
  return (
    <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">
      <defs>
        <linearGradient id="gf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <path
        d="M32 6c9 7 13 17 11 30l-6 6H27l-6-6C19 23 23 13 32 6z"
        fill="url(#gf)"
      />
      <circle cx="32" cy="24" r="5" fill="#0B1020" />
      <path d="M21 36l-8 8 9-1zM43 36l8 8-9-1z" fill="#6366F1" />
      <path d="M28 46c0 6 2 10 4 12 2-2 4-6 4-12z" fill="#F59E0B" />
    </svg>
  )
}

function Abertura({ aoTerminar }: { aoTerminar: () => void }) {
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    const a = window.setTimeout(() => setSaindo(true), 2300)
    const b = window.setTimeout(aoTerminar, 2900)

    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [aoTerminar])

  const onda: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '2px solid rgba(56,189,248,0.6)',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#050B18',
        backgroundImage: `linear-gradient(rgba(5,11,24,0.45), rgba(5,11,24,0.88)), url(${FUNDO})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        opacity: saindo ? 0 : 1,
        transform: saindo ? 'scale(1.06)' : 'scale(1)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'nx-entrar 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        }}
      >
        <span style={{ ...onda, animation: 'nx-onda 1.8s ease-out 0.6s infinite' }} />
        <span style={{ ...onda, animation: 'nx-onda 1.8s ease-out 1.2s infinite' }} />
        <svg
          width="76"
          height="76"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.6"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.8))' }}
          aria-hidden="true"
        >
          <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" />
        </svg>
      </div>

      <div
        style={{
          marginTop: 26,
          fontSize: '2.4rem',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: 1,
          ...TEXTO_GRAD,
          animation: 'nx-subir 0.8s ease 0.5s both',
        }}
      >
        NEXORA JH
      </div>

      <div
        style={{
          marginTop: 8,
          color: '#91A4C7',
          fontSize: '0.95rem',
          animation: 'nx-subir 0.8s ease 0.8s both',
        }}
      >
        O teu navegador moderno e seguro
      </div>

      <div
        style={{
          marginTop: 36,
          width: 170,
          height: 4,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.15)',
          animation: 'nx-subir 0.6s ease 1s both',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 4,
            background: GRAD,
            animation: 'nx-carregar 1.9s ease-in-out 1s both',
          }}
        />
      </div>
    </div>
  )
}

export default function App() {
  const [texto, setTexto] = useState('')
  const [aba, setAba] = useState<Aba>('inicio')
  const [vistaHist, setVistaHist] = useState<VistaHistorico>('sites')
  const [favoritos, setFavoritos] = useState(lerFavoritos)
  const [historico, setHistorico] = useState(lerHistorico)
  const [downloads, setDownloads] = useState(lerDownloads)
  const [config, setConfig] = useState<Config>(lerConfig)
  const [abertura, setAbertura] = useState(true)
  const campo = useRef<HTMLInputElement>(null)

  // O AdSense só é carregado no website.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return

    const existente = document.querySelector('script[data-nexora-adsense]')
    if (existente) return

    const script = document.createElement('script')
    script.async = true
    script.dataset.nexoraAdsense = 'true'
    script.crossOrigin = 'anonymous'
    script.src =
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7936089745101654'

    script.onerror = () => {
      console.error('Não foi possível carregar o script do Google AdSense.')
    }

    document.head.appendChild(script)
  }, [])

  // O AdMob é utilizado apenas na aplicação Android.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let ativo = true

    const iniciarAdMob = async () => {
      try {
        await AdMob.initialize()
        if (!ativo) return

        await AdMob.showBanner({
          adId: 'ca-app-pub-4653920322395752/8835923354',
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 82,
          isTesting: false,
        })
      } catch (erro) {
        console.error('Erro ao iniciar o banner AdMob:', erro)
      }
    }

    void iniciarAdMob()

    return () => {
      ativo = false
      void AdMob.hideBanner().catch((erro) => {
        console.error('Erro ao ocultar o banner AdMob:', erro)
      })
    }
  }, [])

  const terminarAbertura = useCallback(() => setAbertura(false), [])

  const t = TEMAS[config.tema]
  const escuro = config.tema === 'escuro'

  const atualizar = () => {
    setFavoritos(lerFavoritos())
    setHistorico(lerHistorico())
    setDownloads(lerDownloads())
  }

  useEffect(() => {
    const aoVoltar = () => {
      setFavoritos(lerFavoritos())
      setHistorico(lerHistorico())
      setDownloads(lerDownloads())
    }

    window.addEventListener('focus', aoVoltar)
    document.addEventListener('visibilitychange', aoVoltar)

    return () => {
      window.removeEventListener('focus', aoVoltar)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [])

  const ir = (valor: string) => {
    abrir(valor)
      .catch(() => alert('Não foi possível abrir o endereço.'))
      .finally(atualizar)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!texto.trim()) return
    ir(texto)
  }

  const mudarConfig = (parte: Partial<Config>) => {
    const nova = { ...config, ...parte }
    setConfig(nova)
    guardarConfig(nova)
  }

  const guardarFavoritoDoTexto = () => {
    const u = montarUrl(texto)
    if (!u) return

    adicionarFavorito({ titulo: nomeDoSite(u), url: u })
    atualizar()
    alert('Guardado nos favoritos.')
  }

  const limparDados = () => {
    limparCookies()
      .then(() => alert('Pedido enviado: cookies e cache limpos.'))
      .catch(() => alert('Não foi possível limpar agora.'))
  }

  const maisVisitados = [...historico]
    .filter((v) => !v.titulo.startsWith('Pesquisa'))
    .filter((v) => !favoritos.some((f) => f.url === v.url))
    .sort((a, b) => b.vezes - a.vezes)
    .slice(0, 6)

  const entrada = (atraso: number): React.CSSProperties =>
    abertura
      ? { opacity: 0 }
      : { animation: `nx-subir 0.7s ease ${atraso}s both` }

  const botao: React.CSSProperties = {
    padding: '9px 16px',
    backgroundColor: t.botao,
    border: `1px solid ${t.botaoBorda}`,
    borderRadius: 12,
    color: t.botaoTexto,
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  }

  const botaoAtivo: React.CSSProperties = {
    ...botao,
    background: GRAD,
    color: '#FFFFFF',
    border: '1px solid rgba(125,211,252,0.4)',
    boxShadow: '0 5px 18px rgba(37,99,235,0.22)',
  }

  const cartaoAtalho: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: '15px 5px',
    backgroundColor: t.botao,
    border: `1px solid ${t.botaoBorda}`,
    borderRadius: 17,
    color: t.texto,
    cursor: 'pointer',
    minWidth: 0,
    animation: 'nx-brilho 4s ease-in-out infinite',
  }

  const linha: React.CSSProperties = {
    backgroundColor: t.cartao,
    border: `1px solid ${t.borda}`,
    borderRadius: 15,
    padding: '13px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: escuro ? '0 5px 18px rgba(0,0,0,0.08)' : '0 5px 18px rgba(37,99,235,0.04)',
  }

  const titulo: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 800,
    margin: '0 0 16px 0',
    color: t.texto,
    letterSpacing: '-0.3px',
  }

  const rotulo: React.CSSProperties = {
    color: t.suave,
    fontSize: '0.85rem',
    margin: '20px 0 9px 0',
    fontWeight: 600,
  }

  const nota: React.CSSProperties = {
    color: t.suave,
    fontSize: '0.75rem',
    margin: '7px 0 0 0',
    lineHeight: 1.5,
  }

  const lista: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    width: '100%',
  }

  const textoLinha: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
    textAlign: 'left',
  }

  const cortar: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const botaoIcone: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: t.suave,
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: 8,
  }

  const botaoPerigo: React.CSSProperties = {
    ...botao,
    width: '100%',
    padding: '12px 16px',
    marginBottom: 14,
    border: '1px solid rgba(248,113,113,0.45)',
    color: escuro ? '#FCA5A5' : '#B91C1C',
    backgroundColor: escuro ? 'rgba(127,29,29,0.14)' : 'rgba(254,226,226,0.7)',
  }

  const corVeu = escuro ? '5,11,24' : '243,247,255'
  const veu = aba === 'inicio' ? 0.12 : escuro ? 0.72 : 0.55
  const imagemFundo = escuro ? FUNDO : FUNDO_CLARO

  const estiloFundo: React.CSSProperties = {
    backgroundColor: t.fundo,
    backgroundImage: `linear-gradient(rgba(${corVeu},${veu}), rgba(${corVeu},${veu})), url(${imagemFundo})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...estiloFundo,
        color: t.texto,
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '22px 18px 112px',
        boxSizing: 'border-box',
        textAlign: 'left',
      }}
    >
      <style>{ANIMACOES}</style>

      {abertura && <Abertura aoTerminar={terminarAbertura} />}

      {aba === 'inicio' && (
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              ...entrada(0),
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" />
                </svg>
                <span
                  style={{
                    fontSize: 'clamp(1.55rem, 6vw, 1.95rem)',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    letterSpacing: '-0.8px',
                    ...TEXTO_GRAD,
                  }}
                >
                  NEXORA JH
                </span>
              </div>
              <p style={{ color: t.suave, fontSize: '0.85rem', margin: '7px 0 0 0' }}>
                {config.privado ? '🕶️ Modo privado ativo' : 'O teu navegador moderno e seguro'}
              </p>
            </div>

            <button
              type="button"
              aria-label="Abrir definições"
              onClick={() => setAba('definicoes')}
              style={{
                ...botaoIcone,
                border: `1px solid ${t.borda}`,
                borderRadius: 14,
                padding: 12,
                color: t.texto,
                backgroundColor: t.cartao,
                flexShrink: 0,
              }}
            >
              <Icone nome="menu" />
            </button>
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.6rem, 6vw, 2.15rem)',
              lineHeight: 1.2,
              margin: '58px 0 18px',
              maxWidth: 430,
              fontWeight: 850,
              letterSpacing: '-0.8px',
              ...TEXTO_GRAD,
              ...entrada(0.1),
            }}
          >
            Explore o mundo com mais liberdade!
          </h2>

          <div
            style={{
              display: 'flex',
              gap: 15,
              color: t.suave,
              fontSize: '0.78rem',
              flexWrap: 'wrap',
              marginBottom: 25,
              ...entrada(0.2),
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icone nome="escudo" tamanho={17} /> Rápido
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icone nome="cadeado" tamanho={17} /> Seguro
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icone nome="raio" tamanho={17} /> Confiável
            </span>
          </div>

          <div
            style={{
              padding: 2,
              borderRadius: 999,
              background: GRAD,
              boxShadow: '0 8px 28px rgba(37,99,235,0.16)',
              ...entrada(0.3),
            }}
          >
            <form
              onSubmit={handleSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 999,
                background: escuro ? '#081326' : '#FFFFFF',
                padding: '4px 4px 4px 16px',
              }}
            >
              <span style={{ color: '#38BDF8', display: 'flex', flexShrink: 0 }}>
                <Icone nome="lupa" />
              </span>
              <input
                ref={campo}
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Pesquisar ou escrever endereço..."
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                inputMode="url"
                enterKeyHint="go"
                aria-label="Pesquisar ou escrever endereço"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '13px 4px',
                  border: 'none',
                  background: 'transparent',
                  color: escuro ? '#EAF2FF' : '#10213D',
                  outline: 'none',
                  fontSize: '0.94rem',
                }}
              />
              <button
                type="submit"
                aria-label="Pesquisar"
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: '50%',
                  border: 'none',
                  background: GRAD,
                  color: '#FFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icone nome="seta" />
              </button>
            </form>
          </div>

          {texto.trim() && (
            <button
              type="button"
              onClick={guardarFavoritoDoTexto}
              style={{ ...botao, marginTop: 12 }}
            >
              ☆ Guardar nos favoritos
            </button>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 10,
              marginTop: 26,
              ...entrada(0.4),
            }}
          >
            {favoritos.slice(0, 8).map((f) => (
              <CartaoSite
                key={f.url}
                titulo={f.titulo}
                url={f.url}
                aoTocar={() => ir(f.url)}
                estilo={cartaoAtalho}
              />
            ))}
          </div>

          <AnuncioAdSense />

          {maisVisitados.length > 0 && (
            <div style={{ marginTop: 24, ...entrada(0.5) }}>
              <p style={{ color: t.suave, fontSize: '0.8rem', margin: '0 0 10px 0' }}>
                Mais visitados
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {maisVisitados.map((v) => (
                  <button
                    type="button"
                    key={v.url}
                    onClick={() => ir(v.url)}
                    style={botao}
                  >
                    {v.titulo}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={entrada(0.6)}>
            <button
              type="button"
              onClick={() => campo.current?.focus()}
              style={{
                width: '100%',
                marginTop: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '15px 16px',
                borderRadius: 20,
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: t.cartao,
                border: `1px solid ${t.borda}`,
                color: t.texto,
                boxShadow: escuro ? '0 10px 30px rgba(0,0,0,0.12)' : '0 10px 30px rgba(37,99,235,0.05)',
              }}
            >
              <span style={{ display: 'inline-flex', animation: 'nx-flutuar 3s ease-in-out infinite' }}>
                <Foguete />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: '1.02rem' }}>
                  Navegação sem limites
                </span>
                <span style={{ display: 'block', color: t.suave, fontSize: '0.83rem', marginTop: 5, lineHeight: 1.5 }}>
                  Descobre, pesquisa, aprende e evolui cada dia mais.
                </span>
              </span>
              <span style={{ color: '#38BDF8', display: 'flex' }}>
                <Icone nome="direita" />
              </span>
            </button>
          </div>
        </div>
      )}

      {aba === 'favoritos' && (
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <h2 style={titulo}>⭐ Favoritos</h2>
          {favoritos.length === 0 && (
            <p style={{ color: t.suave }}>Ainda não tens favoritos.</p>
          )}
          <div style={lista}>
            {favoritos.map((f) => (
              <div key={f.url} style={linha}>
                <div style={textoLinha} onClick={() => ir(f.url)}>
                  <div style={{ fontWeight: 750, ...cortar }}>{f.titulo}</div>
                  <div style={{ color: t.suave, fontSize: '0.75rem', marginTop: 4, ...cortar }}>
                    {f.url}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${f.titulo} dos favoritos`}
                  style={botaoIcone}
                  onClick={() => {
                    removerFavorito(f.url)
                    atualizar()
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'historico' && (
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <h2 style={titulo}>🕘 Histórico</h2>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              style={vistaHist === 'sites' ? botaoAtivo : botao}
              onClick={() => setVistaHist('sites')}
            >
              🌐 Sites
            </button>
            <button
              type="button"
              style={vistaHist === 'downloads' ? botaoAtivo : botao}
              onClick={() => setVistaHist('downloads')}
            >
              ⬇️ Downloads
            </button>
          </div>

          {vistaHist === 'sites' && (
            <>
              <button
                type="button"
                style={botaoPerigo}
                onClick={() => {
                  if (historico.length === 0) {
                    alert('O histórico já está vazio.')
                  } else if (confirm('Apagar todo o histórico?')) {
                    limparHistorico()
                    atualizar()
                  }
                }}
              >
                🗑️ Limpar histórico
              </button>

              {historico.length === 0 && (
                <p style={{ color: t.suave }}>O histórico está vazio.</p>
              )}

              <div style={lista}>
                {historico.map((v) => (
                  <div key={v.url} style={linha}>
                    <div style={textoLinha} onClick={() => ir(v.url)}>
                      <div style={{ fontWeight: 750, ...cortar }}>{v.titulo}</div>
                      <div style={{ color: t.suave, fontSize: '0.75rem', marginTop: 4, ...cortar }}>
                        {formatarData(v.data)} · {v.url}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Guardar ${v.titulo} nos favoritos`}
                      style={botaoIcone}
                      onClick={() => {
                        adicionarFavorito({ titulo: v.titulo, url: v.url })
                        atualizar()
                      }}
                    >
                      ☆
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {vistaHist === 'downloads' && (
            <>
              <button
                type="button"
                style={botaoPerigo}
                onClick={() => {
                  if (downloads.length === 0) {
                    alert('A lista já está vazia.')
                  } else if (confirm('Apagar a lista de downloads? Os ficheiros não são apagados.')) {
                    limparDownloads()
                    atualizar()
                  }
                }}
              >
                🗑️ Limpar lista de downloads
              </button>

              {downloads.length === 0 && (
                <p style={{ color: t.suave }}>
                  Ainda não há downloads. Toque num link de ficheiro dentro de um site.
                </p>
              )}

              <div style={lista}>
                {downloads.map((d, i) => (
                  <div key={d.data + '-' + i} style={linha}>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{ fontWeight: 750, ...cortar }}>
                        {d.erro ? '⚠️ ' : '✅ '}{d.nome}
                      </div>
                      <div style={{ color: t.suave, fontSize: '0.75rem', marginTop: 4, ...cortar }}>
                        {formatarData(d.data)} · {d.erro ? 'Falhou: ' + d.erro : d.tipo || 'ficheiro'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p style={nota}>
                Os ficheiros abrem no visualizador do Android depois de baixados. Se quiser
                guardá-los, use o botão de guardar ou partilhar desse visualizador.
              </p>
            </>
          )}
        </div>
      )}

      {aba === 'definicoes' && (
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <h2 style={titulo}>⚙️ Definições</h2>

          <p style={{ ...rotulo, marginTop: 0 }}>Motor de pesquisa</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['google', 'duckduckgo', 'bing'] as const).map((m) => (
              <button
                type="button"
                key={m}
                style={config.motor === m ? botaoAtivo : botao}
                onClick={() => mudarConfig({ motor: m })}
              >
                {m === 'google' ? 'Google' : m === 'duckduckgo' ? 'DuckDuckGo' : 'Bing'}
              </button>
            ))}
          </div>

          <p style={rotulo}>Tema</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              style={config.tema === 'escuro' ? botaoAtivo : botao}
              onClick={() => mudarConfig({ tema: 'escuro' })}
            >
              🌙 Escuro
            </button>
            <button
              type="button"
              style={config.tema === 'claro' ? botaoAtivo : botao}
              onClick={() => mudarConfig({ tema: 'claro' })}
            >
              ☀️ Claro
            </button>
          </div>

          <p style={rotulo}>Modo privado</p>
          <button
            type="button"
            style={config.privado ? botaoAtivo : botao}
            onClick={() => mudarConfig({ privado: !config.privado })}
          >
            {config.privado ? '🕶️ Ativo: não guarda histórico' : 'Desativado'}
          </button>

          <p style={rotulo}>Modo computador</p>
          <button
            type="button"
            style={config.computador ? botaoAtivo : botao}
            onClick={() => mudarConfig({ computador: !config.computador })}
          >
            {config.computador ? '🖥️ Ativo' : 'Desativado'}
          </button>
          <p style={nota}>
            Tenta mostrar os sites em formato de PC. Alguns sites podem continuar a mostrar
            a versão de telemóvel. Vale para o próximo site que abrir.
          </p>

          <p style={rotulo}>Cookies</p>
          <button
            type="button"
            style={config.cookies ? botaoAtivo : botao}
            onClick={() => mudarConfig({ cookies: !config.cookies })}
          >
            {config.cookies ? '🍪 Guardar cookies' : '🧹 Apagar ao fechar o site'}
          </button>
          <p style={nota}>
            Com “Apagar ao fechar”, os sites esquecem o seu login quando fecha a janela deles.
          </p>

          <p style={rotulo}>Modo seguro (HTTPS)</p>
          <button
            type="button"
            style={config.seguro ? botaoAtivo : botao}
            onClick={() => mudarConfig({ seguro: !config.seguro })}
          >
            {config.seguro ? '🔒 Ativo: converte http:// em https://' : 'Desativado'}
          </button>
          <p style={nota}>
            Desativado, endereços que começam por http:// abrem como foram escritos,
            sem a proteção do https.
          </p>

          <p style={rotulo}>Limpeza</p>
          <button type="button" style={botao} onClick={limparDados}>
            🧽 Limpar cookies e cache
          </button>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          left: 10,
          right: 10,
          bottom: 10,
          display: 'flex',
          zIndex: 5,
          backgroundColor: escuro ? 'rgba(8,19,38,0.94)' : 'rgba(255,255,255,0.96)',
          border: `1px solid ${t.borda}`,
          borderRadius: 24,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: escuro ? '0 8px 32px rgba(0,0,0,0.22)' : '0 8px 32px rgba(37,99,235,0.1)',
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        {ABAS.map((a) => (
          <button
            type="button"
            key={a.id}
            onClick={() => {
              setAba(a.id)
              atualizar()
            }}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '10px 4px 8px',
              background: 'none',
              border: 'none',
              color: aba === a.id ? '#38BDF8' : t.suave,
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              fontWeight: aba === a.id ? 750 : 500,
            }}
          >
            <Icone nome={a.id} />
            {a.nome}
            <span
              style={{
                height: 3,
                width: 28,
                borderRadius: 3,
                marginTop: 2,
                background: aba === a.id ? GRAD : 'transparent',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
