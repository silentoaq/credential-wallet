/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
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
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VerifiedIcon from '@mui/icons-material/Verified';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { useWalletConnection } from '../../context/WalletContext';
import { useCredentials } from '../../context/CredentialContext';

const SharePage = () => {
  useWalletConnection();
  const { credentials } = useCredentials();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedCredentialIndex, setSelectedCredentialIndex] = useState<number | null>(null);
  const [credentialSelectOpen, setCredentialSelectOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>({});
  const [shareableData, setShareableData] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  // 顯示通知
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  
  // 當選擇憑證時初始化欄位選擇
  useEffect(() => {
    if (selectedCredentialIndex !== null && credentials.length > 0) {
      const credential = credentials[selectedCredentialIndex];
      const initialSelection = Object.keys(credential.credentialSubject).reduce(
        (acc, key) => ({
          ...acc,
          [key]: key === 'id' // 默認情況下只選擇ID欄位
        }),
        {}
      );
      setSelectedFields(initialSelection);
    }
  }, [selectedCredentialIndex, credentials]);

  // 處理欄位選擇變更
  const handleFieldSelectionChange = (field: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 處理全選或全不選
  const handleSelectAllFields = (selected: boolean) => {
    if (selectedCredentialIndex !== null && credentials.length > 0) {
      const credential = credentials[selectedCredentialIndex];
      const newSelection = Object.keys(credential.credentialSubject).reduce(
        (acc, key) => ({
          ...acc,
          [key]: selected
        }),
        {}
      );
      setSelectedFields(newSelection);
    }
  };

  // 生成可分享的憑證數據
  const generateShareableCredential = () => {
    if (selectedCredentialIndex === null) return null;
    
    const credential = credentials[selectedCredentialIndex];
    
    // 創建一個只包含選中欄位的新憑證對象
    const shareableCredential = {
      id: credential.id,
      type: credential.type,
      issuer: credential.issuer,
      issuanceDate: credential.issuanceDate,
      credentialSubject: Object.entries(credential.credentialSubject)
        .filter(([key]) => selectedFields[key])
        .reduce(
          (obj, [key, value]) => {
            obj[key] = value;
            return obj;
          },
          {} as Record<string, any>
        )
    };
    
    return JSON.stringify(shareableCredential, null, 2);
  };

  // 生成QR碼數據
  const generateQrCode = () => {
    const shareableData = generateShareableCredential();
    if (!shareableData) return;
    
    setShareableData(shareableData);
    
    // 在實際應用中，這可能是一個指向後端API的URL
    // 在這個示例中，我們直接使用Base64編碼的數據
    const encodedData = btoa(shareableData);
    const qrData = `didholder://shared-credential?data=${encodedData}`;
    
    setQrCodeData(qrData);
    
    // 打開QR碼對話框
    setCredentialSelectOpen(false);
    setQrCodeDialogOpen(true);
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
        <DialogTitle>選擇要分享的憑證與欄位</DialogTitle>
        <DialogContent>
          {/* 憑證選擇部分 */}
          <Typography variant="subtitle1" gutterBottom>選擇憑證</Typography>
          <List sx={{ mb: 3 }}>
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
          
          {/* 選擇性披露部分 - 只在選擇了憑證後顯示 */}
          {selectedCredentialIndex !== null && (
            <>
              <Typography variant="subtitle1" gutterBottom>選擇要分享的欄位</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                選擇性披露讓您能夠只共享憑證中的部分信息，保護您的隱私。
              </Alert>
              
              <Box sx={{ mb: 2 }}>
                <Button 
                  onClick={() => handleSelectAllFields(true)}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  全選
                </Button>
                <Button 
                  onClick={() => handleSelectAllFields(false)}
                  variant="outlined"
                  size="small"
                >
                  全不選
                </Button>
              </Box>
              
              <List sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {Object.entries(credentials[selectedCredentialIndex].credentialSubject).map(([key, value]) => (
                  <ListItem key={key} divider>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={!!selectedFields[key]} 
                          onChange={() => handleFieldSelectionChange(key)}
                        />
                      }
                      label={
                        <ListItemText 
                          primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        />
                      }
                      sx={{ width: '100%' }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCredentialSelectOpen(false)}>取消</Button>
          <Button 
            onClick={generateQrCode} 
            variant="contained" 
            color="primary"
            disabled={selectedCredentialIndex === null}
          >
            生成QR碼
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* QR碼對話框 */}
      <Dialog
        open={qrCodeDialogOpen}
        onClose={() => setQrCodeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>掃描QR碼分享憑證</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            {qrCodeData && (
              <div id="qrcode-container" style={{ marginBottom: '20px' }}>
                <QrCodeIcon sx={{ fontSize: 180 }} />
              </div>
            )}
            <Typography variant="body1" gutterBottom>
              使用數位憑證應用掃描QR碼獲取共享憑證
            </Typography>
          </Box>
          
          {shareableData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>共享資料預覽:</Typography>
              <Box 
                sx={{ 
                  bgcolor: 'background.default', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '150px'
                }}
              >
                <pre style={{ margin: 0 }}>
                  {shareableData}
                </pre>
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button 
              startIcon={<ContentCopyIcon />}
              onClick={() => {
                if (shareableData) {
                  navigator.clipboard.writeText(shareableData)
                    .then(() => {
                      showSnackbar('資料已複製到剪貼板');
                    })
                    .catch(err => {
                      console.error('複製失敗:', err);
                      showSnackbar('複製失敗');
                    });
                }
              }}
              variant="outlined"
            >
              複製資料
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrCodeDialogOpen(false)}>關閉</Button>
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