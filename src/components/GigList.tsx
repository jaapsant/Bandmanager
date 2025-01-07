return (
  <div className="p-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold">Upcoming Gigs</h1>
      {(isAdmin || isBandManager) && (
        <Button
          onClick={() => setShowNewGigModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Gig</span>
        </Button>
      )}
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-4">Date</th>
            <th className="text-left py-2 px-4">Title</th>
            <th className="text-left py-2 px-4">Location</th>
            <th className="text-left py-2 px-4">Status</th>
            <th className="text-right py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {gigs.map((gig) => (
            <tr key={gig.id} className="border-b hover:bg-gray-50">
              {/* ... existing row content ... */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
); 