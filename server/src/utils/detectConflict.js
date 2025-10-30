// utils/detectConflicts.js
import { Application } from "../models/Application.model.js";
import { Shift } from "../models/Shift.model.js";

/**
 * Detect and handle overlapping applications for a pharmacist.
 * Called asynchronously by the conflictWorker through BullMQ.
 *
 * @param {Object} data
 * @param {String} data.pharmacistId - Pharmacist whose applications will be checked
 * @param {String} data.shiftId - The main shift involved in the event
 * @param {String} [data.action] - The triggering action ("apply", "accept", "confirm")
 */
export const detectConflicts = async (data) => {
    const { pharmacistId, shiftId, action } = data;

    console.log(`🧩 Running conflict detection for pharmacist: ${pharmacistId}, shift: ${shiftId}, action: ${action}`);

    const mainShift = await Shift.findById(shiftId);
    if (!mainShift) {
        console.log("⚠️ No main shift found, aborting job");
        return;
    }

    // fetch all active applications (excluding this one)
    const activeApps = await Application.find({
        pharmacistId,
        status: { $in: ["applied", "offered", "accepted"] },
        shiftId: { $ne: shiftId }
    }).populate("shiftId");

    const overlappingIds = [];

    for (const app of activeApps) {
        const otherShift = app.shiftId;
        if (!otherShift) continue;

        const overlaps =
            mainShift.startTime < otherShift.endTime &&
            mainShift.endTime > otherShift.startTime;

        if (!overlaps) continue;

        // Handle overlap depending on type of shift and action context
        if (
            !mainShift.requiresPharmacistConfirmation &&
            !otherShift.requiresPharmacistConfirmation
        ) {
            // Type B ↔ Type B conflict — always withdraw
            overlappingIds.push(app._id);
        } else if (
            action === "accept" || action === "confirm"
        ) {
            // When a shift is accepted/confirmed, withdraw all overlapping apps (A or B)
            overlappingIds.push(app._id);
        }
    }

    if (overlappingIds.length > 0) {
        await Application.updateMany(
            { _id: { $in: overlappingIds } },
            { $set: { status: "withdrawn" } }
        );
        console.log(`🔻 Withdrawn ${overlappingIds.length} overlapping applications.`);
    } else {
        console.log("✅ No conflicting applications found.");
    }

    return {
        pharmacistId,
        shiftId,
        withdrawnCount: overlappingIds.length
    };
};
