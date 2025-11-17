#!/bin/bash

pnpm build
pnpm pack --out=package.tgz
pnpm publish --access=public

