const express = require('express');
const app = express();
require('./db/conn');
const Result = require('./models/result');
const puppeteer = require('puppeteer');
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Inserting Google search result in to mongo db (demo : localhost:5000/search/xyz --> it will save the top 10 search results for xyz.)
app.get('/search', async (req, res) => {
    const q = req.query.q;
    let browser = await puppeteer.launch();
    const [page] = await browser.pages();
    await page.goto("https://www.google.com/");
    await page.waitForSelector('input[aria-label="Search"]', {
        visible: true
    });
    await page.type('input[aria-label="Search"]', q);
    await Promise.all([
        page.waitForNavigation(),
        page.keyboard.press("Enter"),
    ]);
    await page.waitForSelector(".LC20lb", {
        visible: true
    });

    const searchResults = await page.evaluate(() => [...document.querySelectorAll(".LC20lb")].slice(0, 10).map((e) => {
        if (e.parentNode.parentNode.nextElementSibling.children[0].innerText !== '') {
            return {
                title: e.innerHTML,
                link: e.parentNode.href,
                description: e.parentNode.parentNode.nextElementSibling.children[0].innerText
            }
        }
        else {
            if (e.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.previousElementSibling.children[0].children[0].children[0].children[0].children[0] !== null) {
                return {
                    title: e.innerHTML,
                    link: e.parentNode.href,
                    description: e.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.previousElementSibling.children[0].children[0].children[0].children[0].children[0].innerHTML
                }
            }
        }
    }
    ));
    // console.log(searchResults);
    let newResult = new Result({
        resultsArray: searchResults
    });
    let resultSave = await newResult.save();
    await browser.close();
    res.send(resultSave);
})

// Fetching the data from mongodb
app.get('/results', async (req, res) => {
    try {
        let results = await Result.find();
        res.json({ results });
    } catch (error) {
        res.json({ message: error.message });
    }
})

// Listening on port 5000
app.listen(port, () => {
    console.log('Listening...');
})