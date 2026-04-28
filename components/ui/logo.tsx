export function Logo({ className }: { className?: string }) {
  return (
    <div className="relative active:scale-95 transition-all duration-200">
      <img
        src="/logo.svg"
        alt="Logo"
        width={32}
        height={32}
        className={className}
      />
    </div>
  );
}
