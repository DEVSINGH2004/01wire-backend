# Claude Fixes Log

Source: `01Wire-QA-Audit-2026-10-21.docx`. Fixes applied in severity order.

## Progress

| Step | Severity | Findings | Status | Date |
|---|---|---|---|---|
| 1 | Critical | OLD-1, OLD-2 (+ allow-list bypass found during fix) | ✅ Done | 2026-10-22 |
| 2 | High | OLD-3, OLD-6, BE-1, BE-3, BE-6, FE-1/CU-1, CU-2 (+ BE-4, BE-9, BE-13, BE-15, FE-4, CU-11 fixed along the way) | ✅ Done | 2026-10-22 |
| 3 | Medium-High | CU-12, BE-7, CU-7 (+ CU-8, CU-10 and the same id check in article create/update) | ✅ Done | 2026-10-22 |
| 4 | Medium / Low | rest (minus those already fixed above) | ⏳ Pending | — |

---

## Step 1 — Critical: public article/estimate leak

**Root cause:** `getArticleById` and `getEstimateById` are in the public `allowedOperations` list (`src/config/index.ts`) for the `/share-release/:id` and `/share-estimation/:id` pages. When no token is sent, the context sets `me: null` and the resolvers returned everything, including DRAFTs and the owner's email/fullName.

**Extra hole found:** the allow-list only checked the *first* top-level field of the query. An anonymous caller could put `getArticleById` first and add any other field after it, and the whole request ran with `me: null`.

**Decision (user-approved):** keep share links public, but harden them. Anonymous viewers see any article past DRAFT.

