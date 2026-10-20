import Link from "next/link";
import { computeRecipe, labelIngredients, netContentsForSize, UNIT_LABELS, type RecipeLine } from "@/lib/core";
import { cosmeticsPack } from "@/lib/packs/cosmetics";

/** A sample recipe, run through the real label engine on every page load. */
const SAMPLE: RecipeLine[] = [
  { amount: "12", unit: "oz", text: "Shea butter" },
  { amount: "1/2", unit: "cup", text: "Sweet almond oil" },
  { amount: "2", unit: "tbsp", text: "White beeswax" },
  { amount: "1", unit: "tsp", text: "Vitamin E oil" },
  { amount: "10", unit: "drop", text: "Lavender essential oil", variety: { group: "lavender", variety: "true" } },
];

export default function Home() {
  const recipe = computeRecipe(SAMPLE, cosmeticsPack);
  const ingredients = labelIngredients(recipe, cosmeticsPack);

  return (
    <main className="wrap">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <span>Verabatch</span>
      </div>

      <h1>Correct labels for small-batch makers.</h1>
      <p className="lead">
        Type your recipe the way you make it. Verabatch does the conversions, the official ingredient names and the
        label rules, and keeps a record of every batch.
      </p>
      <Link href="/app" className="btn pri cta">
        Sign in or create an account
      </Link>

      <section className="card" aria-labelledby="try">
        <h2 id="try">Sample recipe</h2>
        <ul className="recipe">
          {SAMPLE.map((l) => (
            <li key={l.text}>
              <span className="amt">
                {l.amount} {UNIT_LABELS[l.unit]}
              </span>
              <span>{l.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="out">
        <h2 id="out">What goes on the label (4 oz jar)</h2>
        <div className="lbl">
          <div className="nm">Midnight Garden</div>
          <div>Whipped Body Butter</div>
          <div>{netContentsForSize(4, "oz")}</div>
          <div>
            <b>Ingredients:</b> {ingredients.map((i) => i.name).join(", ")}.
          </div>
          <div className="mono">Lot MG-261020-1</div>
        </div>
        {recipe.anyApproximate && (
          <p className="note">
            Cups, spoons and drops are converted to weight with typical values, so the batch weight is close, not exact.
          </p>
        )}
      </section>

      <footer>Verabatch is in early development. Sample only; check every label before you print.</footer>
    </main>
  );
}
