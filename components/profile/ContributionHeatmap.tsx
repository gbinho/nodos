type ContributionHeatmapProps = {
  days?: number;
};

export function ContributionHeatmap({ days = 84 }: ContributionHeatmapProps) {
  return (
    <section className="border border-gray-800 p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <p className="text-xs tracking-[0.18em] text-gray-400">JORNADA</p>
        <p className="text-xs text-gray-400">0 check-ins</p>
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {Array.from({ length: days }, (_, index) => (
          <div
            key={index}
            className="h-3 w-3 bg-gray-800"
            title="Sem check-in"
          />
        ))}
      </div>
    </section>
  );
}
