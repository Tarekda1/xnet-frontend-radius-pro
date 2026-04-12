import React from "react";

type FilterOption = {
  value: string;
  label: string;
};

type FilterPillsProps = {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
  name?: string;
};

const FilterPills: React.FC<FilterPillsProps> = ({ value, onChange, options, className = "", name = "filter-pills" }) => {
  return (
    <div
      className={`flex items-center gap-1 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-card/95 px-1 py-1 ${className}`}
    >
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors cursor-pointer ${
              checked ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
};

export default FilterPills;
