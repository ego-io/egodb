import { mustGetCurrentSpaceId } from "@undb/context/server"
import { singleton } from "@undb/di"
import type { Mapper } from "@undb/domain"
import { ShareFactory, type IShareDTO, type IShareTarget, type Share as ShareDo } from "@undb/share"
import type { Share } from "../db"

@singleton()
export class ShareMapper implements Mapper<ShareDo, Share, IShareDTO> {
  toDo(entity: Share): ShareDo {
    return ShareFactory.fromJSON({
      id: entity.id,
      target: {
        type: entity.target_type,
        id: entity.target_id,
      } as IShareTarget,
      enabled: entity.enabled,
    })
  }
  toEntity(domain: ShareDo): Share {
    return {
      id: domain.id.value,
      target_id: domain.target.id,
      target_type: domain.target.type,
      space_id: mustGetCurrentSpaceId(),
      enabled: domain.enabled,
    }
  }
  toDTO(entity: Share): IShareDTO {
    return {
      id: entity.id,
      target: {
        id: entity.target_id,
        type: entity.target_type,
      } as IShareTarget,
      enabled: entity.enabled,
    }
  }
}
