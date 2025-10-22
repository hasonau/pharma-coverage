import { redisConnection } from "../db/redisConnection.js";
import { Worker } from "bullmq";
import { sendEmail } from "../utils/sendEmail.js";

// worker instance
const workerinstance = new Worker("emailQueue",
    async (job) => {
        await sendEmail(job.data);
    },
    {
        connection: redisConnection
    }
);



