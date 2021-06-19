// Requires
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const assert = require("assert");

// Constants
const YEAR = process.env.YEAR || 2021;
const DEFAULT_PATH =
  YEAR >= 2019
    ? `http://vestibular.ufrgs.br/cv${YEAR}/listao/`
    : `https://www.ufrgs.br/vestibular/cv${YEAR}/listao/`;
const PATHS = Array(26)
  .fill(0)
  .map((_, index) => "arquivo_" + String.fromCharCode(index + 97));
const TABLE_BODY_SELECTOR =
  "#vestibular > div.container.row > div.listao.flow-text.highlight > table > tbody";
const TABLE_BODY_ROW_SELECTOR =
  "#vestibular > div.container.row > div.listao.flow-text.highlight > table > tbody > tr:nth-child(INDEX)";
const REGEX = /[\s\-\:]/gm;

// Function which will actually run the scraper
async function run() {
  console.log("Initializing headless browser instance");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0); // To avoid timeouts

  console.log("Browser initialized!");

  // Object which will store all the freshmen
  const freshmen = {};
  let counter = 0;

  // Iterate over all the paths, to find the freshmen
  console.log("Starting to acess all the paths");
  for (let path of PATHS) {
    const new_path = DEFAULT_PATH + path + ".html";
    console.log(`Acessing path: ${new_path}`);

    await page.goto(new_path);

    // Gets the quantity of freshmen in this path
    const freshmenLength = await page.evaluate((sel) => {
      try {
        return document.querySelector(sel).childElementCount;
      } catch (_) {
        return 0;
      }
    }, TABLE_BODY_SELECTOR);
    counter += freshmenLength;

    // Iterate through all the freshmen rows in this path
    for (let i = 0; i < freshmenLength; i++) {
      const selector = TABLE_BODY_ROW_SELECTOR.replace("INDEX", i + 1);
      const htmlElement = await page.evaluate((sl) => {
        const htmlElement = document.querySelector(sl).children;
        const freshman = Array.from(htmlElement).map((el) =>
          el.innerText.replace("\n", "")
        );
        return freshman;
      }, selector);

      // If this course doesn't have an array yet, create it
      if (freshmen[htmlElement[3]] == undefined) freshmen[htmlElement[3]] = [];

      // Add the name and the starting semester for this freshman
      freshmen[htmlElement[3]].push({
        name: htmlElement[1],
        semester: htmlElement[2],
      });
    }
  }
  console.log(`Fetched ${counter} freshmen`);

  // Write data to files
  console.log("Starting to write data fo files");
  await fs.mkdir("json");
  for (let course of Object.keys(freshmen)) {
    const students = freshmen[course];
    const parsedCourse = course.toLowerCase().replace(REGEX, "");
    const json = JSON.stringify(students);
    const text = students
      .map((s) => s.name + "\n")
      .reduce((acc, val) => acc + val, "");

    console.log(`Creating files for ${parsedCourse}`);
    await fs.mkdir(`json/${parsedCourse}`);
    await fs.writeFile(`json/${parsedCourse}/freshmen.json`, json, "utf8");
    await fs.writeFile(`json/${parsedCourse}/freshmen.txt`, text, "utf8");
  }
  console.log("It's done! :D");

  // Closes the browser and its process
  browser.close();
}

// Main function
function main() {
  console.log(
    "WARNING - ANY JSON NAMED FOLDER IN THIS DIRECTORY WILL BE REMOVED"
  );
  console.log("Insert YES (case sensitive) to continue... ");

  // Configures the prompt to the user
  const std_in = process.stdin;
  std_in.setEncoding("utf-8");
  std_in.on("data", async (data) => {
    // Only run the code if the user prompted 'YES'

    if (data === "YES\r\n" || data == "YES\n") {
      const hrstart = process.hrtime();

      // Remove JSON folder and run the puppeteer code
      fs.remove("json");
      await run();
      console.log("\n\nProgram concluded sucessfully!");

      // Console.log the execution time
      const [seconds, nanoseconds] = process.hrtime(hrstart);
      console.info(
        "Execution time (hr): %ds %dms",
        seconds,
        nanoseconds / 1000000
      );
    } else {
      console.log("Exiting without running the code!");
    }

    process.exit();
  });
}

// Makes sure that here is a valid year
assert.ok(
  YEAR >= 2016 && YEAR <= 2021,
  "The YEAR you want to access is not valid, use a YEAR between 2016 and 2021"
);

// Calls the main process
main();
