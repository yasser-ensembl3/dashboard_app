import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700 }}>MiniVault Dashboard</span>,
  project: {
    link: 'https://github.com/yasserMusic/minivault-dashboard',
  },
  docsRepositoryBase: 'https://github.com/yasserMusic/minivault-dashboard',
  footer: {
    text: 'MiniVault Dashboard - Your vault ecosystem hub',
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="MiniVault Dashboard" />
      <meta property="og:description" content="Hub for all MiniVault projects" />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: '%s – MiniVault'
    }
  },
  primaryHue: 200,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
}

export default config
