"use client"

import {
  MINECRAFT_JAVA_VERSIONS,
  MINECRAFT_EDITION_TYPES,
  MINECRAFT_MOD_LOADERS,
  isMinecraftJavaEdition,
} from "@/lib/minecraft-java"
import ModrinthInstanceUpload from "./ModrinthInstanceUpload"

export type MinecraftJavaFormSlice = {
  minecraftVersion: string
  minecraftEditionType: string
  minecraftModLoader: string
  hasModrinthInstance: boolean
}

type Props = {
  gameType: string
  values: MinecraftJavaFormSlice
  onChange: (patch: Partial<MinecraftJavaFormSlice>) => void
  modrinthFile: File | null
  onModrinthFileChange: (file: File | null) => void
  existingModrinthFileName?: string | null
  showModrinthUpload?: boolean
}

export default function MinecraftJavaFields({
  gameType,
  values,
  onChange,
  modrinthFile,
  onModrinthFileChange,
  existingModrinthFileName,
  showModrinthUpload = true,
}: Props) {
  if (!isMinecraftJavaEdition(gameType)) return null

  const isModded = values.minecraftEditionType === "modded"

  return (
    <div className="space-y-5 rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Minecraft: Java Edition</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Version and mod details appear on your public server page.
        </p>
      </div>

      <div>
        <label htmlFor="minecraftVersion" className="block text-sm font-medium text-gray-300 mb-1">
          Minecraft version <span className="text-red-400">*</span>
        </label>
        <select
          id="minecraftVersion"
          required
          value={values.minecraftVersion}
          onChange={(e) => onChange({ minecraftVersion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select version...</option>
          {MINECRAFT_JAVA_VERSIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-300 mb-2">
          Server type <span className="text-red-400">*</span>
        </span>
        <div className="flex flex-wrap gap-4">
          {MINECRAFT_EDITION_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="minecraftEditionType"
                value={value}
                checked={values.minecraftEditionType === value}
                onChange={() =>
                  onChange({
                    minecraftEditionType: value,
                    minecraftModLoader: value === "vanilla" ? "" : values.minecraftModLoader,
                  })
                }
                className="h-4 w-4 text-indigo-600 border-gray-500"
              />
              <span className="text-sm text-gray-200">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {isModded && (
        <div>
          <label htmlFor="minecraftModLoader" className="block text-sm font-medium text-gray-300 mb-1">
            Mod loader <span className="text-red-400">*</span>
          </label>
          <select
            id="minecraftModLoader"
            required
            value={values.minecraftModLoader}
            onChange={(e) => onChange({ minecraftModLoader: e.target.value })}
            className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select mod loader...</option>
            {MINECRAFT_MOD_LOADERS.map((loader) => (
              <option key={loader} value={loader}>
                {loader}
              </option>
            ))}
          </select>
        </div>
      )}

      {showModrinthUpload && (
        <div className="pt-2 border-t border-white/10">
          <span className="block text-sm font-medium text-gray-300 mb-2">
            Do you have a Modrinth instance for your server?
          </span>
          <div className="flex flex-wrap gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hasModrinthInstance"
                checked={!values.hasModrinthInstance}
                onChange={() => {
                  onChange({ hasModrinthInstance: false })
                  onModrinthFileChange(null)
                }}
                className="h-4 w-4 text-indigo-600 border-gray-500"
              />
              <span className="text-sm text-gray-200">No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hasModrinthInstance"
                checked={values.hasModrinthInstance}
                onChange={() => onChange({ hasModrinthInstance: true })}
                className="h-4 w-4 text-indigo-600 border-gray-500"
              />
              <span className="text-sm text-gray-200">Yes</span>
            </label>
          </div>

          {values.hasModrinthInstance && (
            <ModrinthInstanceUpload
              file={modrinthFile}
              onChange={onModrinthFileChange}
              existingFileName={existingModrinthFileName}
            />
          )}
        </div>
      )}
    </div>
  )
}
