const AWS = require('aws-sdk');
const { Client } = require('pg');

// Retrieve the secret from AWS Secrets Manager
const getSecret = async (secretName, regionName) => {
    const secretsManager = new AWS.SecretsManager({ region: regionName });
    
    try {
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        if (data.SecretString) {
            return JSON.parse(data.SecretString);  // Return the secret as a JSON object
        } else {
            const buff = Buffer.from(data.SecretBinary, 'base64');
            return JSON.parse(buff.toString('ascii'));  // Return the decoded binary secret as a JSON object
        }
    } catch (error) {
        console.error(`Error retrieving secret: ${error.message}`);
        throw error;
    }
};

// List tables in the PostgreSQL database
const listTables = async (secret) => {
    const client = new Client({
        host: secret.host,
        user: secret.username,
        password: secret.password,
        database: secret.database,
        port: secret.port,
    });

    try {
        await client.connect();

        // Query to get all tables in the public schema
        const res = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log("Tables in the database:");
        res.rows.forEach(row => {
            console.log(row.table_name);
        });
    } catch (err) {
        console.error(`Error connecting to database: ${err.message}`);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
};

// Main function to retrieve the secret and list tables
const main = async () => {
    const secretName = 'your_secret_name';  // Replace with your secret name
    const regionName = 'your_region_name';  // Replace with your region name
    
    try {
        const secret = await getSecret(secretName, regionName);
        await listTables(secret);
    } catch (error) {
        console.error('Error:', error.message);
    }
};

main();
