import express from 'express';
import { Request, Response } from 'express';
// import moment from 'moment';

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import kurs from './kurs';
import axios from 'axios'; // Import axios
import cheerio from 'cheerio'; // Import cheerio
import Data, { IData } from '../../models/data';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.get<{}, MessageResponse>('/indexing', async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const existingData = await Data.findOne({ date: new Date(currentDate) });

    if (existingData) {
      // Data already exists for the current date, no need to scrape again
      res.json({ message: 'Data for the current date already exists' });
      return;
    }

    const url = 'https://www.bca.co.id/id/informasi/kurs';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const kursTable = $('.m-table-kurs');
    const kursData: IData[] = [];

    $('tbody tr', kursTable).each((index: number, row: cheerio.Element) => {
      const columns = $(row).find('td');
      const symbol = $(columns[0]).text().trim();
      const eRateBeli = parseFloat(
        $(columns[1]).text().trim().replace(/\./g, '').replace(',', '.')
      );
      const eRateJual = parseFloat(
        $(columns[2]).text().trim().replace(/\./g, '').replace(',', '.')
      );
      const ttCounterBeli = parseFloat(
        $(columns[3]).text().trim().replace(/\./g, '').replace(',', '.')
      );
      const ttCounterJual = parseFloat(
        $(columns[4]).text().trim().replace(/\./g, '').replace(',', '.')
      );
      const bankNotesBeli = parseFloat(
        $(columns[5]).text().trim().replace(/\./g, '').replace(',', '.')
      );
      const bankNotesJual = parseFloat(
        $(columns[6]).text().trim().replace(/\./g, '').replace(',', '.')
      );

      const kurs: IData = {
        symbol,
        e_rate: {
          jual: eRateJual,
          beli: eRateBeli,
        },
        tt_counter: {
          jual: ttCounterJual,
          beli: ttCounterBeli,
        },
        bank_notes: {
          jual: bankNotesJual,
          beli: bankNotesBeli,
        },
        date: new Date(currentDate), // Convert the date string to a Date object
        // Adding these properties for bypassing the error, as it's expected to be used with Mongoose
        $assertPopulated: () => {},
        $clone: () => {},
        $getAllSubdocs: () => {},
        $ignore: () => {},
        // Add other Mongoose-specific properties as needed
      } as any; // Explicitly casting to any to bypass type checking for this assignment
      kursData.push(kurs);
    });

    // Assuming 'Data' is your mongoose model for the MongoDB collection
    // Uncomment the below line if you have the 'Data' model
    await Data.insertMany(kursData as IData[]);

    res.status(200).json({ message: 'Scraping and indexing completed' });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ message: 'Scraping and indexing failed' }); // Include 'message' property
  }
});

router.use('/emojis', emojis);
router.use('/kurs', kurs);

export default router;
