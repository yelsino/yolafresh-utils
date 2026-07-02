import { DomainEvent } from './DomainEvent';
import { Entity } from './Entity';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent) {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
