return (
  <div className="p-4 max-w-full">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold">{gig.title}</h1>
      
      {/* Group action buttons in a responsive container */}
      <div className="flex flex-wrap gap-2">
        {(isAdmin || isBandManager) && (
          <>
            <Button
              onClick={handleSendAvailabilityRequest}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Request Availability</span>
              <span className="sm:hidden">Availability</span>
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Gig</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </>
        )}
      </div>
    </div>

    {/* Make details section responsive */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">Date & Time</p>
          <p>{formatDate(gig.date)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">Location</p>
          <p>{gig.location}</p>
        </div>
        {gig.description && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">Description</p>
            <p className="whitespace-pre-wrap">{gig.description}</p>
          </div>
        )}
      </div>

      {/* Availability section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Availability</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px]">
            {/* ... existing table content ... */}
          </table>
        </div>
      </div>
    </div>
  </div>
); 