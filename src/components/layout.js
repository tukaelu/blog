import React from "react"
import { Link } from "gatsby"

import { rhythm } from "../utils/typography"

class Layout extends React.Component {
  render() {
    const { title, children } = this.props
    let header

    header = (
      <h3
        style={{
          fontFamily: `Montserrat, sans-serif`,
          marginTop: 0,
        }}
      >
        <Link
          style={{
            boxShadow: `none`,
            textDecoration: `none`,
            color: `inherit`,
          }}
          to={`/`}
        >
          {title}
        </Link>
      </h3>
    )
    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: rhythm(24),
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        }}
      >
        <header>{header}</header>
        <main>{children}</main>
        <footer>
          © {new Date().getFullYear()} <Link to={`/`}>tuka</Link>
        </footer>
      </div>
    )
  }
}

export default Layout
