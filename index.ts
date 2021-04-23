import { Request, Response } from 'express';
import { Browser } from 'puppeteer';

const path = require('path');
const fs = require('fs');

// check if 'temp' folder exists and create it if it doesn't
if (!fs.existsSync(path.resolve('temp'))) {
  console.log('Creating Temp Folder');
  fs.mkdirSync('temp');
}

const puppeteer = require('puppeteer');
const express = require('express');
const enforce = require('express-sslify');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

app.get('/', (req: Request, res: Response) => {
  console.log(req);
  res.send('hello');
});

app.get('/new/:url', async (req: Request, res: Response) => {
  console.log(req.params);

  const { url } = req.params;
  const tag = Date.now();

  // Launching the Puppeteer controlled headless browser and navigate to the url
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Create screenshot file
  await page.screenshot({ path: `temp/screenshot-${tag}.png` });

  // Closing the Puppeteer controlled headless browser
  await browser.close();

  // send the created image
  res.sendFile(path.join(__dirname, 'temp', `screenshot-${tag}.png`));
});

app.listen(PORT, () => {
  console.log(`Server Running on PORT: ${PORT}`);
});
