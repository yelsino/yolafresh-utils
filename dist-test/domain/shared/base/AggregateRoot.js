"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const Entity_1 = require("./Entity");
class AggregateRoot extends Entity_1.Entity {
    constructor() {
        super(...arguments);
        this.domainEvents = [];
    }
    addDomainEvent(event) {
        this.domainEvents.push(event);
    }
    pullDomainEvents() {
        const events = [...this.domainEvents];
        this.domainEvents = [];
        return events;
    }
}
exports.AggregateRoot = AggregateRoot;
