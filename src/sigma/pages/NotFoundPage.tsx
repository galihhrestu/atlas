import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="not-found">
      <SearchX size={44} />
      <span>404</span>
      <h1>Page not found</h1>
      <p>The requested SIGMA workspace does not exist.</p>
      <Link className="button button--primary" to="/dashboard"><ArrowLeft size={17} /> Return to dashboard</Link>
    </div>
  )
}
