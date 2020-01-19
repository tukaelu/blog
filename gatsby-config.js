const {
  NODE_ENV,
  URL: NETLIFY_SITE_URL = 'https://tuka.io',
  DEPLOY_PRIME_URL: NETLIFY_DEPLOY_URL = NETLIFY_SITE_URL,
  CONTEXT: NETLIFY_ENV = NODE_ENV
} = process.env;
const isNetlifyProduction = NETLIFY_ENV === 'production';
const siteUrl = isNetlifyProduction ? NETLIFY_SITE_URL : NETLIFY_DEPLOY_URL;

const config = {
  siteMetadata: {},
  plugins: [],
}

config.siteMetadata = {
  title: `tuka I/O`,
  author: `tuka`,
  description: `opinions are my own.`,
  siteUrl: `https://tuka.io/`,
  image: `/static/tuka.png`,
  social: {
    twitter: `tukaelu`,
    github: `tukaelu`,
  },
}

config.plugins.push({
  resolve: `gatsby-source-filesystem`,
  options: {
    path: `${__dirname}/content/blog`,
    name: `blog`,
  },
})
config.plugins.push({
  resolve: `gatsby-source-filesystem`,
  options: {
    path: `${__dirname}/content/assets`,
    name: `assets`,
  },
})
config.plugins.push({
  resolve: `gatsby-transformer-remark`,
  options: {
    plugins: [
      {
        resolve: `gatsby-remark-images`,
        options: {
          maxWidth: 590,
        },
      },
      {
        resolve: `gatsby-remark-responsive-iframe`,
        options: {
          wrapperStyle: `margin-bottom: 1.0725rem`,
        },
      },
      {
        resolve: `gatsby-remark-autolink-headers`,
        options: {
          removeAccents: true,
        },
      },
      `gatsby-remark-code-titles`,
      {
        resolve: `gatsby-remark-prismjs`,
        options: {
          classPrefix: "language-",
          noInlineHighlight: true,
          inlineCodeMarker: null,
          showLineNumbers: true,
          aliases: {
            sh: 'bash',
          },
        },
      },
      `gatsby-remark-copy-linked-files`,
      `gatsby-remark-smartypants`,
      `gatsby-remark-external-links`,
      {
        resolve: 'gatsby-remark-emojis',
        options: {
          // Deactivate the plugin globally (default: true)
          active : true,
          // Add a custom css class
          class  : 'emoji-icon',
          // In order to avoid pattern mismatch you can specify
          // an escape character which will be prepended to the
          // actual pattern (e.g. `#:poop:`).
          // escapeCharacter : '#', // (default: '')
          // Select the size (available size: 16, 24, 32, 64)
          size   : 64,
          // Add custom styles
          styles : {
            display      : 'inline',
            margin       : '0',
            'margin-top' : '1px',
            position     : 'relative',
            top          : '5px',
            width        : '25px'
          }
        }
      },
    ],
  },
})
config.plugins.push(`gatsby-transformer-sharp`)
config.plugins.push(`gatsby-plugin-sharp`)

if (process.env.CONTEXT === 'production') {
  const googleAnalytics = {
    resolve: `gatsby-plugin-google-analytics`,
    options: {
      trackingId: `UA-116908724-4`,
    },
  }
  config.plugins.push(googleAnalytics)
}

config.plugins.push({
  resolve: `gatsby-plugin-feed`,
  options: {
    query: `
      {
        site {
          siteMetadata {
            title
            description
            siteUrl
            site_url: siteUrl
          }
        }
      }
    `,
    feeds: [
      {
        serialize: ({ query: { site, allMarkdownRemark } }) => {
          return allMarkdownRemark.edges.map(edge => {
            return Object.assign({}, edge.node.frontmatter, {
              description: edge.node.excerpt,
              date: edge.node.frontmatter.date,
              url: site.siteMetadata.siteUrl + `/posts${edge.node.fields.slug}`,
              guid: site.siteMetadata.siteUrl + `/posts${edge.node.fields.slug}`,
              custom_elements: [{ "content:encoded": edge.node.html }],
            })
          })
        },
        query: `
          {
            allMarkdownRemark(
              sort: { order: DESC, fields: [frontmatter___date] },
            ) {
              edges {
                node {
                  excerpt
                  html
                  fields { slug }
                  frontmatter {
                    title
                    date
                  }
                }
              }
            }
          }
        `,
        output: "/rss.xml",
        title: "tuka I/O",
      },
    ],
  },
})

const manifest = {
  resolve: `gatsby-plugin-manifest`,
  options: {
    name: `tuka I/O`,
    short_name: `tuka I/O`,
    start_url: `/`,
    background_color: `#f7f8f9`,
    theme_color: process.env.CONTEXT === 'production' ? `#4dbddb` : `#f4bd0b`,
    display: `minimal-ui`,
    icon: `content/assets/tuka.png`,
  },
}
config.plugins.push(manifest)

config.plugins.push(`gatsby-plugin-offline`)
config.plugins.push(`gatsby-plugin-react-helmet`)
config.plugins.push({
  resolve: `gatsby-plugin-typography`,
  options: {
    pathToConfigModule: `src/utils/typography`,
  },
})
config.plugins.push(`gatsby-plugin-sitemap`)
config.plugins.push(`gatsby-plugin-twitter`)
config.plugins.push(`gatsby-plugin-netlify`)
config.plugins.push(`gatsby-plugin-netlify-cache`)
config.plugins.push(`gatsby-plugin-lodash`)
config.plugins.push({
  resolve: `gatsby-plugin-robots-txt`,
  options: {
    resolveEnv: () => NETLIFY_ENV,
    env: {
      production: {
        policy: [{ userAgent: '*', allow: '/' }],
        sitemap: "https://tuka.io/sitemap.xml",
        host: "https://tuka.io"
      },
      'branch-deploy': {
        policy: [{ userAgent: '*', disallow: ['/'] }],
        sitemap: null,
        host: null
      },
      'deploy-preview': {
        policy: [{ userAgent: '*', disallow: ['/'] }],
        sitemap: null,
        host: null
      }
    }
  }
})
config.plugins.push({
  resolve: `gatsby-plugin-draft`,
  options: {
    timezone: 'Asia/Tokyo',
    publishDraft: process.env.CONTEXT !== 'production',
  }
})

module.exports = config