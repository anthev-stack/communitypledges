"use client"

import Image from "next/image"

type Props = {
  serverId: string
  serverName: string
  fileName: string
}

function ModrinthLogo({ className }: { className?: string }) {
  return (
    <Image
      src="https://cdn.modrinth.com/logo.svg"
      alt=""
      width={20}
      height={20}
      className={className}
      aria-hidden
      unoptimized
    />
  )
}

export default function ModrinthDownloadCard({ serverId, serverName, fileName }: Props) {
  const handleDownload = () => {
    const ok = window.confirm(
      `Download Modrinth instance for "${serverName}"?\n\nFile: ${fileName}\n\nThis pack was uploaded by the server owner for members to import in the Modrinth app.`
    )
    if (ok) {
      window.location.href = `/api/servers/${serverId}/modrinth-instance`
    }
  }

  return (
    <div className="listing-card p-5">
      <p className="text-sm text-gray-300 leading-relaxed">
        Download server&apos;s Modrinth instance{" "}
        <button
          type="button"
          onClick={handleDownload}
          className="modrinth-download-link inline-flex items-center gap-0.5 font-semibold text-[#1bd96a] hover:text-[#5eead4] underline underline-offset-2 transition align-baseline"
        >
          <ModrinthLogo className="inline-block w-4 h-4 align-[-2px] mr-0.5" />
          here
        </button>
      </p>
      <p className="text-xs text-gray-500 mt-2 truncate" title={fileName}>
        {fileName}
      </p>
    </div>
  )
}
