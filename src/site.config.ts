import type { SiteConfig } from '~/types'

const config: SiteConfig = {
  // Absolute URL to the root of your published site, used for generating links and sitemaps.
  site: 'https://monkeywie.cn',
  // The name of your site, used in the title and for SEO.
  title: "Levi's Blog",
  // The description of your site, used for SEO and RSS feed.
  description:
    'A coder-ready Astro blog theme with 59 of your favorite color schemes to choose from',
  // The author of the site, used in the footer, SEO, and RSS feed.
  author: 'Levi',
  // Keywords for SEO, used in the meta tags.
  tags: [
    'Blog',
    'Java',
    'AI',
    'Coding',
    'JavaScript',
    'TypeScript',
    'Golang',
    'Programming',
    'Docker',
    'Kubernetes',
    'DevOps',
  ],
  // Path to the image used for generating social media previews.
  // Needs to be a square JPEG file due to limitations of the social card generator.
  // Try https://squoosh.app/ to easily convert images to JPEG.
  socialCardAvatarImage: './src/content/avatar.jpg',
  // Font imported from @fontsource or elsewhere, used for the entire site.
  // To change this see src/styles/global.css and import a different font.
  font: 'JetBrains Mono Variable',
  // For pagination, the number of posts to display per page.
  // The homepage will display half this number in the "Latest Posts" section.
  pageSize: 6,
  // Whether Astro should resolve trailing slashes in URLs or not.
  // This value is used in the astro.config.mjs file and in the "Search" component to make sure pagefind links match this setting.
  // It is not recommended to change this, since most links existing in the site currently do not have trailing slashes.
  trailingSlashes: false,
  // The navigation links to display in the header.
  navLinks: [
    {
      name: '首页',
      url: '/',
    },
    {
      name: '归档',
      url: '/posts',
    },
    {
      name: '关于我',
      url: '/about',
    },
    {
      name: 'GitHub',
      url: 'https://github.com/monkeyWie/monkeywie.github.io',
      external: true,
    },
  ],
  // The theming configuration for the site.
  themes: {
    // The theming mode. One of "single" | "select" | "light-dark-auto".
    mode: 'light-dark-auto',
    // The default theme identifier, used when themeMode is "select" or "light-dark-auto".
    // Make sure this is one of the themes listed in `themes` or "auto" for "light-dark-auto" mode.
    default: 'auto',
    // Shiki themes to bundle with the site.
    // https://expressive-code.com/guides/themes/#using-bundled-themes
    // These will be used to theme the entire site along with syntax highlighting.
    // To use light-dark-auto mode, only include a light and a dark theme in that order.
    include: ['github-light', 'github-dark'],
    // include: [
    //   'andromeeda',
    //   'aurora-x',
    //   'ayu-dark',
    //   'catppuccin-frappe',
    //   'catppuccin-latte',
    //   'catppuccin-macchiato',
    //   'catppuccin-mocha',
    //   'dark-plus',
    //   'dracula',
    //   'dracula-soft',
    //   'everforest-dark',
    //   'everforest-light',
    //   'github-dark',
    //   'github-dark-default',
    //   'github-dark-dimmed',
    //   'github-dark-high-contrast',
    //   'github-light',
    //   'github-light-default',
    //   'github-light-high-contrast',
    //   'gruvbox-dark-hard',
    //   'gruvbox-dark-medium',
    //   'gruvbox-dark-soft',
    //   'gruvbox-light-hard',
    //   'gruvbox-light-medium',
    //   'gruvbox-light-soft',
    //   'houston',
    //   'kanagawa-dragon',
    //   'kanagawa-lotus',
    //   'kanagawa-wave',
    //   'laserwave',
    //   'light-plus',
    //   'material-theme',
    //   'material-theme-darker',
    //   'material-theme-lighter',
    //   'material-theme-ocean',
    //   'material-theme-palenight',
    //   'min-dark',
    //   'min-light',
    //   'monokai',
    //   'night-owl',
    //   'nord',
    //   'one-dark-pro',
    //   'one-light',
    //   'plastic',
    //   'poimandres',
    //   'red',
    //   'rose-pine',
    //   'rose-pine-dawn',
    //   'rose-pine-moon',
    //   'slack-dark',
    //   'slack-ochin',
    //   'snazzy-light',
    //   'solarized-dark',
    //   'solarized-light',
    //   'synthwave-84',
    //   'tokyo-night',
    //   'vesper',
    //   'vitesse-black',
    //   'vitesse-dark',
    //   'vitesse-light',
    // ],
    // Optional overrides for specific themes to customize colors.
    // Their values can be either a literal color (hex, rgb, hsl) or another theme key.
    // See themeKeys list in src/types.ts for available keys to override and reference.
    overrides: {
      // Improve readability for aurora-x theme
      // 'aurora-x': {
      //   background: '#292929FF',
      //   foreground: '#DDDDDDFF',
      //   warning: '#FF7876FF',
      //   important: '#FF98FFFF',
      //   note: '#83AEFFFF',
      // },
      // Make the GitHub dark theme a little cuter
      // 'github-light': {
      //   accent: 'magenta',
      //   heading1: 'magenta',
      //   heading2: 'magenta',
      //   heading3: 'magenta',
      //   heading4: 'magenta',
      //   heading5: 'magenta',
      //   heading6: 'magenta',
      //   separator: 'magenta',
      //   link: 'list',
      // },
    },
  },
  // Social links to display in the footer.
  socialLinks: {
    github: 'https://github.com/monkeyWie',
    // mastodon: 'https://github.com/monkeyWie/monkeywie.github.io',
    email: 'liwei2633@gmail.com',
    // linkedin: 'https://github.com/monkeyWie/monkeywie.github.io',
    // bluesky: 'https://github.com/monkeyWie/monkeywie.github.io',
    twitter: 'https://twitter.com/JayPlayDota',
    rss: true, // Set to true to include an RSS feed link in the footer
  },
  // Configuration for Giscus comments.
  // To set up Giscus, follow the instructions at https://giscus.app/
  // You'll need a GitHub repository with discussions enabled and the Giscus app installed.
  // Take the values from the generated script tag at https://giscus.app and fill them in here.
  // IMPORTANT: Update giscus.json in the root of the project with your own website URL
  // If you don't want to use Giscus, set this to undefined.
  giscus: {
    repo: 'monkeyWie/monkeywie.github.io',
    repoId: 'MDEwOlJlcG9zaXRvcnkxNDIxMDk4MTQ=',
    category: 'Announcements',
    categoryId: 'DIC_kwDOCHhsds4CxvMI',
    reactionsEnabled: true, // Enable reactions on post itself
  },
  // These are characters available for the character chat feature.
  // To add your own character, add an image file to the top-level `/public` directory
  // Make sure to compress the image to a web-friendly size (<100kb)
  // Try using the excellent https://squoosh.app web app for creating small webp files
  characters: {
    owl: '/owl.webp',
    unicorn: '/unicorn.webp',
    duck: '/duck.webp',
  },
}

export default config
