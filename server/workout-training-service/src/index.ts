import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 8003;

app.use(express.json());

app.get('/workout',(req: Request, res: Response)=>{
    res.send('Hello World! from workout-service');
});

app.listen(port, ()=>{
    console.log(`Workout service listening at http://localhost:${port}`);
});