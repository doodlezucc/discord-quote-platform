import { persisted } from './persisted-state.svelte';

export const volume = persisted('master-volume', 0.5);
