import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-saas-secret-key-change-in-production';

export interface QRTokenPayload {
  table_id: string;
  restaurant_id: string;
  table_name: string;
  exp: number;
}

export const generateTableToken = (tableId: string, restaurantId: string, tableName: string): string => {
  // Always use base64 encoding for simplicity and cross-platform compatibility
  const payload = {
    table_id: tableId,
    restaurant_id: restaurantId,
    table_name: tableName,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const verifyTableToken = (token: string): QRTokenPayload | null => {
  try {
    // URL decode the token first (in case it's URL encoded)
    const urlDecodedToken = decodeURIComponent(token);
    console.log('URL decoded token:', urlDecodedToken);
    
    // Always use base64 decoding
    const decodedString = Buffer.from(urlDecodedToken, 'base64').toString('utf-8');
    console.log('Decoded token string:', decodedString);
    
    const decoded = JSON.parse(decodedString);
    if (decoded.table_id && decoded.restaurant_id && decoded.table_name) {
      return decoded as QRTokenPayload;
    }
    return null;
  } catch (error) {
    console.error('Invalid token:', error);
    console.error('Token was:', token);
    return null;
  }
};

export const generateQRCode = async (token: string, baseUrl: string = 'http://localhost:3000'): Promise<string> => {
  const orderUrl = `${baseUrl}/order/${token}`;
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(orderUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const generateQRCodeForTable = async (
  tableId: string, 
  restaurantId: string, 
  tableName: string,
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
): Promise<{ token: string; qrCodeDataURL: string }> => {
  try {
    const token = generateTableToken(tableId, restaurantId, tableName);
    const qrCodeDataURL = await generateQRCode(token, baseUrl);
    
    return { token, qrCodeDataURL };
  } catch (error) {
    console.error('Error generating QR code for table:', error);
    throw new Error(`Failed to generate QR code for table ${tableName}`);
  }
};