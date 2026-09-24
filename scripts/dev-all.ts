/**
 * Pixel Distributor - Unified Local Dev Orchestrator
 *
 * Launches:
 * 1. Central Backend API Server (Port 5001)
 * 2. Plan B: Admin Web Control Centre (Port 3000)
 * 3. Dealer Web/PWA App & Download Portal (Port 3001)
 */

import { spawn } from 'child_process';
import * as path from 'path';

console.log('================================================================');
console.log('   PIXEL DISTRIBUTOR — LOCAL SYSTEM ORCHESTRATOR');
console.log('================================================================');
console.log('Starting services...');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 1. Backend Server
const backend = spawn(isWin ? 'npx.cmd' : 'npx', ['tsx', 'backend/src/index.ts'], {
  stdio: 'inherit',
  shell: true,
});

// 2. Admin Web Centre
const admin = spawn(npmCmd, ['run', 'dev', '--workspace=@pixel/admin'], {
  stdio: 'inherit',
  shell: true,
});

// 3. Dealer Web / PWA
const dealer = spawn(npmCmd, ['run', 'dev', '--workspace=@pixel/dealer-web'], {
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\nShutting down all services...');
  backend.kill();
  admin.kill();
  dealer.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
