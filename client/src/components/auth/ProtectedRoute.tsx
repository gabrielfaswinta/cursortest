import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'business' | 'artist' | 'admin' | 'user';
  requireVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireVerification = false,
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have permission to access this page. Required role: {requiredRole}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your current role: {user.role}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Check verification requirement
  if (requireVerification && !user.isVerified) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Typography variant="h5" color="warning.main" gutterBottom>
            Account Verification Required
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please verify your account to access this feature.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Check business license for business users
  if (
    user.role === 'business' && 
    requiredRole === 'business' && 
    user.businessInfo?.licenseStatus !== 'active'
  ) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Typography variant="h5" color="warning.main" gutterBottom>
            Business License Required
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            You need an active business license to access this feature.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current license status: {user.businessInfo?.licenseStatus || 'pending'}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Check LMK membership for artists
  if (
    user.role === 'artist' && 
    requiredRole === 'artist' && 
    !user.artistInfo?.lmkMemberNumber
  ) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Typography variant="h5" color="warning.main" gutterBottom>
            LMK Membership Required
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You need to be a registered LMK member to access royalty features.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;