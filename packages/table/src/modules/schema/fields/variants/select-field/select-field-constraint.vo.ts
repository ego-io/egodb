import { z } from "@undb/zod"
import { FieldConstraintVO, baseFieldConstraint } from "../../field-constraint.vo"
import { optionId } from "../../option/option-id.vo"

export const selectFieldConstraint = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })
  .merge(baseFieldConstraint)
  .partial()
  .refine((v) => v.min === undefined || v.max === undefined || v.min <= v.max, {
    message: "min should be less than or equal to max",
  })

export type ISelectFieldConstraint = z.infer<typeof selectFieldConstraint>

export class SelectFieldConstraint extends FieldConstraintVO<ISelectFieldConstraint> {
  constructor(dto: ISelectFieldConstraint) {
    super({ required: dto.required, max: dto.max })
  }

  public get isSingle() {
    return this.props.max === 1
  }

  override get schema() {
    if (this.isSingle) {
      let base: z.ZodTypeAny = optionId

      if (!this.props.required) {
        base = base.optional().nullable()
      }

      return base
    } else {
      let base = optionId.array()

      if (this.props.required) {
        base = base.min(1)
      }
      if (this.props.min) {
        base = base.min(this.props.min)
      }

      if (this.props.max) {
        base = base.max(this.props.max)
      }

      return this.props.required ? base : base.optional().nullable()
    }
  }
}
