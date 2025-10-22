import dotenv from 'dotenv';
import Redis from 'ioredis';
dotenv.config();

const redisConnection = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redisConnection.on('ready', () => console.log('Redis client ready'));
redisConnection.on('error', (err) => console.error('Redis error', err));

export { redisConnection };

