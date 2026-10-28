import type { Ingredient } from '@/types/meal';
import { PersianNumber } from '@/components/common/PersianNumber';

export function IngredientList({ ingredients, textFallback }: { ingredients: Ingredient[]; textFallback?: string }) {
  if (!ingredients.length && textFallback) {
    return <p className="text-sm text-slate-600 leading-relaxed">{textFallback}</p>;
  }
  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
      {ingredients.map((ing) => (
        <li key={ing.id}>
          {ing.name}{' '}
          <span className="text-slate-500">
            (<PersianNumber value={ing.amount} decimals={0} /> {ing.unit})
          </span>
        </li>
      ))}
    </ul>
  );
}
