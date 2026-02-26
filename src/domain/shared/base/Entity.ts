export abstract class Entity<TId> {
  constructor(public readonly id: TId) {}
}
