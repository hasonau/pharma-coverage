import { Queue } from 'bullmq';
import { redisConnection } from '../db/redisConnection.js';


const emailQueue = new Queue("emailQueue", {
    connection: redisConnection,
});


export { emailQueue };