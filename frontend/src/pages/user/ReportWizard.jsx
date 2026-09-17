import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useCreateIncidentMutation } from "../../features/incidents/incidentsApi";
import { useAnalyzeIncidentMutation } from "../../features/ai/aiApi";
import { setActiveIncident } from "../../features/incidents/incidentsSlice";
import useGeolocation from "../../hooks/useGeolocation";
import PageHeader from "../../components/shared/PageHeader";
import Step1WhatWhere from "./report/Step1WhatWhere";
import Step2Evidence from "./report/Step2Evidence";
import Step3Describe from "./report/Step3Describe";
import Step4Contact from "./report/Step4Contact";
import Step5Confirm from "./report/Step5Confirm";
import { toast } from "sonner";
import { Shield, Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Type & Scene" },
  { id: 2, label: "Evidence" },
  { id: 3, label: "Description" },
  { id: 4, label: "Contacts" },
  { id: 5, label: "Review" },
];

export const ReportWizard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const preselectedType = searchParams.get("type") || "ROAD_ACCIDENT";
  const { latitude, longitude, accuracy } = useGeolocation();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: preselectedType,
    location: { lat: latitude, lng: longitude, accuracy },
    images: [],
    description: "",
    contact: { name: "", phone: "" },
  });

  // Sync GPS once locked
  useEffect(() => {
    if (latitude && longitude) {
      setFormData((prev) => ({
        ...prev,
        location: { lat: latitude, lng: longitude, accuracy },
      }));
    }
  }, [latitude, longitude, accuracy]);

  const [createIncident, { isLoading: isCreating }] = useCreateIncidentMutation();
  const [analyzeIncident] = useAnalyzeIncidentMutation();

  const updateForm = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    try {
      // 1. Create Incident in DB
      const res = await createIncident({
        description: formData.description || `${formData.type} incident reported`,
        location: {
          lat: formData.location.lat,
          lng: formData.location.lng,
          latitude: Number(formData.location.lat),
          longitude: Number(formData.location.lng),
          lat: Number(formData.location.lat),
          lng: Number(formData.location.lng),
          accuracy: formData.location.accuracy || 2,
        },
      }).unwrap();

      const createdIncident = res?.data || res;
      const incidentId = createdIncident._id || createdIncident.id;

      if (!incidentId) {
        throw new Error("Could not retrieve incident identifier");
      }

      dispatch(setActiveIncident(createdIncident));
      toast.success("Emergency incident reported. Activating AI triage...");

      // 2. Trigger AI analysis in background
      try {
        const aiFormData = new FormData();
        aiFormData.append("incidentId", incidentId);
        aiFormData.append(
          "description",
          formData.description || `${formData.type} emergency scene`
        );
        aiFormData.append(
          "location",
          JSON.stringify({ lat: formData.location.lat, lng: formData.location.lng })
        );

        if (formData.images.length > 0 && formData.images[0].file) {
          aiFormData.append("image", formData.images[0].file);
        }

        analyzeIncident(aiFormData);
      } catch (aiErr) {
        console.warn("AI analysis trigger error:", aiErr);
      }

      // 3. Navigate directly to Emergency Live Tracker
      navigate(`/emergency/${incidentId}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit emergency report. Please call 112 directly.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Report Emergency"
        subtitle="Follow the 5 steps to dispatch emergency teams and notify nearby trauma centers."
      />

      {/* Progress Stepper Bar */}
      <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700/80 shadow-lg">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-dark-700 w-full z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-emergency-500 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((s) => {
            const isDone = s.id < step;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isDone
                      ? "bg-cyan-500 text-dark-950 shadow-md shadow-cyan-500/30"
                      : isCurrent
                      ? "bg-emergency-600 text-white ring-4 ring-emergency-500/20 shadow-md shadow-emergency-600/40"
                      : "bg-dark-800 border border-dark-600 text-dark-400"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
                </div>
                <span
                  className={`text-[10px] font-mono mt-1.5 hidden sm:block ${
                    isCurrent ? "text-white font-bold" : "text-dark-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Components Container */}
      <div className="p-6 sm:p-8 rounded-2xl bg-dark-900/90 border border-dark-700 shadow-2xl">
        {step === 1 && (
          <Step1WhatWhere formData={formData} updateForm={updateForm} nextStep={nextStep} />
        )}
        {step === 2 && (
          <Step2Evidence
            formData={formData}
            updateForm={updateForm}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {step === 3 && (
          <Step3Describe
            formData={formData}
            updateForm={updateForm}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {step === 4 && (
          <Step4Contact
            formData={formData}
            updateForm={updateForm}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {step === 5 && (
          <Step5Confirm
            formData={formData}
            onSubmit={handleSubmit}
            prevStep={prevStep}
            isSubmitting={isCreating}
          />
        )}
      </div>
    </div>
  );
};

export default ReportWizard;

