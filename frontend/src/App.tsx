import { useState } from 'react';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ZonesPage from './pages/ZonesPage';
import AlertsPage from './pages/AlertsPage';
import MapPage from './pages/MapPage';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'zones':
        return <ZonesPage />;
      case 'map':
        return <MapPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
