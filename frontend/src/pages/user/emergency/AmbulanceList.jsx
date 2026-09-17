import React from "react";
import AmbulanceCard from "./AmbulanceCard";
import LoadingSkeleton from "../../../components/shared/LoadingSkeleton";
import EmptyState from "../../../components/shared/EmptyState";
import { Truck } from "lucide-react";

export const AmbulanceList = ({
  ambulances = [],
  isLoading = false,
  selectedAmbulanceId,
  onSelectAmbulance,
  isBooking = false,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>Available Emergency Ambulances</span>
        </h3>
        <p className="text-xs text-dark-400">
          Ranked by proximity to your scene with active paramedic crews.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={2} />
      ) : ambulances.length === 0 ? (
        <EmptyState
          title="Searching for active units..."
          description="Connecting to regional EMS dispatch. You will be matched with the next available paramedic unit."
        />
      ) : (
        <div className="space-y-3">
          {ambulances.map((amb) => (
            <AmbulanceCard
              key={amb._id || amb.id}
              ambulance={amb}
              isSelected={selectedAmbulanceId === (amb._id || amb.id)}
              onSelect={onSelectAmbulance}
              isBooking={isBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AmbulanceList;

