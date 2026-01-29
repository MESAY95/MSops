import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Chip,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Paper,
  alpha,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  LocalShipping,
  Assessment,
  Settings,
  Person,
  Logout,
  Notifications,
  ChevronLeft,
  ExpandMore,
  Business,
  TrendingUp,
  Warning,
  Security
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
    { text: 'Orders', icon: <ShoppingCart />, path: '/orders' },
    { text: 'Supply Chain', icon: <LocalShipping />, path: '/supply-chain' },
    { text: 'Analytics', icon: <Assessment />, path: '/analytics' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
    handleMenuClose();
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      background: 'linear-gradient(180deg, #1B5E20 0%, #2E7D32 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Drawer Header */}
      <Box>
        <Toolbar sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 2,
          py: 3,
          minHeight: '80px !important'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src="/logo.jpg"
              alt="Mesay Foods Logo"
              sx={{
                height: 44,
                width: 44,
                borderRadius: 2,
                objectFit: 'cover',
                border: '3px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
                Mesay Foods
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                Operations Portal
              </Typography>
            </Box>
          </Box>
          {isMobile && (
            <IconButton 
              onClick={handleDrawerToggle}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <ChevronLeft />
            </IconButton>
          )}
        </Toolbar>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <Tooltip title={item.text} placement="right" arrow>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    px: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        transform: 'translateY(-1px)'
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white'
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.7)'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      fontWeight: location.pathname === item.path ? 600 : 400
                    }}
                    sx={{ color: 'white' }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

        {/* Settings Section */}
        <List sx={{ px: 2 }}>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <Tooltip title="Settings" placement="right" arrow>
              <ListItemButton
                selected={location.pathname === '/settings'}
                onClick={() => handleNavigation('/settings')}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      transform: 'translateY(-1px)'
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: location.pathname === '/settings' ? 'white' : 'rgba(255,255,255,0.7)'
                }}>
                  <Settings />
                </ListItemIcon>
                <ListItemText 
                  primary="Settings" 
                  primaryTypographyProps={{ fontSize: '0.95rem' }}
                  sx={{ color: 'white' }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>

      {/* System Status Footer */}
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.15)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUp sx={{ fontSize: 16, color: '#4CAF50' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
              System Status
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<TrendingUp sx={{ fontSize: 14 }} />}
              label="Online" 
              color="success" 
              size="small" 
              variant="outlined"
              sx={{ 
                color: 'white', 
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fontWeight: 500
              }}
            />
            <Chip 
              icon={<Security sx={{ fontSize: 14 }} />}
              label="Secure" 
              color="primary" 
              size="small" 
              variant="outlined"
              sx={{ 
                color: 'white', 
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fontWeight: 500
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Enhanced App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(20px)',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          minHeight: '80px !important',
          px: { xs: 2, sm: 3 }
        }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 1, 
                display: { md: 'none' },
                color: 'text.primary',
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box>
              <Typography variant="h4" sx={{ 
                fontSize: '1.5rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1.2
              }}>
                {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.75rem'
              }}>
                {location.pathname === '/dashboard' ? 'Operations Overview' : 'Management Portal'}
              </Typography>
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Status Chip */}
            <Chip 
              icon={<TrendingUp sx={{ fontSize: 16 }} />}
              label="All Systems Operational" 
              color="success" 
              size="small" 
              variant="filled"
              sx={{ 
                backgroundColor: '#E8F5E8',
                color: '#2E7D32',
                fontWeight: 600,
                display: { xs: 'none', sm: 'flex' },
                boxShadow: '0 2px 4px rgba(46, 125, 50, 0.2)'
              }}
            />
            
            {/* Notifications */}
            <Tooltip title="Notifications" arrow>
              <IconButton 
                size="medium" 
                onClick={handleNotificationsOpen}
                sx={{ 
                  color: 'text.secondary',
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Badge badgeContent={3} color="error" variant="dot">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: theme.palette.primary.main,
                  border: '2px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                }}
              >
                <Business sx={{ fontSize: 20 }} />
              </Avatar>
              
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: '0.875rem' }}>
                  Admin User
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1, fontSize: '0.75rem' }}>
                  mesay710@gmail.com
                </Typography>
              </Box>
              
              <Tooltip title="Account menu" arrow>
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ 
                    color: 'text.secondary',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <ExpandMore />
                </IconButton>
              </Tooltip>
            </Box>

            {/* User Menu Dropdown */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1.5,
                  borderRadius: 2,
                  minWidth: 200,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateX(4px)'
                    }
                  }
                }
              }}
            >
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                Profile Settings
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                System Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>

            {/* Notifications Menu */}
            <Menu
              anchorEl={notificationsAnchor}
              open={Boolean(notificationsAnchor)}
              onClose={handleNotificationsClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1.5,
                  borderRadius: 2,
                  minWidth: 320,
                  maxHeight: 400,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateX(4px)'
                    }
                  }
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notifications fontSize="small" />
                  Notifications
                </Typography>
              </Box>
              <MenuItem onClick={handleNotificationsClose}>
                <ListItemIcon>
                  <ShoppingCart color="primary" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    New order received
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    5 minutes ago
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <ListItemIcon>
                  <Inventory color="warning" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Inventory low alert
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1 hour ago
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <ListItemIcon>
                  <Assessment color="success" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Quality check completed
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 hours ago
                  </Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ 
            keepMounted: true,
            BackdropProps: {
              sx: {
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)'
              }
            }
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '2px 0 12px rgba(0,0,0,0.1)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Enhanced Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
        }}
      >
        <Toolbar sx={{ minHeight: '80px !important' }} />
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: 3,
            px: { xs: 2, sm: 3 },
            height: 'calc(100vh - 80px)'
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              minHeight: 'calc(100vh - 140px)',
              backgroundColor: 'white',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}
          >
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;