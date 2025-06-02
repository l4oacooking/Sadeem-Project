import express from 'express';
import sallaInstallRoute from './routes/sallaInstall.js'; // هذا هو الملف اللي فيه /webhook
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use('/', sallaInstallRoute); // مهم جدًا

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});