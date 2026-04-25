type Props = { text: string | null }

export function ErrorBanner(props: Props) {
  if (!props.text) return null
  return (
    <p
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {props.text}
    </p>
  )
}
