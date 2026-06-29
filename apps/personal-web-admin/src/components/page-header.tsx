export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-slate-400 to-slate-600 shrink-0" />
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
