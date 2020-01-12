import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Helmet from "react-helmet"

import {
  FacebookShareButton, FacebookIcon,
  TwitterShareButton, TwitterIcon,
} from "react-share"

const Hatebu = () => {
  return (
    <span>
      <Helmet>
        <script type="text/javascript" src="//b.st-hatena.com/js/bookmark_button.js" charset="utf-8" async="async" />
      </Helmet>
      <a
        href="http://b.hatena.ne.jp/entry/"
        className="hatena-bookmark-button"
        data-hatena-bookmark-layout="vertical-normal"
        data-hatena-bookmark-lang="ja"
        title="このエントリーをはてなブックマークに追加"
        >
        <img
          src="//b.st-hatena.com/images/entry-button/button-only@2x.png"
          alt="このエントリーをはてなブックマークに追加"
          width="20"
          height="20"
          style={{border: 'none'}}
        />
      </a>
    </span>
  )
}
  
const SocialButtons = ({title, slug}) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            siteUrl
            social {
              twitter
            }
          }
        }
      }
    `
  )
  const { siteUrl, social } = site.siteMetadata

  return(
    <ul
    style={{
      display: `flex`,
      flexWrap: `wrap`,
      justifyContent: `flex-start`,
      listStyle: `none`,
      padding: 0,
    }}
    >
      <li style={{ paddingRight: 10 }}>
        <Hatebu />
      </li>
      <li style={{ paddingRight: 10 }}>
        <FacebookShareButton url={`${siteUrl}${slug}`}>
          <FacebookIcon size={32} round />
        </FacebookShareButton>
      </li>
      <li style={{ paddingRight: 10 }}>
        <TwitterShareButton title={title} via={social.twitter} url={`${siteUrl}${slug}`}>
          <TwitterIcon size={32} round />
        </TwitterShareButton>
      </li>
    </ul>
  )
}

export default SocialButtons