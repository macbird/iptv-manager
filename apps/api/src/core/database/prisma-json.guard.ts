/**
 * Compile-time guard: fails `tsc` when shared JSON types stop matching Prisma Json columns.
 * Do not import this module at runtime.
 */
import type { Prisma } from '@prisma/client';
import {
  buildDefaultOverdueChargeMessages,
  serializeOverdueChargeMessages,
} from '@client-manager/shared';
import { toPrismaInputJson } from './prisma-json.util';

type _AssertChargeTemplates = Prisma.InputJsonValue;
type _AssertOverdueTemplates = Prisma.InputJsonValue;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertPrismaJsonCompatibility: {
  chargeTemplates: _AssertChargeTemplates;
  overdueTemplates: _AssertOverdueTemplates;
} = {
  chargeTemplates: toPrismaInputJson(['template-a', '{{pix}}']),
  overdueTemplates: toPrismaInputJson(
    serializeOverdueChargeMessages(buildDefaultOverdueChargeMessages()),
  ),
};

void _assertPrismaJsonCompatibility;
