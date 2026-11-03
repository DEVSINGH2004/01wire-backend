# 01 Wire Dashboard: Handover (flow, payments, going live)

_Prepared 03 Nov 2026 for a senior developer and their AI assistant. It covers the whole dashboard flow, where each payment option stands, what is needed to take payments live, and how to get each key, click by click._

> **Note for an AI assistant reading this:** treat this file as the map and the code as the truth. The repos are listed in §1. Never ask for keys or passwords in chat. Keys go only into the hosting settings (Render) or a local `.env` that is never committed.

---

## 0. Summary

| Item | State today |
|---|---|
| Dashboard (users and admins) | **Live** and in daily use |
| Paying for a PR with **01Wire Credits** (wallet) | **Live**. This is the only payment method working end to end today |
| **Razorpay** (pay the full PR amount in ₹) | **Built and tested against a fake Razorpay, but hidden.** It switches on as soon as 3 keys are added on Render. Needs the company's Razorpay account (business PAN / KYC) |
| **CopperX** (buy credit packs on *My Credits*) | **Older code, not verified by us.** Its return links point to `app.01wire.com`, which is not the current site |
| **Shopify** checkout | **Not built.** A plan is ready (§5.4). Needs a Shopify app's Client ID and Secret |

---

## 1. Where things are

| What | Where |
|---|---|
| Frontend (React, MUI, Apollo) | Repo `01wire-frontend`, branch **`task/dev-singh`**, hosted on **Vercel**: https://01wire-frontend.vercel.app |
| Backend (NestJS, GraphQL, MongoDB) | Repo `01wire-be`, branch **`task/dev-singh`**, hosted on **Render**: https://zero1wire-backend.onrender.com/graphql |
| Database | MongoDB Atlas, database `01wire`. **The same database is used locally and live, so a local test writes to live data.** |
| Images / logos | `https://api.01wire.com/public/...` (a separate upload host) |

**Deploying:** pushing to `task/dev-singh` deploys automatically (Render for the backend, Vercel for the frontend). If the frontend needs a backend change, push the backend first.

**Test accounts:**
- Admin: `qa-e2e-admin@example.com`
- User: `qa-deep-user@example.com`

Ask the developer for the passwords; they are not written here. Mark anything you create while testing with `[QA-E2E]` so it can be cleaned up. Wrong passwords several times in a row lock the account for about 1 minute (this is intended).

---

## 2. How the dashboard works

### 2.1 Signing in (same page for users and admins)
1. Enter your work email and click **Next**. The server checks the email:
   - **Account exists:** a password box appears. Click **Submit**. Admins land on **Manage Orders**; users land on the **Dashboard**.
   - **New email:** a sign-up form (name and password) appears. Click **Sign up**. The person then confirms with a 4-digit email code (OTP).
   - **Email not verified:** a code is sent and the OTP screen opens.
2. Every mistake shows a clear message, e.g. "Incorrect email or password" or "Can't reach the server".
3. The role (USER or ADMIN) is saved in the browser. Admins see an **Admin** badge next to the account icon. The server checks the role on every admin request, so the badge itself grants nothing.

### 2.2 User side (sidebar: Dashboard, Press Releases, Clients, My Credits, Marketplace, My Estimates)
- **Dashboard:** quick actions (Add Client, Add PR), counts of PRs by status, and a preview of the Marketplace.
- **Clients:** the companies a user writes PRs for (name, type, industry, logo, social links).
- **Marketplace:**
  - *Publications* tab: 718 websites, which are 1,163 options because one site can have several (e.g. Hindi, Do-follow). It has filters, sorting, **Add**, and **Details**.
  - *Packages* tab: 77 ready-made PR packages. The 8 "★ Popular" ones are listed first.
  - Picked items appear in a bottom bar ("1 selected · Total 40 credits"). From there the user can **Save Estimate** or **Continue to Add PR**.
