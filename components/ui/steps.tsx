interface Step {
  title: string;
  description: string;
}

interface StepsProps {
  items: Step[];
}

export function Steps({ items }: StepsProps) {
  return (
    <div className="space-y-4">
      {items.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {index + 1}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-lg mb-1">{step.title}</h4>
            <p className="text-muted-foreground">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 