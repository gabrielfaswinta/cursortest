import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MusicLibraryPage from './pages/MusicLibraryPage';
import RoyaltyPage from './pages/RoyaltyPage';
import BusinessDashboard from './pages/business/BusinessDashboard';
import ArtistDashboard from './pages/artist/ArtistDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import LicensePage from './pages/business/LicensePage';
import CompliancePage from './pages/business/CompliancePage';
import EarningsPage from './pages/artist/EarningsPage';
import ReportsPage from './pages/ReportsPage';

// Store
import { useAuthStore } from './store/authStore';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {isAuthenticated && <Sidebar />}
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {isAuthenticated && <Navbar />}
              
              <Box 
                component="main" 
                sx={{ 
                  flex: 1, 
                  p: isAuthenticated ? 3 : 0,
                  backgroundColor: 'background.default',
                  overflow: 'auto'
                }}
              >
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path="/" 
                    element={
                      isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <HomePage />
                      )
                    } 
                  />
                  <Route 
                    path="/login" 
                    element={
                      isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <LoginPage />
                      )
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <RegisterPage />
                      )
                    } 
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        {user?.role === 'business' && <BusinessDashboard />}
                        {user?.role === 'artist' && <ArtistDashboard />}
                        {user?.role === 'admin' && <AdminDashboard />}
                        {user?.role === 'user' && <DashboardPage />}
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/music"
                    element={
                      <ProtectedRoute>
                        <MusicLibraryPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/royalty"
                    element={
                      <ProtectedRoute>
                        <RoyaltyPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Business Routes */}
                  <Route
                    path="/business/license"
                    element={
                      <ProtectedRoute requiredRole="business">
                        <LicensePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/business/compliance"
                    element={
                      <ProtectedRoute requiredRole="business">
                        <CompliancePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Artist Routes */}
                  <Route
                    path="/artist/earnings"
                    element={
                      <ProtectedRoute requiredRole="artist">
                        <EarningsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/reports"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <ReportsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
            </Box>
          </Box>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#4caf50',
                },
              },
              error: {
                style: {
                  background: '#f44336',
                },
              },
            }}
          />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
