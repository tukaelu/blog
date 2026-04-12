// Hatena Star configuration
// Initializes Hatena Star for blog articles
// This script is loaded with defer attribute, ensuring it runs after
// HatenaStar.js but before DOMContentLoaded, allowing proper initialization
if (window.Hatena && window.Hatena.Star) {
  Hatena.Star.SiteConfig = {
    entryNodes: {
      'article[data-pagefind-body]': {
        uri: 'header h1 a',
        title: 'header h1',
        container: '.hatena-star',
      },
    },
  }
}
