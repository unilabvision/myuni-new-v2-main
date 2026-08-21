import 'server-only';
import Iyzipay from 'iyzipay';

export function createIyzipayClient() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl = process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com';

  if (!apiKey || !secretKey) {
    throw new Error('IYZICO_API_KEY / IYZICO_SECRET_KEY is not configured');
  }

  const IyzipayClass = (Iyzipay as any).default || Iyzipay;
  return new IyzipayClass({
    apiKey,
    secretKey,
    uri: baseUrl,
  });
}

export type IyzicoCheckoutRetrieveResult = {
  status?: string;
  paymentStatus?: string;
  fraudStatus?: number;
  basketId?: string;
  conversationId?: string;
  paymentId?: string;
  authCode?: string;
  paidPrice?: string | number;
  price?: string | number;
  errorMessage?: string;
  token?: string;
};

/**
 * Query Iyzico Checkout Form result by token (same call the callback uses).
 */
export function retrieveCheckoutForm(
  token: string,
  conversationId?: string
): Promise<IyzicoCheckoutRetrieveResult> {
  const iyzipay = createIyzipayClient();

  return new Promise((resolve, reject) => {
    iyzipay.checkoutForm.retrieve(
      {
        locale: Iyzipay.LOCALE.TR,
        token,
        ...(conversationId ? { conversationId } : {}),
      },
      (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result || {});
      }
    );
  });
}

/** Map Iyzico retrieve payload → our order status semantics */
export function mapIyzicoPaymentToOrderStatus(result: IyzicoCheckoutRetrieveResult): {
  orderStatus: 'completed_ready' | 'payment_review' | 'failed' | 'pending';
  iyzicoPaymentStatus: string;
  fraudStatus: number | null;
} {
  const paymentStatus = String(result.paymentStatus || '').toUpperCase();
  const fraudStatus =
    result.fraudStatus === undefined || result.fraudStatus === null
      ? null
      : Number(result.fraudStatus);

  if (paymentStatus === 'FAILURE' || result.status === 'failure') {
    return {
      orderStatus: 'failed',
      iyzicoPaymentStatus: paymentStatus || 'FAILURE',
      fraudStatus,
    };
  }

  if (paymentStatus === 'SUCCESS') {
    // fraudStatus: 1 approved, 0 in review, -1 rejected
    if (fraudStatus === 0) {
      return {
        orderStatus: 'payment_review',
        iyzicoPaymentStatus: paymentStatus,
        fraudStatus,
      };
    }
    if (fraudStatus === -1) {
      return {
        orderStatus: 'failed',
        iyzicoPaymentStatus: paymentStatus,
        fraudStatus,
      };
    }
    return {
      orderStatus: 'completed_ready',
      iyzicoPaymentStatus: paymentStatus,
      fraudStatus,
    };
  }

  // INIT_THREEDS, CALLBACK_THREEDS, empty, etc. — ödeme henüz kesinleşmedi
  return {
    orderStatus: 'pending',
    iyzicoPaymentStatus: paymentStatus || 'PENDING',
    fraudStatus,
  };
}
