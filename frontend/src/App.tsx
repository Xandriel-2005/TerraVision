import { useState } from 'react';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
// We'll add other pages as we build them: AlertsPage, ZonesPage, MapPage

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'alerts':
        return <div className="p-8 text-center text-text-muted">Alerts History (Coming Soon)</div>;
      case 'zones':
        return <div className="p-8 text-center text-text-muted">Virtual Fences (Coming Soon)</div>;
      case 'map':
        return <div className="p-8 text-center text-text-muted">GIS Map (Coming Soon)</div>;
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
