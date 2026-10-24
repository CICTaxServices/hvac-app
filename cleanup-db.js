const { Pool } = require('pg');

// Your Render database connection string
const connectionString = 'postgresql://hvac_user:AB9nW4v6LdDdEAK3dQt7N2a7h8K7dGud@dpg-db9ranlg1s2s739p5rkg-a.oregon-postgres.render.com/hvac_db_2en6';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function cleanupDatabase() {
  const client = await pool.connect();

  try {
    console.log('🧹 Starting database cleanup...\n');

    // Delete in order (respecting foreign key constraints)
    console.log('1. Deleting activity logs...');
    await client.query('DELETE FROM activity_logs WHERE ticket_id IN (SELECT id FROM tickets)');

    console.log('2. Deleting billing records...');
    await client.query('DELETE FROM billing WHERE ticket_id IN (SELECT id FROM tickets)');

    console.log('3. Deleting price assignments...');
    await client.query('DELETE FROM price_assignments WHERE ticket_id IN (SELECT id FROM tickets)');

    console.log('4. Deleting work logs...');
    await client.query('DELETE FROM work_logs WHERE ticket_id IN (SELECT id FROM tickets)');

    console.log('5. Deleting all tickets...');
    await client.query('DELETE FROM tickets');

    // Verify
    const ticketResult = await client.query('SELECT COUNT(*) as count FROM tickets');
    const userResult = await client.query('SELECT COUNT(*) as count FROM users');

    console.log('\n✅ Cleanup complete!');
    console.log(`   Tickets remaining: ${ticketResult.rows[0].count}`);
    console.log(`   Users remaining: ${userResult.rows[0].count}`);
    console.log('\n✓ Your database is clean! Only user accounts remain.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDatabase();
