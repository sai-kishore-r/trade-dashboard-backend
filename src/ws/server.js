import WebSocket, { WebSocketServer } from 'ws';

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('New client connected.');

        ws.send('Welcome to the WebSocket server!');

        ws.on('message', (message) => {
            console.log('Received:', message);
            const text = message.toString(); // Convert buffer → string
            console.log('Received message:', text);

            // Broadcast to all connected clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(`Server echo: ${message}`);
                }
            });
        });

        ws.on('close', () => {
            console.log('Client disconnected.');
        });
    });

    return wss;
}

export default setupWebSocket;
