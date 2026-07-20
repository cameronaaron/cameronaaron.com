import type { InternetFeature } from '@/data/internetFeatures';

export type InternetFeatureCategory = InternetFeature['category'];

export const CATEGORY_ORDER: InternetFeatureCategory[] = ['Speaking', 'Media', 'Research', 'Profiles'];

export interface FeatureCategoryGroup {
  category: InternetFeatureCategory;
  items: InternetFeature[];
}

/**
 * Bucket features by category in a single pass (Map lookup, O(n + k)) instead
 * of one filter scan per category (O(n·k)). Input order is preserved within
 * each bucket, so date-sorted input stays date-sorted. Empty categories are
 * dropped so the page renders no empty headings.
 */
export function groupFeaturesByCategory(
  features: InternetFeature[],
  order: InternetFeatureCategory[] = CATEGORY_ORDER
): FeatureCategoryGroup[] {
  const byCategory = new Map<InternetFeatureCategory, InternetFeature[]>();
  for (const category of order) {
    byCategory.set(category, []);
  }
  for (const feature of features) {
    byCategory.get(feature.category)?.push(feature);
  }

  const groups: FeatureCategoryGroup[] = [];
  for (const category of order) {
    const items = byCategory.get(category)!;
    if (items.length > 0) {
      groups.push({ category, items });
    }
  }
  return groups;
}
