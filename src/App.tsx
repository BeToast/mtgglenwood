import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UnsavedChangesProvider } from './context/UnsavedChangesContext';
import Ladder from './pages/Ladder';
import Profile from './pages/Profile';
import NavigationBar from './components/NavigationBar';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <UnsavedChangesProvider>
        <Router>
          <div className="app">
            <div className="content">
              <Routes>
                <Route path="/" element={<Navigate to="/ladder" replace />} />
                <Route path="/ladder" element={<Ladder />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </div>
            <NavigationBar />
          </div>
        </Router>
      </UnsavedChangesProvider>
    </AuthProvider>
  );
}

export default App;
