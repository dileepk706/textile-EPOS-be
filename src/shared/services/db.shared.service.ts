import mongoose from 'mongoose';
import { injectable } from 'tsyringe';

@injectable()
class DbSharedService {
  getConnection = () => {
    return mongoose.connection;
  };
}

export default DbSharedService;
