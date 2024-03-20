//  session create response
//  {
//   id: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//   createdAt: '2024-03-15T11:25:04.728Z',
//   updatedAt: '2024-03-15T11:25:04.847Z',
//   mode: 'payment',
//   paymentMethodTypes: ['wallet'],
//   paymentSetting: {
//     allowedChains: [
//       {
//         chainId: 80001,
//         blacklistCurrencies: null
//       }
//     ],
//     paymentMethodTypes: ['wallet'],
//     preferredChainId: 80001,
//     allowSwap: true
//   },
//   customerCreation: 'if_required',
//   customerUpdate: null,
//   submitType: 'pay',
//   afterCompletion: 'redirect',
//   organizationId: '67c330b9-ed9d-446b-b402-2c9bfbade850',
//   amountTotal: '1000',
//   amountSubtotal: '1000',
//   currency: 'matic',
//   paymentLinkId: null,
//   subscriptionId: null,
//   invoiceId: null,
//   allowPromotionCodes: false,
//   expiresAt: '2024-03-15T12:25:04.750Z',
//   customerId: null,
//   clientReferenceId: null,
//   successUrl:
//     'https://copperx.io/success?cid=6c9ab90c-8274-4dfa-a0fc-99b7a6c47acd',
//   cancelUrl: null,
//   status: 'open',
//   paymentStatus: 'unpaid',
//   metadata: null,
//   nameCollection: false,
//   emailCollection: false,
//   phoneNumberCollection: false,
//   shippingAddressCollection: false,
//   billingAddressCollection: false,
//   customFields: {},
//   afterCompletionConfirmMsg: null,
//   shippingDetails: {},
//   billingDetails: {},
//   url: 'https://buy.copperx.dev/payment/checkout-session/8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//   customerDetails: {
//     address: {}
//   },
//   lineItems: {
//     object: 'list',
//     data: [
//       {
//         description: null,
//         quantity: 1,
//         price: {
//           id: '183689e9-56b7-4248-b6e9-b5a2341d9729',
//           createdAt: '2024-03-15T11:25:04.738Z',
//           updatedAt: '2024-03-15T11:25:04.738Z',
//           billingScheme: 'per_unit',
//           currency: 'matic',
//           productId: 'faec80d3-4096-4a3e-85ef-b1913951690a',
//           interval: null,
//           intervalCount: null,
//           usageType: null,
//           type: 'one_time',
//           unitAmount: '1000',
//           unitAmountDecimal: null,
//           customUnitMax: null,
//           customUnitMin: null,
//           customPreset: null,
//           customUnitAmountSuggestions: null,
//           product: {
//             id: 'faec80d3-4096-4a3e-85ef-b1913951690a',
//             createdAt: '2024-03-15T11:25:04.729Z',
//             updatedAt: '2024-03-15T11:25:04.747Z',
//             name: 'Basic',
//             description: 'For early stage projects who are getting started',
//             isActive: true,
//             images: [],
//             unitLabel: null,
//             url: null,
//             metadata: null,
//             defaultPriceId: '183689e9-56b7-4248-b6e9-b5a2341d9729',
//             visibility: 20
//           },
//           metadata: null,
//           isActive: true,
//           visibility: 20
//         }
//       }
//     ]
//   },
//   addresses: [
//     {
//       id: '5d648898-3738-4b74-8897-d15c32710c9e',
//       createdAt: '2024-03-15T11:25:04.847Z',
//       updatedAt: '2024-03-15T11:25:04.847Z',
//       checkoutSessionId: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//       asset: {
//         id: '50f61211-e0af-4314-8666-0c2d8bf16126',
//         name: 'MATIC',
//         address: '0x0000000000000000000000000000000000000000',
//         chainId: 80001,
//         currency: 'matic',
//         symbol: 'MATIC',
//         decimals: 18,
//         coingeckoId: 'matic-network',
//         isPublic: true,
//         superToken: {
//           address: '0x96b82b65acf7072efeb00502f45757f254c2a0d4',
//           symbol: 'MATICx',
//           decimals: 18
//         },
//         chain: {
//           id: 80001,
//           name: 'Polygon Mumbai',
//           icon: 'icon',
//           currency: 'matic',
//           blockExplorerName: 'Polygonscan',
//           blockExplorerTransactionUrl:
//             'https://mumbai.polygonscan.com/tx/{hash}',
//           type: 'evm'
//         }
//       },
//       paymentAddress: '0x5bdfd8d28b1e50aedf69a319919f19ab81f72896'
//     },
//     {
//       id: '85e933e3-26fe-4eb4-8345-8a7f35bfc46d',
//       createdAt: '2024-03-15T11:25:04.847Z',
//       updatedAt: '2024-03-15T11:25:04.847Z',
//       checkoutSessionId: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//       asset: {
//         id: '1f6ceb43-de1e-425d-ab40-2a139eb32482',
//         name: 'BUSD',
//         address: '0xfdeb3bf847c0c7f07b32976a1bbf76d7b52d6360',
//         chainId: 80001,
//         currency: 'busd',
//         symbol: 'BUSD',
//         decimals: 18,
//         coingeckoId: 'binance-usd',
//         isPublic: true,
//         chain: {
//           id: 80001,
//           name: 'Polygon Mumbai',
//           icon: 'icon',
//           currency: 'matic',
//           blockExplorerName: 'Polygonscan',
//           blockExplorerTransactionUrl:
//             'https://mumbai.polygonscan.com/tx/{hash}',
//           type: 'evm'
//         }
//       },
//       paymentAddress: '0x462b6bdf86c3cea386ad124049526f72f8d8f760'
//     },
//     {
//       id: '8cdd415c-226d-40b2-9a2e-c91904081cde',
//       createdAt: '2024-03-15T11:25:04.847Z',
//       updatedAt: '2024-03-15T11:25:04.847Z',
//       checkoutSessionId: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//       asset: {
//         id: '94e98c19-2a6c-4c6a-b925-92a557d8d631',
//         name: 'WBTC',
//         address: '0x9c39cbb8defcbf2997e9ff8c3ede57dd0734f41b',
//         chainId: 80001,
//         currency: 'btc',
//         symbol: 'WBTC',
//         decimals: 8,
//         coingeckoId: 'bitcoin',
//         isPublic: true,
//         chain: {
//           id: 80001,
//           name: 'Polygon Mumbai',
//           icon: 'icon',
//           currency: 'matic',
//           blockExplorerName: 'Polygonscan',
//           blockExplorerTransactionUrl:
//             'https://mumbai.polygonscan.com/tx/{hash}',
//           type: 'evm'
//         }
//       },
//       paymentAddress: '0x7eb886a2a34d7fe5331a0ff6f33923f792e452e7'
//     },
//     {
//       id: 'c8420a11-31b8-4ac6-9bde-57446d009182',
//       createdAt: '2024-03-15T11:25:04.847Z',
//       updatedAt: '2024-03-15T11:25:04.847Z',
//       checkoutSessionId: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//       asset: {
//         id: '1fc37950-768e-46e4-9658-98a8188723f3',
//         name: 'USDT',
//         address: '0xba569eae6fb2c233815174501b0e1210dc940b64',
//         chainId: 80001,
//         currency: 'usdt',
//         symbol: 'USDT',
//         decimals: 6,
//         coingeckoId: 'tether',
//         isPublic: true,
//         chain: {
//           id: 80001,
//           name: 'Polygon Mumbai',
//           icon: 'icon',
//           currency: 'matic',
//           blockExplorerName: 'Polygonscan',
//           blockExplorerTransactionUrl:
//             'https://mumbai.polygonscan.com/tx/{hash}',
//           type: 'evm'
//         }
//       },
//       paymentAddress: '0xa9e6937c609ac305f10c284ea4c08c07ff711c2c'
//     },
//     {
//       id: '8f253f02-fce9-47ac-a3b9-d1b8d968b6bb',
//       createdAt: '2024-03-15T11:25:04.847Z',
//       updatedAt: '2024-03-15T11:25:04.847Z',
//       checkoutSessionId: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//       asset: {
//         id: 'ebbc5597-0ab0-4ecb-96bd-717b838a26e1',
//         name: 'DAI',
//         address: '0x0c39f2e66ab07f8ddae0620d3328ea8c54ad236b',
//         chainId: 80001,
//         currency: 'dai',
//         symbol: 'DAI',
//         decimals: 18,
//         coingeckoId: 'dai',
//         isPublic: true,
//         chain: {
//           id: 80001,
//           name: 'Polygon Mumbai',
//           icon: 'icon',
//           currency: 'matic',
//           blockExplorerName: 'Polygonscan',
//           blockExplorerTransactionUrl:
//             'https://mumbai.polygonscan.com/tx/{hash}',
//           type: 'evm'
//         }
//       },
//       paymentAddress: '0x45301b709b36f78a5ddfc69bdf9a0d7b7255e110'
//     },
//     {
//       id: 'cbb77f87-0c20-4a2f-8a71-94eff8c0250f',
//       createdAt: '2024-03-15T11:25:04.847Z',
//       updatedAt: '2024-03-15T11:25:04.847Z',
//       checkoutSessionId: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//       asset: {
//         id: '9cebf370-8a11-4523-84bf-ed755ed7eac7',
//         name: 'BNB',
//         address: '0x7786a7736f0b6c28da112f88c740196e642ffe86',
//         chainId: 80001,
//         currency: 'bnb',
//         symbol: 'BNB',
//         decimals: 18,
//         coingeckoId: 'binancecoin',
//         isPublic: true,
//         chain: {
//           id: 80001,
//           name: 'Polygon Mumbai',
//           icon: 'icon',
//           currency: 'matic',
//           blockExplorerName: 'Polygonscan',
//           blockExplorerTransactionUrl:
//             'https://mumbai.polygonscan.com/tx/{hash}',
//           type: 'evm'
//         }
//       },
//       paymentAddress: '0x83022cedb0fb32544451c1e8368222f475140d22'
//     },
//     {
//       id: '27c98317-da2c-4a47-8368-a8a5a9181284',
//       createdAt: '2024-03-15T11:25:04.847Z',
//       updatedAt: '2024-03-15T11:25:04.847Z',
//       checkoutSessionId: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//       asset: {
//         id: '2a24097c-2653-4bda-b5f4-8c86c368b70f',
//         name: 'ETH',
//         address: '0x92f4cd5bd2f46f73e32336bf9399c61cd846078b',
//         chainId: 80001,
//         currency: 'eth',
//         symbol: 'ETH',
//         decimals: 18,
//         coingeckoId: 'ethereum',
//         isPublic: true,
//         chain: {
//           id: 80001,
//           name: 'Polygon Mumbai',
//           icon: 'icon',
//           currency: 'matic',
//           blockExplorerName: 'Polygonscan',
//           blockExplorerTransactionUrl:
//             'https://mumbai.polygonscan.com/tx/{hash}',
//           type: 'evm'
//         }
//       },
//       paymentAddress: '0x7475e3eb5f8f01ae17cebedd6fad590f5126c998'
//     },
//     {
//       id: 'c8bc0062-4204-4025-9a7b-8ce5a62266f8',
//       createdAt: '2024-03-15T11:25:04.847Z',
//       updatedAt: '2024-03-15T11:25:04.847Z',
//       checkoutSessionId: '8b64a7e8-de1c-4e20-b69b-bc78274e17ce',
//       asset: {
//         id: 'a60c79d2-7f9f-4b03-a597-85e7432edb5f',
//         name: 'USDC.e',
//         address: '0x953ecae2e3c8ee8723fef049de53666d7126dde9',
//         chainId: 80001,
//         currency: 'usdc',
//         symbol: 'USDC',
//         decimals: 6,
//         coingeckoId: 'usd-coin',
//         isPublic: true,
//         superToken: {
//           address: '0x6d691bd589cc175714a85bbd528b96c011a24fe6',
//           symbol: 'CXUSDCx',
//           decimals: 18
//         },
//         chain: {
//           id: 80001,
//           name: 'Polygon Mumbai',
//           icon: 'icon',
//           currency: 'matic',
//           blockExplorerName: 'Polygonscan',
//           blockExplorerTransactionUrl:
//             'https://mumbai.polygonscan.com/tx/{hash}',
//           type: 'evm'
//         }
//       },
//       paymentAddress: '0xdc30d2cfca85704ce58b24c5e7d8d7b7b3cc4522'
//     }
//   ],
//   paymentIntent: {
//     id: 'd7f02186-b7b9-43da-af03-889dd1a298a9',
//     createdAt: '2024-03-15T11:25:04.728Z',
//     updatedAt: '2024-03-15T11:25:04.762Z',
//     organizationId: '67c330b9-ed9d-446b-b402-2c9bfbade850',
//     amount: null,
//     amountReceived: null,
//     currency: null,
//     status: 'requires_payment_method',
//     paymentMethodId: null,
//     paymentMethodTypes: ['wallet'],
//     description: null,
//     transferAccountAddress: null,
//     canceledAt: null,
//     cancellationReason: null,
//     isMarkRefunded: null,
//     markRefundedAt: null,
//     markRefundedComment: null,
//     transactions: []
//   },
//   isMarkRefunded: null,
//   discounts: [],
//   amountDetails: {
//     amountTotal: '1000',
//     amountSubtotal: '1000',
//     currency: 'matic',
//     amountDiscount: '0',
//     amountTax: '0',
//     discountAmounts: [],
//     taxAmounts: []
//   }
// };

