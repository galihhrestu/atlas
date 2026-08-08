import { Link } from 'react-router-dom'

function getInsightK3Url() {
  const value = (import.meta.env.VITE_INSIGHT_K3_URL || '').trim()

  if (!value) {
    return { url: '', invalid: false }
  }

  try {
    const parsed = new URL(value)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { url: '', invalid: true }
    }

    return { url: parsed.toString(), invalid: false }
  } catch {
    return { url: '', invalid: true }
  }
}

export default function InsightK3Portal() {
  const insight = getInsightK3Url()

  return (
    <main className="insight-k3-portal">
      <header className="insight-k3-portal-header">
        <Link className="insight-k3-back" to="/">
          ← Kembali ke ATLAS
        </Link>
        <span className="insight-k3-portal-label">ATLAS platform / dashboard portal</span>
      </header>

      <section className="insight-k3-portal-content">
        <div className="insight-k3-portal-copy">
          <span className="insight-k3-kicker">Health, Safety &amp; Environment</span>
          <h1>INSIGHT K3</h1>
          <p>
            Dashboard untuk incident, near miss, investigasi, verifikasi operator,
            tindak lanjut, dan pelaporan keselamatan kerja.
          </p>
        </div>

        <div className="insight-k3-status-card">
          <div className="insight-k3-status-icon" aria-hidden="true">K3</div>
          <div>
            {insight.url ? (
              <>
                <span className="insight-k3-status-label is-ready">Portal terhubung</span>
                <h2>Buka aplikasi INSIGHT K3</h2>
                <p>
                  Frontend INSIGHT K3 dibuka sebagai aplikasi terpisah. Backend-nya
                  tetap berjalan bersama Express, Prisma, dan PostgreSQL.
                </p>
                <a
                  className="insight-k3-open-button"
                  href={insight.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka INSIGHT K3 <span aria-hidden="true">↗</span>
                </a>
              </>
            ) : (
              <>
                <span className={`insight-k3-status-label${insight.invalid ? ' is-warning' : ''}`}>
                  {insight.invalid ? 'URL belum valid' : 'Menunggu URL aplikasi'}
                </span>
                <h2>Source sudah masuk ke repository</h2>
                <p>
                  Folder frontend dan backend tersedia di{' '}
                  <code>apps/insight-k3/</code>. Setelah frontend INSIGHT K3
                  dideploy, masukkan alamatnya ke <code>VITE_INSIGHT_K3_URL</code>
                  lalu push ulang repository ini.
                </p>
                <div className="insight-k3-instructions">
                  <strong>Pemisahan ini memang diperlukan</strong>
                  <span>
                    GitHub Pages hanya menjalankan file statis, sedangkan API dan
                    database K3 membutuhkan server Node.js dan PostgreSQL.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <Link className="insight-k3-secondary-link" to="/">
          Kembali ke katalog dashboard ATLAS
        </Link>
      </section>
    </main>
  )
}
