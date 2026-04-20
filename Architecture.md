FridgeChef 架构说明（Architecture）

1. 文档目的

本文档用于定义 FridgeChef 项目的轻量技术架构、核心模块边界、数据模型、目录结构与代码规范，目标包括：

降低 AI 辅助开发过程中的偏差与幻觉风险

统一项目结构与命名方式，避免代码快速失控

为后续扩展提供明确边界，保证项目可维护、可部署、可演进

帮助零开发经验的个人开发者按模块推进，而不是一次性堆叠全部逻辑

该文档不是产品需求文档的替代品，而是对 PRD 的工程落地补充。

2. 架构设计原则

本项目采用适合个人项目的轻量架构，遵循以下原则：

2.1 单体优先，避免过度工程化

项目首期为 Web 端 MVP，采用单仓库、单应用结构，不拆分独立前后端服务。

2.2 页面与业务逻辑分离

页面负责展示和交互，业务逻辑单独拆分到 features 与 lib 中，避免所有代码堆积在页面文件中。

2.3 数据结构先于实现

在生成接口、页面状态与组件实现之前，先定义统一的数据模型，减少 AI 生成代码时的结构混乱。

2.4 接口返回格式统一

所有内部接口返回格式统一，减少前端适配成本与异常场景分支复杂度。

2.5 先跑通核心链路，再做增强能力

优先实现：输入食材 → 生成菜谱 → 展示结果。登录、数据库、收藏、历史记录等不在首期范围。

3. 技术选型

3.1 前端技术栈

Next.js：用于页面开发与服务端能力承载

TypeScript：用于提升类型安全与可维护性

Tailwind CSS：用于快速实现样式系统

shadcn/ui：用于复用基础组件

Framer Motion：用于实现动效与交互过渡

3.2 服务端能力

Next.js API Routes：作为轻量后端层，处理生成请求、参数校验与外部 API 调用

3.3 第三方服务

OpenAI API：负责菜谱生成、食材归一化、热量估算、兜底文案

Pexels API / Unsplash API：负责根据菜名检索真实图片

3.4 部署方案

Vercel：用于 Web 端部署与托管

3.5 当前不引入的能力

以下能力不在首期架构中引入：

数据库

登录鉴权

支付系统

用户历史记录

收藏功能

后续如需支持持久化能力，优先引入 Supabase。

4. 项目目录结构

fridge-chef/
├── public/
│   ├── images/
│   └── icons/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.ts
│   │   │   └── image/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── mode-switch.tsx
│   │   ├── ingredient-input.tsx
│   │   ├── preference-panel.tsx
│   │   ├── generate-bar.tsx
│   │   ├── loading-state.tsx
│   │   ├── recipe-card.tsx
│   │   └── recipe-detail.tsx
│   │
│   ├── features/
│   │   ├── recipe/
│   │   │   ├── recipe-service.ts
│   │   │   ├── recipe-mapper.ts
│   │   │   └── recipe-prompt.ts
│   │   ├── ingredient/
│   │   │   ├── ingredient-normalizer.ts
│   │   │   └── ingredient-tags.ts
│   │   └── mode/
│   │       └── mode-config.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── env.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── types/
│   │   ├── recipe.ts
│   │   ├── ingredient.ts
│   │   └── preference.ts
│   │
│   └── styles/
│
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md

5. 核心模块划分

5.1 页面壳层模块

职责：负责页面布局、模块组合与页面级状态承接。位置：src/app/page.tsx

5.2 模式切换模块

职责：负责日常模式与减脂模式的切换、模式配置差异、切换后的数据清空。位置：src/components/mode-switch.tsx、src/features/mode/mode-config.ts

5.3 食材输入模块

