import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, 
    Grid, 
    Card, 
    CardHeader, 
    CardContent, 
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Snackbar,
    IconButton,
    Box,
    Chip,
    Avatar,
    CircularProgress,
    Divider,
    LinearProgress,
    Select,
    MenuItem
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import PersonIcon from '@material-ui/icons/Person';
import ScheduleIcon from '@material-ui/icons/Schedule';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import CloudIcon from '@material-ui/icons/Cloud';
import RefreshIcon from '@material-ui/icons/Refresh';
import { fetchAdminData, updateUser, deleteUser, clearCache, backupDatabase } from '../../services/adminService';
import './AdminDashboard.css';

const useStyles = makeStyles((theme) => ({
    root: {
        marginTop: theme.spacing(4)
    },
    card: {
        marginBottom: theme.spacing(4),
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        borderRadius: '10px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
        }
    },
    statsCard: {
        backgroundColor: '#f8faff',
        padding: theme.spacing(2),
        borderRadius: '10px',
        border: '1px solid #edf2f7',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    button: {
        marginRight: theme.spacing(2),
        borderRadius: '8px',
        boxShadow: 'none',
        fontWeight: 500,
        textTransform: 'none',
        fontSize: '1rem',
        padding: '10px 20px'
    },
    successSnackbar: {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText
    },
    errorSnackbar: {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText
    },
    loadingMessage: {
        padding: theme.spacing(4),
        backgroundColor: '#f8faff',
        color: theme.palette.info.dark,
        borderRadius: theme.shape.borderRadius,
        marginBottom: theme.spacing(2),
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
    },
    refreshButton: {
        marginLeft: theme.spacing(2),
        marginBottom: theme.spacing(3),
        padding: '8px 16px',
    },
    metricValue: {
        fontWeight: 'bold',
        fontSize: '2rem',
        marginBottom: theme.spacing(1),
        color: theme.palette.primary.main
    },
    metricLabel: {
        fontSize: '0.9rem',
        color: theme.palette.text.secondary
    },
    metricCard: {
        padding: theme.spacing(3),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        height: '100%'
    },
    metricIcon: {
        fontSize: '2.5rem',
        marginBottom: theme.spacing(1),
        color: theme.palette.primary.light
    },
    trendPositive: {
        color: '#4caf50',
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.9rem',
        marginTop: theme.spacing(1)
    },
    trendNegative: {
        color: '#f44336',
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.9rem',
        marginTop: theme.spacing(1)
    },
    trendIcon: {
        fontSize: '1rem',
        marginRight: theme.spacing(0.5)
    },
    tableContainer: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        borderRadius: '10px',
        overflow: 'hidden'
    },
    tableHeader: {
        backgroundColor: '#f8faff'
    },
    tableCell: {
        fontSize: '0.9rem'
    },
    roleChip: {
        fontWeight: 500,
        borderRadius: '6px'
    },
    adminChip: {
        backgroundColor: '#e3f2fd',
        color: '#1565c0'
    },
    expertChip: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32'
    },
    farmerChip: {
        backgroundColor: '#fff8e1',
        color: '#f57c00'
    },
    actionButton: {
        marginRight: theme.spacing(1),
        minWidth: 'auto',
        padding: '4px 10px'
    },
    pulse: {
        animation: '$pulse 2s infinite'
    },
    '@keyframes pulse': {
        '0%': {
            boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)'
        },
        '70%': {
            boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)'
        },
        '100%': {
            boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)'
        }
    },
    realTimeTag: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: theme.palette.success.main,
        marginLeft: theme.spacing(1),
        '& svg': {
            fontSize: '0.8rem',
            marginRight: theme.spacing(0.5)
        }
    }
}));

