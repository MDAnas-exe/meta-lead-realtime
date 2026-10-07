import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

console.log('env loaded, port:', PORT);

app.listen(PORT, () => {
  console.log(`server on port ${PORT}`);
});