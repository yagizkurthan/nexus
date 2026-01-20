import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnalysisProvider } from './context/AnalysisContext';
import DashboardLayout from './components/layout/DashboardLayout';
import AgentDashboard from './pages/AgentDashboard';
import DataSources from './pages/DataSources';
import Analytics from './pages/Analytics';
import AgentControlCenter from './pages/AgentControlCenter';
import DataExplorer from './pages/DataExplorer';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <AnalysisProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/agent" replace />} />
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/data" element={<DataSources />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<AgentControlCenter />} />
            <Route path="/explorer" element={<DataExplorer />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AnalysisProvider>
      </DashboardLayout>
    </Router>
  );
}

export default App;
