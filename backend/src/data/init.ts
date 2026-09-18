import { promises as fs } from 'fs';
import path from 'path';

/**
 * Initialize data layer by copying seed data to runtime data files
 * This ensures the system has the assignment data at startup
 */
export async function initializeData(): Promise<void> {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const seedDir = path.join(dataDir, 'seed');

  // Files to initialize from seed data
  const filesToInit = [
    'customers.json',
    'bookings.json',
    'booking-segments.json',
    'policies.json',
    'policy-rules.json',
  ];

  try {
    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true });

    for (const file of filesToInit) {
      const seedFile = path.join(seedDir, file);
      const dataFile = path.join(dataDir, file);

      try {
        // Check if runtime file already exists
        await fs.access(dataFile);
      } catch {
        // File doesn't exist, copy from seed
        try {
          const seedContent = await fs.readFile(seedFile, 'utf-8');
          await fs.writeFile(dataFile, seedContent, 'utf-8');
          console.log(`✓ Initialized ${file} from seed data`);
        } catch (error) {
          console.warn(`⚠ Could not initialize ${file}: ${(error as Error).message}`);
        }
      }
    }

    // Ensure runtime-only files exist as empty arrays
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
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, '[]', 'utf-8');
        console.log(`✓ Created empty ${file}`);
      }
    }

    console.log('✓ Data layer initialized');
  } catch (error) {
    console.error('Failed to initialize data layer:', error);
    throw error;
  }
}
