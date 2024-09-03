import { spawn, spawnSync, SpawnOptions } from 'child_process'

export const exec = async (command: string, args?: string[] | null, options?: SpawnOptions) => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      command,
      args || [],
      {
        stdio: 'inherit',
        shell: true,
        ...options,
      }
    )

    let exited = false;
    let err: Error | null = null;
    const handleExit = (code: number | null, signal: string | null) => {
      if (exited) return;
      exited = true;
  
      if (!err && code === 0 && signal === null) {
        resolve();
        return;
      }

      reject(err || new Error(`exec command: '${command}' error, code: ${code}, signal: ${signal}`))
    }
    child.on('error', e => {
      err = e
      handleExit(null, null)
    })
    child.on('exit', handleExit)
  })
}

export const execSync = async (command: string, args?: string[] | null, options?: SpawnOptions) => {
  const { error } = spawnSync(
    command,
    args || [],
    {
      stdio: 'inherit',
      shell: true,
      ...options,
    }
  )
  if (error) {
    throw error
  }
}

export const signWinApp = async (file: string) => {
  const signPath = process.env.WINDOWS_SIGN_TOOL_PATH
  if (!signPath) return Promise.resolve()
  return exec(signPath, [file, file], { shell: false })
}
