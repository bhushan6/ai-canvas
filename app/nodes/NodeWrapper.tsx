import { Card } from "@/components/ui/card";

export const NodeWrapper = ({
  children,
  selected,
}: {
  children: React.ReactNode;
  selected: boolean;
}) => {
  return (
    <Card
      className={`w-80 mx-auto border-stone-500 border-[0.5px] shadow-2xl ${selected ? "border-2" : ""} my-2`}
    >
      {children}
    </Card>
  );
};
