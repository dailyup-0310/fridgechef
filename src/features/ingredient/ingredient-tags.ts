export interface TagGroup {
  label: string;
  tags: string[];
}

export const INGREDIENT_TAG_GROUPS: TagGroup[] = [
  {
    label: "蛋白质",
    tags: ["鸡蛋", "鸡肉", "猪肉", "牛肉", "虾", "豆腐", "三文鱼"],
  },
  {
    label: "蔬菜",
    tags: ["西红柿", "土豆", "洋葱", "胡萝卜", "菠菜", "西兰花", "黄瓜"],
  },
  {
    label: "主食",
    tags: ["米饭", "面条", "面包", "意面"],
  },
];
