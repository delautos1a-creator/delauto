import { formatPrice } from "@/lib/utils";

interface Props {
  price: number;
  discountPrice?: number | null;
  currency: string;
  className: string;
}

export default function PriceTag({ price, discountPrice, currency, className }: Props) {
  const hasDiscount = discountPrice != null && discountPrice > 0 && discountPrice < price;

  if (!hasDiscount) {
    return (
      <p className={className}>
        {formatPrice(price)} {currency}
      </p>
    );
  }

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <p className={className}>
        {formatPrice(discountPrice)} {currency}
      </p>
      <p className="text-muted-foreground/60 line-through text-sm font-medium">
        {formatPrice(price)} {currency}
      </p>
    </div>
  );
}