- **My Estimates:** saved selections. Each one has a public share link (`/share-estimation/<id>`) and a **Create PR** button.
- **Press Releases:** the list of the user's PRs, plus the PR form in 4 steps:
  1. **Add Press Release:** client, title, image, location, contact, content.
  2. **Category & Media:** the publications and packages chosen in the Marketplace.
  3. **Plan & Payment:** **Proceed to Payment** opens `/releases/<id>/payment`.
  4. **Review & Publish.**
- **PR payment page** (`/releases/<id>/payment`):
  - Shows the order summary and the payment methods.
  - Today the only method is **01Wire Credits**. If the balance is too low it says "You need N credits more" and offers **Add Credits**.
  - After payment, the PR goes to review and one **order** is created per publication (one order per package).
- **My Credits:** the wallet balance, the credit history (+ credits in green, − debits in red), and "Buy $100 / $500 / $1000 / $5000" packs. Those packs use **CopperX** (§5.3).
- **Public pages (no login needed):** shared estimate, article preview (`/share-release/<id>`), and the distribution report (`/download-report/<id>`).

**PR statuses:** Draft → Submitted → Review → Awaiting Approval / Scheduled → Published or Rejected. A rejected PR shows the admin's comments.

### 2.3 Admin side (sidebar: Manage Orders, Manage Articles, Manage Users, Publications, Packages)
- **Manage Orders:** one row per publication per PR.
  - *Update status* opens a dialog to **Publish** (with the live URL or notes) or **Reject**.
  - *Release status* gives a template upload/download.
  - *Order details* shows the order.
  - *Open article* opens the article.
- **Manage Articles:** every PR, with its status and a review page that has a status change.
- **Manage Users:** users and admins (admins carry an **Admin** tag), wallet balance, *Update wallet* (add or remove credits), and *View user's PRs*.
- **Publications:** the price list behind the Marketplace.
  - Each option has a **vendor price in ₹** (admin only, never shown to clients).
  - It has **Pricing settings** (default markup, GST and USD→INR rate), **Import** (CSV or JSON), and bulk Publish / Hide / Set markup / Delete.
- **Packages:** the 77 PR packages, with their media list, vendor price and ★ Popular order. A live package can only change its Popular setting; any other edit needs it set to Suppressed first.

### 2.4 Pricing rule (credits; $1 = 1 credit)
```
credits = ceil( vendor ₹ × (1 + markup 45%) × (1 + GST 18%) ÷ 95.62 )
e.g. ₹2,200 → ₹3,190 → ₹3,764.20 → 39.37 → 40 credits
```
- Settings today: markup **45%**, GST **18%**, **₹95.62 per credit**.
- An audit on 03 Nov 2026 found all 1,163 publications and all 77 packages priced correctly.
- Known small bug: the "Last updated" time in Pricing settings changes whenever the settings are *read*, not only when they are saved. The values themselves don't change.

---

## 3. How a payment works (money → credits → PR)

```
User picks media ─▶ PR (Draft) ─▶ Payment page
                                   ├─ 01Wire Credits (LIVE): wallet debited ─▶ PR submitted, orders created
                                   └─ Razorpay (HIDDEN until keys):
                                        createRazorpayOrder(articleId)  → backend creates a Razorpay order
                                                                          for credits × ₹95.62 (full PR amount)
                                        Razorpay Checkout popup (card / UPI / netbanking)
                                        verifyRazorpayPayment(...)      → backend checks signature, amount and
                                                                          "captured" with Razorpay
                                        → credits added to the wallet ─▶ same debit + submit step as above
                                        webhook POST /payment/razorpay/webhook (payment.captured / order.paid)
                                          = backup if the browser closes. Each payment is claimed once, so the
                                            browser and the webhook can't both add credits.
                                        If submitting the PR fails, the credits stay in the wallet.
My Credits "Buy $N" ─▶ CopperX checkout (new tab) ─▶ CopperX webhook ─▶ wallet credited
```
- The Razorpay code lives in `01wire-be/src/core/payment/razorpay/`: `razorpay.service.ts`, `razorpay.controller.ts` (webhook), `graphql/razorpay.resolver.ts` (`paymentMethods`, `createRazorpayOrder`, `verifyRazorpayPayment`, `razorpayPaymentStatus`). Payment attempts are stored in the `payment_orders` collection.
- The CopperX code lives in `01wire-be/src/core/payment/` (`payment.service.ts`, `providers/copperx`). Its webhook is `POST /payment/copperx/webhook`, with the header `X-Webhook-Token`.
- The frontend payment page is `01wire-fe/src/layouts/pages/releases/payment/index.tsx`. It only shows Razorpay when the backend's `paymentMethods` query says it is set up.

