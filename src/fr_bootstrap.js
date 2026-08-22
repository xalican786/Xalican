// src/fr_bootstrap.js — FR Bootstrap Model monitor
// Monitors POL balance and treasury inflow with 200ms precision
// Updates HOT slots for dashboard visibility
// Works alongside deployer.js — deployer deploys, this reports
// ~50 LoC. Imported by index.js only.

import { ethers } from 'ethers'
import { EXECUTOR, CHAINS, H, POL_THRESHOLD, TREASURY, USDC } from './config.js'

const POL_CHAIN = CHAINS.find(c => c.id === 137)
const provider  = new ethers.JsonRpcProvider(POL_CHAIN.http)

// USDC contract for treasury inflow detection
const USDC_CONTRACT = new ethers.Contract(
  USDC[137],
  ['event Transfer(address indexed from, address indexed to, uint256 value)',
   'function balanceOf(address) view returns (uint256)'],
  provider
)

export function startFRBootstrap(SAB) {
  const HOT = new Float64Array(SAB)

  // Watch for incoming USDC to treasury (organic FR confirmation)
  USDC_CONTRACT.on(USDC_CONTRACT.filters.Transfer(null, TREASURY), (from, to, amount) => {
    const usd = Number(amount) / 1e6
    if (usd < 1) return
    if (HOT[H.FIRST_REV] === 0) {
      HOT[H.FIRST_REV] = 1
      // Signal AEE — organic first revenue received
      const SIG = new Int32Array(SAB, 4088)
      if (Atomics.load(SIG, 0) === 0) Atomics.store(SIG, 0, 1)
      console.log(`[FR-BOOTSTRAP] FIRST REVENUE — $${usd.toFixed(2)} USDC confirmed on-chain`)
      console.log('[FR-BOOTSTRAP] AEE EXECUTOR mode activated — system fully operational')
    }
  })

  // Fast POL balance monitor — 200ms (faster than deployer's 500ms)
  // Provides dashboard-visible status before deployer fires
  let logged = false
  const iv = setInterval(async () => {
    try {
      const bal    = await provider.getBalance(EXECUTOR)
      const polBal = Number(ethers.formatEther(bal))
      HOT[H.BOOTSTRAP] = polBal >= POL_THRESHOLD ? 1 : 0

      if (polBal > 0 && polBal < POL_THRESHOLD && !logged) {
        logged = true
        console.log(`[FR-BOOTSTRAP] ${polBal.toFixed(6)} POL received — need ${POL_THRESHOLD} POL total`)
      }
      if (polBal >= POL_THRESHOLD && HOT[H.CONTRACTS] === 0) {
        clearInterval(iv)
        console.log(`[FR-BOOTSTRAP] ${polBal.toFixed(4)} POL threshold met — deployer activating`)
      }
    } catch {}
  }, 200)

  console.log('[FR-BOOTSTRAP] Watching treasury and executor | organic + bootstrap monitoring active')
}
