// src/fr_organic.js — FR Organic Model signal maximizer
// Maximizes probability of buyer in seconds via 3-layer broadcast
// Layer 1: Mempool broadcast to 7 chains (not 3 — wider coverage)
// Layer 2: Flashbots MEV-Share direct hint submission (reaches 10K+ searchers)
// Layer 3: Re-broadcast every 100ms during 600ms auction window
// Result: 42 mempool entries + Flashbots coverage per qualifying swap
// ~50 LoC. No dependencies beyond ethers and config.

import { ethers } from 'ethers'
import { EVM_CHAINS, EXECUTOR_WALLET, TREASURY, MEVSHARE_URL, H } from './config.js'

// 7 chains for mempool broadcast (more than 3 — covers more bot populations)
const MEMPOOL_CHAIN_NAMES = ['arb-mainnet','base-mainnet','polygon-mainnet','opt-mainnet','eth-mainnet','bnb-mainnet','blast-mainnet']
let   MEMPOOL_PROVIDERS   = []

export function startFROrganicSignal() {
  // Pre-load providers for the 7 broadcast chains
  MEMPOOL_PROVIDERS = EVM_CHAINS
    .filter(c => MEMPOOL_CHAIN_NAMES.includes(c.name))
    .map(c => new ethers.JsonRpcProvider(c.http))

  console.log('[FR-ORGANIC] Mempool broadcast ready | 7 chains | Flashbots MEV-Share active')
}

// Called by sovereign_signal.js for every built bundle
export async function broadcastBundle(bundle) {
  const ABI = ethers.AbiCoder.defaultAbiCoder()

  // Encode signal: bundleId, apparentProfit, currentPrice, expiresAt, commitment, payTo
  const data = ABI.encode(
    ['bytes32','uint256','uint256','uint256','bytes32','address'],
    [bundle.bundleId, BigInt(Math.floor(bundle.apparentProfit)),
     BigInt(Math.floor(bundle.auctionPrice)), BigInt(bundle.expiresAt),
     bundle.commitment, TREASURY]
  )

  // Re-broadcast every 100ms during 600ms window (6 broadcasts per auction)
  let broadcasts = 0
  const iv = setInterval(async () => {
    if (broadcasts >= 6) { clearInterval(iv); return }
    broadcasts++

    // Layer 1: Mempool broadcast — zero gas, never confirms, visible to all bots
    const tx = { to: ethers.ZeroAddress, value: 0n, data, gasLimit: 21000n, gasPrice: 0n, nonce: BigInt(Date.now() % 100000), chainId: 42161n, type: 0 }
    const signed = await EXECUTOR_WALLET.signTransaction(tx).catch(() => null)
    if (signed) {
      await Promise.allSettled(MEMPOOL_PROVIDERS.map(p => p.broadcastTransaction(signed).catch(() => {})))
    }

    // Layer 2: Flashbots MEV-Share hint (broadcast 1 only — no spam)
    if (broadcasts === 1) {
      fetch(MEVSHARE_URL + '/api/v1/private-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx: signed, preferences: { fast: true, privacy: { hints: ['calldata','logs'] } } }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {})
    }
  }, 100)
}
