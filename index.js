import express from 'express';
import cors from 'cors';
import { router } from './routes/router.js';
import { WebSocketServer } from 'ws';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(router);

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT} `);
});

const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('message', (mess) => {
        const data = JSON.parse(mess);
        clients.forEach((client) => {
            client.send(JSON.stringify(data));
        });
    });
    ws.on('close', () => {
        clients.delete(ws);
    });
});
