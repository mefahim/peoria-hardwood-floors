import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-accent">
          {align === "center" && <span className="h-px w-6 bg-accent" />}
          {eyebrow}
          <span className="h-px w-6 bg-accent" />
        </p>
      ) : null}
      <h2 className="font-serif text-3xl leading-[1.1] text-balance md:text-4xl lg:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">{description}</p> : null}
    </div>
  )
}
