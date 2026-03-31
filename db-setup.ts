import { spawnSync } from 'child_process';

/**
 * DB Setup Orchestrator
 * Runs migration and seeding in sequence.
 */

function run(command: string, args: string[]) {
  console.log(`🚀 Running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`❌ Command failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

console.log("🏁 Starting full database setup...");

// 1. Run Migration (Idempotent schema setup)
run('npx', ['tsx', 'migrate.ts']);

// 2. Run Seeding (Initial data population)
run('npx', ['tsx', 'seed.ts']);

console.log("✨ Full database setup complete!");
