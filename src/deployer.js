// src/deployer.js — XALICAN autonomous contract deployer
// Compiles xalican.sol using solc, deploys to Polygon when POL detected
// Injects contract address into running process — no manual env vars needed
// Persists addresses to /data/contracts.json across Railway restarts
// Imported ONLY by index.js. Zero dependencies on other src files.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createRequire } from 'module'
import { ethers }        from 'ethers'
import { EXECUTOR_WALLET, EXECUTOR, TREASURY, CHAINS, CONTRACT, H, POL_THRESHOLD } from './config.js'

const require       = createRequire(import.meta.url)
const CONTRACTS_PATH = '/data/contracts.json'
const CONTRACT_FILE  = './contracts/xalican.sol'

// ── POLYGON PROVIDER (deployment chain) ───────────────────────────────────────
const POL_CHAIN  = CHAINS.find(c => c.id === 137)
const provider   = new ethers.JsonRpcProvider(POL_CHAIN.http)
const signer     = EXECUTOR_WALLET.connect(provider)

// ── COMPILE xalican.sol ───────────────────────────────────────────────────────
function compile() {
  console.log('[DEPLOYER] Compiling xalican.sol...')
  const solc   = require('solc')
  const source = readFileSync(CONTRACT_FILE, 'utf8')

  const input = JSON.stringify({
    language: 'Solidity',
    sources:  { 'xalican.sol': { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  })

  const output = JSON.parse(solc.compile(input))

  if (output.errors) {
    const fatal = output.errors.filter(e => e.severity === 'error')
    if (fatal.length > 0) throw new Error('Compilation failed: ' + fatal[0].message)
  }

  const contract = output.contracts['xalican.sol']['Xalican']
  if (!contract) throw new Error('Contract "Xalican" not found in compiled output')

  const abi      = contract.abi
  const bytecode = '0x' + contract.evm.bytecode.object

  console.log('[DEPLOYER] Compilation successful | bytecode:', (bytecode.length / 2 - 1), 'bytes')
  return { abi, bytecode }
}

// ── DEPLOY TO POLYGON ─────────────────────────────────────────────────────────
async function deploy(abi, bytecode, HOT) {
  console.log('[DEPLOYER] Deploying Xalican contract to Polygon...')

  const factory   = new ethers.ContractFactory(abi, bytecode, signer)
  const contract  = await factory.deploy(TREASURY, { gasLimit: 2_000_000 })
  const receipt   = await contract.deploymentTransaction().wait(1)
  const address   = await contract.getAddress()

  console.log('[DEPLOYER] Xalican deployed:', address)

  // Inject into running process immediately — no Railway redeploy needed
  process.env.XALICAN_POLYGON = address
  CONTRACT.XALICAN_POLYGON    = address

  // Persist to disk — survives Railway restarts
  const data = loadPersisted()
  data.XALICAN_POLYGON = address
  data.deployedAt      = Date.now()
  data.txHash          = receipt.hash
  savePersisted(data)

  HOT[H.CONTRACTS] = (HOT[H.CONTRACTS] || 0) + 1
  console.log('[DEPLOYER] Address persisted to', CONTRACTS_PATH)
  return address
}

// ── PERSIST CONTRACT ADDRESSES ────────────────────────────────────────────────
function loadPersisted() {
  try {
    if (existsSync(CONTRACTS_PATH)) return JSON.parse(readFileSync(CONTRACTS_PATH, 'utf8'))
  } catch {}
  return {}
}

function savePersisted(data) {
  try {
    if (!existsSync('/data')) mkdirSync('/data', { recursive: true })
    writeFileSync(CONTRACTS_PATH, JSON.stringify(data, null, 2))
  } catch (e) { console.error('[DEPLOYER] Failed to persist:', e.message) }
}

function loadExisting(HOT) {
  const data = loadPersisted()
  if (data.XALICAN_POLYGON) {
    process.env.XALICAN_POLYGON = data.XALICAN_POLYGON
    CONTRACT.XALICAN_POLYGON    = data.XALICAN_POLYGON
    HOT[H.CONTRACTS]            = Object.keys(data).filter(k => k.startsWith('XALICAN') || k === 'SPLITTER').length
    console.log('[DEPLOYER] Loaded existing contracts from', CONTRACTS_PATH)
    console.log('[DEPLOYER] Xalican Polygon:', data.XALICAN_POLYGON)
    return true
  }
  return false
}

// ── SIGNAL AEE EXECUTOR MODE ──────────────────────────────────────────────────
function signalAEE(SAB) {
  const SIG_CTRL = new Int32Array(SAB, 4088)
  Atomics.store(SIG_CTRL, 0, 1)
  console.log('[DEPLOYER] AEE EXECUTOR mode signal sent')
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export function startDeployer(SAB) {
  const HOT = new Float64Array(SAB)

  // Check for previously deployed contracts first
  if (loadExisting(HOT)) {
    signalAEE(SAB)
    console.log('[DEPLOYER] System ready — contracts already deployed')
    return
  }

  // Pre-compile at boot so deployment is instant when POL arrives
  let compiled = null
  try {
    compiled = compile()
    console.log('[DEPLOYER] Pre-compilation complete — waiting for', POL_THRESHOLD, 'POL at', EXECUTOR)
  } catch (e) {
    console.error('[DEPLOYER] Pre-compilation failed:', e.message)
    return
  }

  // Poll for POL balance every 500ms
  let deploying = false
  const iv = setInterval(async () => {
    if (deploying) return
    try {
      const bal    = await provider.getBalance(EXECUTOR)
      const polBal = Number(ethers.formatEther(bal))

      if (polBal >= POL_THRESHOLD) {
        deploying = true
        clearInterval(iv)
        HOT[H.BOOTSTRAP] = 1
        console.log(`[DEPLOYER] ${polBal.toFixed(4)} POL detected — deploying contracts`)

        const address = await deploy(compiled.abi, compiled.bytecode, HOT)
        signalAEE(SAB)
        console.log('[DEPLOYER] READY — send qualifying swap or wait for detection')
      }
    } catch (e) {
      if (process.env.DEBUG) console.error('[DEPLOYER] Poll error:', e.message?.slice(0, 80))
      deploying = false
    }
  }, 500)

  console.log('[DEPLOYER] Watching for', POL_THRESHOLD, 'POL at:', EXECUTOR)
}
