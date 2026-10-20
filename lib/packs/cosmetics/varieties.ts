/**
 * Botanicals that need a question before they can be labeled correctly:
 * "chamomile" could be German or Roman, essential oil or dried flowers.
 *
 * DRAFT: label names are typical published values; check each against CosIng
 * (and later wINCI) before launch.
 */

export type FormKey = "eo" | "flower" | "infused" | "hydrosol" | "extract";

export interface Form {
  label: string;
  /** Word used when building the display name: "German chamomile essential oil". */
  suffix: string;
  density: number;
  /** Words in what the maker typed that point to this form. */
  keywords: string[];
}

export const FORMS: Record<FormKey, Form> = {
  eo: { label: "Essential oil", suffix: "essential oil", density: 0.9, keywords: ["essential oil", "eo", "oil", "absolute"] },
  flower: { label: "Dried flowers, leaves or bark", suffix: "(dried)", density: 0.3,
    keywords: ["flower", "flowers", "buds", "petals", "dried", "herb", "leaf", "leaves", "tea", "sticks", "ground", "powder"] },
  infused: { label: "Infused oil", suffix: "infused oil", density: 0.91, keywords: ["infused", "infusion", "macerated", "macerate"] },
  hydrosol: { label: "Hydrosol (floral water)", suffix: "hydrosol", density: 1.0, keywords: ["hydrosol", "floral water", "water"] },
  extract: { label: "CO2 or extract", suffix: "extract", density: 0.95, keywords: ["co2", "extract"] },
};

/**
 * Order to test form keywords in: most specific first, so "infused oil" isn't
 * read as essential oil, and "cinnamon leaf oil" is an oil, not dried leaves.
 */
export const FORM_DETECT_ORDER: FormKey[] = ["infused", "hydrosol", "extract", "eo", "flower"];

export interface Carrier {
  key: string;
  label: string;
  keywords: string[];
  labelName: string;
}

export const CARRIERS: Carrier[] = [
  { key: "olive", label: "Olive oil", keywords: ["olive", "evoo"], labelName: "Olea Europaea (Olive) Fruit Oil" },
  { key: "sunflower", label: "Sunflower oil", keywords: ["sunflower"], labelName: "Helianthus Annuus (Sunflower) Seed Oil" },
  { key: "almond", label: "Sweet almond oil", keywords: ["almond"], labelName: "Prunus Amygdalus Dulcis (Sweet Almond) Oil" },
  { key: "jojoba", label: "Jojoba oil", keywords: ["jojoba"], labelName: "Simmondsia Chinensis (Jojoba) Seed Oil" },
  { key: "fco", label: "Fractionated coconut oil", keywords: ["fractionated", "mct"], labelName: "Caprylic/Capric Triglyceride" },
  { key: "avocado", label: "Avocado oil", keywords: ["avocado"], labelName: "Persea Gratissima (Avocado) Oil" },
  { key: "apricot", label: "Apricot kernel oil", keywords: ["apricot"], labelName: "Prunus Armeniaca (Apricot) Kernel Oil" },
];

export interface Variety {
  key: string;
  label: string;
  latin: string;
  keywords: string[];
  /** Plant part name; form suffixes are added to it (" Oil", " Water", " Extract"). */
  base: string;
  /** Essential oil name when it isn't simply base + " Oil". */
  eo?: string;
  /** Only these forms exist for this variety. */
  only?: FormKey[];
  note?: string;
}

export interface VarietyGroup {
  key: string;
  triggers: string[];
  /** Phrases that contain a trigger but mean something else ("rose hip" isn't rose). */
  exclude?: string[];
  question: string;
  forms: FormKey[];
  varieties: Variety[];
}

