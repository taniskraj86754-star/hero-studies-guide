import { useState } from "react";

interface DiagramPanelProps {
  imageUrl: string;
  title?: string;
}

export default function DiagramPanel({
  imageUrl,
  title = "Diagram",
}: DiagramPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90"
      >
        View Diagram
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">{title}</h2>

              <button
                onClick={() => setOpen(false)}
                className="text-2xl leading-none hover:opacity-70"
              >
                ×
              </button>
            </div>

            <div className="h-[calc(90vh-70px)] flex items-center justify-center bg-gray-50 p-6">
              <img
                src={imageUrl}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
