export interface HourlyAlertPoint {
  hour: string
  count: number
}

export interface AlertTypeCount {
  type: string
  label: string
  count: number
}

export interface RecentAlertItem {
  id: number
  publicId: string
  type: string
  typeLabel: string
  priority: string
  status: string
  cameraName: string
  location: string
  description: string
  simulated: boolean
  occurredAt: string
}

export interface DashboardSummary {
  totalCameras: number
  onlineCameras: number
  offlineCameras: number
  alertsToday: number
  underReview: number
  confirmed: number
  monitoringStatus: string
  alertsByHour: HourlyAlertPoint[]
  alertsByType: AlertTypeCount[]
  recentAlerts: RecentAlertItem[]
}
