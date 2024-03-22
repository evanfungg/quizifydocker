
// import { Pool } from 'pg';

// const pool = new Pool({
//   user: process.env.PGUSER,
//   host: process.env.PGHOST,
//   database: process.env.PGDATABASE,
//   port: process.env.PGPORT,
  
// });

// const connectToPostgreSQL = async () => {
//   try {
    
//     const client = await pool.connect();
//     await client.query('SELECT NOW()'); 
//     console.log('Connected to PostgreSQL');
//     return client; 
//   } catch (error) {
//     console.error('Error connecting to PostgreSQL:', error);
//     throw error;
//   }
// };

// export default connectToPostgreSQL;


import { Pool } from 'pg';

const connectionString = 'postgresql://quizify_owner:************@ep-spring-truth-a664l9yu.us-west-2.aws.neon.tech/quizify?sslmode=require';

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false 
  }
});

const connectToPostgreSQL = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()'); 
    console.log('Connected to PostgreSQL');
    return client; 
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    throw error;
  }
};

export default connectToPostgreSQL;
