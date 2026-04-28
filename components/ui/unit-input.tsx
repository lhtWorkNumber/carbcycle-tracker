import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UnitInputProps = React.ComponentPropsWithoutRef<typeof Input> & {
  label: string;
  unit?: string;
  helper?: string;
  wrapperClassName?: string;
  unitClassName?: string;
};

export function UnitInput({
  label,
  unit,
  helper,
  wrapperClassName,
  unitClassName,
  className,
  id,
  ...props
}: UnitInputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <label htmlFor={inputId} className={cn("block space-y-1.5", wrapperClassName)}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="relative block">
        <Input
          id={inputId}
          className={cn("h-12 rounded-[1.3rem]", unit ? "pr-16" : null, className)}
          {...props}
        />
        {unit ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground",
              unitClassName
            )}
          >
            {unit}
          </span>
        ) : null}
      </span>
      {helper ? <span className="block text-xs text-muted-foreground">{helper}</span> : null}
    </label>
  );
}
