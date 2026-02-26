import { Entity } from './Entity';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private domainEvents: any[] = [];

  protected addDomainEvent(event: any) {
    this.domainEvents.push(event);
  }

  pullDomainEvents() {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
