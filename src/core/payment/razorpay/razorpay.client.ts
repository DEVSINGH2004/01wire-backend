import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigVariablesType } from 'src/config';

export interface IRazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface IRazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string; // created | authorized | captured | refunded | failed
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a || '');
  const y = Buffer.from(b || '');
  return x.length === y.length && timingSafeEqual(x, y);
};

// Thin wrapper over the Razorpay REST API (orders, payments, signatures).
@Injectable()
export class RazorpayClient {
  private cfg: ConfigVariablesType['razorpay'];
  private http: AxiosInstance;

  constructor(configService: ConfigService<ConfigVariablesType>) {
    this.cfg = configService.get('razorpay', { infer: true });
    if (this.enabled) {
      this.http = axios.create({
        baseURL: this.cfg.baseUrl,
        auth: { username: this.cfg.keyId, password: this.cfg.keySecret },
        timeout: 20000
      });
    }
  }

  get enabled() {
    return !!(this.cfg?.keyId && this.cfg?.keySecret);
  }

  get keyId() {
    return this.cfg.keyId;
  }

  private assertEnabled() {
    if (!this.enabled)
      throw new ServiceUnavailableException('Razorpay is not available right now');
  }

  async createOrder(body: {
    amount: number;
    currency: string;
    receipt: string;
    notes: Record<string, string>;
  }): Promise<IRazorpayOrder> {
    this.assertEnabled();
    const { data } = await this.http.post<IRazorpayOrder>('/orders', body);
    return data;
  }

  async getPayment(paymentId: string): Promise<IRazorpayPayment> {
    this.assertEnabled();
    const { data } = await this.http.get<IRazorpayPayment>(
      `/payments/${encodeURIComponent(paymentId)}`
    );
    return data;
  }

  // Signature sent to the browser after a checkout payment
  isCheckoutSignatureValid(orderId: string, paymentId: string, signature: string) {
    this.assertEnabled();
    const expected = createHmac('sha256', this.cfg.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return safeEqual(expected, signature);
  }

  isWebhookSignatureValid(rawBody: Buffer, signature: string) {
    if (!this.cfg?.webhookSecret || !rawBody) return false;
    const expected = createHmac('sha256', this.cfg.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return safeEqual(expected, signature);
  }
}
