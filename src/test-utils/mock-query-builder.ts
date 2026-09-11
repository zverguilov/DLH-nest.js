/**
 * A chainable TypeORM QueryBuilder mock. Every non-terminal method returns
 * `this` so `.where().andWhere().leftJoin()...` chains work; terminal methods
 * (getOne, getMany, getRawMany, getRawOne, getCount, execute) are plain
 * jest.fn()s to be configured per-test with mockResolvedValue/mockReturnValue.
 */
export function createMockQueryBuilder(): any {
  const qb: any = {};
  const chainMethods = [
    'where', 'andWhere', 'orWhere', 'leftJoin', 'leftJoinAndSelect',
    'innerJoin', 'innerJoinAndSelect', 'select', 'addSelect', 'orderBy',
    'addOrderBy', 'groupBy', 'addGroupBy', 'skip', 'take', 'limit',
    'insert', 'into', 'values', 'update', 'set', 'delete', 'from',
  ];
  for (const method of chainMethods) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  const terminalMethods = [
    'getOne', 'getOneOrFail', 'getMany', 'getRawMany', 'getRawOne',
    'getCount', 'execute',
  ];
  for (const method of terminalMethods) {
    qb[method] = jest.fn();
  }
  return qb;
}

/** Mocks repository.createQueryBuilder() to return a sequence of query builders in order. */
export function mockCreateQueryBuilderSequence(repository: any, ...builders: any[]): void {
  const fn = jest.fn();
  builders.forEach((b) => fn.mockReturnValueOnce(b));
  repository.createQueryBuilder = fn;
}
