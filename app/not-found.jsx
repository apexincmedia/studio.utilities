import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h2>Page not found</h2>
      <p>This tool or page doesn&apos;t exist — yet.</p>
      <Link href="/tools" className="btn-primary">
        Browse All Tools
      </Link>
    </div>
  );
}
