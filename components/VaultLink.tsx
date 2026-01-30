import React from 'react'

interface VaultLinkProps {
  url: string
  name: string
}

export function VaultLink({ url, name }: VaultLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="vault-link"
    >
      Open {name}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      <style jsx>{`
        .vault-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: #3b82f6;
          color: white;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .vault-link:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        .vault-link svg {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </a>
  )
}
