import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 8001;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World! from path-service!!!!');
});

app.listen(port, () => {
    console.log(`Path service listening at http://localhost:${port}`);
});