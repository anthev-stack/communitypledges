"use client"

import { LayoutGrid, List } from "lucide-react"

type ViewMode = "grid" | "list"

export default function ServersViewSwitch({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  const isList = viewMode === "list"

  return (
    <div className="servers-view-switch" title={isList ? "Horizontal list view" : "Column view"}>
      <LayoutGrid
        className={`servers-view-switch__icon ${!isList ? "servers-view-switch__icon--active" : ""}`}
        aria-hidden
      />
      <button
        type="button"
        role="switch"
        aria-checked={isList}
        aria-label={`${isList ? "List" : "Column"} view. Click to switch layout.`}
        className="servers-view-switch__track"
        onClick={() => onChange(isList ? "grid" : "list")}
      >
        <span className={`servers-view-switch__thumb ${isList ? "servers-view-switch__thumb--on" : ""}`} />
      </button>
      <List
        className={`servers-view-switch__icon ${isList ? "servers-view-switch__icon--active" : ""}`}
        aria-hidden
      />
    </div>
  )
}