职责：负责食材输入、动态新增输入框、删除输入项、标签快捷输入与基础提示。位置：src/components/ingredient-input.tsx、src/features/ingredient/*

5.4 偏好选择模块

职责：根据模式渲染不同偏好字段，并维护偏好选择结果。位置：src/components/preference-panel.tsx

5.5 菜谱生成模块

职责：接收前端输入，调用 AI 接口，转换结果结构，并补充图片数据。位置：src/app/api/generate/route.ts、src/features/recipe/*

5.6 结果展示模块

职责：负责三张菜谱卡片展示、详情展开、失败提示与重新生成。位置：src/components/recipe-card.tsx、src/components/recipe-detail.tsx 等

6. 数据模型设计

6.1 模式类型

export type Mode = "daily" | "diet";

6.2 食材模型

export interface IngredientItem {
  id: string;
  input: string;
  normalized: string;
}

6.3 日常模式偏好模型

export interface DailyPreferences {
  mealType?: "breakfast" | "main";
  cookTime?: "15" | "30" | "60";
  cuisine?: "中餐" | "西餐" | "日餐" | "韩餐";
  flavor?: "清淡" | "适中" | "重口";
}

6.4 减脂模式偏好模型

export interface DietPreferences {
  mealType?: "breakfast" | "main";
  cookTime?: "15" | "30" | "60";
  calorieTarget?: number;
}

6.5 生成请求模型

export interface GenerateRecipeRequest {
  mode: Mode;
  ingredients: IngredientItem[];
  preferences: DailyPreferences | DietPreferences;
}

6.6 菜谱模型

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  calories?: number;
  imageUrl?: string;
}

6.7 生成响应模型

export interface GenerateRecipeResponse {
  success: boolean;
  recipes: Recipe[];
  message?: string;
  suggestion?: string;
}

6.8 页面状态模型

export interface AppState {
  mode: Mode;
  ingredients: IngredientItem[];
  preferences: DailyPreferences | DietPreferences;
  loading: boolean;
  recipes: Recipe[];
  errorMessage?: string;
}

7. API 设计约定

7.1 接口原则

内部接口统一返回对象

不直接返回裸数组或纯文本

成功与失败状态必须可判断

7.2 推荐响应格式

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

7.3 生成接口

路径：/api/generate

请求体示例：

{
  "mode": "daily",
  "ingredients": [
    { "id": "1", "input": "tomato", "normalized": "西红柿" },
    { "id": "2", "input": "egg", "normalized": "鸡蛋" }
  ],
  "preferences": {
    "mealType": "main",
    "cookTime": "15",
    "cuisine": "中餐",
    "flavor": "清淡"
  }
}

成功响应示例：

{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "r1",
        "name": "番茄炒蛋",
        "ingredients": ["西红柿", "鸡蛋"],
        "steps": ["切番茄", "打鸡蛋", "下锅翻炒"],
        "imageUrl": "https://..."
      }
    ]
  }
}

8. 代码规范建议

8.1 命名规范

文件名：使用小写字母 + 连字符，例如 recipe-card.tsx

组件名：使用大驼峰，例如 RecipeCard

类型名：使用大驼峰，例如 GenerateRecipeRequest

常量：使用全大写或语义化小驼峰，保持统一

8.2 单一职责原则

一个文件只负责一类功能

页面文件不堆叠全部逻辑

Prompt、类型、接口请求、视图组件分开存放

8.3 目录职责明确

components 只放展示组件

features 放业务逻辑

types 放数据结构

lib 放通用工具与封装

8.4 先定义类型，再实现逻辑

在开发新模块时，先定义输入输出结构，再写实现。

8.5 环境变量管理

所有密钥必须放在 .env.local 中，不允许直接写入代码。

示例：

OPENAI_API_KEY=xxx
PEXELS_API_KEY=xxx

8.6 错误处理要求

所有 API 调用必须捕获错误

页面需显示可理解的错误提示

不允许直接将原始报错展示给用户

8.7 AI 输出约束

Prompt 必须要求返回结构化结果

不允许直接使用自由文本作为页面渲染源

推荐 AI 输出 JSON，再由后端统一转换

9. 防止 AI 幻觉与代码失控的约束

本文档的一个核心目标，是在 AI 辅助开发时减少以下风险：

9.1 目录混乱

通过明确目录结构，避免 AI 把所有逻辑都塞进 page.tsx。

9.2 数据结构漂移

通过统一类型定义，避免 AI 每次返回不同字段名或不同结构。

9.3 接口格式不一致

通过统一 API 返回规范，降低前端适配与调试复杂度。

9.4 Prompt 输出不可控

通过先定义目标 JSON 结构，再写 Prompt，减少生成结果不可解析的问题。

9.5 模块职责混乱

通过明确模块边界，避免一个文件同时承担 UI、状态、请求、数据处理等多个职责。

因此，这份文档既是架构说明，也是 AI 辅助编码时的约束文档。

10. 推荐开发顺序

第一阶段：静态页面

完成模式切换、食材输入、偏好选择、生成按钮、结果卡片假数据展示。

第二阶段：接入生成接口

完成 /api/generate 与 OpenAI API 调用，跑通菜谱生成链路。

第三阶段：补充图片能力

根据菜名调用图片 API，补全结果卡片展示。

第四阶段：异常与体验优化

补全 Loading、失败提示、食材不足提示、再来一次、重新开始。

第五阶段：部署上线

完成 Vercel 部署，补充基础访问与交互数据监测。

11. 后续扩展建议

当产品进入下一阶段时，可按以下顺序扩展：

收藏功能

历史记录

登录系统

用户偏好存储

订阅与支付

届时建议引入：

Supabase 作为数据库与鉴权方案

