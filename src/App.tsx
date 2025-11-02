import { AuthProvider } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import MainContent from './components/MainContent';
import RoleSelectionScreen from './components/RoleSelectionScreen';
import { useAuth } from './context/AuthContext';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';

function AppContent() {
  const { user, loading, actualIsSuperAdmin, selectedRole } = useAuth();
  const { toasts, removeToast } = useToast();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#667eea'
      }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '1rem' }}></i>
        Caricamento...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Se è superadmin e non ha ancora selezionato un ruolo, mostra schermata di selezione
  if (actualIsSuperAdmin && !selectedRole) {
    return <RoleSelectionScreen />;
  }

  return (
    <>
      <MainContent />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


