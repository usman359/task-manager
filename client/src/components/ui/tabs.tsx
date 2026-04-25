import * as React from "react"
import { Tabs as TabsRoot } from "radix-ui"
import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsRoot.Root>) {
  return <TabsRoot.Root data-slot="tabs" className={cn("flex w-full flex-col gap-2", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsRoot.List>) {
  return (
    <TabsRoot.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 w-full min-w-0 max-w-full items-center justify-start gap-0.5 overflow-x-auto rounded-lg bg-muted/40 p-1 text-muted-foreground",
        "sm:justify-center",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsRoot.Trigger>) {
  return (
    <TabsRoot.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap ring-offset-background transition-all",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsRoot.Content>) {
  return (
    <TabsRoot.Content
      data-slot="tabs-content"
      className={cn("mt-2 min-h-[120px] w-full flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
