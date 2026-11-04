import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigVariablesType } from 'src/config';

export interface IShopifyDraftOrder {
  id: string; // gid://shopify/DraftOrder/123
  name: string; // #D12
  status: string; // OPEN | INVOICE_SENT | COMPLETED
  invoiceUrl: string;
  totalPriceSet?: { shopMoney: { amount: string; currencyCode: string } };
  order?: {
    id: string; // gid://shopify/Order/123
    name: string; // #1001
    displayFinancialStatus: string; // PAID | PENDING | AUTHORIZED | ...
    totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  } | null;
}

const DRAFT_FIELDS = `
  id name status invoiceUrl
  totalPriceSet { shopMoney { amount currencyCode } }
  order { id name displayFinancialStatus totalPriceSet { shopMoney { amount currencyCode } } }
`;

// Thin wrapper over the Shopify Admin GraphQL API for one store.
// Auth: the app's client ID + secret are exchanged for a 24-hour token
// ("client credentials" grant); the token is cached and refreshed before it expires.
@Injectable()
export class ShopifyClient {
  private _logger = new Logger(ShopifyClient.name);
  private cfg: ConfigVariablesType['shopify'];
  private token: string = null;
  private tokenExpiresAt = 0;

  constructor(configService: ConfigService<ConfigVariablesType>) {
    this.cfg = configService.get('shopify', { infer: true });
  }

  get enabled() {
    return !!(this.cfg?.storeDomain && this.cfg?.clientId && this.cfg?.clientSecret);
  }

  get webhookUrl(): string | null {
    return this.cfg?.webhookUrl || null;
  }

  private assertEnabled() {
    if (!this.enabled)
      throw new ServiceUnavailableException('Shopify is not available right now');
  }

  private async accessToken(): Promise<string> {
    // Refresh 5 minutes before expiry
    if (this.token && Date.now() < this.tokenExpiresAt - 5 * 60 * 1000) return this.token;
    const { data } = await axios.post(
      `https://${this.cfg.storeDomain}/admin/oauth/access_token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        timeout: 20000
      }
    );
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;
    return this.token;
  }

  private async gql<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    this.assertEnabled();
    const call = async () =>
      axios.post(
        `https://${this.cfg.storeDomain}/admin/api/${this.cfg.apiVersion}/graphql.json`,
        { query, variables },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': await this.accessToken()
          },
          timeout: 20000
        }
      );
    let res;
    try {
      res = await call();
    } catch (e) {
      // Token revoked or expired early: get a new one and try once more
      if (e?.response?.status === 401) {
        this.token = null;
        res = await call();
      } else throw e;
    }
    if (res.data?.errors?.length) {
      this._logger.error(`Shopify API: ${JSON.stringify(res.data.errors).slice(0, 300)}`);
      throw new Error(res.data.errors[0]?.message || 'Shopify API error');
    }
    return res.data.data as T;
  }

  // Checkout for one custom line (no product, no shipping, no tax added)
  async createDraftOrder(input: {
    title: string;
    amount: string; // "65690.94" in the store currency
    currency: string;
    note: string;
    tags: string[];
    attributes: { key: string; value: string }[];
  }): Promise<IShopifyDraftOrder> {
    const data = await this.gql<{ draftOrderCreate: { draftOrder: IShopifyDraftOrder; userErrors: { field: string[]; message: string }[] } }>(
      `mutation create($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { ${DRAFT_FIELDS} }
          userErrors { field message }
        }
      }`,
      {
        input: {
          lineItems: [
            {
              title: input.title,
              quantity: 1,
              originalUnitPriceWithCurrency: { amount: input.amount, currencyCode: input.currency },
              requiresShipping: false,
              taxable: false
            }
          ],
          taxExempt: true,
          note: input.note,
          tags: input.tags,
          customAttributes: input.attributes
        }
      }
    );
    const { draftOrder, userErrors } = data.draftOrderCreate;
    if (userErrors?.length) throw new Error(userErrors.map((e) => e.message).join('; '));
    return draftOrder;
  }

  // Shopify signs each webhook body with the app's client secret (base64 HMAC-SHA256)
  isWebhookValid(rawBody: Buffer, hmac: string): boolean {
    if (!this.cfg?.clientSecret || !rawBody || !hmac) return false;
    const expected = Buffer.from(createHmac('sha256', this.cfg.clientSecret).update(rawBody).digest('base64'));
    const given = Buffer.from(hmac);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  isOurShop(domain: string): boolean {
    return !!domain && domain.toLowerCase() === (this.cfg?.storeDomain || '').toLowerCase();
  }

  // Makes sure the store sends "order paid" to our webhook URL (creates it once; safe to repeat)
  async ensureOrdersPaidWebhook(uri: string): Promise<'exists' | 'created'> {
    const found = await this.gql<{ webhookSubscriptions: { nodes: { id: string; uri: string }[] } }>(
      `{ webhookSubscriptions(first: 50, topics: [ORDERS_PAID]) { nodes { id uri } } }`
    );
    if (found.webhookSubscriptions.nodes.some((w) => w.uri === uri)) return 'exists';
    const data = await this.gql<{ webhookSubscriptionCreate: { userErrors: { message: string }[] } }>(
      `mutation create($uri: String!) {
        webhookSubscriptionCreate(topic: ORDERS_PAID, webhookSubscription: { uri: $uri, format: JSON }) {
          webhookSubscription { id }
          userErrors { message }
        }
      }`,
      { uri }
    );
    const errs = data.webhookSubscriptionCreate.userErrors;
    if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
    return 'created';
  }

  async getDraftOrder(id: string): Promise<IShopifyDraftOrder | null> {
    const data = await this.gql<{ draftOrder: IShopifyDraftOrder }>(
      `query get($id: ID!) { draftOrder(id: $id) { ${DRAFT_FIELDS} } }`,
      { id }
    );
    return data.draftOrder;
  }
}
