import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  MusicNote as MusicIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Verified as VerifiedIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SecurityIcon fontSize="large" />,
      title: 'LMK Compliance',
      description: 'Automatic compliance with Indonesia\'s Lembaga Manajemen Kolektif regulations.',
      color: '#4caf50'
    },
    {
      icon: <PaymentIcon fontSize="large" />,
      title: 'Transparent Royalties',
      description: 'Real-time royalty tracking and fair distribution to artists and rights holders.',
      color: '#2196f3'
    },
    {
      icon: <BusinessIcon fontSize="large" />,
      title: 'Business-Focused',
      description: 'Curated music collections for restaurants, hotels, retail, and other businesses.',
      color: '#ff9800'
    },
    {
      icon: <AnalyticsIcon fontSize="large" />,
      title: 'Detailed Analytics',
      description: 'Comprehensive reports on music usage, costs, and compliance status.',
      color: '#9c27b0'
    },
  ];

  const businessTypes = [
    'Restaurant', 'Hotel', 'Retail Store', 'Cafe', 'Gym', 'Office Space'
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        bgcolor: 'background.paper', 
        borderBottom: 1, 
        borderColor: 'divider',
        zIndex: 1000
      }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <MusicIcon />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Musika Biz
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box>
              <Chip 
                label="LMK Compliant Music Platform" 
                color="primary" 
                sx={{ mb: 2 }}
              />
              <Typography 
                variant="h2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #1976d2, #dc004e)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Legal Music Streaming for Indonesian Businesses
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                paragraph
                sx={{ mb: 4 }}
              >
                Stream music legally for your business with automatic LMK compliance, 
                transparent royalty payments, and curated playlists designed for 
                commercial environments.
              </Typography>
              
              <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  endIcon={<ArrowIcon />}
                  onClick={() => navigate('/register')}
                >
                  Start Free Trial
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Learn More
                </Button>
              </Stack>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VerifiedIcon color="success" />
                <Typography variant="body2" color="text.secondary">
                  Certified by LMK Indonesia • Trusted by 1000+ businesses
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120%',
                height: '120%',
                background: 'linear-gradient(45deg, rgba(25,118,210,0.1), rgba(220,0,78,0.1))',
                borderRadius: '50%',
                zIndex: -1,
              }
            }}>
              <Card sx={{ 
                maxWidth: 400, 
                mx: 'auto',
                transform: 'rotate(-5deg)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'rotate(0deg) scale(1.05)',
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: 'primary.main' 
                  }}>
                    <BusinessIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h5" gutterBottom>
                    Business Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor your music usage, royalty payments, and LMK compliance in real-time
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            textAlign="center" 
            gutterBottom
            fontWeight="bold"
          >
            Why Choose Musika Biz?
          </Typography>
          <Typography 
            variant="h6" 
            textAlign="center" 
            color="text.secondary" 
            paragraph
            sx={{ mb: 6 }}
          >
            The first music streaming platform designed specifically for Indonesian businesses
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ 
                  height: '100%',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 4,
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Avatar sx={{ 
                      width: 60, 
                      height: 60, 
                      mx: 'auto', 
                      mb: 2,
                      bgcolor: feature.color 
                    }}>
                      {feature.icon}
                    </Avatar>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Business Types Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" gutterBottom fontWeight="bold">
              Perfect for Every Business Type
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Our platform serves a wide range of business types with tailored 
              music collections and licensing solutions.
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {businessTypes.map((type, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Chip 
                    label={type} 
                    variant="outlined" 
                    color="primary"
                    sx={{ width: '100%' }}
                  />
                </Grid>
              ))}
            </Grid>

            <Button 
              variant="contained" 
              size="large" 
              sx={{ mt: 4 }}
              onClick={() => navigate('/register')}
            >
              Register Your Business
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 2 
            }}>
              {[
                { title: 'Restaurant Music', desc: 'Ambient dining soundscapes' },
                { title: 'Retail Playlists', desc: 'Upbeat shopping music' },
                { title: 'Hotel Ambiance', desc: 'Sophisticated lobby music' },
                { title: 'Cafe Vibes', desc: 'Cozy coffee shop tunes' },
              ].map((item, index) => (
                <Card key={index} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        py: 8,
        background: 'linear-gradient(135deg, #1976d2, #dc004e)',
      }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" paragraph sx={{ opacity: 0.9 }}>
            Join thousands of Indonesian businesses already using Musika Biz
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                }
              }}
              onClick={() => navigate('/register')}
            >
              Start Your Free Trial
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              sx={{ 
                borderColor: 'white', 
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              Contact Sales
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <MusicIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Musika Biz
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Legal music streaming for Indonesian businesses with 
                LMK compliance and transparent royalty management.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Contact Info
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Email: support@musikabiz.com<br />
                Phone: +62 21 1234 5678<br />
                Jakarta, Indonesia
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ 
            borderTop: 1, 
            borderColor: 'grey.700', 
            mt: 4, 
            pt: 2,
            textAlign: 'center'
          }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2024 Musika Biz. All rights reserved. Built for the Indonesian music industry.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;