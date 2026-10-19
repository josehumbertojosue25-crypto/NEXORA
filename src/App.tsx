import React, { useEffect, useState } from 'react'
import { abrir, montarUrl } from './navegar'
import {
  adicionarFavorito,
  guardarConfig,
  lerConfig,
  lerFavoritos,
  lerHistorico,
  limparHistorico,
  nomeDoSite,
  removerFavorito,
} from './armazem'
import type { Config } from './armazem'

type Aba = 'inicio' | 'favoritos' | 'historico' | 'definicoes'

const TEMAS = {
  escuro: {
    fundo: '#0B0F19', texto: '#F3F4F6', suave: '#9CA3AF', cartao: '#111827',
    borda: '#1F2937', botao: '#1F2937', botaoBorda: '#374151', botaoTexto: '#D1D5DB',
  },
  claro: {
    fundo: '#F9FAFB', texto: '#111827', suave: '#6B7280', cartao: '#FFFFFF',
    borda: '#E5E7EB', botao: '#E5E7EB', botaoBorda: '#D1D5DB', botaoTexto: '#374151',
  },
}

const ABAS: { id: Aba; icone: string; nome: string }[] = [
  { id: 'inicio', icone: '🏠', nome: 'Início' },
  { id: 'favoritos', icone: '⭐', nome: 'Favoritos' },
  { id: 'historico', icone: '🕘', nome: 'Histórico' },
  { id: 'definicoes', icone: '⚙️', nome: 'Definições' },
]

