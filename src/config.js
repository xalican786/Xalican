// src/config.js — XALICAN
// All 20 Alchemy keys taken directly from ALUCARD's confirmed working config
// Fake keys replaced. All chains now connect via real Alchemy endpoints.

import { ethers } from 'ethers'

export const SYSTEM    = 'XALICAN'
export const VERSION   = '1.0.0'
export const OPERATOR  = 'Bun Omar SECKA'
export const PORT      = parseInt(process.env.PORT || '3000')
export const DASHBOARD_PIN = (process.env.DASHBOARD_PASSKEY || '3530588')
export const MPKEY     = process.env.MODEMPAY_SECRET_KEY || ''
export const MODEMPAY_REF = 'Xalican Operator: Bun Omar SECKA'
export const USB_VAULT_PIN = '3530588'

// ── WALLETS ────────────────────────────────────────────────────────────────────
export const EXECUTOR_PK = '0x11a016d02b5cdd160dad12f0a5bb11477bd785a036c648e0491a10afd2fbdb3f'
export const EXECUTOR_WALLET = new ethers.Wallet(EXECUTOR_PK)
export const EXECUTOR = EXECUTOR_WALLET.address
export const TREASURY = '0xCCCF1C9A2154750A0D7CceeD51fE0f9b4c1906e8'

// ── FLASH & RESERVE ────────────────────────────────────────────────────────────
export const BASE_FLASH    = 70e9
export const WORKING_FLASH = 250e9
export const PER_EXECUTION = 640e9
export const RESERVE_MAX   = 15e12
export const RESERVE_MIN   = 250e9
export const AEE_RATIO_DEFAULT = 99
export const POL_THRESHOLD = 0.1   // CORRECTED: 0.001 was too low for gas

// ── DEPLOYED CONTRACT ADDRESSES (populated by deployer.js at runtime) ─────────
export const CONTRACT = {
  XALICAN_POLYGON:   process.env.XALICAN_POLYGON   || '',
  XALICAN_ARBITRUM:  process.env.XALICAN_ARBITRUM  || '',
  XALICAN_BASE:      process.env.XALICAN_BASE       || '',
  XALICAN_OPTIMISM:  process.env.XALICAN_OPTIMISM  || '',
  XALICAN_ETHEREUM:  process.env.XALICAN_ETHEREUM  || '',
  SPLITTER:          process.env.SPLITTER           || '',
  XC_TOKEN:          process.env.XC_TOKEN           || '',
}

// ── PROTOCOL ADDRESSES ─────────────────────────────────────────────────────────
export const BALANCER_VAULT = '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
export const AAVE_POOL_POL  = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'
export const NFPM_POLYGON   = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'

// ── USDC ───────────────────────────────────────────────────────────────────────
export const USDC = {
  137:    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  42161:  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  8453:   '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  10:     '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  1:      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
}

// ── SWAP EVENTS ────────────────────────────────────────────────────────────────
export const SWAP_SIG   = '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67'
export const MIN_SWAP_USD = 10_000

// ── SSC CHANNELS ──────────────────────────────────────────────────────────────
export const IPFS_TOPIC    = '/xalican/bundles/v1'
export const BLOXROUTE_URL = 'https://mev.api.bloxroute.com/v1/submit'
export const MEVSHARE_URL  = 'https://relay.flashbots.net'
export const FLASHBOTS_RPC = 'https://rpc.flashbots.net'

// ── SAB HOT LAYOUT ─────────────────────────────────────────────────────────────
export const H = {
  PROPELLER:0, DAILY_REV:1, FLASH_BASE:2, RESERVE:3, CRASH:4,
  TREASURY:5, EXEC_TODAY:6, EXEC_TOTAL:7, UPTIME:8, FIRST_REV:9,
  EFF_FLASH:10, TOTAL_AMP:11, RESERVE_PCT:12, RESERVE_BAL:13,
  MRS7_SYNTH_PCT:14, MRS7_SYNTH_VAL:15, CYCLES_TODAY:16, ETA_MINS:17,
  P100_TARGET:18, YIELD_TODAY:19,
  MRS1:20, MRS2:21, MRS4:22, MRS5:23, MRS7:24, XC_FEES:25,
  BUNDLES_SOLD:26, BUYER_EXECS:27, AEE_EXECS:28, AVG_PAYOUT:29,
  SEARCHER_CNT:30, STAKE_TOTAL:31, MRS7_DEPLOYED:32, SYNTH_TODAY:33, NATURAL_TODAY:34,
  AEE_RATIO:35, AEE_MODE:36, BOOTSTRAP:37, CONTRACTS:38, XC_SUPPLY:39,
  XC_USD:40, XC_GOLD:41, XC_HOLDERS:42, XC_VOL:43,
  CLOAK:44, DARK_POOL:45, BACKUP:46, ORACLE_DEVS:47, PENDING_REV:48, PENDING_RESERVE:49,
}
export const SAB_SIZE = 4096
export const PROP_DEFAULT = 21

