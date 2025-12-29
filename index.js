#!/usr/bin/env node

// Requires
const puppeteer = require("puppeteer")
const fs = require("fs-extra")
const { defineCommand, runMain } = require("citty")
const { intro, outro, confirm, spinner, log, cancel, isCancel } = require("@clack/prompts")

// Constants
const currentYear = new Date().getFullYear()
const TABLE_BODY_SELECTOR =
  "#vestibular > div.container.row > div.listao.flow-text.highlight > table > tbody"
const TABLE_BODY_ROW_SELECTOR =
  "#vestibular > div.container.row > div.listao.flow-text.highlight > table > tbody > tr:nth-child({INDEX})"
const REGEX = /[\s:]/gm

// Function which will actually run the scraper
async function run(year) {
  const DEFAULT_PATH = `https://www.ufrgs.br/vestibular/cv${year}/listao/`
  const PATHS = Array(26)
    .fill(0)
    .map((_, index) => "arquivo_" + String.fromCharCode(index + 97))

  const s = spinner()
  s.start("Initializing headless browser instance")
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  page.setDefaultNavigationTimeout(0) // To avoid timeouts
  s.stop("Headless browser initialized!")

  // Object which will store all the freshmen
  const freshmen = {}
  let counter = 0

  // Iterate over all the paths, to find the freshmen
  s.start(`Processing files (0/${PATHS.length})`)
  for (let pathIndex = 0; pathIndex < PATHS.length; pathIndex++) {
    const path = PATHS[pathIndex]
    const new_path = DEFAULT_PATH + path + ".html"
    s.message(`Processing ${path}.html (${pathIndex + 1}/${PATHS.length})`)

    await page.goto(new_path)

    // Gets the quantity of freshmen in this path
    const freshmenLength = await page.evaluate((sel) => {
      try {
        return document.querySelector(sel).childElementCount
      } catch {
        return 0
      }
    }, TABLE_BODY_SELECTOR)
    counter += freshmenLength

    // Iterate through all the freshmen rows in this path
    for (let i = 0; i < freshmenLength; i++) {
      const selector = TABLE_BODY_ROW_SELECTOR.replace("{INDEX}", i + 1)
      const htmlElement = await page.evaluate((sl) => {
        const htmlElement = document.querySelector(sl).children
        const freshman = Array.from(htmlElement).map((el) =>
          el.innerText.replace("\n", "")
        )

        return freshman
      }, selector)

      // If this course doesn't have an array yet, create it
      if (freshmen[htmlElement[4]] == undefined) freshmen[htmlElement[4]] = []

      // Add the name and the starting semester for this freshman
      freshmen[htmlElement[4]].push({
        name: htmlElement[1],
        semester: htmlElement[3],
      })
    }
  }
  s.stop(`Processed ${PATHS.length} files — fetched ${counter} freshmen`)

  // Write data to files
  const courses = Object.keys(freshmen).sort((a, b) => a.localeCompare(b))
  s.start(`Writing files (0/${courses.length} courses)`)
  await fs.mkdir("json")

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]
    const students = freshmen[course]
    const parsedCourse = course.toLowerCase().replace(REGEX, "")
    const json = JSON.stringify(students)
    const text = students.map((s) => s.name + "\n").join("")

    s.message(`Writing files (${i + 1}/${courses.length} courses)`)
    await fs.mkdir(`json/${parsedCourse}`)
    await fs.writeFile(`json/${parsedCourse}/freshmen.json`, json, "utf8")
    await fs.writeFile(`json/${parsedCourse}/freshmen.txt`, text, "utf8")
  }
  s.stop(`Wrote ${courses.length * 2} files for ${courses.length} courses`)

  // Closes the browser and its process
  browser.close()
}

// Define CLI command
const main = defineCommand({
  meta: {
    name: "ufrgs-scraper",
    description: "Scraper para buscar todos os ingressantes no Vestibular da UFRGS em um dado ano",
  },
  args: {
    year: {
      type: "string",
      description: `Year to scrape (e.g. ${currentYear})`,
      default: String(currentYear),
    },
    yes: {
      type: "boolean",
      alias: "y",
      description: "Skip confirmation prompt",
      default: false,
    },
  },
  async run({ args }) {
    const year = parseInt(args.year, 10)

    // Validate year
    if (year < 2022) {
      log.error("The YEAR you want to access is not valid. Only 2022 and later are supported.")
      log.info("For older years, check previous commits in this repo.")
      process.exit(1)
    }

    intro(`UFRGS Vestibular Scraper - ${year}`)

    // Check for confirmation
    let shouldContinue = args.yes

    if (!shouldContinue) {
      log.warn("Any existing 'json' folder in this directory will be removed!")

      const response = await confirm({
        message: "Do you want to continue?",
      })

      if (isCancel(response) || !response) {
        cancel("Operation cancelled.")
        process.exit(0)
      }

      shouldContinue = true
    }

    if (shouldContinue) {
      const hrstart = process.hrtime()

      // Remove JSON folder and run the puppeteer code
      await fs.remove("json")
      await run(year)

      // Log the execution time
      const [seconds, nanoseconds] = process.hrtime(hrstart)
      const ms = Math.round(nanoseconds / 1000000)

      outro(`Done in ${seconds}s ${ms}ms`)
    }
  },
})

runMain(main)
