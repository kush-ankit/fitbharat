import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 8002;

app.use(express.json());

app.get('/notification',(req: Request, res: Response)=>{
    res.send('Hello World! from notification-service');
});

app.listen(port, ()=>{
    console.log(`Notification service listening at http://localhost:${port}`);
});