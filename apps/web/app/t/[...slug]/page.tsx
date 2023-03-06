'use client'

import { TableFactory } from '@egodb/core'
import { setCurrentTableId, useGetTableQuery } from '@egodb/store'
import type { TRPCError } from '@egodb/trpc'
import { Alert, Container, IconAlertCircle, ModalsProvider } from '@egodb/ui'
import { useEffect } from 'react'
import { TableLoading } from '../../../features/loading'
import { CurrentTableContext } from '../../../context/current-table'
import { CurrentViewContext } from '../../../context/current-view'
import { useAppDispatch } from '../../../hooks'
import { modals } from '../../../modals'
import Table from './table'

export default function Page({ params: { slug } }: { params: { slug: string[] } }) {
  const [tableId, viewId] = slug
  const { data, isLoading, isError, error } = useGetTableQuery({ id: tableId })
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setCurrentTableId(tableId))
  }, [dispatch, tableId])

  if (isLoading) {
    return <TableLoading />
  }

  if (isError) {
    return (
      <Container>
        <Alert icon={<IconAlertCircle size={16} />} title="Oops! Get Table Error!" mt="lg" color="red">
          {(error as TRPCError).message}
        </Alert>
      </Container>
    )
  }

  if (!data) {
    return 'none'
  }
  const table = TableFactory.fromQuery(data)
  const view = table.mustGetView(viewId)
  return (
    <CurrentTableContext.Provider value={table}>
      <CurrentViewContext.Provider value={view}>
        <ModalsProvider modals={modals}>
          <Table />
        </ModalsProvider>
      </CurrentViewContext.Provider>
    </CurrentTableContext.Provider>
  )
}
