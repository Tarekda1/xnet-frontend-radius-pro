import { ArrowUpDown } from "lucide-react";
import { Button } from "./button";

/* helper for sortable column headers */
const HeaderButton: React.FC<{ column: any, children: any, className?: string }> = ({ column, children, className }) => (
    <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={`w-full justify-start hover:bg-gray-100 p-0! ${className}  `}
    >
        {children}
        <ArrowUpDown className="ml-1 h-4 w-4" />
    </Button>
);
export { HeaderButton }
