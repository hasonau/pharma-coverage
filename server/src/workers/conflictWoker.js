import { Worker } from "bullmq";
import { redisConnection } from "../db/redisConnection.js";
import { detectConflicts } from "../utils/detectConflicts.js";

// worker instance
const workerinstacne = new Worker("conflictQueue",
    async (job) => {
        await detectConflicts(job.data);
    },
    {
        connection: redisConnection
    }
)


