import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useWalletConnection } from '../../context/WalletContext';
import { useCredentials } from '../../context/CredentialContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { disconnect, did, publicKey } = useWalletConnection();
  const { clearAllCredentials } = useCredentials();
  
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'clearCredentials' | 'disconnect'>('disconnect');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // 顯示確認對話框
  const showConfirmDialog = (action: 'clearCredentials' | 'disconnect') => {
    setDialogAction(action);
    setConfirmDialogOpen(true);
  };

  // 確認操作
  const handleConfirm = () => {
    setConfirmDialogOpen(false);
    
    if (dialogAction === 'clearCredentials') {
      clearAllCredentials();
      showSnackbar('所有憑證已清除');
    } else if (dialogAction === 'disconnect') {
      disconnect();
      showSnackbar('錢包已斷開連接');
      navigate('/login');
    }
  };

  // 顯示通知
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // 處理生物識別切換
  const handleBiometricToggle = () => {
    // 在實際應用中，這裡應該檢查裝置是否支援生物識別
    // 並進行相應的配置
    setBiometricEnabled(prev => !prev);
    showSnackbar(biometricEnabled ? '生物識別已禁用' : '生物識別已啟用');
  };

  // 處理暗黑模式切換
  const handleDarkModeToggle = () => {
    setDarkModeEnabled(prev => !prev);
    showSnackbar(darkModeEnabled ? '淺色模式已啟用' : '深色模式已啟用');
    // 在實際應用中，您應該在此處更新應用的主題
  };

  return (
    <Box>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
            設定
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        {/* 帳戶資訊 */}
        <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>帳戶資訊</Typography>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              錢包地址
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 1 }}>
              {publicKey}
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              DID
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {did}
            </Typography>
          </CardContent>
        </Card>
        
        {/* 一般設定 */}
        <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <List>
            <ListItem>
              <ListItemIcon>
                <DarkModeIcon />
              </ListItemIcon>
              <ListItemText primary="深色模式" />
              <Switch
                edge="end"
                checked={darkModeEnabled}
                onChange={handleDarkModeToggle}
              />
            </ListItem>
            
            <Divider variant="inset" component="li" />
            
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText 
                primary="生物識別" 
                secondary="使用指紋或臉部識別解鎖應用"
              />
              <Switch
                edge="end"
                checked={biometricEnabled}
                onChange={handleBiometricToggle}
              />
            </ListItem>
          </List>
        </Card>
        
        {/* 資料管理 */}
        <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => showConfirmDialog('clearCredentials')}>
                <ListItemIcon>
                  <DeleteIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="清除所有憑證" 
                  secondary="從此裝置移除所有憑證"
                  primaryTypographyProps={{ color: 'error' }}
                />
              </ListItemButton>
            </ListItem>
            
            <Divider variant="inset" component="li" />
            
            <ListItem disablePadding>
              <ListItemButton onClick={() => showConfirmDialog('disconnect')}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="斷開錢包連接" 
                  secondary="登出當前錢包"
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Card>
        
        {/* 關於 */}
        <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <List>
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText 
                primary="關於" 
                secondary="數位憑證皮夾 v1.0.0"
              />
            </ListItem>
          </List>
        </Card>
      </Container>
      
      {/* 確認對話框 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          {dialogAction === 'clearCredentials' ? '清除所有憑證' : '斷開錢包連接'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === 'clearCredentials' 
              ? '此操作將清除此裝置上的所有憑證。這些憑證可能無法恢復。確定要繼續嗎？' 
              : '確定要斷開與當前錢包的連接嗎？'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleConfirm} 
            color={dialogAction === 'clearCredentials' ? 'error' : 'primary'}
            autoFocus
          >
            確定
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 通知欄 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;