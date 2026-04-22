interface PricingHeroProps {
  title: string;
  subtitle: string;
}

export default function PricingHero({ title, subtitle }: PricingHeroProps) {
  return (
    <div className="text-center py-12 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
      <p className="text-xl text-muted-foreground">{subtitle}</p>
    </div>
  );
}
