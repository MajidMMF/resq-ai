import React, { useRef } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

export const Step2Evidence = ({ formData, updateForm, nextStep, prevStep }) => {
  const fileInputRef = useRef(null);
  const { images } = formData;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Convert file to local preview URLs
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    updateForm({ images: [...images, ...newImages].slice(0, 4) });
    toast.success(`${files.length} evidence photo(s) added`);
  };

  const handleRemoveImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    updateForm({ images: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Scene Photos (Optional)</h3>
        <p className="text-xs text-dark-400">
          Photographs help ResQ AI vision models gauge trauma severity and vehicle entanglement.
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Upload Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-6 rounded-2xl border-2 border-dashed border-dark-600 hover:border-cyan-400/80 bg-dark-800/40 hover:bg-dark-800/80 flex flex-col items-center justify-center text-center transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-white">Capture / Upload Photo</span>
          <span className="text-[10px] text-dark-400 mt-1">JPEG, PNG up to 10MB (Max 4)</span>
        </button>

        {/* Info card */}
        <div className="p-4 rounded-2xl bg-dark-800/40 border border-dark-700/60 flex flex-col justify-center">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            Privacy & Security
          </h4>
          <p className="text-[11px] text-dark-300 leading-relaxed">
            All captured photos are sent via encrypted connection directly to the emergency triage
            agent for automated triage extraction.
          </p>
        </div>
      </div>

      {/* Preview Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-dark-600 group">
              <img src={img.preview} alt="Accident evidence" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-dark-950/80 text-emergency-400 hover:bg-emergency-500 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-700">
        <button
          type="button"
          onClick={prevStep}
          className="px-5 py-2.5 rounded-xl border border-dark-600 hover:bg-dark-700 text-xs font-semibold text-dark-300"
        >
          &larr; Back
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="px-8 py-3 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white font-bold text-xs shadow-lg shadow-emergency-600/30 transition active:scale-95"
        >
          Next: Describe Scene &rarr;
        </button>
      </div>
    </div>
  );
};

export default Step2Evidence;

