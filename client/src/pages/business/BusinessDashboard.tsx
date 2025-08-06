import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  MusicNote as MusicIcon,
  Payment as PaymentIcon,
  Assessment as ReportIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  VolumeUp as VolumeIcon,
  Gavel as LegalIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { royaltyApi, businessApi, musicApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface DashboardStats {
  totalPlays: number;
  totalRoyalties: number;
  pendingRoyalties: number;
  complianceScore: number;
  activeSubscription: string;
}

interface RecentActivity {
  id: string;
  type: 'play' | 'payment' | 'compliance';
  description: string;
  timestamp: string;
  amount?: number;
  status?: string;
}

const BusinessDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch dashboard data
  const { data: royaltySummary, isLoading: summaryLoading } = useQuery(
    'royalty-summary',
    () => royaltyApi.getSummary(),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const { data: recentTransactions } = useQuery(
    'recent-transactions',
    () => royaltyApi.getTransactions({ limit: 5 }),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  const { data: businessCompliance } = useQuery(
    'business-compliance',
    () => businessApi.getCompliance(),
    {
      refetchInterval: 300000, // Refresh every 5 minutes
    }
  );

  const { data: recommendedMusic } = useQuery(
    'recommended-music',
    () => musicApi.getMusic({ 
      businessType: user?.businessInfo?.businessType,
      limit: 10 
    })
  );

  const stats: DashboardStats = {
    totalPlays: royaltySummary?.data?.summary?.totalPlays || 0,
    totalRoyalties: royaltySummary?.data?.summary?.totalRoyalties || 0,
    pendingRoyalties: royaltySummary?.data?.pendingPayments?.totalPending || 0,
    complianceScore: businessCompliance?.data?.complianceScore || 0,
    activeSubscription: user?.businessInfo?.subscriptionPlan || 'basic',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const playTrack = async (track: any) => {
    try {
      // Record the play
      await royaltyApi.recordPlay({
        musicId: track._id,
        playType: 'background',
        location: {
          businessName: user?.businessInfo?.companyName,
          city: user?.businessInfo?.address?.city,
          province: user?.businessInfo?.address?.province,
        },
      });

      setCurrentTrack(track);
      setIsPlaying(true);
      toast.success(`Now playing: ${track.title}`);
    } catch (error) {
      toast.error('Failed to play track');
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Business Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.businessInfo?.companyName || user?.name}
        </Typography>
      </Box>

      {/* License Status Alert */}
      {user?.businessInfo?.licenseStatus !== 'active' && (
        <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'warning.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WarningIcon color="warning" />
              <Box>
                <Typography variant="h6" color="warning.main">
                  License Status: {user?.businessInfo?.licenseStatus || 'Pending'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.businessInfo?.licenseStatus === 'pending' 
                    ? 'Your business license application is under review.'
                    : 'Please resolve your license status to continue using the service.'
                  }
                </Typography>
              </Box>
              <Button variant="outlined" color="warning" href="/business/license">
                View License
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <MusicIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalPlays}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Plays
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <PaymentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {formatCurrency(stats.totalRoyalties)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Royalties
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <PaymentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {formatCurrency(stats.pendingRoyalties)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <LegalIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.complianceScore}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    LMK Compliance
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Music Player */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Music Player
              </Typography>
              
              {currentTrack ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      src={currentTrack.coverArt?.path}
                      sx={{ width: 64, height: 64 }}
                    >
                      <MusicIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{currentTrack.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentTrack.artist?.name || 'Unknown Artist'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentTrack.album} • {currentTrack.formattedDuration}
                      </Typography>
                    </Box>
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={30} 
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton>
                      <SkipPreviousIcon />
                    </IconButton>
                    <IconButton onClick={togglePlayPause} size="large">
                      {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </IconButton>
                    <IconButton>
                      <SkipNextIcon />
                    </IconButton>
                    <IconButton>
                      <VolumeIcon />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No track selected. Choose from recommended music below.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Recommended Music */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommended for {user?.businessInfo?.businessType || 'your business'}
              </Typography>
              
              <List>
                {recommendedMusic?.data?.music?.slice(0, 5).map((track: any) => (
                  <ListItem
                    key={track._id}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => playTrack(track)}
                        disabled={track._id === currentTrack?._id && isPlaying}
                      >
                        <PlayIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <Avatar src={track.coverArt?.path}>
                        <MusicIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={track.title}
                      secondary={`${track.artist?.name} • ${track.genre?.join(', ')}`}
                    />
                  </ListItem>
                ))}
              </List>

              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 2 }}
                href="/music"
              >
                Browse More Music
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Status */}
        <Grid item xs={12} md={4}>
          {/* Business Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Company Name
                </Typography>
                <Typography variant="body1">
                  {user?.businessInfo?.companyName || 'Not set'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Business Type
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {user?.businessInfo?.businessType || 'Not set'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  License Status
                </Typography>
                <Chip
                  label={user?.businessInfo?.licenseStatus || 'pending'}
                  color={getLicenseStatusColor(user?.businessInfo?.licenseStatus || 'pending') as any}
                  size="small"
                  icon={user?.businessInfo?.licenseStatus === 'active' ? <CheckIcon /> : <WarningIcon />}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Subscription Plan
                </Typography>
                <Chip
                  label={stats.activeSubscription}
                  color="primary"
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="outlined"
                fullWidth
                startIcon={<BusinessIcon />}
                href="/profile"
              >
                Edit Business Info
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              
              <Button
                variant="contained"
                fullWidth
                startIcon={<ReportIcon />}
                sx={{ mb: 1 }}
                href="/royalty"
              >
                View Royalty Report
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<LegalIcon />}
                sx={{ mb: 1 }}
                href="/business/compliance"
              >
                LMK Compliance
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<PaymentIcon />}
                href="/business/license"
              >
                Manage License
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              
              <List dense>
                {recentTransactions?.data?.transactions?.map((transaction: any) => (
                  <ListItem key={transaction._id}>
                    <ListItemIcon>
                      <MusicIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Played: ${transaction.music?.title}`}
                      secondary={`${formatCurrency(transaction.royaltyInfo?.calculatedAmount)} • ${format(new Date(transaction.playInfo?.playDate), 'MMM dd, HH:mm')}`}
                    />
                  </ListItem>
                ))}
              </List>

              {recentTransactions?.data?.transactions?.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessDashboard;