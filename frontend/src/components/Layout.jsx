import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/analyze', label: 'Analyze Code' },
  { to: '/results', label: 'Results' },
  { to: '/optimization', label: 'Optimization' },
  { to: '/benchmark', label: 'Benchmark' },
  { to: '/history', label: 'History' },
  { to: '/projects', label: 'Projects' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">GreenCode AI</Link>
        <span className="tag">AI for Sustainable Software</span>
      </header>
      <nav className="sidebar">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
