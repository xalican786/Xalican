// src/index.js — XALICAN v1.0
// Clean boot. Correct workers. Deployer integrated.
// FR Hybrid: organic (mempool/Flashbots) + bootstrap (POL)
// Workers: chains.js (not detector.js), aee.js, mrs7.js

import { Worker }        from 'worker_threads'
import { createServer }  from 'http'
import { ethers }        from 'ethers'
import {
  SAB_SIZE, H, CHAINS, PROP_DEFAULT, BASE_FLASH,
  WORKING_FLASH, AEE_RATIO_DEFAULT, EXECUTOR, TREASURY, SYSTEM, VERSION,
  getPropTarget,
} from './config.js'
import { initDB }              from './db.js'
import { startDeployer }       from './deployer.js'
import { startFRBootstrap }    from './fr_bootstrap.js'
import { startFROrganicSignal }from './fr_organic.js'
import { startTreasury }       from './treasury.js'
import { startDashboard }      from './dashboard.js'

// ── SAB ────────────────────────────────────────────────────────────────────────
export const SAB = new SharedArrayBuffer(SAB_SIZE)
export const HOT = new Float64Array(SAB)
const SIG_C2N    = new Int32Array(SAB, 4080)
const SIG_CTRL   = new Int32Array(SAB, 4088)

// Defaults
HOT[H.PROPELLER]  = PROP_DEFAULT      // P15
HOT[H.FLASH_BASE] = BASE_FLASH        // $70B
HOT[H.EFF_FLASH]  = WORKING_FLASH     // $250B
HOT[H.AEE_RATIO]  = AEE_RATIO_DEFAULT // 99%
HOT[H.AEE_MODE]   = 0                 // FACILITATOR
HOT[H.RESERVE_PCT]= 25                // 25% to reserve

// ── WORKER SPAWNER ────────────────────────────────────────────────────────────
function spawn(file, extra = {}) {
  const w = new Worker(new URL(file, import.meta.url), { workerData: { SAB, ...extra } })
  const tag = file.replace(/.*\//, '').replace('.js', '').toUpperCase()
  w.on('error', e  => console.error(`[${tag}]`, e.message?.slice(0, 100)))
  w.on('exit',  c  => { if (c !== 0) setTimeout(() => spawn(file, extra), 2000) })
  return w
}

// ── BANNER ─────────────────────────────────────────────────────────────────────
function banner() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║   X A L I C A N  —  Sovereign Intelligence Protocol  ║')
  console.log(`║   Version: ${VERSION}  |  Operator: ${EXECUTOR.slice(0, 10)}...            ║`)
  console.log(`║   Treasury: ${TREASURY.slice(0, 14)}...                         ║`)
  console.log(`║   Chains: ${CHAINS.length}  |  Flash: $70B base  |  P15 default     ║`)
  console.log('║   FR Hybrid: organic + bootstrap | deployer active   ║')
  console.log('╚══════════════════════════════════════════════════════╝')
}

// ── MIDNIGHT RESET ────────────────────────────────────────────────────────────
function scheduleMidnight() {
  const now = new Date(), nx = new Date()
  nx.setUTCHours(0, 0, 0, 0); nx.setUTCDate(nx.getUTCDate() + 1)
  setTimeout(() => {
    const daily = [H.DAILY_REV,H.EXEC_TODAY,H.CYCLES_TODAY,H.YIELD_TODAY,
                   H.MRS1,H.MRS2,H.MRS4,H.MRS5,H.MRS7,H.XC_FEES,
                   H.BUNDLES_SOLD,H.BUYER_EXECS,H.AEE_EXECS,H.SYNTH_TODAY,H.NATURAL_TODAY]
    daily.forEach(i => HOT[i] = 0)
    console.log('[BOOT] Midnight reset')
    scheduleMidnight()
  }, nx - now)
}

// ── MEMORY GUARD ──────────────────────────────────────────────────────────────
function memGuard() {
  const mb = process.memoryUsage().heapUsed / 1024 / 1024
  if (mb > 170 && typeof global.gc === 'function') global.gc()
  if (mb > 190) Atomics.store(SIG_CTRL, 0, 9)
}

// ── BOOT ───────────────────────────────────────────────────────────────────────
banner()
await initDB()

// Workers — chains.js replaces detector.js
const chainsW = spawn('./chains.js')
const aeeW    = spawn('./aee.js')
spawn('./mrs7.js')

// Core services
startDeployer(SAB)            // compiles + deploys contracts when POL arrives
startFRBootstrap(SAB)         // monitors POL + treasury inflow, updates HOT
startFROrganicSignal()        // mempool + Flashbots broadcast for organic buyers
startTreasury(HOT)
startDashboard(SAB, CHAINS.filter(c => c.id !== 0), aeeW)

// Uptime counter
setInterval(() => HOT[H.UPTIME]++, 1000)
scheduleMidnight()
setInterval(memGuard, 5000)

// Health endpoint for Railway
createServer((req, res) => {
  if (req.url !== '/health') { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    ok: true, system: SYSTEM, uptime: HOT[H.UPTIME]|0,
    propeller: HOT[H.PROPELLER], rev: HOT[H.DAILY_REV],
    treasury: HOT[H.TREASURY], reserve: HOT[H.RESERVE],
    aeeMode: HOT[H.AEE_MODE], contracts: HOT[H.CONTRACTS]|0,
    firstRev: HOT[H.FIRST_REV] === 1,
    mb: process.memoryUsage().heapUsed/1024/1024|0,
  }))
}).listen(3001).on('error', () => {})

process.on('uncaughtException',  e => console.error('[BOOT]', e.message?.slice(0, 120)))
process.on('unhandledRejection', r => console.error('[BOOT]', String(r).slice(0, 120)))
process.on('SIGTERM', () => process.exit(0))

console.log(`[BOOT] ${SYSTEM} operational :${process.env.PORT || 3000} | Send ${0.1} POL to deploy contracts`)
