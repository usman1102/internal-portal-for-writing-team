import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: "primary" | "secondary" | "warning" | "success";
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  iconColor,
  className,
}: StatsCardProps) {
  const getIconColorClass = () => {
    switch (iconColor) {
      case "primary":
        return "bg-primary-light text-white";
      case "secondary":
        return "bg-secondary-light text-white";
      case "warning":
        return "bg-warning text-white";
      case "success":
        return "bg-success text-white";
      default:
        return "bg-primary-light text-white";
    }
  };

  return (
    <div className={cn("bg-white rounded-lg shadow p-5 flex items-center", className)}>
      <div className={cn("rounded-full h-12 w-12 flex items-center justify-center", getIconColorClass())}>
        {icon}
      </div>
      <div className="ml-4">
        <h4 className="text-gray-500 text-sm">{title}</h4>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
