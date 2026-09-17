import React from "react";
import HospitalCard from "./HospitalCard";
import LoadingSkeleton from "../../../components/shared/LoadingSkeleton";
import EmptyState from "../../../components/shared/EmptyState";
import { Building2 } from "lucide-react";

export const HospitalList = ({
  hospitals = [],
  isLoading = false,
  selectedHospitalId,
  onSelectHospital,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emergency-500" />
            <span>Select Destination Hospital</span>
          </h3>
          <p className="text-xs text-dark-400">
            Sorted by shortest ETA and verified emergency trauma readiness.
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : hospitals.length === 0 ? (
        <EmptyState
          title="No trauma centers in immediate radius"
          description="ResQ AI is expanding search radius to locate regional medical centers."
        />
      ) : (
        <div className="space-y-3">
          {hospitals.map((hosp) => (
            <HospitalCard
              key={hosp._id || hosp.id}
              hospital={hosp}
              isSelected={selectedHospitalId === (hosp._id || hosp.id)}
              onSelect={onSelectHospital}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalList;

