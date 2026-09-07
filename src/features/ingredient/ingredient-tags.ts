export interface TagGroup {
  label: string;
  tags: string[];
}

export const INGREDIENT_TAG_GROUPS: TagGroup[] = [
  {
    label: "Protein",
    tags: ["Eggs", "Chicken", "Pork", "Beef", "Shrimp", "Tofu", "Salmon"],
  },
  {
    label: "Vegetables",
    tags: ["Tomatoes", "Potatoes", "Onion", "Carrots", "Spinach", "Broccoli", "Cucumber"],
  },
  {
    label: "Staples",
    tags: ["Rice", "Noodles", "Bread", "Pasta"],
  },
];
