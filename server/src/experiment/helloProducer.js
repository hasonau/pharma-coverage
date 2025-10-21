import { Queue } from 'bullmq';
import { redisClient } from '../db/redisConnection.js';

const emailQueue = new Queue('emailQueue', {
    connection: redisClient,
});

const addJob = async () => {
    const job = await emailQueue.add('sendEmail', {
        to: 'test@example.com',
        subject: 'Hello from BullMQ',
        body: 'This is a test email!',
    });

    console.log(`📨 Job added with ID: ${job.id}`);
};

addJob()
    .then(() => {
        console.log('Job successfully added to the queue!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error adding job:', err);
        process.exit(1);
    });
