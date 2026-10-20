import { Invalid, slugify, str, optStr, num, int } from "./admin";

export function cleanCategory(b) {
  const name_en = str(b.name_en, 120);
  if (!name_en) throw new Invalid("English name is required.");
  const slug = slugify(str(b.slug, 120) || name_en);
  if (!slug) throw new Invalid("Slug could not be generated.");
  const sort = b.sort_order === "" || b.sort_order == null ? 0 : int(b.sort_order);
  if (Number.isNaN(sort)) throw new Invalid("Sort order must be a whole number.");
  return { slug, name_en, name_hi: optStr(b.name_hi, 120), emoji: optStr(b.emoji, 8), sort_order: sort, is_active: b.is_active !== false };
}

const TYPES = ["ayurvedic", "homeopathy", "healthcare"];
const SOURCES = ["own", "distributor"];

export function cleanProduct(b) {
  const name_en = str(b.name_en, 200);
  if (!name_en) throw new Invalid("English name is required.");
  const slug = slugify(str(b.slug, 200) || name_en);
  if (!slug) throw new Invalid("Slug could not be generated.");
  const sku = str(b.sku, 60) || slug.slice(0, 60);
  const mrp = num(b.mrp), price = num(b.selling_price);
  if (!(mrp > 0) || mrp > 1_000_000) throw new Invalid("MRP must be a positive amount.");
  if (!(price > 0) || price > mrp) throw new Invalid("Selling price must be positive and not more than MRP.");
  const type = str(b.product_type, 20);
  if (!TYPES.includes(type)) throw new Invalid("Choose a product type.");
  const source = str(b.supply_source, 20) || "own";
  if (!SOURCES.includes(source)) throw new Invalid("Bad supply source.");
  const gst = b.gst_percent === "" || b.gst_percent == null ? 12 : num(b.gst_percent);
  if (!(gst >= 0 && gst <= 28)) throw new Invalid("GST % must be between 0 and 28.");
  const cat = b.category_id === "" || b.category_id == null ? null : int(b.category_id);
  if (Number.isNaN(cat)) throw new Invalid("Bad category.");
  const image = optStr(b.image_url, 1000);
  if (image && !/^https:\/\//i.test(image)) throw new Invalid("Image URL must start with https://");
  return {
    sku, slug, name_en, name_hi: optStr(b.name_hi, 200), category_id: cat, product_type: type,
    description_en: optStr(b.description_en, 4000), description_hi: optStr(b.description_hi, 4000),
    ingredients: optStr(b.ingredients, 4000), usage_info: optStr(b.usage_info, 4000), pack_size: optStr(b.pack_size, 60),
    mrp, selling_price: price, gst_percent: gst, hsn_code: optStr(b.hsn_code, 10), supply_source: source,
    is_active: b.is_active !== false, image,
  };
}

export async function setImage(c, productId, url) {
  await c.query("DELETE FROM product_images WHERE product_id = $1", [productId]);
  if (url) await c.query("INSERT INTO product_images (product_id, url) VALUES ($1, $2)", [productId, url]);
}

export const COLS = ["sku","slug","name_en","name_hi","category_id","product_type","description_en","description_hi","ingredients","usage_info","pack_size","mrp","selling_price","gst_percent","hsn_code","supply_source","is_active"];
