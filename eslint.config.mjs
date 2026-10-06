import convexPlugin from "@convex-dev/eslint-plugin";

export default [
  ...convexPlugin.configs.recommended,
  {
    ignores: ["node_modules/**", "convex/_generated/**"],
  },
];