const AdminDashboard = () => {
    const classes = useStyles();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        users: {
            total: 0,
            admins: 0,
            regular: 0
        },
        activeUsers: 0,
        userTrend: 0,
        totalRequests: 0,
        requestTrend: 0,
        dataUsage: 0,
        usersByRole: {},
        lastUpdated: new Date().toISOString()
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30);

    const loadAdminData = useCallback(async () => {
        try {
            setRefreshing(true);
            setError('');
            const data = await fetchAdminData();
            if (data) {
                setUsers(data.users);
                setStats({
                    ...data.stats,
                    usersByRole: {
                        admin: data.stats.users?.admins || 0,
                        regular: data.stats.users?.regular || 0
                    },
                    lastUpdated: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('Error loading admin data:', err);
            setError(err.message || 'Failed to load admin data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    useEffect(() => {
        let intervalId = null;
        if (autoRefresh) {
            intervalId = setInterval(() => {
                loadAdminData();
            }, refreshInterval * 1000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [autoRefresh, refreshInterval, loadAdminData]);

    const handleRefresh = () => {
        loadAdminData();
    };

    const toggleAutoRefresh = () => {
        setAutoRefresh(prev => !prev);
    };

    const handleIntervalChange = (event) => {
        setRefreshInterval(event.target.value);
    };

    const handleUpdateUser = async (userId, updates) => {
        try {
            setError('');
            await updateUser(userId, updates);
            setSuccessMessage('User updated successfully');
            loadAdminData(); // Reload data
            setEditingUser(null); // Close edit form
        } catch (err) {
            setError(err.message || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                setError('');
                await deleteUser(userId);
                setSuccessMessage('User deleted successfully');
                loadAdminData(); // Reload data
            } catch (err) {
                setError(err.message || 'Failed to delete user');
            }
        }
    };

    const handleClearCache = async () => {
        try {
            setError('');
            await clearCache();
            setSuccessMessage('Cache cleared successfully');
        } catch (err) {
            setError(err.message || 'Failed to clear cache');
        }
    };

    const handleBackupDatabase = async () => {
        try {
            setError('');
            await backupDatabase();
            setSuccessMessage('Database backup initiated successfully');
        } catch (err) {
            setError(err.message || 'Failed to backup database');
        }
    };

    const handleCloseMessage = () => {
        setSuccessMessage('');
        setError('');
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getRoleChipClass = (role) => {
        switch(role) {
            case 'admin': return classes.adminChip;
            case 'expert': return classes.expertChip;
            case 'farmer': return classes.farmerChip;
            default: return '';
        }
    };

    if (loading) {
        return (
            <Container className={classes.root}>
                <Paper className={classes.loadingMessage}>
                    <CircularProgress size={40} color="primary" style={{ marginBottom: 16 }} />
                    <Typography variant="h6">Loading admin dashboard...</Typography>
                    <Typography variant="body2" color="textSecondary">Fetching real-time system data and user information</Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Container className={classes.root}>
            <Snackbar 
                open={!!successMessage || !!error} 
                autoHideDuration={3000} 
                onClose={handleCloseMessage}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                ContentProps={{
                    className: error ? classes.errorSnackbar : classes.successSnackbar
                }}
                message={error || successMessage}
                action={
                    <IconButton
                        size="small"
                        color="inherit"
                        onClick={handleCloseMessage}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
            />

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4">Admin Dashboard</Typography>
                <Box display="flex" alignItems="center">
                    <Box display="flex" alignItems="center" mr={2}>
                        <Typography variant="body2" color="textSecondary" mr={1}>Auto-refresh:</Typography>
                        <Chip 
                            label={autoRefresh ? "On" : "Off"} 
                            color={autoRefresh ? "primary" : "default"}
                            onClick={toggleAutoRefresh}
                            className={autoRefresh ? classes.pulse : ''}
                            size="small"
                        />
                    </Box>
                    
                    {autoRefresh && (
                        <Box display="flex" alignItems="center" mr={2}>
                            <Typography variant="body2" color="textSecondary" style={{ marginRight: 8 }}>
                                Interval:
                            </Typography>
                            <Select
                                value={refreshInterval}
                                onChange={handleIntervalChange}
                                variant="outlined"
                                size="small"
                                style={{ minWidth: 100 }}
                            >
                                <MenuItem value={10}>10 sec</MenuItem>
                                <MenuItem value={30}>30 sec</MenuItem>
                                <MenuItem value={60}>1 min</MenuItem>
                                <MenuItem value={300}>5 min</MenuItem>
                            </Select>
                        </Box>
                    )}
                    
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleRefresh}
                        startIcon={<RefreshIcon />}
                        className={classes.refreshButton}
                        disabled={refreshing}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </Box>
            </Box>
            
            <Box mb={4}>
                <Typography variant="body2" color="textSecondary" align="right">
                    Last updated: {formatDateTime(stats.lastUpdated)}
                    {autoRefresh && (
                        <span className={classes.realTimeTag}>
                            <ScheduleIcon /> Real-time
                        </span>
                    )}
                </Typography>
            </Box>
            
            <Grid container spacing={3} style={{ marginBottom: 24 }}>
                <Grid item xs={12} md={3}>
                    <Card className={classes.card}>
                        <CardContent className={classes.metricCard}>
                            <PersonIcon className={classes.metricIcon} />
                            <Typography variant="h4" className={classes.metricValue}>
                                {stats.users?.total || 0}
                            </Typography>
                            <Typography className={classes.metricLabel}>
                                Total Users
                            </Typography>
                            {stats.userTrend !== undefined && (
                                <Typography className={stats.userTrend >= 0 ? classes.trendPositive : classes.trendNegative}>
                                    {stats.userTrend >= 0 ? (
                                        <TrendingUpIcon className={classes.trendIcon} />
                                    ) : (
                                        <TrendingDownIcon className={classes.trendIcon} />
                                    )}
                                    {Math.abs(stats.userTrend)}% {stats.userTrend >= 0 ? 'increase' : 'decrease'}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card className={classes.card}>
                        <CardContent className={classes.metricCard}>
                            <PersonIcon className={classes.metricIcon} />
                            <Typography variant="h4" className={classes.metricValue}>
                                {stats.activeUsers || 0}
                            </Typography>
                            <Typography className={classes.metricLabel}>
                                Active Users
                            </Typography>
                            <Box width="100%" mt={1}>
                                <Typography variant="caption" display="block" gutterBottom>
                                    {(stats.activeUsers / (stats.users?.total || 1) * 100).toFixed(0)}% of total users
                                </Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={(stats.activeUsers / (stats.users?.total || 1) * 100)} 
                                    color="primary"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card className={classes.card}>
                        <CardContent className={classes.metricCard}>
                            <CloudIcon className={classes.metricIcon} />
                            <Typography variant="h4" className={classes.metricValue}>
                                {stats.totalRequests?.toLocaleString() || 0}
                            </Typography>
                            <Typography className={classes.metricLabel}>
                                API Requests (24h)
                            </Typography>
                            {stats.requestTrend !== undefined && (
                                <Typography className={stats.requestTrend >= 0 ? classes.trendPositive : classes.trendNegative}>
                                    {stats.requestTrend >= 0 ? (
                                        <TrendingUpIcon className={classes.trendIcon} />
                                    ) : (
                                        <TrendingDownIcon className={classes.trendIcon} />
                                    )}
                                    {Math.abs(stats.requestTrend)}% {stats.requestTrend >= 0 ? 'increase' : 'decrease'}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card className={classes.card}>
                        <CardContent className={classes.metricCard}>
                            <CloudIcon className={classes.metricIcon} />
                            <Typography variant="h4" className={classes.metricValue}>
                                {stats.dataUsage?.toFixed(2) || 0} GB
                            </Typography>
                            <Typography className={classes.metricLabel}>
                                Data Usage
                            </Typography>
                            <Box width="100%" mt={1}>
                                <Typography variant="caption" display="block" gutterBottom>
                                    {(stats.dataUsage / 10 * 100).toFixed(0)}% of 10GB limit
                                </Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={(stats.dataUsage / 10 * 100)} 
                                    color={stats.dataUsage > 8 ? "secondary" : "primary"}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Card className={classes.card}>
                        <CardHeader title="System Statistics" />
                        <Divider />
                        <CardContent>
                            <Box className={classes.statsCard} mb={2}>
                                <Typography variant="subtitle1" gutterBottom>User Distribution</Typography>
                                {stats.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                                    <Box key={role} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                        <Typography variant="body2">
                                            {role.charAt(0).toUpperCase() + role.slice(1)}s
                                        </Typography>
                                        <Box display="flex" alignItems="center">
                                            <Typography variant="body1" fontWeight="bold">
                                                {count}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" style={{ marginLeft: 8 }}>
                                                ({(count / (stats.users?.total || 1) * 100).toFixed(0)}%)
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                            
                            <Box className={classes.statsCard}>
                                <Typography variant="subtitle1" gutterBottom>System Health</Typography>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                    <Typography variant="body2">Database</Typography>
                                    <Chip 
                                        size="small" 
                                        label="Operational" 
                                        style={{ backgroundColor: '#e8f5e9', color: '#388e3c' }}
                                    />
                                </Box>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                    <Typography variant="body2">API Services</Typography>
                                    <Chip 
                                        size="small" 
                                        label="Operational" 
                                        style={{ backgroundColor: '#e8f5e9', color: '#388e3c' }}
                                    />
                                </Box>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                    <Typography variant="body2">File Storage</Typography>
                                    <Chip 
                                        size="small" 
                                        label="Operational" 
                                        style={{ backgroundColor: '#e8f5e9', color: '#388e3c' }}
                                    />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card className={classes.card}>
                        <CardHeader title="System Actions" />
                        <Divider />
                        <CardContent>
                            <Box display="flex" flexWrap="wrap" gap={2}>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={handleBackupDatabase}
                                    className={classes.button}
                                    disabled={refreshing}
                                >
                                    Backup Database
                                </Button>
                                <Button 
                                    variant="contained" 
                                    color="secondary" 
                                    onClick={handleClearCache}
                                    className={classes.button}
                                    disabled={refreshing}
                                >
                                    Clear Cache
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="primary" 
                                    onClick={loadAdminData}
                                    className={classes.button}
                                    disabled={refreshing}
                                >
                                    Refresh Dashboard
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card className={classes.card} style={{ marginTop: 24 }}>
                        <CardHeader 
                            title="User Management" 
                            action={
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={handleRefresh}
                                    startIcon={<RefreshIcon />}
                                    disabled={refreshing}
                                >
                                    Refresh
                                </Button>
                            }
                        />
                        <Divider />
                        <CardContent>
                            {refreshing && <LinearProgress />}
                            
                            <TableContainer component={Paper} className={classes.tableContainer}>
                                <Table>
                                    <TableHead className={classes.tableHeader}>
                                        <TableRow>
                                            <TableCell>Username</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell align="center">Status</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map(user => (
                                            <TableRow key={user._id} hover>
                                                <TableCell className={classes.tableCell}>
                                                    {editingUser === user._id ? (
                                                        <input
                                                            type="text"
                                                            defaultValue={user.username}
                                                            onBlur={(e) => handleUpdateUser(user._id, { username: e.target.value })}
                                                            className="edit-input"
                                                        />
                                                    ) : (
                                                        <Box display="flex" alignItems="center">
                                                            <Avatar style={{ width: 28, height: 28, marginRight: 8, backgroundColor: '#bbdefb' }}>
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            {user.username}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                                <TableCell className={classes.tableCell}>
                                                    {editingUser === user._id ? (
                                                        <input
                                                            type="email"
                                                            defaultValue={user.email}
                                                            onBlur={(e) => handleUpdateUser(user._id, { email: e.target.value })}
                                                            className="edit-input"
                                                        />
                                                    ) : (
                                                        user.email
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {editingUser === user._id ? (
                                                        <select
                                                            defaultValue={user.role}
                                                            onChange={(e) => handleUpdateUser(user._id, { role: e.target.value })}
                                                            className="edit-select"
                                                        >
                                                            <option value="admin">Admin</option>
                                                            <option value="expert">Expert</option>
                                                            <option value="farmer">Farmer</option>
                                                        </select>
                                                    ) : (
                                                        <Chip 
                                                            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                                                            size="small" 
                                                            className={`${classes.roleChip} ${getRoleChipClass(user.role)}`}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        label={user.active ? "Active" : "Inactive"} 
                                                        size="small"
                                                        style={{
                                                            backgroundColor: user.active ? '#e8f5e9' : '#ffebee',
                                                            color: user.active ? '#388e3c' : '#d32f2f'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {editingUser === user._id ? (
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            size="small"
                                                            onClick={() => setEditingUser(null)}
                                                            className={classes.actionButton}
                                                        >
                                                            Done
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="outlined"
                                                                color="primary"
                                                                size="small"
                                                                onClick={() => setEditingUser(user._id)}
                                                                className={classes.actionButton}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="secondary"
                                                                size="small"
                                                                onClick={() => handleDeleteUser(user._id)}
                                                                className={classes.actionButton}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AdminDashboard; 