export interface ICustomerCreateRequest {
  name: string;
  email: string;
  customerReferenceId: string;
}

export interface ICustomerCreateResponse {
  id: string;
  name: string;
  email: string;
}

export interface ICheckoutCreateRequest {
  customerId: string;
  successUrl: string;
  cancelUrl: string;
  lineItems: {
    data: {
      priceData: {
        currency: string;
        unitAmount: string;
        productData: {
          name: string;
          description: string;
        };
      };
    }[];
  };

  clientReferenceId?: string;
}

export interface ICheckoutCreateResponse {
  url: string;
  id: string;
}

export interface IWebhookPayload {
  id: string;
  apiVersion: string;
  created: number;
  object: string;
  type: 'checkout_session.completed';
  data: {
    object: {
      id: string;
      createdAt: string;
      updatedAt: string;
      mode: string;
      paymentMethodTypes: string[];
      customerCreation: string | null;
      customerUpdate: string | null;
      submitType: string;
      afterCompletion: string;
      organizationId: string;
      amountTotal: string;
      amountSubtotal: string;
      currency: string;
      paymentLinkId: string | null;
      subscriptionId: string | null;
      invoiceId: string | null;
      allowPromotionCodes: boolean;
      expiresAt: string;
      customerId: string | null;
      clientReferenceId: string | null;
      successUrl: string;
      cancelUrl: string | null;
      status: string;
      paymentStatus: string;
      metadata: any | null;
      nameCollection: boolean;
      emailCollection: boolean;
      phoneNumberCollection: boolean;
      shippingAddressCollection: boolean;
      billingAddressCollection: boolean;
      customFields: Record<string, any>;
      afterCompletionConfirmMsg: string | null;
      shippingDetails: Record<string, any>;
      billingDetails: Record<string, any>;
      url: string;
      paymentIntent: {
        id: string;
        createdAt: string;
        updatedAt: string;
        organizationId: string;
        amount: string;
        amountReceived: string;
        currency: string;
        status: string;
        paymentMethodId: string;
        paymentMethodTypes: string[];
        description: string | null;
        transferAccountAddress: string;
        canceledAt: string | null;
        cancellationReason: string | null;
        isMarkRefunded: string | null;
        markRefundedAt: string | null;
        markRefundedComment: string | null;
      };
    };
  };
}
