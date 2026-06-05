// Reusable Section Header Component
export const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="mb-6 bg-purple-50 rounded-md p-2">
    <div className="flex items-center gap-3">
      <div className="p-1 bg-blue-100 rounded-lg text-blue-700 shadow-sm">{icon}</div>
      <div>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      </div>
    </div>
  </div>
);
