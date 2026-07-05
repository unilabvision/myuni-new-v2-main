declare module 'iyzipay' {
  interface IyzipayConfig {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  interface IyzipayCallback {
    (err: unknown, result: Record<string, unknown>): void;
  }

  class Iyzipay {
    constructor(config: IyzipayConfig);
    checkoutForm: {
      retrieve(request: { locale: string; token: string }, callback: IyzipayCallback): void;
    };
    checkoutFormInitialize: {
      create(request: Record<string, unknown>, callback: IyzipayCallback): void;
    };
    static LOCALE: {
      TR: string;
      EN: string;
    };
    static CURRENCY: {
      TRY: string;
      USD: string;
      EUR: string;
      GBP: string;
    };
    static PAYMENT_GROUP: {
      PRODUCT: string;
      LISTING: string;
      SUBSCRIPTION: string;
    };
    static BASKET_ITEM_TYPE: {
      PHYSICAL: string;
      VIRTUAL: string;
    };
  }

  export = Iyzipay;
}




