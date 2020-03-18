const puppeteer = require("puppeteer");

let browser;

exports.screenshot = async (req, res) => {
  const { generator, quote } = req.query;

  const url = `https://${process.env.GCP_PROJECT}.web.app/#${generator}`;

  if (!browser) {
    browser = await puppeteer.launch({
      userDataDir: "/tmp/user-data-dir",
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--single-process"
      ]
    });
  }

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.click("#hidelink");

    await page.evaluate(quote => {
      const element = document.querySelector("#sourcetext");
      element.value = quote;
      renderText();
    }, quote);

    const bounds = await page.evaluate(() => {
      const element = document.querySelector("#death");
      const { x, y, width, height } = element.getBoundingClientRect();
      return { left: x, top: y, width, height };
    });

    const padding = 0;
    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 90,
      clip: {
        x: bounds.left - padding,
        y: bounds.top - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2
      }
    });

    res.type("image/jpeg").send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.toString());
  } finally {
    await page.close();
  }
};
