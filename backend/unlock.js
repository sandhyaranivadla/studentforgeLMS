const { Pool } = require('pg');
const fs = require('fs');

async function main() {
  const connectionString = 'postgresql://task:1Ui_8StKe7wyI4ldZingVA@okay-mastiff-32707.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full&sslrootcert=C:/Users/padar/AppData/Roaming/postgresql/root.crt';
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync('C:/Users/padar/AppData/Roaming/postgresql/root.crt').toString(),
    },
  });

  const client = await pool.connect();
  try {
    console.log("Unlocking tables...");
    const tables = ['"User"', '"Course"', '"CourseModule"', '"Lesson"', '"Enrollment"', '"LiveSession"', '"Message"'];
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} SET (schema_locked = false);`);
        console.log(`Unlocked ${table}`);
      } catch (e) {
        console.log(`Could not unlock ${table}: ${e.message}`);
      }
    }
  } finally {
    client.release();
    pool.end();
  }
}
main();
