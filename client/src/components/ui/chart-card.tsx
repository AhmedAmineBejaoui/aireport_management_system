import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface ChartCardProps {
  title: string;
  filter?: {
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  };
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function ChartCard({
  title,
  filter,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {filter && (
            <Select
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {action}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[250px] w-full">{children}</div>
      </CardContent>
    </Card>
  );
}
