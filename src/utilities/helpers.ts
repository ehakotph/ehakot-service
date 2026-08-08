import { Model, type ModelStatic, type IncludeOptions, type WhereOptions } from 'sequelize';
import type { Request } from 'express';

export const buildNestedIncludes = (
    model: ModelStatic<Model>,
    includeStr: string,
    attributes?: string[],
): IncludeOptions[] => {
    // split "a.b.c" → ["a","b","c"], trimming & removing empties
    const parts = includeStr
        .split('.')
        .map((s) => s.trim())
        .filter(Boolean);
    const [root, ...rest] = parts;

    if (!root) {
        throw new Error(`Invalid include string: ${includeStr}`);
    }

    // guard: require a valid first association
    const assoc = model.associations?.[root];
    if (!assoc) {
        throw new Error(`Invalid association: ${root}`);
    }

    // current include node
    const node: IncludeOptions = { 
        model: assoc.target,
        as: assoc.as,
    };

    // recurse for remaining path, else apply attributes at the leaf
    if (rest.length > 0) {
        node.include = buildNestedIncludes(assoc.target as ModelStatic<Model>, rest.join('.'), attributes);
    } else if (attributes?.length) {
        node.attributes = attributes;
    }

    return [node];
};

/** Parse comma-separated strings into trimmed tokens. */
export const csv = (v: unknown): string[] =>
    String(v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

/** Safe int parse with default. */
export const num = (v: unknown, d: number): number => {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : d;
};

/** String booleans: 'true'/'false' → boolean (default true for paginate). */
export const boolFromStr = (v: unknown, d: boolean): boolean => (v == null ? d : String(v).toLowerCase() === 'true');

/** Build include[] from query tokens like "a.b" or "a.b:field1,field2". */
export const buildIncludes = (model: ModelStatic<Model>, includes: unknown): IncludeOptions[] =>
    csv(includes).flatMap((tok) => {
        if (tok.includes(':')) {
            const [path = '', fieldsStr = ''] = tok.split(':', 2);
            const fields = csv(fieldsStr);
            return buildNestedIncludes(model, path, fields);
        }
        return buildNestedIncludes(model, tok);
    });

/** Validate and normalize sort order. */
export const normSortOrder = (v: unknown): 'ASC' | 'DESC' =>
    (['ASC', 'DESC'].includes(String(v).toUpperCase()) ? String(v).toUpperCase() : 'DESC') as 'ASC' | 'DESC';

export const getPrimaryKeyWhere = (model: ModelStatic<Model>, req: Request): WhereOptions => {
    const primaryKey = model.primaryKeyAttribute || 'id';
    const id = req.params._id || req.params.id || req.params[primaryKey];
    return id ? { [primaryKey]: id } : { ...req.params };
};