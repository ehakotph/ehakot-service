import sequelize from './database';
import type { Request, Response } from 'express';
import { boolFromStr, buildIncludes, csv, normSortOrder, num, getPrimaryKeyWhere } from '@/utilities/helpers';
import { type IncludeOptions, literal, Model, type ModelStatic, Op, type WhereOptions, type OrderItem } from 'sequelize';

type WhereWithOr = WhereOptions & { [K in typeof Op.or]?: WhereOptions[] };

/**
 * Creates a new record in the database for the given model.
 * Expects the `req.body` to contain the fields for the new record.
 * Uses a transaction to ensure data integrity.
 *
 * @param model - The Sequelize model representing the database table.
 * @returns An Express middleware function that handles the creation request.
 */
export const create =
    (model: ModelStatic<Model>) =>
    async (req: Request, res: Response): Promise<void> => {
        const transaction = await sequelize.transaction();

        try {
            const record = await model.create({ ...req.body }, { transaction });

            await transaction.commit();

            res.status(201).json({ message: `${model.name} created successfully`, data: record });
        } catch (error: unknown) {
            await transaction.rollback();
            res.status(500).json({ message: `${model.name} could not be created.`, data: error instanceof Error ? error.message : String(error) });
        }
    };

/**
 * Updates an existing record in the database.
 * Identifies the record using the primary key derived from the request (e.g., `req.params.id`).
 * Expects the `req.body` to contain the updated fields.
 * Uses a transaction to ensure data integrity.
 *
 * @param model - The Sequelize model representing the database table.
 * @returns An Express middleware function that handles the update request.
 */
export const update =
    (model: ModelStatic<Model>) =>
    async (req: Request, res: Response): Promise<void> => {
        const transaction = await sequelize.transaction();

        try {
            const where = getPrimaryKeyWhere(model, req);
            const record = await model.findOne({ where, transaction });

            if (!record) {
                throw new Error(`${model.name} not found.`);
            }

            const updatedRecord = await record.update(req.body, { transaction });

            await transaction.commit();

            res.status(200).json({ message: `${model.name} has been updated successfully.`, data: updatedRecord });
        } catch (error: unknown) {
            await transaction.rollback();
            res.status(500).json({ message: `${model.name} could not be updated.`, data: error instanceof Error ? error.message : String(error) });
        }
    };

/**
 * Retrieves a single record from the database based on its primary key.
 * Identifies the record using the primary key derived from the request.
 * Supports eager loading of associated models via the `includes` query parameter.
 *
 * @param model - The Sequelize model representing the database table.
 * @returns An Express middleware function that handles the read-one request.
 */
export const readOne =
    (model: ModelStatic<Model>) =>
    async (req: Request, res: Response): Promise<void> => {
        try {
            const where = getPrimaryKeyWhere(model, req) as Record<string, unknown>;

            let include: IncludeOptions[] = [];
            try {
                include = buildIncludes(model, req.query.includes);
            } catch (err) {
                // keep original early-error behavior for bad association paths
                res.status(500).json({ message: `${model.name} could not be retrieved.`, data: err instanceof Error ? err.message : String(err) });
                return;
            }

            const record = await model.findOne({ where, include });

            if (!record) {
                res.status(404).json({ message: `${model.name} does not exist.`, data: false });
                return;
            }

            res.status(200).json({ message: `${model.name} retrieved successfully.`, data: record });
        } catch (error) {
            res.status(500).json({ message: `${model.name} could not be retrieved.`, data: error instanceof Error ? error.message : String(error) });
        }
    };

/**
 * Retrieves a list of records from the database with advanced querying capabilities.
 * 
 * Query Parameters:
 * - `page` (number): The page number for pagination (default: 1).
 * - `limit` (number): The number of records per page (default: 10).
 * - `paginate` (boolean): Whether to enable pagination (default: true).
 * - `searchKeyword` (string): The keyword to search for across specified columns.
 * - `searchColumns` (string): A comma-separated list of columns to search within (required if `searchKeyword` is provided).
 * - `includes` (string): A comma-separated list of associated models to eager-load (e.g., `includes=Profile,Posts`).
 * - `fields` (string): A comma-separated list of specific attributes/columns to retrieve.
 * - `sortBy` (string): The column to sort the results by (default: 'created_at').
 * - `sortOrder` (string): The order of sorting ('ASC' or 'DESC', default: 'DESC').
 * - `random` (boolean): Whether to fetch records in random order (default: false, overrides `sortBy`).
 * - `...rawFilters`: Any other query parameters are treated as exact match filters (e.g., `?status=active`).
 *
 * @param model - The Sequelize model representing the database table.
 * @returns An Express middleware function that handles the read-all request.
 */
