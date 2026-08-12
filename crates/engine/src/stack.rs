use crate::ids::{ObjectId, PlayerId, StackItemId};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct StackItem {
    pub id: StackItemId,
    pub controller: PlayerId,
    pub source: ObjectId,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct StackZone {
    items: Vec<StackItem>,
}

impl StackZone {
    #[must_use]
    pub const fn new() -> Self {
        Self { items: Vec::new() }
    }

    pub fn push(&mut self, item: StackItem) {
        self.items.push(item);
    }

    pub fn resolve_next(&mut self) -> Option<StackItem> {
        self.items.pop()
    }

    #[must_use]
    pub const fn len(&self) -> usize {
        self.items.len()
    }

    #[must_use]
    pub const fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_last_in_first_out_without_recursion() {
        let mut stack = StackZone::new();
        for id in 0..100_000 {
            stack.push(StackItem {
                id: StackItemId(id),
                controller: PlayerId(1),
                source: ObjectId(id),
            });
        }
        for expected in (0..100_000).rev() {
            assert_eq!(stack.resolve_next().expect("item").id, StackItemId(expected));
        }
        assert!(stack.is_empty());
    }
}

