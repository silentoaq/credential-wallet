import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Card, 
  CardContent, 
  Button, 
  AppBar, 
  Toolbar,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useWalletConnection } from '../../context/WalletContext';
import { useCredentials } from '../../context/CredentialContext';

const SharePage = () => {
  useWalletConnection();
  const { credentials } = useCredentials();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedCredentialIndex, setSelectedCredentialIndex] = useState<number | null>(null);
  const [credentialSelectOpen, setCredentialSelectOpen] = useState(false);

  // 顯示通知
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // 創建公共連結
  const createPublicLink = () => {
    if (credentials.length === 0) {
      showSnackbar('沒有可分享的憑證');
      return;
    }
    setCredentialSelectOpen(true);
  };

  // 發送憑證
  const sendCredential = () => {
    if (credentials.length === 0) {
      showSnackbar('沒有可分享的憑證');
      return;
    }
    
    try {
      // 將憑證轉換為JSON文件並下載
      const dataStr = JSON.stringify(credentials, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `credentials-${new Date().toISOString()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      showSnackbar('憑證已下載');
    } catch (error) {
      console.error('下載憑證失敗:', error);
      showSnackbar('下載失敗');
    }
  };

  // 掃描共享的QR碼
  const scanSharedQRCode = () => {
    // 這裡我們簡單地導航到添加憑證頁面，因為那裡會有掃描功能
    window.location.href = '/add-credential?mode=scan';
  };

  return (
    <Box>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
            分享
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Card 
          sx={{ 
            bgcolor: 'background.paper', 
            mb: 3,
            ':hover': {
              boxShadow: 2,
              cursor: 'pointer'
            }
          }}
          onClick={createPublicLink}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LinkIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">創建公共連結</Typography>
                <Typography variant="body2" color="text.secondary">
                  允許公開分享一個憑證
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card 
          sx={{ 
            bgcolor: 'background.paper', 
            mb: 3,
            ':hover': {
              boxShadow: 2,
              cursor: 'pointer'
            }
          }}
          onClick={sendCredential}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FileDownloadIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">發送憑證</Typography>
                <Typography variant="body2" color="text.secondary">
                  允許發送一個或多個憑證為JSON檔案
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card 
          sx={{ 
            bgcolor: 'background.paper', 
            mb: 3,
            ':hover': {
              boxShadow: 2,
              cursor: 'pointer'
            }
          }}
          onClick={scanSharedQRCode}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <QrCodeScannerIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">掃描共享QR碼</Typography>
                <Typography variant="body2" color="text.secondary">
                  掃描其他人分享的憑證QR碼
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
      
      {/* 選擇憑證對話框 */}
      <Dialog 
        open={credentialSelectOpen} 
        onClose={() => setCredentialSelectOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>選擇要分享的憑證</DialogTitle>
        <DialogContent>
          <List>
            {credentials.map((credential, index) => (
              <Box key={credential.id}>
                <ListItem
                  sx={{ 
                    cursor: 'pointer',
                    ...(selectedCredentialIndex === index ? { bgcolor: 'action.selected' } : {}) 
                  }}
                  onClick={() => setSelectedCredentialIndex(index)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <VerifiedIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={credential.type[credential.type.length - 1]
                      .replace('Credential', '')
                      .replace(/([A-Z])/g, ' $1')
                      .trim()}
                    secondary={`發行者: ${credential.issuer}`}
                  />
                </ListItem>
                {index < credentials.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCredentialSelectOpen(false)}>取消</Button>
          <Button 
            onClick={() => {
              if (selectedCredentialIndex === null) {
                showSnackbar('請選擇一個憑證');
                return;
              }
              
              const credential = credentials[selectedCredentialIndex];
              
              // 生成分享連結
              try {
                // 在實際應用中，這可能是一個指向真實共享頁面的鏈接
                // 帶有加密的憑證 ID 參數
                const shareUrl = `${window.location.origin}/shared-credential?id=${credential.id}`;
                
                // 複製到剪貼板
                navigator.clipboard.writeText(shareUrl)
                  .then(() => {
                    showSnackbar('連結已複製到剪貼板');
                    setCredentialSelectOpen(false);
                  })
                  .catch(err => {
                    console.error('無法複製連結:', err);
                    showSnackbar('無法複製連結');
                  });
              } catch (error) {
                console.error('創建公共連結失敗:', error);
                showSnackbar('創建連結失敗');
              }
            }} 
            variant="contained" 
            color="primary"
            disabled={selectedCredentialIndex === null}
          >
            建立連結
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

export default SharePage;