// ── PROPELLER TARGET ───────────────────────────────────────────────────────────
export function getPropTarget(lvl) {
  if (lvl <= 0)   return 0
  if (lvl <= 0.1) return 100_000
  if (lvl <= 0.2) return 250_000
  if (lvl <= 0.3) return 500_000
  if (lvl <= 0.4) return 750_000
  if (lvl <= 0.5) return 1e6
  if (lvl <= 1)   return 5e6
  if (lvl <= 2)   return 15e6
  if (lvl <= 3)   return 50e6
  if (lvl <= 4)   return 150e6
  if (lvl <= 5)   return 500e6
  if (lvl <= 7)   return 1e9
  if (lvl <= 9)   return 50e9
  if (lvl <= 11)  return 500e9
  if (lvl <= 14)  return 10e12
  if (lvl <= 17)  return 500e12
  if (lvl <= 20)  return 5e15
  if (lvl <= 21)  return 10e15
  if (lvl <= 23)  return 50e15
  if (lvl <= 26)  return 500e15
  if (lvl <= 27)  return 1e18
  if (lvl <= 30)  return 50e18
  if (lvl <= 33)  return 300e18
  if (lvl <= 36)  return 500e18
  if (lvl >= 100) return Infinity
  return 500e18
}

// ── CHAINS — ALL 20 KEYS FROM ALUCARD (CONFIRMED WORKING) ────────────────────
// 12 keys were wrong in previous config.js — now corrected from ALUCARD source
export const CHAINS = [
  { id:137,    name:'polygon-mainnet',    ws:'wss://polygon-mainnet.g.alchemy.com/v2/CfWwmhym4lH5r7_T7_oU0',    http:'https://polygon-mainnet.g.alchemy.com/v2/CfWwmhym4lH5r7_T7_oU0',    blockMs:2000  },
  { id:42161,  name:'arb-mainnet',        ws:'wss://arb-mainnet.g.alchemy.com/v2/X0nWXU_gGc2Q7P_FrF_tM',        http:'https://arb-mainnet.g.alchemy.com/v2/X0nWXU_gGc2Q7P_FrF_tM',        blockMs:250   },
  { id:8453,   name:'base-mainnet',       ws:'wss://base-mainnet.g.alchemy.com/v2/3aotTt1Kv1x-fWDF7_kab',       http:'https://base-mainnet.g.alchemy.com/v2/3aotTt1Kv1x-fWDF7_kab',       blockMs:2000  },
  { id:10,     name:'opt-mainnet',        ws:'wss://opt-mainnet.g.alchemy.com/v2/sGjcCN-W3Ls8XQNNqSsNn',        http:'https://opt-mainnet.g.alchemy.com/v2/sGjcCN-W3Ls8XQNNqSsNn',        blockMs:2000  },
  { id:1,      name:'eth-mainnet',        ws:'wss://eth-mainnet.g.alchemy.com/v2/jKhd0hz6ZYWaDlacqh_dx',        http:'https://eth-mainnet.g.alchemy.com/v2/jKhd0hz6ZYWaDlacqh_dx',        blockMs:12000 },
  { id:56,     name:'bnb-mainnet',        ws:'wss://bnb-mainnet.g.alchemy.com/v2/6iqYCCQwSTR6b-tJKucS-',        http:'https://bnb-mainnet.g.alchemy.com/v2/6iqYCCQwSTR6b-tJKucS-',        blockMs:3000  },
  { id:43114,  name:'avax-mainnet',       ws:'wss://avax-mainnet.g.alchemy.com/v2/qbhq33J1d5gA1fa2F9oTc',       http:'https://avax-mainnet.g.alchemy.com/v2/qbhq33J1d5gA1fa2F9oTc',       blockMs:2000  },
  { id:81457,  name:'blast-mainnet',      ws:'wss://blast-mainnet.g.alchemy.com/v2/0zddkzYwBs_J7lTLPQJAr',      http:'https://blast-mainnet.g.alchemy.com/v2/0zddkzYwBs_J7lTLPQJAr',      blockMs:2000  },
  { id:324,    name:'zksync-mainnet',     ws:'wss://zksync-mainnet.g.alchemy.com/v2/-2hgPK_0yIugOtz8gd2bN',     http:'https://zksync-mainnet.g.alchemy.com/v2/-2hgPK_0yIugOtz8gd2bN',     blockMs:1000  },
  { id:534352, name:'scroll-mainnet',     ws:'wss://scroll-mainnet.g.alchemy.com/v2/2Hfl39Jdr3cIONf6P6evX',     http:'https://scroll-mainnet.g.alchemy.com/v2/2Hfl39Jdr3cIONf6P6evX',     blockMs:3000  },
  { id:59144,  name:'linea-mainnet',      ws:'wss://linea-mainnet.g.alchemy.com/v2/1orEe9d1Y0Z6pcu0YsUPH',      http:'https://linea-mainnet.g.alchemy.com/v2/1orEe9d1Y0Z6pcu0YsUPH',      blockMs:2000  },
  { id:5000,   name:'mantle-mainnet',     ws:'wss://mantle-mainnet.g.alchemy.com/v2/TjtdcQ2UzexinqajRW1AX',     http:'https://mantle-mainnet.g.alchemy.com/v2/TjtdcQ2UzexinqajRW1AX',     blockMs:2000  },
  { id:100,    name:'gnosis-mainnet',     ws:'wss://gnosis-mainnet.g.alchemy.com/v2/rcXlHBD_ATzcywKP_3yOv',     http:'https://gnosis-mainnet.g.alchemy.com/v2/rcXlHBD_ATzcywKP_3yOv',     blockMs:5000  },
  { id:480,    name:'worldchain-mainnet', ws:'wss://worldchain-mainnet.g.alchemy.com/v2/KYeP7PjTazpg9y1cESm3h', http:'https://worldchain-mainnet.g.alchemy.com/v2/KYeP7PjTazpg9y1cESm3h', blockMs:2000  },
  { id:80094,  name:'berachain-mainnet',  ws:'wss://berachain-mainnet.g.alchemy.com/v2/2dJONPcgoCkGLFULJ1ugZ',  http:'https://berachain-mainnet.g.alchemy.com/v2/2dJONPcgoCkGLFULJ1ugZ',  blockMs:2000  },
  { id:1301,   name:'unichain-mainnet',   ws:'wss://unichain-mainnet.g.alchemy.com/v2/oFFJFW-FxwGOnCaNx21LO',   http:'https://unichain-mainnet.g.alchemy.com/v2/oFFJFW-FxwGOnCaNx21LO',   blockMs:1000  },
  { id:1329,   name:'sei-mainnet',        ws:'wss://sei-mainnet.g.alchemy.com/v2/-vnNUoR-xYBdJc-EVAEtr',        http:'https://sei-mainnet.g.alchemy.com/v2/-vnNUoR-xYBdJc-EVAEtr',        blockMs:400   },
  { id:146,    name:'sonic-mainnet',      ws:'wss://sonic-mainnet.g.alchemy.com/v2/bvVHqI4zTiNSN8Hkx9vqj',     http:'https://sonic-mainnet.g.alchemy.com/v2/bvVHqI4zTiNSN8Hkx9vqj',     blockMs:1000  },
  { id:64165,  name:'sonic-mainnet-2',    ws:'wss://sonic-mainnet.g.alchemy.com/v2/OwN_yxTn0r3jg4KxlqkYJ',     http:'https://sonic-mainnet.g.alchemy.com/v2/OwN_yxTn0r3jg4KxlqkYJ',     blockMs:1000  },
  // Solana: HTTP only — different protocol, not EVM, excluded from WS subscriptions
  { id:0,      name:'solana-mainnet',     ws:null,                                                                 http:'https://solana-mainnet.g.alchemy.com/v2/FOimj4oVe521S4xNZC9FO',     blockMs:400   },
]

// EVM chains only (excludes Solana for eth_subscribe)
export const EVM_CHAINS = CHAINS.filter(c => c.id !== 0 && c.ws !== null)
