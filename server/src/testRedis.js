import { redisClient } from './db/redisConnection.js';

const testRedis = async () => {
    try {
        const pong = await redisClient.ping();
        console.log('Redis ping response:', pong);
    } catch (err) {
        console.error('Redis ping failed:', err);
    } finally {
        redisClient.quit(); // close connection
    }
};

testRedis();