---

## 4. Taking Razorpay live: what's needed

| Setting (on Render) | Where it comes from | Required? |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → API Keys (`rzp_test_…` for test, `rzp_live_…` for live) | Yes |
| `RAZORPAY_KEY_SECRET` | Shown **once**, when the key is generated | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | A strong random text you choose, typed into the Razorpay webhook form and into Render (they must match) | Yes, for the webhook |
| `RAZORPAY_API_URL` | Only for local tests against a fake Razorpay. **Leave it empty on Render.** | No |

**Business requirement:** live Razorpay needs an **activated account**, meaning KYC with a **business PAN**, a bank account, business details and website policies. The developer doesn't have a PAN, so this must be the **company's** Razorpay account. Test-mode keys can be made before KYC is finished.

### 4.1 Razorpay test keys, click by click
1. Go to https://dashboard.razorpay.com and sign in with the company account.
2. At the top, switch the mode to **Test Mode**.
3. Open **Account & Settings** (gear icon), then **API Keys**. In some dashboards it is under *Website and app settings → API keys*.
4. Click **Generate Test Key**.
5. Copy the **Key ID** and **Key Secret**, or click **Download Key Details**. The secret is shown only once.
6. Still in Test Mode, go to **Account & Settings → Webhooks → + Add New Webhook**:
   - **Webhook URL:** `https://zero1wire-backend.onrender.com/payment/razorpay/webhook`
   - **Secret:** type a long random text. You'll paste the same text into Render as `RAZORPAY_WEBHOOK_SECRET`.
   - **Active events:** tick **`payment.captured`** and **`order.paid`**.
   - Click **Create Webhook**.

### 4.2 Put the keys on Render, click by click
1. Go to https://dashboard.render.com and open the **zero1wire-backend** service.
2. Open **Environment** in the left menu, then **Add Environment Variable**. Add:
   - `RAZORPAY_KEY_ID` = the Key ID
   - `RAZORPAY_KEY_SECRET` = the Key Secret
   - `RAZORPAY_WEBHOOK_SECRET` = the same text as in the webhook form
3. Click **Save Changes**. Render redeploys by itself, which takes a few minutes.
4. Check it: log in as a test user, open a Draft PR, click **Proceed to Payment**. **Razorpay** should now appear next to 01Wire Credits.
5. Pay with Razorpay's **test** card or UPI (e.g. `success@razorpay`). Check that the PR moved to review, the credits went in and out once, and the payment shows in Razorpay → Transactions → Payments.

### 4.3 Switching to real money
1. Finish **Account Activation** in Razorpay (KYC). Razorpay emails when it's approved.
2. Switch the top toggle to **Live Mode**, then **API Keys → Generate Live Key** and copy both values.
3. In Live Mode, add the **same webhook** again (URL, secret, the two events). Live and test webhooks are separate.
4. On Render, replace the 2 key values with the live ones (and the webhook secret, if you chose a new one). Save.
5. Make one small real payment, check it, and refund it from Razorpay if needed.

---

## 5. The other payment options

### 5.1 01Wire Credits (wallet): live
Nothing to set up. Admins can add or remove credits in **Manage Users → Update wallet**.

