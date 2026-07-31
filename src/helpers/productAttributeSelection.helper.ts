import { Types } from 'mongoose';
import { BadRequestError } from '../errors';
import { ProductAttributeSelection, ProductDocument } from '../models/product.model';

export interface SelectedOptionInput {
  attribute: string;
  option: string;
}

// `entry.attribute` is an ObjectId when read straight off the DB, but a full populated
// ProductAttribute document once `.populate('attributeOptions.attribute')` has run (as the
// cart response does, so the client can resolve option display names) — normalize either
// shape to its id string.
function attributeIdOf(attribute: Types.ObjectId | { _id: Types.ObjectId }): string {
  return (attribute as { _id?: Types.ObjectId })._id?.toString() ?? attribute.toString();
}

/**
 * Validates client-supplied `selectedOptions` against a product's configured
 * attribute/option/priceAdjustment list, then returns them normalized (sorted by
 * attribute id) so two selections of the same options always compare/store identically
 * regardless of the order the client sent them in.
 *
 * Rules enforced:
 * - every selected (attribute, option) pair must be one this product actually configured
 * - every attribute the product configures at least one option for must have exactly one
 *   selection (a product with Texture options configured can't be added to cart without
 *   picking a texture)
 * - no attribute may be selected twice
 */
export function validateSelectedOptions(product: ProductDocument, selectedOptions: SelectedOptionInput[] | undefined, functionName: string): SelectedOptionInput[] {
  const input = selectedOptions ?? [];
  const configuredByAttribute = new Map<string, ProductAttributeSelection[]>();
  for (const entry of product.attributeOptions) {
    const key = attributeIdOf(entry.attribute);
    if (!configuredByAttribute.has(key)) configuredByAttribute.set(key, []);
    configuredByAttribute.get(key)!.push(entry);
  }

  const seenAttributes = new Set<string>();
  for (const selection of input) {
    if (seenAttributes.has(selection.attribute)) {
      throw new BadRequestError(`Attribute ${selection.attribute} was selected more than once`, functionName);
    }
    seenAttributes.add(selection.attribute);

    const options = configuredByAttribute.get(selection.attribute);
    const match = options?.find((entry) => entry.option.toString() === selection.option);
    if (!match) {
      throw new BadRequestError('Selected option is not available for this product', functionName);
    }
  }

  const missing = [...configuredByAttribute.keys()].filter((attributeId) => !seenAttributes.has(attributeId));
  if (missing.length > 0) {
    throw new BadRequestError('Please select an option for every available product setting', functionName);
  }

  return [...input].sort((a, b) => a.attribute.localeCompare(b.attribute));
}

export function computeUnitPrice(product: ProductDocument, selectedOptions: SelectedOptionInput[]): number {
  let price = product.price;
  for (const selection of selectedOptions) {
    const match = product.attributeOptions.find(
      (entry) => attributeIdOf(entry.attribute) === selection.attribute && entry.option.toString() === selection.option,
    );
    if (match) price += match.priceAdjustment;
  }
  return price;
}

export function sameSelectedOptions(a: SelectedOptionInput[], b: { attribute: Types.ObjectId; option: Types.ObjectId }[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((entry, index) => entry.attribute === b[index].attribute.toString() && entry.option === b[index].option.toString());
}
