import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-muted text-foreground hover:bg-muted/80 dark:hover:bg-muted/70",
        /* 镂空：透明底 + 描边同色字 */
        softPrimary:
          "border border-[var(--brand)] bg-transparent text-[var(--brand)] hover:bg-[var(--brand-soft)]",
        softSuccess:
          "border border-[var(--success)] bg-transparent text-[var(--success)] hover:bg-[var(--success-soft)]",
        softDestructive:
          "border border-[var(--danger)] bg-transparent text-[var(--danger)] hover:bg-[var(--danger-soft)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        "default": "h-9 px-4 py-2 has-[>svg]:px-3",
        /* 表格操作镂空：高度略小，内边距保持宽松 */
        "xs": "h-8 gap-1 rounded-[12px] px-3.5 text-[13px] has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        "sm": "h-8 rounded-[12px] gap-1.5 px-3 has-[>svg]:px-2.5",
        "lg": "h-10 rounded-[12px] px-6 has-[>svg]:px-4",
        "icon": "size-9 rounded-[12px]",
        "icon-xs": "size-6 rounded-[10px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[12px]",
        "icon-lg": "size-10 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
