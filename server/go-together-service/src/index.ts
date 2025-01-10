import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';


const port = process.env.PORT || 4001;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World! from go-together-service!!!!');
});



const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
})

io.on("connection", (socket) => {

    console.log("User connected");
    console.log(socket.id);

    socket.on("message-req", ({ message, room }) => {
        console.log(message, socket.id, room);
        io.to(room).emit("message-res", message);
    });

    socket.on('join', ({name, room}, callback) => {
        socket.join(room);
        console.log(`User joined room ${room}`);
        io.to(room).emit('roomData', {
            room: room,
            users: io.sockets.adapter.rooms.get(room)
        });
    })

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
})

httpServer.listen(port, () => {
    console.log(`go-together service listening at http://localhost:${port}`);
});