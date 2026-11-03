import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseDatabase } from './databases';
import { databaseForRpc, databaseForTable } from './tableDatabase';

type ClientGetter = (database: SupabaseDatabase) => SupabaseClient;

export function createRoutedSupabaseClient(getClient: ClientGetter): SupabaseClient {
  const identity = getClient('identity');

  return new Proxy(identity, {
    get(target, property) {
      if (property === 'from') {
        return (table: string) => getClient(databaseForTable(table)).from(table);
      }
      if (property === 'rpc') {
        return (fn: string, args?: Record<string, unknown>, options?: unknown) =>
          getClient(databaseForRpc(fn)).rpc(fn, args, options as never);
      }

      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
