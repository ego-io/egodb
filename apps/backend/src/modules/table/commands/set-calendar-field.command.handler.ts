import {
  SetCalendarFieldCommand,
  SetCalendarFieldCommandHandler as DomainHandler,
  type ITableRepository,
} from '@egodb/core'
import type { ICommandHandler } from '@nestjs/cqrs'
import { CommandHandler } from '@nestjs/cqrs'
import { InjectTableReposiory } from '../adapters/in-memory'

@CommandHandler(SetCalendarFieldCommand)
export class SetCalendarFieldCommandHandler extends DomainHandler implements ICommandHandler<SetCalendarFieldCommand> {
  constructor(
    @InjectTableReposiory()
    protected readonly repo: ITableRepository,
  ) {
    super(repo)
  }
}
