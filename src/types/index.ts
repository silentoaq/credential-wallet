/* eslint-disable @typescript-eslint/no-explicit-any */
// 憑證類型定義
export interface Credential {
    id: string;          // 憑證ID
    type: string[];      // 憑證類型
    issuer: string;      // 發行者
    issuanceDate: string; // 發行日期
    expirationDate?: string; // 過期日期
    credentialSubject: {  // 憑證主體
      id: string;        // 主體ID (通常是用戶的DID)
      [key: string]: any; // 其他屬性
    };
    proof?: {            // 證明
      type: string;      // 證明類型
      [key: string]: any; // 其他屬性
    };
    status?: {           // 憑證狀態
      id: string;        // 狀態檢查URI
      type: string;      // 狀態類型
    };
    rawCredential?: string; // 原始憑證資料 (JWT格式)
  }
  
  // 憑證請求類型
  export interface CredentialRequest {
    applicationId: string;  // 申請ID
    preAuthCode?: string;   // 預授權碼
  }
  
  // 用戶資料類型
  export interface UserProfile {
    did: string;            // 用戶的DID
    publicKey?: string;     // 公鑰
    walletAddress: string;  // 錢包地址
  }
  
  // QR碼掃描類型
  export enum QRCodeType {
    DID_CONNECT = 'did-connect',      // DID連接請求
    CREDENTIAL_OFFER = 'cred-offer',  // 憑證發放請求
    CREDENTIAL_SHARE = 'cred-share',  // 憑證分享
  }
  
  // QR碼資料類型
  export interface QRCodeData {
    type: QRCodeType;       // QR碼類型
    applicationId?: string; // 申請ID
    preAuthCode?: string;   // 預授權碼
    issuer?: string;        // 發行者
    credentialId?: string;  // 憑證ID
    url?: string;           // 相關URL
  }
  
  // API 回應類型
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }