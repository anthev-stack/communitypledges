export function getTicketPriorityClass(priority: string) {
  switch (priority) {
    case "urgent":
      return "ticket-pill ticket-pill--urgent"
    case "high":
      return "ticket-pill ticket-pill--high"
    case "medium":
      return "ticket-pill ticket-pill--medium"
    case "low":
      return "ticket-pill ticket-pill--low"
    default:
      return "ticket-pill ticket-pill--closed"
  }
}

export function getTicketStatusClass(status: string) {
  switch (status) {
    case "open":
      return "ticket-pill ticket-pill--open"
    case "in_progress":
      return "ticket-pill ticket-pill--in_progress"
    case "resolved":
      return "ticket-pill ticket-pill--resolved"
    case "closed":
      return "ticket-pill ticket-pill--closed"
    default:
      return "ticket-pill ticket-pill--closed"
  }
}
