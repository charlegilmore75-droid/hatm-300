import axios from 'axios';

const getConfig = () => ({
  apiKey: process.env.PROVIDER_API_KEY || '426497afd24be9cf36cf7f744b4bbbc7',
  baseUrl: process.env.PROVIDER_API_URL || 'https://boostprovider.com/api/v2',
});

export interface ProviderService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill: boolean;
  cancel: boolean;
  description?: string;
}

export interface ProviderOrderStatus {
  charge: string;
  start_count: string;
  status: string;
  remains: string;
  currency: string;
}

export async function fetchProviderServices(): Promise<ProviderService[]> {
  try {
    const { apiKey, baseUrl } = getConfig();
    const res = await axios.post(baseUrl, null, {
      params: { key: apiKey, action: 'services' },
      timeout: 30000,
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function placeProviderOrder(
  serviceId: number,
  link: string,
  quantity: number
): Promise<{ order: number } | { error: string }> {
  try {
    const { apiKey, baseUrl } = getConfig();
    const res = await axios.post(baseUrl, null, {
      params: { key: apiKey, action: 'add', service: serviceId, link, quantity },
      timeout: 30000,
    });
    if (res.data?.order) return { order: res.data.order };
    return { error: res.data?.error || 'Unknown error' };
  } catch {
    return { error: 'Provider connection failed' };
  }
}

export async function getProviderOrderStatus(
  orderId: number
): Promise<ProviderOrderStatus | null> {
  try {
    const { apiKey, baseUrl } = getConfig();
    const res = await axios.post(baseUrl, null, {
      params: { key: apiKey, action: 'status', order: orderId },
      timeout: 15000,
    });
    return res.data || null;
  } catch {
    return null;
  }
}

export async function refillProviderOrder(
  orderId: number
): Promise<{ refill: number } | { error: string }> {
  try {
    const { apiKey, baseUrl } = getConfig();
    const res = await axios.post(baseUrl, null, {
      params: { key: apiKey, action: 'refill', order: orderId },
      timeout: 15000,
    });
    if (res.data?.refill) return { refill: res.data.refill };
    return { error: res.data?.error || 'Refill failed' };
  } catch {
    return { error: 'Provider connection failed' };
  }
}

export async function getProviderBalance(): Promise<string> {
  try {
    const { apiKey, baseUrl } = getConfig();
    const res = await axios.post(baseUrl, null, {
      params: { key: apiKey, action: 'balance' },
      timeout: 15000,
    });
    return res.data?.balance || '0';
  } catch {
    return '0';
  }
}

export function mapProviderStatus(status: string): string {
  const map: Record<string, string> = {
    Pending: 'PENDING',
    'In progress': 'IN_PROGRESS',
    Processing: 'IN_PROGRESS',
    Completed: 'COMPLETED',
    Partial: 'PARTIAL',
    Canceled: 'CANCELED',
    Refunded: 'REFUNDED',
  };
  return map[status] || 'PENDING';
}
