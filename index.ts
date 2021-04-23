import { Request, Response } from 'express';
import { Browser } from 'puppeteer';

const path = require('path');
const fs = require('fs');
const { URL } = require('url');

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

app.use(express.urlencoded({ extended: false }));

// serve files from public folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/new', (req: Request, res: Response) => {
  try {
    (async (req: Request, res: Response) => {
      console.log(req.body);

      const { url } = req.body;
      // const tag = Date.now();
      const tag = encodeURIComponent(url.trim().split('://')[1]);

      try {
        const myUrl: any = new URL(url);

        // check url protocol
        if (!['http:', 'https:'].includes(myUrl.protocol)) {
          throw new Error('invalid url protocol');
        }
      } catch (error) {
        return res
          .status(400)
          .json({ message: `'${url.trim()}' is not a valid HTTP/HTTPS url` });
      }

      // Launching the Puppeteer controlled headless browser and navigate to the url
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url.trim());

      // Create screenshot file
      await page.screenshot({ path: `temp/screenshot-${tag}.png` });

      // Closing the Puppeteer controlled headless browser
      await browser.close();

      // send the created image
      res.sendFile(path.join(__dirname, 'temp', `screenshot-${tag}.png`));
    })(req, res);
  } catch (error) {
    console.error('Error: ', error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server Running on PORT: ${PORT}`);
});
