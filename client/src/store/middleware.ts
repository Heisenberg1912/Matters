import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(f: StateCreator<T, [], []>, name?: string) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  type SetFunction = typeof set;
  const loggedSet = ((...a: Parameters<SetFunction>) => {
    set(...(a as [never, never]));
    if (import.meta.env.DEV) {
      console.log(`[${name || 'Store'}]`, get());
    }
  }) as SetFunction;
  return f(loggedSet, get, store);
};

export const logger = loggerImpl as unknown as Logger;

// Type for persist middleware from zustand
export type { PersistOptions } from 'zustand/middleware';
