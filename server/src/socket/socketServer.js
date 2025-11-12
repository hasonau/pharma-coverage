import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocketServer = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // later you can restrict to frontend URL
            methods: ["GET", "POST"],
            transports: ["websocket", "polling"]
        }
    });

    io.on("connection", (socket) => {
        const token = socket.handshake.auth?.token;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            console.log("User authenticated:", decoded.id);
        } catch (err) {
            console.log("Auth failed");
            socket.disconnect();
            return;
        }
        const room = `${socket.user.role}_${socket.user.id}`;
        socket.join(room);
        console.log(`Joined room: ${room}`);


        console.log("✅ User connected:", socket.id);

        socket.on("disconnect", () => {
            console.log("❌ User disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};
