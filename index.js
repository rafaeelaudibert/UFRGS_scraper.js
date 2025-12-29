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
  s.start("Inicializando navegador headless")
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  page.setDefaultNavigationTimeout(0) // To avoid timeouts
  s.stop("Navegador headless inicializado!")

  // Object which will store all the freshmen
  const freshmen = {}
  let counter = 0

  // Itera sobre todos os paths para encontrar os calouros
  s.start(`Processando arquivos (0/${PATHS.length})`)
  for (let pathIndex = 0; pathIndex < PATHS.length; pathIndex++) {
    const path = PATHS[pathIndex]
    const new_path = DEFAULT_PATH + path + ".html"
    s.message(`Processando ${path}.html (${pathIndex + 1}/${PATHS.length})`)

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
  s.stop(`${PATHS.length} arquivos processados — ${counter} calouros encontrados`)

  // Write data to files
  const courses = Object.keys(freshmen).sort((a, b) => a.localeCompare(b))
  s.start(`Escrevendo arquivos (0/${courses.length} cursos)`)
  await fs.mkdir("json")

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]
    const students = freshmen[course]
    const parsedCourse = course.toLowerCase().replace(REGEX, "")
    const json = JSON.stringify(students)
    const text = students.map((s) => s.name + "\n").join("")

    s.message(`Escrevendo arquivos (${i + 1}/${courses.length} cursos)`)
    await fs.mkdir(`json/${parsedCourse}`)
    await fs.writeFile(`json/${parsedCourse}/calouros.json`, json, "utf8")
    await fs.writeFile(`json/${parsedCourse}/calouros.txt`, text, "utf8")
  }
  s.stop(`${courses.length * 2} arquivos escritos para ${courses.length} cursos`)

  // Closes the browser and its process
  browser.close()
}

// Define CLI command
const main = defineCommand({
  meta: {
    name: "ufrgs-scraper",
    description: "Scraper para buscar todos os calouros no Vestibular da UFRGS em um dado ano",
  },
  args: {
    ano: {
      type: "string",
      description: `Ano para buscar (ex: ${currentYear})`,
      default: String(currentYear),
    },
    sim: {
      type: "boolean",
      alias: "s",
      description: "Pular confirmação",
      default: false,
    },
  },
  async run({ args }) {
    const year = parseInt(args.ano, 10)

    // Validate year
    if (year < 2022) {
      log.error("O ano informado não é válido. Apenas 2022 e posteriores são suportados.")
      log.info("Para anos anteriores, verifique commits anteriores neste repositório.")
      process.exit(1)
    }

    intro(`UFRGS Vestibular Scraper - ${year}`)

    // Check for confirmation
    let shouldContinue = args.sim

    if (!shouldContinue) {
      log.warn("A pasta 'json' existente neste diretório será removida!")

      const response = await confirm({
        message: "Deseja continuar?",
      })

      if (isCancel(response) || !response) {
        cancel("Operação cancelada.")
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

      outro(`Concluído em ${seconds}s ${ms}ms`)
    }
  },
})

runMain(main)
