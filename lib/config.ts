export const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'inpsyq',
    },
    app: {
        mockMode: process.env.MOCK_MODE === 'true', // Defaults to false, but should be true for this task usually
    }
};
