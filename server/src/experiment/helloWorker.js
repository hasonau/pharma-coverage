import { Worker } from 'bullmq';
import { redisClient } from '../db/redisConnection.js';

const worker = new Worker(
    'emailQueue',
    async (job) => {
        console.log(`Processing job: ${job.id}`);
        console.log('Job data:', job.data);

        // Simulate work (e.g., sending email, processing data)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(`Job ${job.id} completed`);
    },
    {
        connection: redisClient,
    }
);

worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} has been completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed with error: ${err.message}`);
});
