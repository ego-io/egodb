import { writable } from 'svelte/store'

export const createTableHidden = writable<boolean>(true)

export const createOptionOpen = writable<boolean>(false)

export const createRecordOpen = writable<boolean>(false)

export const createFieldOpen = writable<boolean>(false)

export const updateFieldOpen = writable<boolean>(false)
