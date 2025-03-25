/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Card, 
  CardContent, 
  Button, 
  TextField,
  AppBar, 
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  CircularProgress
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Html5Qrcode } from 'html5-qrcode';
import { useWalletConnection } from '../../context/WalletContext';
import { useCredentials } from '../../context/CredentialContext';
import { QRCodeType, QRCodeData } from '../../types';

// QR掃描器ID
const qrScannerId = 'html5-qr-code-scanner';

const AddCredentialPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { did, signMessage, isAuthenticated } = useWalletConnection();
  const { addCredential } = useCredentials();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // 檢查URL參數，如果指定了掃描模式，自動打開掃描器
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'scan') {
      setScannerOpen(true);
    }
  }, [searchParams]);

  // 啟動QR掃描器
  const startScanner = async () => {
    const container = document.getElementById(qrScannerId);
    if (!container) return;

    // 清空容器
    container.innerHTML = '';

    try {
      // 初始化掃描器
      html5QrCodeRef.current = new Html5Qrcode(qrScannerId);
      
      // 獲取相機列表
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length) {
        // 默認使用後置相機（如果有多個相機）
        let selectedCameraId = devices[0].id;
        if (devices.length > 1) {
          // 嘗試找到後置相機，它通常包含"back"或不包含"front"
          const backCamera = devices.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            !camera.label.toLowerCase().includes('front')
          );
          if (backCamera) {
            selectedCameraId = backCamera.id;
          }
        }
        
        // 啟動掃描
        await html5QrCodeRef.current.start(
          selectedCameraId, 
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // 停止掃描
            stopScanner();
            
            // 處理掃描到的數據
            handleScannedData(decodedText);
          },
          (errorMessage) => {
            // 錯誤處理
            console.log(errorMessage);
          }
        );
      } else {
        showSnackbar('找不到相機裝置', 'error');
      }
    } catch (err) {
      console.error('啟動掃描器失敗:', err);
      showSnackbar('無法啟動掃描器', 'error');
    }
  };

  // 停止QR掃描器
  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => {
          console.log('掃描器已停止');
        })
        .catch(err => {
          console.error('停止掃描器失敗:', err);
        });
    }
  };

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // 處理掃描到的數據
  const handleScannedData = async (data: string) => {
    try {
      setIsProcessing(true);
      
      // 預處理數據
      const trimmedData = data.trim();
      
      // 嘗試解析為JSON
      let qrData: QRCodeData | null = null;
      
      try {
        // 嘗試解析為JSON
        qrData = JSON.parse(trimmedData) as QRCodeData;
      } catch (e) {
        // 不是JSON，進行其他格式檢查
        
        // 檢查是否是URL
        if (trimmedData.startsWith('http') || trimmedData.startsWith('didholder://')) {
          await handleDeepLink(trimmedData);
          return;
        } 
        // 檢查是否是JWT
        else if (trimmedData.startsWith('eyJ')) {
          await processCredential(trimmedData);
          return;
        }
        // 檢查是否是JSON字符串但包含額外字符
        else if (trimmedData.includes('{') && trimmedData.includes('}')) {
          try {
            // 嘗試提取JSON部分
            const jsonMatch = trimmedData.match(/{[\s\S]*}/);
            if (jsonMatch) {
              qrData = JSON.parse(jsonMatch[0]) as QRCodeData;
            } else {
              throw new Error('不支援的QR碼格式');
            }
          } catch {
            throw new Error('無法解析QR碼內容');
          }
        } else {
          throw new Error('不支援的QR碼格式');
        }
      }
      
      // 根據掃描到的QR碼類型處理
      if (qrData) {
        switch(qrData.type) {
          case QRCodeType.DID_CONNECT:
            await handleDidConnect(qrData);
            break;
          case QRCodeType.CREDENTIAL_OFFER:
            await handleCredentialOffer(qrData);
            break;
          case QRCodeType.CREDENTIAL_SHARE:
            await handleCredentialShare(qrData);
            break;
          default:
            throw new Error('未知的QR碼類型');
        }
      } else {
        throw new Error('無法識別QR碼內容');
      }
    } catch (error) {
      console.error('處理掃描數據錯誤:', error);
      showSnackbar(`掃描失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, 'error');
    } finally {
      setIsProcessing(false);
      setScannerOpen(false);
    }
  };

  // 處理深度連結
  const handleDeepLink = async (url: string) => {
    try {
      // 解析URL
      let parsedUrl: URL;
      if (url.startsWith('didholder://')) {
        // 將自定義協議轉換為臨時HTTP URL以進行解析
        parsedUrl = new URL(url.replace('didholder://', 'http://'));
      } else {
        parsedUrl = new URL(url);
      }
      
      // 檢查URL路徑/協議
      if (url.includes('connect') || parsedUrl.pathname.includes('connect')) {
        // 處理DID連接請求
        const applicationId = parsedUrl.searchParams.get('application_id');
        const issuer = parsedUrl.searchParams.get('issuer');
        
        if (applicationId && issuer) {
          await handleDidConnect({
            type: QRCodeType.DID_CONNECT,
            applicationId,
            issuer
          });
        } else {
          throw new Error('連接請求缺少必要參數');
        }
      } else if (url.includes('credential') || parsedUrl.pathname.includes('credential')) {
        // 處理憑證請求
        const preAuthCode = parsedUrl.searchParams.get('pre_auth_code');
        const issuer = parsedUrl.searchParams.get('issuer');
        
        if (preAuthCode && issuer) {
          await handleCredentialOffer({
            type: QRCodeType.CREDENTIAL_OFFER,
            preAuthCode,
            issuer
          });
        } else {
          throw new Error('憑證請求缺少必要參數');
        }
      } else {
        throw new Error('不支援的深度連結格式');
      }
    } catch (error) {
      console.error('處理深度連結錯誤:', error);
      throw new Error('無法處理深度連結');
    }
  };

  // 處理DID連接請求
  const handleDidConnect = async (data: QRCodeData) => {
    if (!isAuthenticated || !did) {
      showSnackbar('請先連接錢包', 'warning');
      return;
    }
    
    if (!data.applicationId || !data.issuer) {
      showSnackbar('缺少必要參數', 'error');
      return;
    }
    
    try {
      // 如果需要，產生消息簽名
      const message = `關聯DID到申請 ${data.applicationId}`;
      const signature = await signMessage(message);
      
      // 建立API請求
      const apiUrl = `http://${data.issuer}/api/application/${data.applicationId}/connect`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          did,
          signature: signature ? Array.from(signature) : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error(`連接失敗: ${response.status} ${response.statusText}`);
      }
            
      showSnackbar('DID連接成功', 'success');
      
      // 延遲後導航回首頁
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('DID連接錯誤:', error);
      showSnackbar('DID連接失敗', 'error');
    }
  };

  // 處理憑證發放請求
  const handleCredentialOffer = async (data: QRCodeData) => {
    if (!isAuthenticated || !did) {
      showSnackbar('請先連接錢包', 'warning');
      return;
    }
    
    if (!data.preAuthCode || !data.issuer) {
      showSnackbar('缺少必要參數', 'error');
      return;
    }
    
    try {
      // 第1步：使用預授權碼獲取訪問令牌
      const tokenUrl = `http://${data.issuer}/api/v1/token`;
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'grant_type': 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          'pre-authorized_code': data.preAuthCode
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('獲取訪問令牌失敗');
      }
      
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      
      // 第2步：使用訪問令牌請求憑證
      const credentialUrl = `http://${data.issuer}/api/v1/credentials`;
      
      const credentialResponse = await fetch(credentialUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'format': 'jwt_sd',
          'credential_definition': {
            'type': ['VerifiableCredential', 'NaturalPersonCredential']
          }
        })
      });
      
      if (!credentialResponse.ok) {
        throw new Error('獲取憑證失敗');
      }
      
      const credentialData = await credentialResponse.json();
      
      // 將獲取到的憑證添加到錢包
      const success = await addCredential(credentialData.credential);
      
      if (success) {
        showSnackbar('憑證已添加到您的錢包', 'success');
        
        // 延遲後導航回首頁
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('無法添加憑證');
      }
    } catch (error) {
      console.error('處理憑證請求錯誤:', error);
      showSnackbar('獲取憑證失敗', 'error');
    }
  };

  // 處理共享憑證
  const handleCredentialShare = async (data: QRCodeData) => {
    if (!data.credentialId) {
      showSnackbar('缺少憑證ID', 'error');
      return;
    }
    
    try {
      // 在實際應用中，這裡您可能需要從某個API獲取共享的憑證
      const response = await fetch(`/api/shared-credential/${data.credentialId}`);
      
      if (!response.ok) {
        throw new Error('獲取共享憑證失敗');
      }
      
      const credential = await response.json();
      
      // 添加憑證到錢包
      const success = await addCredential(credential);
      
      if (success) {
        showSnackbar('共享憑證已添加到您的錢包', 'success');
        
        // 延遲後導航回首頁
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('無法添加共享憑證');
      }
    } catch (error) {
      console.error('處理共享憑證錯誤:', error);
      showSnackbar('獲取共享憑證失敗', 'error');
    }
  };

  // 處理文件選擇
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        await processCredential(content);
      } catch (error) {
        console.error('處理憑證文件錯誤:', error);
        showSnackbar('無效的憑證文件', 'error');
      }
    };
    
    reader.onerror = () => {
      showSnackbar('讀取文件失敗', 'error');
    };
    
    reader.readAsText(file);
  };

  // 處理JSON輸入
  const handleJsonSubmit = async () => {
    if (!jsonInput.trim()) {
      showSnackbar('請輸入憑證JSON或URL', 'warning');
      return;
    }
    
    try {
      await processCredential(jsonInput);
    } catch (error) {
      console.error('處理JSON輸入錯誤:', error);
      showSnackbar('處理憑證失敗', 'error');
    }
  };

  // 處理憑證數據
  const processCredential = async (data: string) => {
    setIsProcessing(true);
    try {
      // 如果是URL，嘗試獲取內容
      if (data.startsWith('http')) {
        const response = await fetch(data);
        if (!response.ok) {
          throw new Error('獲取遠程憑證失敗');
        }
        data = await response.text();
      }
      
      // 添加憑證
      const success = await addCredential(data);
      
      if (success) {
        showSnackbar('憑證已添加到您的錢包', 'success');
        setJsonInput('');
        
        // 延遲後導航回首頁
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('無法添加憑證');
      }
    } catch (error) {
      console.error('處理憑證錯誤:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // 處理組件卸載
  useEffect(() => {
    return () => {
      // 確保停止掃描器
      stopScanner();
    };
  }, []);

  // 當對話框打開時啟動掃描器
  useEffect(() => {
    if (scannerOpen && !html5QrCodeRef.current?.isScanning) {
      // 等待UI渲染後啟動掃描器
      setTimeout(() => {
        startScanner();
      }, 500);
    }
  }, [scannerOpen]);

  return (
    <Box>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
            新增憑證
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        <Card 
          sx={{ 
            bgcolor: 'background.paper', 
            mb: 3,
            ':hover': {
              boxShadow: 2,
              cursor: 'pointer'
            }
          }}
          onClick={() => setScannerOpen(true)}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <QrCodeScannerIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">掃描QR碼</Typography>
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
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FileUploadIcon sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">從檔案添加</Typography>
            </Box>
          </CardContent>
        </Card>
        
        <input 
          type="file" 
          accept=".json,.jwt,.txt" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
        
        <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              貼上JSON或URL
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="貼上憑證JSON或URL"
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              fullWidth
              onClick={handleJsonSubmit}
              disabled={isProcessing || !jsonInput.trim()}
            >
              {isProcessing ? <CircularProgress size={24} /> : '新增'}
            </Button>
          </CardContent>
        </Card>
      </Container>
      
      {/* QR掃描器對話框 */}
      <Dialog 
        open={scannerOpen} 
        onClose={() => {
          stopScanner();
          setScannerOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">掃描QR碼</Typography>
            <IconButton 
              onClick={() => {
                stopScanner();
                setScannerOpen(false);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isProcessing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>處理中...</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" paragraph align="center">
                將QR碼放在相機前方
              </Typography>
              <Box 
                id={qrScannerId} 
                sx={{ width: '100%', height: 300 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (scannerOpen && !html5QrCodeRef.current?.isScanning) {
                startScanner();
              }
            }}
            color="primary"
            disabled={isProcessing}
          >
            啟動掃描
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 啟動掃描器 */}
      <Dialog
        open={false}
        onClose={() => {}}
      >
        <DialogContent>
          <div id={qrScannerId}></div>
        </DialogContent>
      </Dialog>
      
      {/* 通知欄 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddCredentialPage;