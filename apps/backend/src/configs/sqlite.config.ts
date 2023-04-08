import { Inject } from '@nestjs/common'
import { registerAs } from '@nestjs/config'

export const InjectSqliteConfig = () => Inject(sqliteConfig.KEY)

export const sqliteConfig = registerAs('sqlite', () => ({
  data: process.env.EGODB_DATABASE_SQLITE_DATA,
}))
