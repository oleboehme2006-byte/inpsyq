export const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'ole',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'inpsyq',
    },
    app: {
        mockMode: process.env.MOCK_MODE === 'true',
    }
};
