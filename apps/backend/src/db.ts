import { IQueryBuilder, startTransaction } from "@undb/persistence"
import { IsolationLevel } from "kysely"

export const withTransaction =
  (qb: IQueryBuilder, level: IsolationLevel = "read committed") =>
  (callback: () => Promise<any>) => {
    return new Promise((resolve) => {
      return qb
        .transaction()
        .setIsolationLevel(level)
        .execute(async (trx) => {
          startTransaction(trx)
          const result = await callback()
          resolve(result)
        })
    })
  }