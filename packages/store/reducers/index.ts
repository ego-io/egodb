import { combineReducers } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/es/storage'
import { api, attachment, auth } from '../services'
import { tableReducer, tableSlice } from '../slices'
import { recordReducer, recordSlice } from '../slices/record'

export const reducer = combineReducers({
  [recordSlice.name]: recordReducer,
  [tableSlice.name]: tableReducer,
  [api.reducerPath]: api.reducer,
  [attachment.reducerPath]: attachment.reducer,
  [auth.reducerPath]: auth.reducer,
})

export const rootReducder = persistReducer(
  {
    key: 'root',
    version: 1,
    storage,
    blacklist: [api.reducerPath, recordSlice.name],
  },
  reducer,
)

export type RootState = ReturnType<typeof reducer>
