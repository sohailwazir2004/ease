// A COMPONENT is just a function that returns JSX (HTML-like code).
// NavLink is a smart <a>: it changes the URL without reloading the page and
// automatically adds the class "active" to the link of the current page.
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Create Event' },
  { to: '/customize', label: 'Customize' },
  { to: '/co-organizers', label: 'Co-Organizers' },
  { to: '/templates', label: 'Templates' },
  { to: '/clone', label: 'Clone Event' },
  { to: '/visibility', label: 'Visibility' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/promotions', label: 'Promotions' },
]

export default function Navbar() {
  return (
    <nav className="navbar">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end>
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
