import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface SearchableSelectProps {
    options: string[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    emptyMessage?: string
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    emptyMessage = "No results found.",
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options
        return options.filter((option) =>
            option.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [options, searchQuery])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? options.find((option) => option === value) || value
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                    {filteredOptions.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            {emptyMessage}
                        </div>
                    )}
                    {filteredOptions.map((option) => (
                        <div
                            key={option}
                            className={cn(
                                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                value === option && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                                onChange(option)
                                setOpen(false)
                            }}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === option ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {option}
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
