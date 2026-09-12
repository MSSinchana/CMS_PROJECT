import { Navigate, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Layout from './components/Layout';
import AnalyzePage from './pages/AnalyzePage';
import BenchmarkPage from './pages/BenchmarkPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import OptimizationPage from './pages/OptimizationPage';
import ProjectsPage from './pages/ProjectsPage';
import ResultsPage from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [benchmarkResult, setBenchmarkResult] = useState(null);

  const sharedProps = useMemo(
    () => ({
      selectedProjectId,
      setSelectedProjectId,
      projects,
      setProjects,
      analysisResult,
      setAnalysisResult,
      optimizationResult,
      setOptimizationResult,
      benchmarkResult,
      setBenchmarkResult,
    }),
    [selectedProjectId, projects, analysisResult, optimizationResult, benchmarkResult],
  );

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage {...sharedProps} />} />
        <Route path="/analyze" element={<AnalyzePage {...sharedProps} />} />
        <Route path="/results" element={<ResultsPage {...sharedProps} />} />
        <Route path="/optimization" element={<OptimizationPage {...sharedProps} />} />
        <Route path="/benchmark" element={<BenchmarkPage {...sharedProps} />} />
        <Route path="/history" element={<HistoryPage {...sharedProps} />} />
        <Route path="/projects" element={<ProjectsPage {...sharedProps} />} />
        <Route path="/settings" element={<SettingsPage {...sharedProps} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
