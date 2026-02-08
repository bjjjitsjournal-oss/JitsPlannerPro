import { Card, CardContent } from "@/components/ui/card";

interface ProgressChartProps {
  monthlyClasses: number;
}

export default function ProgressChart({ monthlyClasses }: ProgressChartProps) {
  return (
    <div className="h-32 bg-gradient-to-r from-bjj-navy/20 to-bjj-red/20 rounded-lg flex items-end justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-bjj-red rounded-full flex items-center justify-center mb-2">
          <span className="text-white font-bold text-lg">{monthlyClasses}</span>
        </div>
        <p className="text-sm font-medium text-bjj-gray">Classes This Month</p>
      </div>
    </div>
  );
}
