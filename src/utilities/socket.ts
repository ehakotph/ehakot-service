import type { Express } from "express";
import http from 'http';
import { Server } from "socket.io";

async function initializeSocket(app: Express) {
    const server = http.createServer(app);
    const io = new Server(server);

    io.on('connection', async (socket) => {
        console.info(`User connected: ${socket.id}`);
    });

    return server;
}

export default initializeSocket;