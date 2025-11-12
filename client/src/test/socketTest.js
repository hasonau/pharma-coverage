import { io } from "socket.io-client";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTQxYzYzZDk3MDVmMjEyOGY4YWQ0NiIsInJvbGUiOiJwaGFybWFjaXN0IiwiaWF0IjoxNzYyOTI1NjY4LCJleHAiOjE3NjMwMTIwNjh9.jGpDuqK0s7JbLshkjIylERJcoBsnz-nMhlDQZ0ZsHHU";
// copy from localStorage or Postman response

const socket = io("http://localhost:8000", {
    auth: { token },
});

socket.on("connect", () => {
    console.log("✅ Connected to socket server:", socket.id);
});

socket.on("newApplication", (data) => {
    console.log("📩 Received new application event:", data);
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from socket server");
});
