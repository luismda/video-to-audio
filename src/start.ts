import { resolve } from 'node:path'
import { readdir } from 'node:fs/promises'

import ora from 'ora'
import chalk from 'chalk'
import inquirer from 'inquirer'

import { exec } from './utils/exec'

interface Response {
  inputDir: string
}

async function start() {
  const response = await inquirer.prompt<Response>([
    {
      type: 'input',
      name: 'inputDir',
      message: 'Enter the videos directory (e.g.: /home/your-user/videos): ',
    },
  ])

  const inputPath = resolve(response.inputDir)

  const contentFromPath = await readdir(inputPath, {
    recursive: true,
    encoding: 'utf-8',
    withFileTypes: true,
  })

  const directoriesFromPath = contentFromPath.filter((item) => item.isDirectory())

  const outputPath = inputPath.concat('/out')
  await exec(`mkdir "${outputPath}"`)

  for (const directory of directoriesFromPath) {
    const parentDir = directory.parentPath.replace(inputPath, '')

    await exec(`mkdir "${outputPath.concat(parentDir)}/${directory.name}"`)
  }

  const filesFromPath = contentFromPath.filter((item) => item.isFile())
  const videosFromPath = filesFromPath.filter((file) => file.name.includes('.mp4'))

  const loading = ora().start()

  for (let i = 0; i < videosFromPath.length; i++) {
    const inputVideo = videosFromPath[i]
    const videoFullPath = inputVideo.parentPath.concat('/').concat(inputVideo.name)

    const audioPath = videoFullPath.replace(inputPath, '').replace('.mp4', '.mp3')
    const audioFullPath = outputPath.concat(audioPath)

    const progress = Math.round((i / videosFromPath.length) * 100)
    loading.text = `Converting ${i + 1}/${videosFromPath.length} video(s) to audio... ${progress}%`

    await exec(`ffmpeg -i "${videoFullPath}" "${audioFullPath}"`)
  }

  loading.succeed(chalk.bold.green(`Done! ${videosFromPath.length} video(s) converted to audio.`))

  console.info(chalk.blueBright(`✔ The audios can be viewed at: ${outputPath}`))
}

start()
