import { Queue } from 'bullmq';
import { redisConnection } from '../db/redisConnection.js';


const conflictQueue = new Queue("conflictQueue", {
    connection: redisConnection,
});


export { conflictQueue };