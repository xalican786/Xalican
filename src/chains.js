// src/chains.js — XALICAN swap detector
// Uses ALUCARD's proven WS connection pattern — same architecture that produces
// the clean logs: [CHAINS] arb-mainnet ✓
// 19 EVM chains. Solana excluded (different protocol).
// Each chain fully isolated — one failure never affects others.
// Alchemy only — no public RPC fallback.

import { workerData }    from 'worker_threads'
import { ethers }        from 'ethers'
import {
  EVM_CHAINS, SWAP_SIG, MIN_SWAP_USD, H,
} from './config.js'

const { SAB }   = workerData
const HOT       = new Float64Array(SAB)
const SIG_C2N   = new Int32Array(SAB, 4080)
const RING      = new Float64Array(SAB, 2048, 128)

let ringHead = 0

function writeRing(flash, profit) {
  const slot       = (ringHead++) % 64
  RING[slot * 2]     = flash
  RING[slot * 2 + 1] = profit
  Atomics.add(SIG_C2N, 0, 1)
  HOT[H.NATURAL_TODAY]++
}

// ── DECODE SWAP AMOUNT ────────────────────────────────────────────────────────
// Uniswap V3 Swap event: amount0 is first int256 in data (bytes 0-31)
function decodeSwapAmount(data) {
  if (!data || data.length < 66) return 0
  try {
    const hex = data.slice(2, 66)
    const raw = BigInt('0x' + hex)
    // int256 — check sign bit
    const MAX_INT256 = BigInt('0x8000000000000000000000000000000000000000000000000000000000000000')
    const val = raw >= MAX_INT256 ? raw - (BigInt(2) ** BigInt(256)) : raw
    const abs = val < 0n ? -val : val
    // USDC has 6 decimals, ETH has 18 — approximate USD value
    // For USDC pairs: divide by 1e6. For ETH pairs: divide by 1e18 * ~2500
    // Quick heuristic: if abs > 1e24 it is likely an ETH amount
    if (abs > BigInt(1e24)) {
      return Number(abs / BigInt(1e15)) * 2500 / 1e3  // ETH * $2500 approx
    }
    return Number(abs) / 1e6  // USDC
  } catch { return 0 }
}

// ── CONNECT ONE CHAIN — isolated, auto-reconnect ──────────────────────────────
function connectChain(chain, idx) {
  let provider    = null
  let retryMs     = 1000
  let retries     = 0

  async function connect() {
    try {
      provider = new ethers.WebSocketProvider(chain.ws)

      provider.websocket.on('error', () => {
        drop()
      })

      provider.websocket.on('close', () => {
        if (HOT[H.UPTIME] > 5) drop()  // ignore close during first 5s startup
      })

      // Subscribe to Uniswap V3 Swap events
      await provider.on({ topics: [SWAP_SIG] }, (log) => {
        HOT[70 + idx] = 1  // chain active

        const amountUSD = decodeSwapAmount(log.data)
        if (amountUSD < MIN_SWAP_USD) return

        // Calculate flash needed and apparent profit
        const flashNeeded   = Math.min(amountUSD * 2.5, 250e9)
        const apparentProfit = Math.min(amountUSD * 0.01, 1e6)

        writeRing(flashNeeded, apparentProfit)
      })

      // Gas price update every 60s using same provider
      setInterval(async () => {
        try {
          const fee = await provider.getFeeData()
          if (fee?.gasPrice) HOT[50 + idx] = Number(fee.gasPrice) / 1e9
        } catch {}
      }, 60_000 + idx * 100)  // stagger to avoid simultaneous calls

      HOT[70 + idx] = 1
      retryMs = 1000
      retries = 0
      console.log(`[CHAINS] ${chain.name} connected`)

    } catch (e) {
      const msg = String(e.message || '')
      if (msg.includes('401') || msg.includes('403')) {
        console.error(`[CHAINS] ${chain.name} — API key rejected. Check Alchemy key.`)
        // Do not retry on auth failure — key is wrong, not transient
        HOT[70 + idx] = 0
        return
      }
      if (retries < 3) console.warn(`[CHAINS] ${chain.name} — retrying (${retryMs}ms)`)
      retries++
      drop()
    }
  }

  function drop() {
    HOT[70 + idx] = 0
    if (provider) {
      try { provider.destroy() } catch {}
      provider = null
    }
    setTimeout(connect, Math.min(retryMs, 30000))
    retryMs = Math.min(retryMs * 2, 30000)
  }

  // Stagger connection by 200ms per chain to avoid rate limiting
  setTimeout(connect, idx * 200)
}

// ── CONNECT ALL 19 EVM CHAINS ─────────────────────────────────────────────────
EVM_CHAINS.forEach((chain, idx) => connectChain(chain, idx))

console.log(`[CHAINS] Connecting ${EVM_CHAINS.length} EVM chains | Alchemy only | Solana excluded from EVM subscriptions`)