export const readAll =
    (model: ModelStatic<Model>) =>
    async (req: Request, res: Response): Promise<void> => {
        try {
            // Extract known params; keep the rest as filters
            const {
                page = '1',
                limit = '10',
                paginate = 'true',
                searchKeyword = '',
                searchColumns = '',
                includes = '',
                fields = '',
                sortBy = 'created_at',
                sortOrder = 'DESC',
                random = 'false',
                ...rawFilters
            } = req.query;

            // Pagination
            const shouldPaginate = boolFromStr(paginate, true);
            const pageNum = shouldPaginate ? num(page, 1) : 1;
            const limitNum = shouldPaginate ? num(limit, 10) : 10;
            const offset = shouldPaginate ? (pageNum - 1) * limitNum : 0;

            // Base filters
            const where: WhereWithOr = { ...(rawFilters as Record<string, unknown>) };

            // Search (requires searchColumns when keyword is provided)
            if (String(searchKeyword).length > 0) {
                const cols = csv(searchColumns);
                if (cols.length === 0) {
                    res.status(400).json({
                        message:
                            'No columns specified for search. Please provide at least one column name in the searchColumns parameter.',
                    });
                    return;
                }
                const kw = String(searchKeyword);

                const orConditions: WhereOptions[] = cols.map((column) =>
                    sequelize.where(sequelize.cast(sequelize.col(column), 'varchar'), { [Op.iLike]: `%${kw}%` })
                );

                // Assign with symbol key safely
                where[Op.or] = orConditions;
            }

            // Includes + field selection
            const includeArr = csv(includes);
            if (String(searchKeyword).length > 0) {
                const cols = csv(searchColumns);
                cols.forEach((col) => {
                    if (col.includes('.')) {
                        const relation = col.substring(0, col.lastIndexOf('.'));
                        if (!includeArr.includes(relation)) {
                            includeArr.push(relation);
                        }
                    }
                });
            }

            const include = buildIncludes(model, includeArr.join(','));
            const attributes = csv(fields);
            const hasAttributes = attributes.length > 0;

            // Sorting (or RANDOM)
            const isRandom = boolFromStr(random, false);
            const orderBy = isRandom ? literal('RANDOM()') : [[String(sortBy), normSortOrder(sortOrder)] as OrderItem];

            // Query options (conditionals via spreads)
            const findAllOptions = {
                where,
                order: orderBy,
                include,
                distinct: true, // Prevents wrong counts when using includes
                col: model.primaryKeyAttribute || 'id',
                ...(shouldPaginate && { limit: limitNum, offset }),
                ...(hasAttributes && { attributes }),
            };

            const { rows: records, count: totalCount } = await model.findAndCountAll(findAllOptions);

            res.status(200).json({
                totalCount,
                data: records,
                message: `${model.name} retrieved successfully.`,
            });
        } catch (error) {
            res.status(500).json({ message: `${model.name} could not be retrieved.`, data: error instanceof Error ? error.message : String(error) });
        }
    };

/**
 * Deletes a single record from the database based on its primary key.
 * Identifies the record using the primary key derived from the request.
 *
 * @param model - The Sequelize model representing the database table.
 * @returns An Express middleware function that handles the delete request.
 */
export const destroy =
    (model: ModelStatic<Model>) =>
    async (req: Request, res: Response): Promise<void> => {
        try {
            const where = getPrimaryKeyWhere(model, req);
            const destroyedRecord = await model.destroy({ where });

            if (destroyedRecord < 1) {
                res.status(404).json({ message: 'Record not found. Failed to delete.', data: false });
                return;
            }

            res.status(200).json({ message: `${model.name} deleted successfully`, data: true });
        } catch (error: unknown) {
            res.status(500).json({ message: `${model.name} could not be deleted.`, data: error instanceof Error ? error.message : String(error) });
        }
    };
