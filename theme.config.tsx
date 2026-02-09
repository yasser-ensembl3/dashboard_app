import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700 }}>MetaVault</span>,
  project: {
    link: 'https://github.com/yasserMusic/minivault-dashboard',
  },
  docsRepositoryBase: 'https://github.com/yasserMusic/minivault-dashboard',
  footer: {
    text: 'MetaVault - Your vault ecosystem hub',
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="MetaVault" />
      <meta property="og:description" content="Hub for all MiniVault projects" />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: '%s – MetaVault'
    }
  },
  primaryHue: 0,
  primarySaturation: 0,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
}

export default config
