/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OpenID for Verifiable Credential Issuance (OID4VCI) 類型定義
 */

// Issuer 配置
export interface OID4VCIConfig {
    issuer: string;
    credential_issuer: string;
    authorization_server?: string;
    credential_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
    authorization_endpoint?: string;
    grant_types_supported: string[];
    response_types_supported?: string[];
    vp_formats_supported?: {
      jwt_sd?: {
        alg_values_supported: string[];
      };
      [key: string]: any;
    };
    credentials_supported: {
      [credentialType: string]: {
        format: string;
        scope: string;
        cryptographic_binding_methods_supported?: string[];
        cryptographic_suites_supported?: string[];
        credential_definition: {
          type: string[];
          credentialSubject: {
            [subjectField: string]: {
              mandatory?: boolean;
              display?: Array<{
                name: string;
                locale: string;
              }>;
            };
          };
        };
        proof_types_supported?: string[];
      };
    };
    display?: Array<{
      name: string;
      locale: string;
      logo?: {
        url: string;
        alt_text?: string;
      };
      description?: string;
    }>;
  }
  
  // 訪問令牌響應
  export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    c_nonce?: string;
    c_nonce_expires_in?: number;
  }
  
  // 憑證請求
  export interface CredentialRequest {
    format: string;
    credential_definition: {
      type: string[];
    };
    proof?: {
      proof_type: string;
      jwt: string;
    };
  }
  
  // 憑證響應
  export interface CredentialResponse {
    format: string;
    credential: string;
  }
  
  // 憑證驗證請求
  export interface VerifyRequest {
    credential: string;
  }
  
  // 憑證驗證響應
  export interface VerifyResponse {
    verified: boolean;
    reason?: string;
  }
  
  // 憑證狀態響應
  export interface CredentialStatusResponse {
    id: string;
    status: string;
    issued_at?: string;
    expires_at?: string;
    revoked_at?: string;
  }