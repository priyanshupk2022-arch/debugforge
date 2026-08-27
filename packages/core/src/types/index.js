"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VulnerabilityCategorySchema = void 0;
const zod_1 = require("zod");
exports.VulnerabilityCategorySchema = zod_1.z.enum([
    'COMMAND_INJECTION',
    'PROTOTYPE_POLLUTION',
    'BROKEN_AUTH_IDOR',
]);