| # | File | Change | Fixes |
|---|---|---|---|
| 1 | `src/common/graphql/graphql.module.ts` | Collect **all** top-level fields of all operations; anonymous access only if **every** field is in `allowedOperations`. Fragments never match. | Allow-list bypass |
| 2 | `src/core/article/services/article.service.ts` | `getById`: anonymous caller + `DRAFT` article → `null` | OLD-1 (drafts) |
| 3 | `src/core/article/graphql/article.resolver.ts` | `user` field → `null` for anonymous; new `userId` field resolver → `null` for anonymous | OLD-1 (owner email/name) |
| 4 | `src/core/article/graphql/type/article.type.ts` | `userId` made nullable (required for #3) | OLD-1 |
| 5 | `src/core/estimate/graphql/estimate.resolver.ts` | `getEstimateById`: logged-in `USER` only gets own estimate (admins all, anonymous allowed); new `userId` field resolver → `null` for anonymous | OLD-2 |
| 6 | `src/core/estimate/graphql/type/estimate.type.ts` | `userId` made nullable (required for #5) | OLD-2 |

**Unchanged:** logged-in user/admin results; share pages need no frontend change (they don't request `user`/`userId`).

### Verification run (local, port 7788)

| Test | Expected | Result |
|---|---|---|
| Anonymous `getArticleById` on a DRAFT | `null` | ✅ `null` |
| Anonymous `getEstimateById` | data returned, `userId: null` | ✅ |
| Anonymous bypass: `getEstimateById` + `filterPublicationsPaginated` in one query | rejected | ✅ "authorization token not found" |
| Anonymous `login` (public op) still reachable | normal response | ✅ |
| `npx tsc --noEmit` | no errors | ✅ |
| Anonymous `getArticleById` on a non-DRAFT article | data, `user: null`, `userId: null` | ⚠️ Not run — no non-DRAFT article in local DB |

### Known limits / follow-ups

| Item | Note |
|---|---|
| Logged-in customer opening *another* customer's share link | Gets "not found" (articles already behaved this way; estimates now match). Anonymous viewing works. Revisit if this matters. |
| `clientInfo` (company email/website/socials) still public on share-release | Left as-is: the PR is about that company. |
| Share links are still guessable-UUID based, no expiry | Signed expiring tokens = future hardening (needs FE change). |
| `filterOrdersPaginated` is public when `articleId` is given | Returns orders of any article (incl. drafts' orphan orders). ✅ Fixed in Step 2. |
| Error is still HTTP 500 + raw text | That's BE-2 (Medium), fixed later. |

---

## Step 2 — High

**User decisions:** new publications default to `PUBLISHED`; wallets can never go below 0 (admins included); orphan-order script = list-only; frontend `.env` left untouched.

### Backend (`01wire-be`)

| Finding | Root cause | Fix | File(s) |
|---|---|---|---|
| **OLD-3** order without payment | Submit emitted the "create order" event *before* debiting; a failed debit left a PENDING order | New `_submitDraft`: validate (≥1 publication/bundle, credits > 0) → atomically claim DRAFT→SUBMITTED (blocks double submit) → debit → create orders directly (awaited). Debit fails → back to DRAFT. Orders fail → delete orders + refund + back to DRAFT | `article/services/article.service.ts`, `order/services/order.service.ts` (`deletePendingByArticleId`) |
| OLD-3 (cleanup crash) | Reject/upload on an order whose article is deleted → `Cannot read properties of null` | Null-check → clean `article not found` | `order/services/order.service.ts` |
| OLD-3 (existing orphans) | — | Read-only report script | `scripts/find-orphan-orders.js` |
| **BE-15** (Medium) wallet negative | `new BadRequestException(...)` missing `throw`; check and update were separate | Debit is one atomic `updateOne({balance ≥ amount}, $inc)` → `Insufficient credits balance` | `wallet/services/wallet.service.ts` |
| **BE-9** (Medium) wallet TypeError | No null check on wallet lookup | `wallet not found` (400) | `wallet/services/wallet.service.ts` |
| **OLD-6** hidden publications | Schema default `SUPPRESSED` | Default `PUBLISHED`; customers get `null` for a non-PUBLISHED `getPublicationById` (admin unchanged). Existing records untouched | `publication/publication.schema.ts`, `publication/graphql/publication.resolver.ts` |
| **BE-1** signup half-fails | AWS SES email send threw after user insert | Already removed by commit `0fb4af2` (no email step). No change; verified by reading `auth.service.ts` `signup` | — |
| **BE-3** negative page → Mongo error | No bounds on pagination input | Zod: `currentPage` int ≥ 0, `perPage` int ≥ 1 → clean 400. Also fixes **BE-4** (perPage 0) and **BE-13** (negative perPage) | `common/dto/pagination.input.dto.ts` |
| **BE-6** `ordersInfo` always errors | Resolver returned the *client* (copy-paste) | Returns the article's orders (`[]` if none) | `article/graphql/article.resolver.ts`, `order/services/order.service.ts` (`getByArticleId`) |
| Step-1 follow-up | Anonymous `filterOrdersPaginated(articleId)` returned orders of any article | Anonymous only for existing, non-DRAFT articles | `order/services/order.service.ts` |
| **CU-2** (backend half) | Backend saved uploads but never served them | `app.useStaticAssets(uploadDir, { prefix: '/public/' })` + `nosniff` + CSP sandbox (blocks scripts in uploaded SVGs) | `src/main.ts` |

### Frontend (`01wire-fe`)

| Finding | Root cause | Fix | File(s) |
|---|---|---|---|
| **FE-1 / CU-1** no nav below 1200px | Navbar's hamburger button was removed (`handleMiniSidenav` unused) | ☰ button shown below `xl`, toggles drawer. Drawer already auto-closes on route change | `examples/Navbars/DashboardNavbar/index.tsx` |
| FE-1 / CU-1 page overflow | Filter rows: fixed widths (252/130/300px), no wrapping | Rows `flexWrap` + `gap`; fields `100%` on `xs` | `orders`, `pr-management`, `releases` → `components/Filters.tsx` |
| **CU-2 / FE-4 / CU-11** broken images | Uploads go to hard-coded `api.01wire.com`, images read from `REACT_APP_IMAGE_BASE_URL` (different host in prod); some stored values start with `public/` | New `getImageUrl()` builds from the **upload host** and strips leading `public/`; all 6 image call sites use it. Upload host now `REACT_APP_API_URL` (optional, default `https://api.01wire.com` = no behaviour change) | `utils/apiConfig.ts` (new), `utils/axiosInstance.js`, `DisplayImage`, `MDEditor`, `clients/makeColumns.js`, `publishedOrder`, `ComplexProjectCard`, `PublicationsList` |

### Verification run

| Test | Expected | Result |
|---|---|---|
| `currentPage: -1` | clean 400 `currentPage must be >= 0` | ✅ |
| `perPage: 0` | clean 400 `perPage must be >= 1` | ✅ |
| Normal pagination | unchanged | ✅ |
| `getArticleById { ordersInfo }` | `[]` (no error) | ✅ |
| Submit DRAFT for a user with no wallet (forced failure) | error, PR stays DRAFT, 0 orders | ✅ `wallet not found`, DRAFT, `[]` |
| `updateWalletBalance` unknown userId | clean 400 | ✅ `wallet not found` |
| Anonymous `filterOrdersPaginated` on a DRAFT article | rejected | ✅ 401 |
| Customer `getPublicationById` on PUBLISHED | returned | ✅ |
| `GET /public/<file>` on local API | 200 + security headers | ✅ |
| Orphan script on local DB | runs, read-only | ✅ 0 PENDING orders (local DB ≠ audited prod DB) |
| Playwright: 11 routes × 375/768px | ☰ visible, no horizontal scroll | ✅ all (was 836–932px on 3 pages) |
| Playwright: tap ☰ at 375px | drawer slides in | ✅ x −246 → 74 |
| Playwright: image requests | 200 | ✅ `api.01wire.com/public/...` |
| `tsc --noEmit` BE + FE | no errors | ✅ |
| Successful submit (debit + orders) | — | ⚠️ Not run: would debit real credits — see manual check |

### Known limits / follow-ups

| Item | Note |
|---|---|
| Not a true DB transaction | Rollback is compensating (refund + revert). A crash *between* debit and rollback could still leave a debit with no order — far narrower than before. Full Mongo transactions = bigger refactor. |
| Render disk is temporary | Files uploaded to the Render backend vanish on redeploy. Uploads currently go to `api.01wire.com` (not Render), so unaffected until `REACT_APP_API_URL` is pointed at Render. Long-term: Cloudinary/S3. |
| `REACT_APP_IMAGE_BASE_URL` no longer used | Safe to delete from `.env`/hosting env later. |
| Bundles still default to `SUPPRESSED` | Same pattern as OLD-6 but not in the audit; left as-is. |
| Local frontend → Render backend | Local UI does not use local backend fixes until `REACT_APP_GRAPHQL_SERVER_URL` points at `http://localhost:7788/graphql`. |
| Removed dead code | Commented-out legacy order-building block in `updateStatus` deleted while restructuring submit. |
| Pre-existing lint errors | `article.service.ts`, `main.ts`, `orders/Filters.tsx` were not Prettier-clean before; left unformatted to keep the diff small. |

---

## Step 3 — Medium-High

**User decisions:** keep client soft delete (old PRs still show their client); `summary` + `featureImage` required in the API; include CU-10 + the same check in article create/update; QA-TEST records allowed in the local DB.

| Finding | Root cause | Fix | File(s) |
|---|---|---|---|
| **CU-12** deleted client blocks its title | Soft-delete plugin hides deleted docs from `find`/`findOne` only; title check uses `countDocuments` | Title checks (create + update) add `deletedAt: null` | `client/services/client.service.ts` |
| **CU-12** deleted client still readable by id | `delete()` never cleared the Redis loader cache (every other write does) | `cleanCacheById` after soft delete | `client/services/client.service.ts` |
| **BE-7** createArticle schema says optional | `ArticleCreateInput` inherits nullable `summary`/`featureImage` from `ArticleType`; Zod requires them | Both `String!` on `ArticleCreateInput` only (output type + update unchanged) | `article/graphql/input/article.create.input.ts` |
| **CU-7** createEstimate schema says optional | `PartialType` made all fields optional; Zod requires all three | `title: String!`; id lists optional, default `[]`; ≥1 publication or bundle required | `estimate/graphql/input/estimate.create.input.ts`, `estimate/dto/estimate.create.bulk.dto.ts` |
| **CU-8** (Medium) customer orders need articleId | Service asserted `articleId` for customers | Optional: no `articleId` → all of the caller's own orders | `order/services/order.service.ts` |
| **CU-10** (Low) estimate accepts unknown publication | `loadMany` returns `null` placeholders, so the length check always passes | Reject if any loaded entry is `null` → `Invalid publication Ids` / `Invalid bundle Ids` | `estimate/services/estimate.service.ts` |
| CU-10 pattern in articles | Same length-only check; unknown id crashed on `null.visibility` (500) | Same null check in `create` and `update` | `article/services/article.service.ts` |

Frontend: no change needed. `createArticle` / `createEstimate` pass the whole `$params: …Input!` object, and the wizard always sends `summary`, `featureImage` and `title`.

### Verification run (local, user token)

| Test | Expected | Result |
|---|---|---|
| create → delete → `getClientById` | `null` | ✅ |
| Recreate same client title after delete | succeeds | ✅ (was "already exists") |
| `createArticle` without summary/featureImage | schema error up front | ✅ `required type "String!" was not provided` |
| `createArticle` with unknown publication id | `Invalid publication Ids`, nothing created | ✅ |
| `updateArticle` with unknown publication id | `Invalid publication Ids`, draft unchanged | ✅ (was a 500) |
| `createEstimate` without title | schema error | ✅ |
| `createEstimate` title only, no ids | validation error | ✅ `Validation failed` (detail: select at least one) |
| `createEstimate` unknown publication id | `Invalid publication Ids` | ✅ |
| `createEstimate` with publicationIds, no bundleIds | succeeds | ✅ (`totalCredits: 200`) |
| Customer `filterOrdersPaginated` without articleId | succeeds, own orders only | ✅ |
| `tsc --noEmit` | no errors | ✅ |

**Test data left behind:** two soft-deleted clients titled `QA-TEST SoftDelete Repro` (deleted state, invisible to the app; soft delete keeps the row by design). The test estimate was hard-deleted.

### Known limits / follow-ups

| Item | Note |
|---|---|
| `createArticle` ignores price | Publications passed to `createArticle` are stored but `totalCredits` stays 0; only `updateArticle` calculates it. UI is unaffected (wizard sets publications via update). Since Step 2, such a PR can't be submitted until it's updated. Candidate: compute credits on create, or recompute at submit. |
| Other `countDocuments` calls | Only client title checks were missing `deletedAt: null`; publication/bundle checks already filter. Plugin itself unchanged. |
