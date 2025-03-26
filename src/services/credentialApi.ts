/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { Credential, QRCodeData, QRCodeType } from '../types';
import { 
  OID4VCIConfig, 
  TokenResponse, 
  CredentialRequest, 
  CredentialResponse, 
} from '../types/oid4vci';

// Issuer 配置緩存
const issuerConfigCache: Record<string, OID4VCIConfig> = {};

// API 錯誤處理
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// 通用 API 請求方法
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  console.log(`發送 API 請求: ${url}, 方法: ${options?.method || 'GET'}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // 檢查回應狀態
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.error_description || errorMessage;
        console.error('API 錯誤:', errorData);
      } catch (e) {
        // 不是 JSON 格式
      }
      
      throw new ApiError(errorMessage, response.status);
    }

    // 解析為 JSON
    const data = await response.json() as T;
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

// 獲取 Issuer 配置
export async function getIssuerConfig(issuerDomain: string): Promise<OID4VCIConfig> {
  console.log(`獲取 Issuer 配置: ${issuerDomain}`);
  
  // 檢查緩存
  if (issuerConfigCache[issuerDomain]) {
    console.log('使用緩存的 Issuer 配置');
    return issuerConfigCache[issuerDomain];
  }
  
  // 構建 well-known URL
  const configUrl = `http://${issuerDomain}/.well-known/openid-credential-issuer`;
  console.log(`請求 Issuer 配置: ${configUrl}`);
  
  try {
    const config = await fetchApi<OID4VCIConfig>(configUrl);
    console.log('成功獲取 Issuer 配置');
    
    // 緩存配置
    issuerConfigCache[issuerDomain] = config;
    
    return config;
  } catch (error) {
    console.error('獲取 Issuer 配置失敗:', error);
    throw new Error(`無法獲取 Issuer ${issuerDomain} 的配置: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 連接 DID 到申請
export async function connectDidToApplication(
  issuerDomain: string, // 完整的 Issuer 域名，如 'fido.moi.gov.tw:5000'
  applicationId: string, 
  did: string,
  signature?: Uint8Array
): Promise<{ success: boolean; message?: string }> {
  // 構建完整的 API URL
  const apiUrl = `http://${issuerDomain}/api/application/${applicationId}/connect`;
  
  console.log(`連接 DID 到申請: ${apiUrl}`);
  
  try {
    const response = await fetchApi<{ status: string; message: string }>(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        did,
        signature: signature ? Array.from(signature) : undefined
      })
    });
    
    console.log('DID 連接成功');
    
    return {
      success: true,
      message: response.message || 'DID successfully connected'
    };
  } catch (error) {
    console.error('Error connecting DID:', error);
    return {
      success: false,
      message: error instanceof ApiError 
        ? error.message 
        : 'Failed to connect DID to application'
    };
  }
}

// 使用預授權碼獲取訪問令牌
export async function getAccessToken(
  issuerDomain: string, // 完整的 Issuer 域名
  preAuthCode: string
): Promise<TokenResponse> {
  console.log(`使用預授權碼獲取訪問令牌: ${issuerDomain}, 預授權碼: ${preAuthCode}`);
  
  try {
    // 獲取 Issuer 配置
    const config = await getIssuerConfig(issuerDomain);
    
    // 使用配置中的 token_endpoint
    const tokenUrl = config.token_endpoint;
    console.log(`使用令牌端點: ${tokenUrl}`);
    
    const response = await fetchApi<TokenResponse>(tokenUrl, {
      method: 'POST',
      body: JSON.stringify({
        'grant_type': 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
        'pre-authorized_code': preAuthCode
      })
    });
    
    console.log('成功獲取訪問令牌');
    return response;
  } catch (error) {
    console.error('獲取訪問令牌失敗:', error);
    throw error;
  }
}

// 獲取憑證
export async function getCredential(
  issuerDomain: string, // 完整的 Issuer 域名
  accessToken: string,
  type: string[] = ['VerifiableCredential', 'NaturalPersonCredential']
): Promise<CredentialResponse> {
  console.log(`獲取憑證: ${issuerDomain}, 憑證類型: ${type.join(', ')}`);
  
  try {
    // 獲取 Issuer 配置
    const config = await getIssuerConfig(issuerDomain);
    
    // 使用配置中的 credential_endpoint
    const credentialUrl = config.credential_endpoint;
    console.log(`使用憑證端點: ${credentialUrl}`);
    
    const request: CredentialRequest = {
      'format': 'jwt_sd',
      'credential_definition': {
        'type': type
      }
    };
    
    const response = await fetchApi<CredentialResponse>(credentialUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    console.log('成功獲取憑證');
    return response;
  } catch (error) {
    console.error('獲取憑證失敗:', error);
    throw error;
  }
}

// 處理掃描到的 QR 碼數據
export function parseQrCodeData(data: string): QRCodeData | null {
  console.log('解析 QR 碼數據:', data);
  
  try {
    // 嘗試解析為 JSON
    try {
      const jsonData = JSON.parse(data) as QRCodeData;
      console.log('成功解析為 JSON:', jsonData);
      return jsonData;
    } catch (e) {
      // 不是 JSON，檢查是否是 URL
      if (data.startsWith('http') || data.startsWith('didholder://')) {
        console.log('嘗試解析為深度連結');
        return parseDeepLink(data);
      }
      // 檢查是否是 JWT
      else if (data.startsWith('eyJ')) {
        console.log('識別為 JWT 格式的憑證');
        return {
          type: QRCodeType.CREDENTIAL_SHARE,
          rawCredential: data
        };
      }
      // 檢查是否包含 JSON 部分
      else if (data.includes('{') && data.includes('}')) {
        const jsonMatch = data.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]) as QRCodeData;
          console.log('從字符串中提取並解析 JSON:', parsedData);
          return parsedData;
        }
      }
    }
  } catch (error) {
    console.error('解析 QR 碼數據錯誤:', error);
  }
  
  console.log('無法解析 QR 碼數據');
  return null;
}