export const VARIETY_GROUPS: VarietyGroup[] = [
  { key: "chamomile", triggers: ["chamomile", "camomile"], question: "Which chamomile?", forms: ["eo", "flower", "infused", "hydrosol", "extract"], varieties: [
    { key: "german", label: "German chamomile", latin: "Matricaria chamomilla", keywords: ["german", "blue", "matricaria"], base: "Chamomilla Recutita (Matricaria) Flower", note: "Deep blue oil. The flower most chamomile teas use." },
    { key: "roman", label: "Roman chamomile", latin: "Chamaemelum nobile", keywords: ["roman", "anthemis", "nobilis", "english"], base: "Anthemis Nobilis Flower", note: "Pale oil with a sweet, apple-like scent." },
    { key: "moroccan", label: "Moroccan chamomile", latin: "Cladanthus mixtus", keywords: ["moroccan", "wild", "ormenis"], base: "Ormenis Multicaulis", eo: "Ormenis Multicaulis Oil", only: ["eo"], note: "Sold as chamomile but a different plant. Usually only as essential oil." },
  ] },
  { key: "lavender", triggers: ["lavender", "lavandin"], question: "Which lavender?", forms: ["eo", "flower", "infused", "hydrosol"], varieties: [
    { key: "true", label: "True lavender", latin: "Lavandula angustifolia", keywords: ["true", "angustifolia", "officinalis", "fine", "bulgarian", "high altitude"], base: "Lavandula Angustifolia (Lavender) Flower", eo: "Lavandula Angustifolia (Lavender) Oil", note: "The classic. Most bottles labeled just \"lavender\" are this." },
    { key: "lavandin", label: "Lavandin", latin: "Lavandula × intermedia", keywords: ["lavandin", "grosso", "intermedia", "hybrida"], base: "Lavandula Hybrida Flower", eo: "Lavandula Hybrida Oil", note: "A sharper, cheaper hybrid. Sometimes sold as plain \"lavender.\"" },
    { key: "spike", label: "Spike lavender", latin: "Lavandula latifolia", keywords: ["spike", "latifolia"], base: "Lavandula Latifolia Flower", eo: "Lavandula Latifolia (Spike Lavender) Oil", note: "Camphor-like, more medicinal smell." },
  ] },
  { key: "eucalyptus", triggers: ["eucalyptus"], question: "Which eucalyptus?", forms: ["eo"], varieties: [
    { key: "globulus", label: "Eucalyptus globulus", latin: "Eucalyptus globulus", keywords: ["globulus", "blue gum"], base: "Eucalyptus Globulus Leaf", eo: "Eucalyptus Globulus Leaf Oil", note: "The common, strong one." },
    { key: "radiata", label: "Eucalyptus radiata", latin: "Eucalyptus radiata", keywords: ["radiata", "narrow"], base: "Eucalyptus Radiata Leaf", eo: "Eucalyptus Radiata Leaf Oil", note: "Softer and gentler." },
    { key: "lemon", label: "Lemon eucalyptus", latin: "Corymbia citriodora", keywords: ["lemon", "citriodora"], base: "Eucalyptus Citriodora", eo: "Eucalyptus Citriodora Oil", note: "Lemony. Calling it a bug repellent is an EPA claim." },
  ] },
  { key: "frankincense", triggers: ["frankincense", "boswellia", "olibanum"], question: "Which frankincense?", forms: ["eo"], varieties: [
    { key: "carterii", label: "Frankincense carterii", latin: "Boswellia carterii", keywords: ["carterii", "somali", "somalian"], base: "Boswellia Carterii", eo: "Boswellia Carterii Oil", note: "The most common one sold." },
    { key: "serrata", label: "Frankincense serrata", latin: "Boswellia serrata", keywords: ["serrata", "indian"], base: "Boswellia Serrata", eo: "Boswellia Serrata Oil", note: "Indian frankincense." },
    { key: "sacra", label: "Frankincense sacra", latin: "Boswellia sacra", keywords: ["sacra", "omani", "sacred", "hojari"], base: "Boswellia Sacra", eo: "Boswellia Sacra Oil", note: "Omani frankincense." },
  ] },
  { key: "rose", triggers: ["rose"], exclude: ["rose hip", "rosehip", "rose geranium", "rosemary", "rosewood"], question: "Which rose?", forms: ["eo", "flower", "hydrosol"], varieties: [
    { key: "damascena", label: "Damask rose", latin: "Rosa damascena", keywords: ["damascena", "damask", "bulgarian", "turkish"], base: "Rosa Damascena Flower", note: "The classic rose oil and rose water." },
    { key: "centifolia", label: "Cabbage rose", latin: "Rosa centifolia", keywords: ["centifolia", "cabbage", "may rose"], base: "Rosa Centifolia Flower", note: "Often sold as rose absolute." },
  ] },
  { key: "mint", triggers: ["mint", "peppermint", "spearmint"], question: "Which mint?", forms: ["eo", "flower"], varieties: [
    { key: "pepper", label: "Peppermint", latin: "Mentha × piperita", keywords: ["peppermint", "piperita"], base: "Mentha Piperita (Peppermint) Leaf", eo: "Mentha Piperita (Peppermint) Oil", note: "Strong and cooling." },
    { key: "spear", label: "Spearmint", latin: "Mentha spicata", keywords: ["spearmint", "spicata"], base: "Mentha Viridis (Spearmint) Leaf", eo: "Mentha Viridis (Spearmint) Leaf Oil", note: "Sweeter and softer." },
  ] },
  { key: "orange", triggers: ["orange"], exclude: ["orange blossom", "neroli", "orange flower water"], question: "Which orange?", forms: ["eo"], varieties: [
    { key: "sweet", label: "Sweet orange", latin: "Citrus sinensis", keywords: ["sweet", "sinensis", "dulcis"], base: "Citrus Aurantium Dulcis (Orange) Peel", eo: "Citrus Aurantium Dulcis (Orange) Peel Oil", note: "The everyday orange oil." },
    { key: "bitter", label: "Bitter orange", latin: "Citrus aurantium", keywords: ["bitter", "amara", "seville"], base: "Citrus Aurantium Amara (Bitter Orange) Peel", eo: "Citrus Aurantium Amara (Bitter Orange) Peel Oil", note: "Cold-pressed bitter orange can make skin sun-sensitive." },
  ] },
  { key: "cedarwood", triggers: ["cedarwood", "cedar"], question: "Which cedarwood?", forms: ["eo"], varieties: [
    { key: "atlas", label: "Atlas cedarwood", latin: "Cedrus atlantica", keywords: ["atlas", "atlantica"], base: "Cedrus Atlantica Bark", eo: "Cedrus Atlantica Bark Oil", note: "Warm and sweet." },
    { key: "virginia", label: "Virginian cedarwood", latin: "Juniperus virginiana", keywords: ["virginia", "virginian", "red cedar"], base: "Juniperus Virginiana", eo: "Juniperus Virginiana Oil", note: "Pencil-shavings scent. Technically a juniper." },
    { key: "himalayan", label: "Himalayan cedarwood", latin: "Cedrus deodara", keywords: ["himalayan", "deodara"], base: "Cedrus Deodara Wood", eo: "Cedrus Deodara Wood Oil", note: "Smoky and dry." },
  ] },
  { key: "sage", triggers: ["sage"], question: "Which sage?", forms: ["eo", "flower"], varieties: [
    { key: "clary", label: "Clary sage", latin: "Salvia sclarea", keywords: ["clary", "sclarea"], base: "Salvia Sclarea Leaf", eo: "Salvia Sclarea (Clary) Oil", note: "Musky and floral." },
    { key: "garden", label: "Garden sage", latin: "Salvia officinalis", keywords: ["garden", "common", "dalmatian", "officinalis"], base: "Salvia Officinalis (Sage) Leaf", eo: "Salvia Officinalis (Sage) Oil", note: "Herbal. The oil is strong; use sparingly." },
  ] },
  { key: "cinnamon", triggers: ["cinnamon", "cassia"], question: "Which cinnamon?", forms: ["eo", "flower"], varieties: [
    { key: "bark", label: "Cinnamon bark", latin: "Cinnamomum verum", keywords: ["bark", "ceylon"], base: "Cinnamomum Zeylanicum Bark", eo: "Cinnamomum Zeylanicum Bark Oil", note: "A strong skin irritant. Very low limits on skin." },
    { key: "leaf", label: "Cinnamon leaf", latin: "Cinnamomum verum", keywords: ["leaf"], base: "Cinnamomum Zeylanicum Leaf", eo: "Cinnamomum Zeylanicum Leaf Oil", note: "Gentler than bark, still use low." },
    { key: "cassia", label: "Cassia", latin: "Cinnamomum cassia", keywords: ["cassia", "chinese"], base: "Cinnamomum Cassia Bark", eo: "Cinnamomum Cassia Leaf Oil", note: "What most US grocery cinnamon actually is." },
  ] },
  { key: "calendula", triggers: ["calendula", "marigold"], question: "Calendula as...", forms: ["infused", "flower", "extract"], varieties: [
    { key: "officinalis", label: "Calendula", latin: "Calendula officinalis", keywords: [], base: "Calendula Officinalis Flower" },
  ] },
];
