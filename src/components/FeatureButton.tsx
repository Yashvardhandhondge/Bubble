import type { LucideIcon } from "lucide-react"
import { SoonIndicator } from "./SoonIndicator"


const FeatureButton = ({ Icon, label }:any) => (
  <div className="relative">
    <SoonIndicator />
    <div className="relative cursor-pointer shadow-lg hover:bg-gradient-to-tr group via-[#5b1dee90] from-[#5b1dee] to-[#5b1dee] flex flex-col space-y-2 items-center justify-center shadow-[2px_2px_6px_0px_rgba(187, 195, 206, 0.60)] border-[2px] rounded-lg w-[160px] h-[120px] bg-white">
      <div className="bg-[#5B1DEE] p-3 rounded-lg">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-center font-medium leading-none">{label}</div>
    </div>
  </div>
)

export default FeatureButton

