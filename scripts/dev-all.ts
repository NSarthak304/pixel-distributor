/**
 * Pixel Distributor - Plan A: Local System Orchestrator
 *
 * Launches:
 * 1. Central Backend API Server (Port 5001)
 * 2. Dealer Chameleon Web / PWA App (Port 3001)
 *
 * Administration:
 * Master Excel File: excel/templates/Pixel_Distributor_Admin.xlsx
 * Push to Cloud: npm run sync:push
 * Pull from Cloud: npm run sync:pull
 */

import { spawn } from 'child_process';

console.log('================================================================');
console.log('   PIXEL DISTRIBUTOR — PLAN A: EXCEL-FIRST & FIREBASE PLATFORM');
console.log('================================================================');
console.log('• Admin Mode: 100% Excel-First (excel/templates/Pixel_Distributor_Admin.xlsx)');
console.log('• Cloud Backend: Google Cloud Firestore (pixel-distributor)');
console.log('• Dealer Access: Chameleon PWA / Web (http://localhost:3001)');
console.log('• Sync Commands: npm run sync:push | npm run sync:pull');
console.log('================================================================');
console.log('Starting services...');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 1. Central Backend Server
const backend = spawn(isWin ? 'npx.cmd' : 'npx', ['tsx', 'backend/src/index.ts'], {
  stdio: 'inherit',
  shell: true,
});

// 2. Dealer Chameleon Web / PWA
const dealer = spawn(npmCmd, ['run', 'dev', '--workspace=@pixel/dealer-web'], {
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\nShutting down services...');
  backend.kill();
  dealer.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
