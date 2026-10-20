import { Capacitor } from '@capacitor/core'
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'

// true = anúncios de TESTE da Google (seguro).
// Só mude para false depois de criar o AdMob e colar os IDs reais abaixo.
const USAR_TESTE = true

const BANNER_TESTE = 'ca-app-pub-3940256099942544/6300978111'
const BANNER_REAL = 'COLE-AQUI-O-ID-DO-BLOCO-DE-ANUNCIOS'

// distância do banner à parte de baixo, para ficar acima da barra de navegação
const MARGEM_BANNER = 84

export async function iniciarAnuncios(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await AdMob.initialize({})
    await AdMob.showBanner({
      adId: USAR_TESTE ? BANNER_TESTE : BANNER_REAL,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: MARGEM_BANNER,
      isTesting: USAR_TESTE,
    })
  } catch {
    // sem rede ou sem anúncio disponível: o app continua normal
  }
}

export async function esconderAnuncios(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await AdMob.removeBanner()
  } catch {
    // ignora
  }
}
