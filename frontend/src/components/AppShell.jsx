import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

export default function AppShell() {
  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 md:flex-row md:px-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
