"use client"

import { useRef } from "react"
import { Upload } from "lucide-react"

type Props = {
  file: File | null
  onChange: (file: File | null) => void
  existingFileName?: string | null
}

export default function ModrinthInstanceUpload({ file, onChange, existingFileName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">
        Upload your Modrinth instance export (.mrpack or .zip, max 150MB) for members to download.
      </p>
      {existingFileName && !file && (
        <p className="text-xs text-emerald-400 mb-2">Current file: {existingFileName}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".mrpack,.zip,application/zip"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-[#1bd96a]/60 hover:bg-[#1bd96a]/5 transition text-gray-300"
      >
        <Upload className="w-8 h-8 text-[#1bd96a]" aria-hidden />
        <span className="text-sm font-medium">
          {file ? file.name : existingFileName ? "Replace Modrinth instance" : "Choose Modrinth instance file"}
        </span>
        {file && (
          <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
        )}
      </button>
      {file && (
        <button
          type="button"
          onClick={() => {
            onChange(null)
            if (inputRef.current) inputRef.current.value = ""
          }}
          className="mt-2 text-xs text-red-400 hover:text-red-300"
        >
          Remove selected file
        </button>
      )}
    </div>
  )
}
