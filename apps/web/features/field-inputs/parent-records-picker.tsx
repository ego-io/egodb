import type { ParentField } from '@egodb/core'
import { getSelectedRecordId, useLazyParentAvailableQuery } from '@egodb/store'
import type { SelectProps } from '@egodb/ui'
import { Select } from '@egodb/ui'
import { Group } from '@egodb/ui'
import { Loader } from '@egodb/ui'
import { forwardRef, useEffect, useState } from 'react'
import { useAppSelector } from '../../hooks'
import { useCurrentTable } from '../../hooks/use-current-table'
import { useReferenceDisplayValues } from '../../hooks/use-reference-display-values'
import { RecordValue } from '../field-value/record-value'
import { FieldIcon } from './field-Icon'

interface IProps extends Omit<SelectProps, 'data'> {
  field: ParentField
}

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  value: string
  label: string
}

// eslint-disable-next-line react/display-name
const ParentSelectItem = forwardRef<HTMLDivElement, ItemProps>(({ label, ...others }: ItemProps, ref) => (
  <Group ref={ref} p="xs" {...others}>
    <RecordValue value={label} />
  </Group>
))

export const ParentRecordPicker: React.FC<IProps> = ({ field, ...rest }) => {
  const recordId = useAppSelector(getSelectedRecordId)
  const table = useCurrentTable()

  const [focused, setFocused] = useState(false)
  const [getRecords, { rawRecords: foreignRecords, isLoading }] = useLazyParentAvailableQuery({
    selectFromResult: (result) => ({
      ...result,
      rawRecords: (Object.values(result.data?.entities ?? {}) ?? []).filter(Boolean),
    }),
  })

  useEffect(() => {
    if (recordId) {
      getRecords({ tableId: table.id.value, parentFieldId: field.id.value, recordId })
    }
  }, [field.id.value, focused, getRecords, recordId, table.id.value])

  const data = useReferenceDisplayValues(field, recordId, foreignRecords)

  return (
    <Select
      {...rest}
      multiple
      searchable
      clearable
      description={focused && !foreignRecords.length ? 'no more available record to select' : undefined}
      itemComponent={ParentSelectItem}
      data={data}
      onFocus={() => setFocused(true)}
      placeholder={focused && isLoading ? 'loading records...' : undefined}
      disabled={focused && isLoading}
      icon={focused && isLoading ? <Loader color="gray" size={14} /> : <FieldIcon type={field.type} />}
      withinPortal
    />
  )
}
