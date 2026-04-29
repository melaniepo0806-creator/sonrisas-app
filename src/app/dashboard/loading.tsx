export default function DashboardLoading() {
  return (
    <div className="app-container">
      <div className="page-content flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-brand-400 text-xs font-bold">Cargando…</p>
        </div>
      </div>
    </div>
  )
}
