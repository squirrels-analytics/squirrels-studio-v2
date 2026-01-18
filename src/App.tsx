import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ConnectPage from './pages/ConnectPage';
import LoginPage from './pages/LoginPage';
import ExplorerPage from './pages/explorer/ExplorerPage';
import UserSettingsPage from './pages/UserSettingsPage';
import ManageUsersPage from './pages/ManageUsersPage';
import NotFoundPage from './pages/NotFoundPage';
import { AppProvider } from './context/AppProvider';
import { LoadingOverlay } from './components/ui/loading-overlay';
import { ProjectInitializer } from './components/project-initializer';
import { SessionTimeoutHandler } from './components/session-timeout-handler';
import { TooltipProvider } from './components/ui/tooltip';
import './App.css';

function App() {
  return (
    <Router>
      <AppProvider>
        <TooltipProvider>
          <LoadingOverlay />
          <SessionTimeoutHandler />
          <ProjectInitializer>
            <Routes>
              <Route path="/" element={<ConnectPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/explorer" element={<ExplorerPage />} />
              <Route path="/user-settings" element={<UserSettingsPage />} />
              <Route path="/manage-users" element={<ManageUsersPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ProjectInitializer>
        </TooltipProvider>
      </AppProvider>
    </Router>
  );
}

export default App;
