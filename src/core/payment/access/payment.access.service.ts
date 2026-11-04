import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigVariablesType } from 'src/config';
import { UserService } from 'src/core/user/services/user.service';

export const PAYMENTS_NOT_OPEN = "Online payments aren't available for your account yet. You can pay with 01Wire Credits.";

// Who may pay real money (Razorpay / Shopify / CopperX credit packs).
// PAYMENT_ALLOWED_USERS: comma-separated emails, or "*" for everyone (when going live).
//   Not set = nobody. 01Wire Credits (wallet) payments are not affected.
// Test-mode gateways (test keys, development store, test orders) are only ever for the
// emails listed by name - "*" never opens test mode to everyone.
@Injectable()
export class PaymentAccessService {
  private allowAll: boolean;
  private emails: Set<string>;

  constructor(
    configService: ConfigService<ConfigVariablesType>,
    private userService: UserService
  ) {
    const raw = configService.get('paymentAllowedUsers', { infer: true }) || '';
    const list = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    this.allowAll = list.includes('*');
    this.emails = new Set(list.filter((e) => e !== '*'));
  }

  private async emailOf(userId: string): Promise<string | null> {
    if (!userId) return null;
    const user: any = await this.userService.load(userId).catch(() => null);
    return user?.email ? String(user.email).toLowerCase() : null;
  }

  // May this user use a gateway? `testMode` = the gateway runs on test keys / a test store.
  async canPay(userId: string, testMode: boolean): Promise<boolean> {
    const email = await this.emailOf(userId);
    if (!email) return false;
    if (this.emails.has(email)) return true;
    return this.allowAll && !testMode;
  }

  async assertCanPay(userId: string, testMode: boolean) {
    if (!(await this.canPay(userId, testMode))) throw new ForbiddenException(PAYMENTS_NOT_OPEN);
  }
}