function formatarData(ms: number): string {
  return new Date(ms).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function App() {
  const [texto, setTexto] = useState('')
  const [aba, setAba] = useState<Aba>('inicio')
  const [favoritos, setFavoritos] = useState(lerFavoritos)
  const [historico, setHistorico] = useState(lerHistorico)
  const [config, setConfig] = useState<Config>(lerConfig)

  const t = TEMAS[config.tema]

  const atualizar = () => {
    setFavoritos(lerFavoritos())
    setHistorico(lerHistorico())
  }

  useEffect(() => {
    const aoVoltar = () => {
      setFavoritos(lerFavoritos())
      setHistorico(lerHistorico())
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

  const maisVisitados = [...historico]
    .filter((v) => !v.titulo.startsWith('Pesquisa'))
    .filter((v) => !favoritos.some((f) => f.url === v.url))
    .sort((a, b) => b.vezes - a.vezes)
    .slice(0, 6)

  const botao: React.CSSProperties = {
    padding: '8px 16px', backgroundColor: t.botao, border: `1px solid ${t.botaoBorda}`,
    borderRadius: '8px', color: t.botaoTexto, cursor: 'pointer', fontSize: '0.85rem',
  }
  const botaoAtivo: React.CSSProperties = {
    ...botao, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FFF', border: 'none',
  }
  const linha: React.CSSProperties = {
    backgroundColor: t.cartao, border: `1px solid ${t.borda}`, borderRadius: '12px',
    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px',
  }
  const titulo: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 14px 0' }
  const lista: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }
  const textoLinha: React.CSSProperties = {
    flex: 1, minWidth: 0, cursor: 'pointer', textAlign: 'left',
  }
  const cortar: React.CSSProperties = {
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }
  const botaoIcone: React.CSSProperties = {
    background: 'none', border: 'none', color: t.suave, fontSize: '1.1rem', cursor: 'pointer', padding: '4px 8px',
  }

  return (
    <div style={{
      backgroundColor: t.fundo, color: t.texto, minHeight: '100vh',
      fontFamily: 'sans-serif', padding: '20px 20px 90px 20px', boxSizing: 'border-box',
    }}>
      {aba === 'inicio' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 'calc(100vh - 110px)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{
              fontSize: '2.5rem', fontWeight: 'bold', margin: 0,
              background: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              NEXORA JH
            </h1>
            <p style={{ color: t.suave, fontSize: '0.9rem', marginTop: '8px' }}>
              {config.privado ? '🕶️ Modo privado ativo' : 'O teu navegador moderno e seguro'}
            </p>
          </div>

          <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '400px', display: 'flex', gap: '8px' }}>
            <input
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
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '12px',
                border: `1px solid ${t.borda}`, backgroundColor: t.cartao,
                color: t.texto, outline: 'none', fontSize: '1rem',
              }}
            />
            <button type="submit" style={{
              padding: '12px 20px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: '#FFF', fontWeight: 'bold', cursor: 'pointer',
            }}>Ir</button>
          </form>

          {texto.trim() && (
            <button onClick={guardarFavoritoDoTexto} style={{ ...botao, marginTop: '12px' }}>
              ☆ Guardar nos favoritos
            </button>
          )}

          <div style={{
            display: 'flex', gap: '12px', marginTop: '30px',
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {favoritos.slice(0, 8).map((f) => (
              <button key={f.url} onClick={() => ir(f.url)} style={botao}>{f.titulo}</button>
            ))}
          </div>

          {maisVisitados.length > 0 && (
            <div style={{ marginTop: '28px', width: '100%', maxWidth: '400px' }}>
              <p style={{ color: t.suave, fontSize: '0.8rem', margin: '0 0 10px 0', textAlign: 'center' }}>
                Mais visitados
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {maisVisitados.map((v) => (
                  <button key={v.url} onClick={() => ir(v.url)} style={botao}>{v.titulo}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {aba === 'favoritos' && (
        <div>
          <h2 style={titulo}>⭐ Favoritos</h2>
          {favoritos.length === 0 && <p style={{ color: t.suave }}>Ainda não tens favoritos.</p>}
          <div style={lista}>
            {favoritos.map((f) => (
              <div key={f.url} style={linha}>
                <div style={textoLinha} onClick={() => ir(f.url)}>
                  <div style={{ fontWeight: 'bold', ...cortar }}>{f.titulo}</div>
                  <div style={{ color: t.suave, fontSize: '0.75rem', ...cortar }}>{f.url}</div>
                </div>
                <button
                  style={botaoIcone}
                  onClick={() => { removerFavorito(f.url); atualizar() }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'historico' && (
        <div>
          <h2 style={titulo}>🕘 Histórico</h2>
          {historico.length === 0 && <p style={{ color: t.suave }}>O histórico está vazio.</p>}
          <div style={lista}>
            {historico.map((v) => (
              <div key={v.url} style={linha}>
                <div style={textoLinha} onClick={() => ir(v.url)}>
                  <div style={{ fontWeight: 'bold', ...cortar }}>{v.titulo}</div>
                  <div style={{ color: t.suave, fontSize: '0.75rem', ...cortar }}>
                    {formatarData(v.data)} · {v.url}
                  </div>
                </div>
                <button
                  style={botaoIcone}
                  onClick={() => {
                    adicionarFavorito({ titulo: v.titulo, url: v.url })
                    atualizar()
                  }}
                >☆</button>
              </div>
            ))}
          </div>
          {historico.length > 0 && (
            <button
              style={{ ...botao, marginTop: '16px' }}
              onClick={() => {
                if (confirm('Apagar todo o histórico?')) {
                  limparHistorico()
                  atualizar()
                }
              }}
            >Limpar histórico</button>
          )}
        </div>
      )}

      {aba === 'definicoes' && (
        <div>
          <h2 style={titulo}>⚙️ Definições</h2>

          <p style={{ color: t.suave, fontSize: '0.85rem' }}>Motor de pesquisa</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {(['google', 'duckduckgo', 'bing'] as const).map((m) => (
              <button
                key={m}
                style={config.motor === m ? botaoAtivo : botao}
                onClick={() => mudarConfig({ motor: m })}
              >
                {m === 'google' ? 'Google' : m === 'duckduckgo' ? 'DuckDuckGo' : 'Bing'}
              </button>
            ))}
          </div>

          <p style={{ color: t.suave, fontSize: '0.85rem' }}>Tema</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              style={config.tema === 'escuro' ? botaoAtivo : botao}
              onClick={() => mudarConfig({ tema: 'escuro' })}
            >🌙 Escuro</button>
            <button
              style={config.tema === 'claro' ? botaoAtivo : botao}
              onClick={() => mudarConfig({ tema: 'claro' })}
            >☀️ Claro</button>
          </div>

          <p style={{ color: t.suave, fontSize: '0.85rem' }}>Modo privado</p>
          <button
            style={config.privado ? botaoAtivo : botao}
            onClick={() => mudarConfig({ privado: !config.privado })}
          >
            {config.privado ? '🕶️ Ativo: não guarda histórico' : 'Desativado'}
          </button>
        </div>
      )}

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex',
        backgroundColor: t.cartao, borderTop: `1px solid ${t.borda}`,
      }}>
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => { setAba(a.id); atualizar() }}
            style={{
              flex: 1, padding: '10px 4px', background: 'none', border: 'none',
              color: aba === a.id ? '#3B82F6' : t.suave, cursor: 'pointer', fontSize: '0.7rem',
            }}
          >
            <div style={{ fontSize: '1.3rem' }}>{a.icone}</div>
            {a.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
