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
      width={18}
      height={18}
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
    <div className="server-detail-modrinth-download">
      <button
        type="button"
        onClick={handleDownload}
        className="server-detail-modrinth-download__link"
      >
        Download modrinth instance here
        <ModrinthLogo className="shrink-0" />
      </button>
      <p className="server-detail-modrinth-download__filename" title={fileName}>
        {fileName}
      </p>
    </div>
  )
}
