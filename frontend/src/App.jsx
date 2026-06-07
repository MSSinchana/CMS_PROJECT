import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AppShell from './components/AppShell.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import BlogFeedPage from './pages/BlogFeedPage.jsx';
import BlogDetailPage from './pages/BlogDetailPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import ContentListPage from './pages/ContentListPage.jsx';
import AddContentPage from './pages/AddContentPage.jsx';
import EditContentPage from './pages/EditContentPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import ActivityLogPage from './pages/ActivityLogPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/blogs" element={<BlogFeedPage />} />
      <Route path="/blogs/:id" element={<BlogDetailPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppShell />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/content" element={<ContentListPage />} />
          <Route path="/content/new" element={<AddContentPage />} />
          <Route path="/content/:id/edit" element={<EditContentPage />} />
          <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="/activity" element={<AdminRoute><ActivityLogPage /></AdminRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
