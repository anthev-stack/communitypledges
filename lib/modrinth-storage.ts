import path from "path"
import fs from "fs/promises"

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "modrinth")

const ALLOWED_EXTENSIONS = [".mrpack", ".zip"]
const MAX_BYTES = 150 * 1024 * 1024 // 150MB

export function getModrinthDiskPath(serverId: string, extension: string) {
  const ext = extension.startsWith(".") ? extension : `.${extension}`
  return path.join(UPLOAD_DIR, `${serverId}${ext}`)
}

export async function saveModrinthInstance(serverId: string, file: File) {
  const originalName = file.name || "modrinth-instance.mrpack"
  const ext = path.extname(originalName).toLowerCase()

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error("Invalid file type. Upload a .mrpack or .zip Modrinth instance export.")
  }

  if (file.size > MAX_BYTES) {
    throw new Error("File must be under 150MB.")
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const diskPath = getModrinthDiskPath(serverId, ext)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(diskPath, buffer)

  return { originalName, extension: ext }
}

export async function readModrinthInstance(serverId: string, extension: string) {
  const diskPath = getModrinthDiskPath(serverId, extension)
  try {
    return await fs.readFile(diskPath)
  } catch {
    return null
  }
}

export async function deleteModrinthInstance(serverId: string, extension: string | null) {
  if (!extension) {
    for (const ext of ALLOWED_EXTENSIONS) {
      try {
        await fs.unlink(getModrinthDiskPath(serverId, ext))
      } catch {
        /* missing file */
      }
    }
    return
  }
  try {
    await fs.unlink(getModrinthDiskPath(serverId, extension))
  } catch {
    /* missing file */
  }
}
