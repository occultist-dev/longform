import typescript from "@rollup/plugin-typescript";
import type {RollupOptions} from "rollup";

const rollupConfig: RollupOptions[] = [
  {
    input: "lib/mod.ts",
    output: {
      file: "dist/longform.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [typescript()],
  },
  {
    input: "lib/mod.ts",
    output: {
      file: "dist/longform.min.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [typescript({
      tsconfig: 'tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
    })],
  },
];

export default rollupConfig;
