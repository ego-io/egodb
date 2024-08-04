import type { IInvitationRepository, InvitationCompositeSpecification, InvitationDo } from "@undb/authz"
import { mustGetCurrentSpaceId } from "@undb/context/server"
import { singleton } from "@undb/di"
import { getCurrentTransaction } from "../ctx"
import { InvitationMutationVisitor } from "./invitation.mutation-visitor"

@singleton()
export class InvitationRepository implements IInvitationRepository {
  async deleteOneById(id: string): Promise<void> {
    const trx = getCurrentTransaction()

    await trx.deleteFrom("undb_invitation").where("id", "=", id).execute()
  }

  async updateOneById(id: string, spec: InvitationCompositeSpecification): Promise<void> {
    const trx = getCurrentTransaction()

    await trx
      .updateTable("undb_invitation")
      .set((eb) => {
        const visitor = new InvitationMutationVisitor()
        spec.accept(visitor)
        return visitor.data
      })
      .where("id", "=", id)
      .execute()
  }

  async upsert(invitation: InvitationDo): Promise<void> {
    const trx = getCurrentTransaction()

    await trx
      .insertInto("undb_invitation")
      .values({
        id: invitation.id.value,
        email: invitation.email,
        space_id: mustGetCurrentSpaceId(),
        role: invitation.role,
        status: invitation.status,
        invited_at: invitation.invitedAt,
        inviter_id: invitation.inviterId,
      })
      .onConflict((oc) =>
        oc.columns(["id", "email"]).doUpdateSet({
          invited_at: new Date(),
          status: invitation.status,
          role: invitation.role,
        }),
      )
      .execute()
  }

  async insert(invitation: InvitationDo): Promise<void> {
    const trx = getCurrentTransaction()

    await trx
      .insertInto("undb_invitation")
      .values({
        id: invitation.id.value,
        email: invitation.email,
        space_id: mustGetCurrentSpaceId(),
        role: invitation.role,
        status: invitation.status,
        invited_at: invitation.invitedAt,
        inviter_id: invitation.inviterId,
      })
      .execute()
  }
}
