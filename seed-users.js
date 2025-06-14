import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function seedUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Hash passwords
    const adminHash = await hashPassword('admin123');
    const teamleadHash = await hashPassword('teamlead123');
    const salesHash = await hashPassword('sales123');
    const writerHash = await hashPassword('writer123');
    const proofHash = await hashPassword('proof123');

    // Update users with properly hashed passwords
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [adminHash, 'superadmin']);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [teamleadHash, 'teamlead1']);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [salesHash, 'sales1']);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [writerHash, 'writer1']);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [writerHash, 'writer2']);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [proofHash, 'proofreader1']);

    console.log('✓ Users seeded successfully with hashed passwords');
    console.log('Login credentials:');
    console.log('- superadmin / admin123');
    console.log('- teamlead1 / teamlead123');
    console.log('- sales1 / sales123');
    console.log('- writer1 / writer123');
    console.log('- writer2 / writer123');
    console.log('- proofreader1 / proof123');
    
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await pool.end();
  }
}

seedUsers();