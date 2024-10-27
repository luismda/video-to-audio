import { promisify } from 'node:util'
import { exec as nodeExec } from 'node:child_process'

export const exec = promisify(nodeExec)
