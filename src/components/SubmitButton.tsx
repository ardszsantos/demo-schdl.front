interface SubmitButtonProps {
  isPending: boolean
  label: string
  pendingLabel: string
}

export function SubmitButton({ isPending, label, pendingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending && (
        <svg
          className="size-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {isPending ? pendingLabel : label}
    </button>
  )
}
