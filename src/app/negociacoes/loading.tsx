export default function NegotiationsLoading() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="surface-shadow mb-6 h-40 rounded-[2rem] border border-white/60 bg-white/70" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="surface-shadow h-[26rem] rounded-[2rem] border border-white/60 bg-white/70"
            key={index}
          />
        ))}
      </div>
    </main>
  );
}
