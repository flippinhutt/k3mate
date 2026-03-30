import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
