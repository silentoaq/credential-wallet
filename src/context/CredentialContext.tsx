/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Credential } from '../types';
import { useWalletConnection } from './WalletContext';

// 憑證上下文類型
interface CredentialContextType {
  credentials: Credential[];
  loading: boolean;
  addCredential: (credential: Credential | string) => Promise<boolean>;
  getCredentialById: (id: string) => Credential | undefined;
  removeCredential: (id: string) => void;
  clearAllCredentials: () => void;
}

// 創建上下文
const CredentialContext = createContext<CredentialContextType | undefined>(undefined);

// 本地存儲鍵
const STORAGE_KEY = 'wallet-credentials';

// 提供者元件
const CredentialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const { did } = useWalletConnection();

  // 從本地存儲加載憑證
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsed = JSON.parse(storedData) as Credential[];
          setCredentials(parsed);
        }
      } catch (error) {
        console.error('加載憑證錯誤：', error);
      } finally {
        setLoading(false);
      }
    };

    loadCredentials();
  }, []);

  // 當憑證變更時，保存到本地存儲
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    }
  }, [credentials, loading]);

  // 解析JWT或SD-JWT格式的憑證
  const parseCredentialJwt = async (jwt: string): Promise<Credential | null> => {
    try {
      // 如果是SD-JWT格式，先分割
      const parts = jwt.split('~');
      const jwtPart = parts[0];
      
      // 解析JWT部分
      // 注意：這裡只是簡單示例，實際實現時應該進行完整的驗證
      const base64Url = jwtPart.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      // 構建Credential對象
      const credential: Credential = {
        id: payload.jti || uuidv4(),
        type: payload.vc?.type || ['VerifiableCredential'],
        issuer: payload.iss,
        issuanceDate: new Date(payload.iat * 1000).toISOString(),
        expirationDate: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
        credentialSubject: {
          id: payload.sub || did || '',
          ...payload.vc?.credentialSubject
        },
        status: payload.vc?.credentialStatus,
        rawCredential: jwt
      };
      
      return credential;
    } catch (error) {
      console.error('解析憑證錯誤：', error);
      return null;
    }
  };

  // 添加憑證
  const addCredential = async (credential: Credential | string): Promise<boolean> => {
    try {
      let newCredential: Credential;
      
      // 如果是字符串，嘗試解析JWT
      if (typeof credential === 'string') {
        const parsed = await parseCredentialJwt(credential);
        if (!parsed) {
          throw new Error('無法解析憑證JWT');
        }
        newCredential = parsed;
      } else {
        newCredential = credential;
      }
      
      // 檢查是否已存在相同ID的憑證
      const exists = credentials.some(c => c.id === newCredential.id);
      if (exists) {
        // 更新現有憑證
        setCredentials(prev => 
          prev.map(c => c.id === newCredential.id ? newCredential : c)
        );
      } else {
        // 添加新憑證
        setCredentials(prev => [...prev, newCredential]);
      }
      
      return true;
    } catch (error) {
      console.error('添加憑證錯誤：', error);
      return false;
    }
  };

  // 獲取指定ID的憑證
  const getCredentialById = (id: string): Credential | undefined => {
    return credentials.find(c => c.id === id);
  };

  // 移除憑證
  const removeCredential = (id: string): void => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  // 清除所有憑證
  const clearAllCredentials = (): void => {
    setCredentials([]);
  };

  const value: CredentialContextType = {
    credentials,
    loading,
    addCredential,
    getCredentialById,
    removeCredential,
    clearAllCredentials
  };

  return (
    <CredentialContext.Provider value={value}>
      {children}
    </CredentialContext.Provider>
  );
};

// 自定義Hook，方便使用上下文
export const useCredentials = (): CredentialContextType => {
  const context = useContext(CredentialContext);
  if (context === undefined) {
    throw new Error('useCredentials必須在CredentialProvider內使用');
  }
  return context;
};

export default CredentialProvider;