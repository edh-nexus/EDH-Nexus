use std::collections::BTreeMap;

use crate::ids::ObjectId;

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum EventKind {
    Cast,
    Damage,
    Draw,
    EnterBattlefield,
    LeaveBattlefield,
    StepBegins,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct TriggerIndex {
    subscribers: BTreeMap<EventKind, Vec<ObjectId>>,
}

impl TriggerIndex {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            subscribers: BTreeMap::new(),
        }
    }

    pub fn subscribe(&mut self, event: EventKind, source: ObjectId) {
        self.subscribers.entry(event).or_default().push(source);
    }

    #[must_use]
    pub fn sources_for(&self, event: EventKind) -> &[ObjectId] {
        self.subscribers.get(&event).map_or(&[], Vec::as_slice)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn event_query_only_returns_matching_sources() {
        let mut index = TriggerIndex::new();
        index.subscribe(EventKind::Draw, ObjectId(1));
        index.subscribe(EventKind::Damage, ObjectId(2));
        assert_eq!(index.sources_for(EventKind::Draw), &[ObjectId(1)]);
    }
}

