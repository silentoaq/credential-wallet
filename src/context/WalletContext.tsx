/* eslint-disable no-prototype-builtins */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// 定義錢包上下文類型
interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: string | null;
  did: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<Uint8Array | null>;
  authenticate: () => Promise<boolean>;
  logout: () => void;
}

// 創建上下文
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// 公鑰轉換為DID格式
const publicKeyToDid = (publicKey: string): string => {
  return `did:pkh:solana:${publicKey}`;
};

// 提供者元件
const WalletConnectionProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
    wallets, 
    select, 
    connected, 
    connecting, 
    disconnecting, 
    publicKey, 
    connect, 
    disconnect, 
    signMessage 
  } = useWallet();
  const [did, setDid] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // 當公鑰變更時，更新DID
  useEffect(() => {
    if (publicKey) {
      const newDid = publicKeyToDid(publicKey.toString());
      setDid(newDid);
      
      // 檢查是否有持久化的認證信息
      const storedAuth = localStorage.getItem('wallet_auth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          // 驗證存儲的認證信息是否匹配當前連接的錢包
          if (authData.publicKey === publicKey.toString() && authData.did === newDid) {
            // 檢查是否過期
            const now = Date.now();
            if (authData.expiresAt && authData.expiresAt > now) {
              setIsAuthenticated(true);
            } else {
              // 認證已過期
              localStorage.removeItem('wallet_auth');
              setIsAuthenticated(false);
            }
          } else {
            // 不匹配，清除舊認證
            localStorage.removeItem('wallet_auth');
            setIsAuthenticated(false);
          }
        } catch (e) {
          console.error('解析認證數據錯誤:', e);
          localStorage.removeItem('wallet_auth');
          setIsAuthenticated(false);
        }
      }
    } else {
      setDid(null);
      setIsAuthenticated(false);
    }
    setAuthLoading(false);
  }, [publicKey]);

  // 檢查是否已安裝 Phantom 錢包
  useEffect(() => {
    const checkPhantomWallet = async () => {
      // 尋找 Phantom 錢包
      const phantomWallet = wallets.find(wallet => 
        wallet.adapter.name.toLowerCase().includes('phantom')
      );
      
      if (phantomWallet && select) {
        // 選擇 Phantom 錢包
        select(phantomWallet.adapter.name);
        console.log('已選擇 Phantom 錢包');
      } else {
        console.warn('未找到 Phantom 錢包。請確保已安裝 Phantom 錢包擴充功能。');
      }
    };
    
    checkPhantomWallet();
  }, [wallets, select]);

  // 包裝signMessage方法，使其更易於使用
  const handleSignMessage = async (message: string): Promise<Uint8Array | null> => {
    if (!publicKey || !signMessage) {
      console.error('無法簽名：錢包未連接或不支援簽名');
      return null;
    }
    
    try {
      // 將訊息轉換為Uint8Array
      const messageBytes = new TextEncoder().encode(message);
      // 簽名
      const signature = await signMessage(messageBytes);
      return signature;
    } catch (error) {
      console.error('簽名錯誤：', error);
      return null;
    }
  };

  // 認證方法 - 讓用戶簽名以證明他們擁有錢包
  const authenticate = async (): Promise<boolean> => {
    if (!publicKey || !did) {
      console.error('無法認證：錢包未連接');
      return false;
    }

    try {
      setAuthLoading(true);
      // 創建認證訊息，包括時間戳防止重放攻擊
      const timestamp = Date.now();
      const message = `authenticate:${did}:${timestamp}`;
      
      // 請求用戶簽名
      const signature = await handleSignMessage(message);
      
      if (!signature) {
        console.error('認證失敗：未獲得簽名');
        setAuthLoading(false);
        return false;
      }
      
      // 將簽名轉換為Base64字符串以便存儲
      const signatureBase64 = Buffer.from(signature).toString('base64');
      
      // 存儲認證資訊
      const expiresAt = timestamp + (7 * 24 * 60 * 60 * 1000); // 7天後過期
      const authData = {
        publicKey: publicKey.toString(),
        did,
        signature: signatureBase64,
        timestamp,
        expiresAt
      };
      
      localStorage.setItem('wallet_auth', JSON.stringify(authData));
      
      // 通知其他頁面/標籤認證狀態已更新
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'wallet_auth',
        newValue: JSON.stringify(authData)
      }));
      
      setIsAuthenticated(true);
      setAuthLoading(false);
      return true;
    } catch (error) {
      console.error('認證過程錯誤：', error);
      setAuthLoading(false);
      return false;
    }
  };

  // 登出方法
  const logout = () => {
    localStorage.removeItem('wallet_auth');
    
    // 通知其他頁面/標籤認證狀態已更新
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'wallet_auth',
      oldValue: localStorage.getItem('wallet_auth'),
      newValue: null
    }));
    
    setIsAuthenticated(false);
  };

  const value: WalletContextType = {
    connected,
    connecting,
    disconnecting,
    publicKey: publicKey ? publicKey.toString() : null,
    did,
    isAuthenticated,
    authLoading,
    connect: async () => {
      try {
        // 確保已選擇錢包
        if (wallets.length > 0 && select) {
          console.log('嘗試選擇第一個可用錢包');
          select(wallets[0].adapter.name);
        }
        
        // 連接錢包
        await connect();
      } catch (error) {
        console.error('連接錢包錯誤：', error);
        
        // 提供更詳細的錯誤訊息
        if (error instanceof Error) {
          if (error.name === 'WalletNotSelectedError') {
            console.error('沒有選擇錢包。請確保已安裝 Phantom 錢包且已在應用中選擇。');
          } else if (error.name === 'WalletNotReadyError') {
            console.error('錢包尚未準備好。請確保已登入錢包。');
          }
        }
      }
    },
    disconnect: async () => {
      try {
        // 清除認證狀態
        logout();
        await disconnect();
      } catch (error) {
        console.error('斷開錢包錯誤：', error);
      }
    },
    signMessage: handleSignMessage,
    authenticate,
    logout
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// 外層提供者，處理Solana連接配置
const WalletConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 初始化Solana網絡
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);

  // 初始化錢包適配器
  const wallets = [
    new PhantomWalletAdapter({ network })
  ];

  // 檢查環境中是否有錢包
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasPhantom = window.hasOwnProperty('phantom') || 
                         (window.hasOwnProperty('solana') && window.solana && window.solana.isPhantom);
      
      if (!hasPhantom) {
        console.warn('未檢測到 Phantom 錢包。請安裝 Phantom 錢包擴充功能：https://phantom.app/');
      }
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletConnectionProviderInner>
          {children}
        </WalletConnectionProviderInner>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// 自定義Hook，方便使用上下文
export const useWalletConnection = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletConnection必須在WalletConnectionProvider內使用');
  }
  return context;
};

export default WalletConnectionProvider;