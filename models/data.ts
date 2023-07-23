import mongoose, { Document, Model, Schema } from 'mongoose';
import db from './db';

export interface IData extends Document {
  symbol: string;
  e_rate: {
    jual: number;
    beli: number;
  };
  tt_counter: {
    jual: number;
    beli: number;
  };
  bank_notes: {
    jual: number;
    beli: number;
  };
  date: Date;
}

interface IDataModel extends Model<IData> {
  findRecordsByDate(startdate: Date, enddate: Date): Promise<IData[]>;
}

const dataSchema: Schema<IData> = new mongoose.Schema({
  symbol: String,
  e_rate: {
    jual: Number,
    beli: Number,
  },
  tt_counter: {
    jual: Number,
    beli: Number,
  },
  bank_notes: {
    jual: Number,
    beli: Number,
  },
  date: Date,
});

dataSchema.statics.findRecordsByDate = async function (
  startdate: Date,
  enddate: Date
): Promise<IData[]> {
  try {
    const records = await this.find({
      date: { $gte: startdate, $lte: enddate },
    });
    return records;
  } catch (error) {
    throw error;
  }
};

const Data: IDataModel = db.model<IData, IDataModel>('Data', dataSchema);

export default Data;
