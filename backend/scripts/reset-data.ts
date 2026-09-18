import { promises as fs } from 'fs';
import path from 'path';

/**
 * Reset data to seed state
 * Useful for testing and resetting the demo
 */
async function resetData() {
  try {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    const seedDir = path.join(dataDir, 'seed');

    console.log('Resetting data to seed state...');

    // Files to reset from seed
    const filesToReset = [
      'customers.json',
      'bookings.json',
      'booking-segments.json',
      'policies.json',
      'policy-rules.json',
    ];

    for (const file of filesToReset) {
      const seedFile = path.join(seedDir, file);
      const dataFile = path.join(dataDir, file);

      try {
        const seedContent = await fs.readFile(seedFile, 'utf-8');
        await fs.writeFile(dataFile, seedContent, 'utf-8');
        console.log(`✓ Reset ${file}`);
      } catch (error) {
        console.error(`✗ Failed to reset ${file}:`, error);
      }
    }

    // Clear runtime data files
    const runtimeFiles = [
      'conversations.json',
      'messages.json',
      'actions.json',
      'escalations.json',
      'audit-events.json',
      'action-policy-references.json',
    ];

    for (const file of runtimeFiles) {
      const filePath = path.join(dataDir, file);
      await fs.writeFile(filePath, '[]', 'utf-8');
      console.log(`✓ Cleared ${file}`);
    }

    console.log('✓ Data reset complete');
  } catch (error) {
    console.error('Failed to reset data:', error);
    process.exit(1);
  }
}

resetData();
