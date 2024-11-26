import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 8001;

app.use(express.json());

app.get('/user-service',(req: Request, res: Response)=>{
    res.send('Hello World! from auth-service!!');
});

app.listen(port, ()=>{
    console.log(`Auth service listening at http://localhost:${port}`);
});