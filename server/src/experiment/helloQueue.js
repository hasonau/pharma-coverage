import { Queue } from 'bullmq';
import { redisClient } from '../db/redisConnection.js';

// Create a new queue instance
const emailQueue = new Queue('emailQueue', {
    connection: redisClient,
});

export { emailQueue };
