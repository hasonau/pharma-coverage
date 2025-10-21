import dotenv from 'dotenv';
import Redis from 'ioredis';
dotenv.config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redisClient.on('ready', () => console.log('Redis client ready'));
redisClient.on('error', (err) => console.error('Redis error', err));

export { redisClient };

