import 'dotenv/config';
import { app } from './app';
import { dbConnection } from './DB/db.connection';
import { ioInitializer } from './Gateways/socketIo.gateway';

dbConnection();

const port: number | string = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

ioInitializer(server);