// 解析深度連結
function parseDeepLink(url: string): QRCodeData {
  try {
    console.log('解析深度連結:', url);
    
    // 解析 URL
    let parsedUrl: URL;
    if (url.startsWith('didholder://')) {
      // 將自定義協議轉換為臨時 HTTP URL 以進行解析
      parsedUrl = new URL(url.replace('didholder://', 'http://temporary.domain/'));
    } else {
      parsedUrl = new URL(url);
    }
    
    // 提取域名和端口（如果有）
    let issuerDomain = parsedUrl.searchParams.get('issuer') || '';
    
    // 確保 issuerDomain 包含端口信息（如果未指定，為開發環境添加默認端口）
    if (issuerDomain) {
      // 檢查是否已包含端口
      if (!issuerDomain.includes(':')) {
        // 根據域名添加默認端口
        if (issuerDomain.includes('fido.moi.gov.tw')) {
          issuerDomain += ':5000';
        } else if (issuerDomain.includes('land.moi.gov.tw')) {
          issuerDomain += ':5001';
        } else if (issuerDomain.includes('zuvi.io')) {
          issuerDomain += ':5002';
        }
      }
    }
    
    console.log('解析後的 Issuer 域名 (含端口):', issuerDomain);
    
    // 檢查 URL 路徑/協議
    if (url.includes('connect') || parsedUrl.pathname.includes('connect')) {
      // 處理 DID 連接請求
      const applicationId = parsedUrl.searchParams.get('application_id');
      
      if (applicationId && issuerDomain) {
        console.log('識別為 DID 連接請求');
        return {
          type: QRCodeType.DID_CONNECT,
          applicationId,
          issuerDomain
        };
      }
    } else if (url.includes('credential') || parsedUrl.pathname.includes('credential')) {
      // 處理憑證請求
      const preAuthCode = parsedUrl.searchParams.get('pre_auth_code');
      
      if (preAuthCode && issuerDomain) {
        console.log('識別為憑證預授權請求');
        return {
          type: QRCodeType.CREDENTIAL_OFFER,
          preAuthCode,
          issuerDomain
        };
      }
      
      // 檢查是否是共享憑證
      const encodedData = parsedUrl.searchParams.get('data');
      if (encodedData) {
        try {
          const decodedData = atob(encodedData);
          const credentialData = JSON.parse(decodedData);
          console.log('識別為共享憑證數據');
          return {
            type: QRCodeType.CREDENTIAL_SHARE,
            credentialData
          };
        } catch (e) {
          console.error('解碼共享憑證數據錯誤:', e);
        }
      }
    }
    
    console.log('無法識別連結類型，返回原始 URL');
    // 返回包含原始 URL 的數據，讓應用程序決定如何處理
    return {
      type: QRCodeType.CREDENTIAL_SHARE,
      url
    };
  } catch (error) {
    console.error('解析深度連結錯誤:', error);
    // 返回包含原始 URL 的數據，讓應用程序決定如何處理
    return {
      type: QRCodeType.CREDENTIAL_SHARE,
      url
    };
  }
}

// 驗證憑證
export async function verifyCredential(
  credential: Credential
): Promise<{ valid: boolean; message: string }> {
  if (!credential.rawCredential) {
    return { valid: false, message: '憑證缺少原始數據' };
  }
  
  // 從憑證的發行者中提取域名
  const issuer = credential.issuer;
  // 解析域名，確保包含正確的端口
  let issuerDomain = extractIssuerDomain(issuer);
  
  try {    
    console.log(`嘗試驗證來自 ${issuerDomain} 的憑證`);
    
    const verifyUrl = `http://${issuerDomain}/api/v1/verify`;
    const response = await fetchApi<{ verified: boolean; reason?: string }>(verifyUrl, {
      method: 'POST',
      body: JSON.stringify({
        credential: credential.rawCredential
      })
    });
    
    return {
      valid: response.verified,
      message: response.verified 
        ? '憑證有效'
        : response.reason || '憑證無效'
    };
  } catch (error) {
    console.error('驗證憑證錯誤:', error);
    return {
      valid: false,
      message: error instanceof ApiError 
        ? error.message 
        : '驗證憑證時發生錯誤'
    };
  }
}

// 從 URL 或 DID 中提取 Issuer 域名
export function extractIssuerDomain(issuer: string): string {
  if (!issuer) return '';
  
  let domain = '';
  
  // 移除協議部分
  if (issuer.startsWith('did:web:')) {
    domain = issuer.replace('did:web:', '');
  } else if (issuer.startsWith('http')) {
    try {
      const url = new URL(issuer);
      domain = url.host; // 含端口的域名
    } catch (e) {
      console.error('解析 URL 錯誤:', e);
      domain = issuer;
    }
  } else {
    // 已經是域名格式
    domain = issuer;
  }
  
  // 檢查是否已包含端口，如果沒有則添加適當的端口
  if (!domain.includes(':')) {
    // 根據域名添加默認端口
    if (domain.includes('fido.moi.gov.tw')) {
      domain += ':5000';
    } else if (domain.includes('land.moi.gov.tw')) {
      domain += ':5001';
    } else if (domain.includes('zuvi.io')) {
      domain += ':5002';
    }
  }
  
  return domain;
}

// 導出所有函數
export default {
  getIssuerConfig,
  connectDidToApplication,
  getAccessToken,
  getCredential,
  parseQrCodeData,
  verifyCredential,
  extractIssuerDomain
};