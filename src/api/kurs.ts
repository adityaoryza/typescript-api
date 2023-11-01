import express from 'express';
import { Request, Response } from 'express';
import moment from 'moment';

// import MessageResponse from '../interfaces/MessageResponse';
// import axios from 'axios'; // Import axios
// import cheerio from 'cheerio'; // Import cheerio
import Data, { IData } from '../../models/data';

const router = express.Router();

router.delete<{ date: string }, { message?: string; error?: string }>(
  '/:date',
  async (req, res) => {
    const { date } = req.params;

    try {
      if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        // Invalid date format
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      const existingRecords = await Data.find({ date });

      if (existingRecords.length === 0) {
        // No records found for the specified date
        res.status(404).json({ error: `No records found for date: ${date}` });
        return;
      }

      await Data.deleteMany({ date });

      res.status(200).json({ message: `Deleted records for date: ${date}` });
    } catch (error) {
      console.error('Error deleting records:', error);
      res.status(500).json({ error: 'Failed to delete records' });
    }
  },
);

// New route for retrieving data within a date range

router.get<{}, {}>('/', async (req, res) => {
  const { startdate, enddate } = req.query;

  try {
    const startdateStr = startdate as string;
    const enddateStr = enddate as string;

    if (
      !moment(startdateStr, 'YYYY-MM-DD', true).isValid() ||
      !moment(enddateStr, 'YYYY-MM-DD', true).isValid()
    ) {
      // Invalid date format
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    if (!startdateStr || !enddateStr) {
      res.status(400).json({ error: 'Missing startdate or enddate' });
      return;
    }

    // Convert startdateStr and enddateStr to Date objects
    const startDate = moment(startdateStr, 'YYYY-MM-DD').toDate();
    const endDate = moment(enddateStr, 'YYYY-MM-DD').toDate();

    const records = await Data.findRecordsByDate(startDate, endDate);

    if (records.length === 0) {
      // No records found for the specified date range
      res
        .status(404)
        .json({ error: 'No records found for the specified date range' });
      return;
    }

    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

router.get<{ symbol: string }, {}>('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { startdate, enddate } = req.query;

  // Validate the startdate and enddate using Moment.js
  const isValidDate = (dateString: string) =>
    moment(dateString, 'YYYY-MM-DD', true).isValid();

  if (!isValidDate(startdate as string) || !isValidDate(enddate as string)) {
    res.status(400).json({ error: 'Invalid startdate or enddate' });
    return;
  }

  try {
    const records = await Data.find({
      symbol: symbol,
      date: { $gte: startdate as string, $lte: enddate as string },
    });

    if (records.length === 0) {
      // No records found for the specified symbol and date range
      res.status(404).json({
        error: 'No records found for the specified symbol and date range',
      });
      return;
    }

    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

router.post('/', async (req, res) => {
  const kursData: IData = req.body;

  // Check if the required fields are present in the kursData
  if (
    !kursData.symbol ||
    !kursData.date ||
    !kursData.e_rate ||
    !kursData.tt_counter ||
    !kursData.bank_notes
  ) {
    res.status(400).json({
      error:
        'Incomplete data. Please provide symbol, date, e_rate, tt_counter, and bank_notes fields',
    });
    return;
  }

  try {
    const existingRecord = await Data.findOne({
      symbol: kursData.symbol,
      date: kursData.date,
    });

    if (existingRecord) {
      res.status(409).json({ error: 'Data already exists' });
      return;
    }

    await Data.create(kursData);

    res.status(200).json({ message: 'Data successfully inserted' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Failed to insert data' });
  }
});

router.put('/', async (req, res) => {
  const kursData: IData = req.body;

  try {
    const existingRecord = await Data.findOne({
      symbol: kursData.symbol,
      date: kursData.date,
    });

    if (!existingRecord) {
      res.status(404).json({ error: 'Data not found' });
      return;
    }

    const updatedRecord = await Data.findOneAndUpdate(
      { symbol: kursData.symbol, date: kursData.date },
      kursData,
      { new: true } // Returns the updated document instead of the original document
    );

    res.status(200).json({ message: 'Data successfully updated' });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
});
// update
export default router;
