import { ShieldAlert } from "lucide-react"

interface PanicModalProps {
  onClose: () => void;
  nearestHospitalName?: string;
  nearestHospitalDistance?: string;
  nearestHospitalPhone?: string;
  nearestHospitalOpenStatus?: string;
}

export function PanicModal({
  onClose,
  nearestHospitalName = "CGHS Inderpuri",
  nearestHospitalDistance = "2.1 km",
  nearestHospitalPhone = "011-25836573",
  nearestHospitalOpenStatus = "Open 24 Hours"
}: PanicModalProps) {
  return (
    <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center bg-destructive/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        <div className="size-24 rounded-full bg-white/20 ring-8 ring-white/30 flex items-center justify-center">
          <ShieldAlert className="size-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">PANIC ATTACK</h2>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            Contacting nearest hospital and sharing your live location...
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <div className="bg-white/10 rounded-2xl px-5 py-3 border border-white/20">
            <p className="text-xs text-white/70 font-medium">Nearest Emergency</p>
            <p className="text-base font-bold text-white mt-0.5">{nearestHospitalName} — {nearestHospitalDistance}</p>
            <p className="text-xs text-white/60 mt-0.5">{nearestHospitalPhone} · {nearestHospitalOpenStatus}</p>
          </div>
          <a
            href="tel:108"
            className="flex items-center justify-center gap-2 bg-white text-destructive font-black text-base py-4 rounded-2xl shadow-lg"
          >
            Call 108 — Ambulance
          </a>
          <button
            onClick={onClose}
            className="text-white/60 text-sm font-semibold underline underline-offset-2 mt-1"
          >
            Cancel — I am safe
          </button>
        </div>
      </div>
    </div>
  )
}