### 5.2 Razorpay
See §4.

### 5.3 CopperX (credit packs on *My Credits*): older code, not verified
- **Needs (Render):** `COPPERX_SECRET_KEY` and `COPPERX_WEBHOOK_SECRET_KEY`. These are required for the backend to start, so some values already exist on Render. Whether they are real, working keys has not been checked.
- **Where to get them:** the CopperX dashboard (https://copperx.io): Developers / API keys for the secret key, and Webhooks for the webhook secret. Add a webhook endpoint `https://zero1wire-backend.onrender.com/payment/copperx/webhook`.
- **Needs fixing before use:**
  - The return links are hard-coded to `https://app.01wire.com/payment-success` and `/payment-failed` (`01wire-be/src/config/index.ts`). They should point to the real frontend address.
  - The non-production backend calls `api.copperx.dev` (sandbox); production calls `api.copperx.io`.
- **Test:** log in as the test user, go to My Credits, click Buy $100, pay in the CopperX sandbox, and check that the wallet goes up once.

### 5.4 Shopify checkout: planned, not built
- **Plan:** "Pay with Shopify" on the PR payment page.
  1. The backend creates a Shopify **draft order** (one line, the full PR amount).
  2. The user pays on Shopify's checkout page.
  3. The backend confirms payment by checking Shopify, with an "order paid" webhook as backup, then adds credits and submits the PR, using the same safeguards as Razorpay.
  4. It stays hidden until the keys are set.
- **Needs (Render):** `SHOPIFY_STORE_DOMAIN` (e.g. `<store>.myshopify.com`), `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`. These names are proposed, because the code isn't written yet.
- **Getting the keys, click by click.** Since January 2026, Shopify apps are made in the **Dev Dashboard**, not inside the store admin.
  1. In the store admin, go to **Settings → General → Store defaults** and note the **currency** (INR or USD).
  2. For tests, go to **Settings → Payments → Add payment method → Bogus Gateway → Activate**. Its test card is name "Bogus Gateway", number `1` (success) or `2` (fail).
  3. Go to https://dev.shopify.com/dashboard, signed in with the account that owns the store, then **Apps → Create app → Start from Dev Dashboard**. Name it (e.g. "01 Wire Payments") and click **Create**.
  4. On the **Versions** page:
     - App URL: leave the default.
     - Webhooks API version: pick the newest.
     - **Scopes:** `write_draft_orders`, `read_orders`.
     - Click **Release**.
  5. **Install app**, choose the store, then **Install**.
  6. The app's **Settings** page shows the **Client ID** and **Client secret**. Put them on Render, not in chat.
  - The backend gets a 24-hour token from these itself (Shopify's "client credentials" flow).
  - If Shopify says `shop_not_permitted`, the store and the app are in different Shopify organisations. Create the test store from **Dev Dashboard → Dev stores** instead.

---

## 6. Open items

1. **Razorpay:** get keys from the company account, do a test-mode payment, then go live (§4).
2. **CopperX:** confirm the keys, fix the return links, test in the sandbox (§5.3).
3. **Shopify:** decide the currency (INR, or USD with credits × $1) and build it (§5.4).
4. Pricing settings "Last updated" changes on every read (backend `getSettings` uses an update-on-read). This is a small fix.
5. Smaller pending items: a Shopify-style package detail page (on hold), the Forgot Password flow, and cleaning up `[QA-DEEP]` / `[QA-E2E]` test data.

## 7. Rules for anyone working on this
- Local tests use the **live database**. Only touch data marked `[QA-E2E]` or `[QA-DEEP]`, and never real users' data.
- Deletes are **soft deletes** (`deletedAt`), so they can be undone. Clean up the same way.
- Vendor prices, vendor names and internal notes are **admin only**. They must never reach clients.
- Keys and passwords go in Render or a local `.env` only. Never commit them, and never paste them in chat.
