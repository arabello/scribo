import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/analyze/guidelines", "routes/api/analyze/guidelines.ts"),
  route("api/analyze/checklist", "routes/api/analyze/checklist.ts"),
] satisfies RouteConfig;
